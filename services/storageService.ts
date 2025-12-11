import { StoredProject, ProjectAnalysis, SearchHistoryItem } from '../types';

const STORAGE_KEY = 'az9_projects';
const CACHE_KEY = 'az9_analysis_cache';
const HISTORY_KEY = 'az9_search_history';

// --- Redis Client (Upstash) ---
class UpstashClient {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const res = await fetch(`${this.url}/get/${key}`, {
        headers: { Authorization: `Bearer ${this.token}` }
      });
      const json = await res.json();
      if (json.result) {
        return JSON.parse(json.result) as T;
      }
      return null;
    } catch (e) {
      console.error("Redis Get Error", e);
      return null;
    }
  }

  async set(key: string, value: any): Promise<void> {
    try {
      await fetch(`${this.url}/set/${key}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(JSON.stringify(value))
      });
    } catch (e) {
      console.error("Redis Set Error", e);
    }
  }
}

// Environment Detection
const REDIS_URL = process.env.REDIS_URL;
const REDIS_TOKEN = process.env.REDIS_TOKEN;
const redis = (REDIS_URL && REDIS_TOKEN) ? new UpstashClient(REDIS_URL, REDIS_TOKEN) : null;

export const isRedisConnected = (): boolean => !!redis;

// --- Projects (Tracker) ---
// Note: In a real multi-user app, we would append UserID to the keys.

export const getProjects = async (): Promise<StoredProject[]> => {
  if (redis) {
    const data = await redis.get<StoredProject[]>(STORAGE_KEY);
    return data || [];
  }
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveProject = async (project: StoredProject): Promise<void> => {
  const projects = await getProjects();
  const index = projects.findIndex(p => p.id === project.id);
  
  if (index >= 0) {
    projects[index] = project;
  } else {
    projects.push(project);
  }
  
  if (redis) {
    await redis.set(STORAGE_KEY, projects);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }
};

export const getProjectById = async (id: string): Promise<StoredProject | undefined> => {
  const projects = await getProjects();
  return projects.find(p => p.id === id);
};

export const deleteProject = async (id: string): Promise<void> => {
  const projects = await getProjects();
  const filtered = projects.filter(p => p.id !== id);
  
  if (redis) {
    await redis.set(STORAGE_KEY, filtered);
  } else {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }
};

// --- Caching (Analysis) ---

interface CacheEntry {
  data: ProjectAnalysis;
  timestamp: number;
}

export const getCachedAnalysis = async (projectName: string): Promise<ProjectAnalysis | null> => {
  const key = `${CACHE_KEY}_${projectName.toLowerCase()}`;
  
  if (redis) {
    const entry = await redis.get<CacheEntry>(key);
    if (entry && (Date.now() - entry.timestamp < 24 * 60 * 60 * 1000)) {
      return entry.data;
    }
    return null;
  }

  // Local Storage Implementation
  const cacheRaw = localStorage.getItem(CACHE_KEY);
  if (!cacheRaw) return null;
  const cache: Record<string, CacheEntry> = JSON.parse(cacheRaw);
  const entry = cache[projectName.toLowerCase()];
  
  if (entry && (Date.now() - entry.timestamp < 24 * 60 * 60 * 1000)) {
    return entry.data;
  }
  return null;
};

export const cacheAnalysis = async (projectName: string, data: ProjectAnalysis) => {
  const entry: CacheEntry = { data, timestamp: Date.now() };

  if (redis) {
    const key = `${CACHE_KEY}_${projectName.toLowerCase()}`;
    await redis.set(key, entry);
    return;
  }

  // Local Storage Implementation
  const cacheRaw = localStorage.getItem(CACHE_KEY);
  const cache: Record<string, CacheEntry> = cacheRaw ? JSON.parse(cacheRaw) : {};
  cache[projectName.toLowerCase()] = entry;
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};

// --- Search History ---

export const getSearchHistory = async (): Promise<SearchHistoryItem[]> => {
  if (redis) {
    const data = await redis.get<SearchHistoryItem[]>(HISTORY_KEY);
    return data || [];
  }
  const data = localStorage.getItem(HISTORY_KEY);
  return data ? JSON.parse(data) : [];
};

export const addToSearchHistory = async (query: string, score: number) => {
  let history = await getSearchHistory();
  history = history.filter(h => h.query.toLowerCase() !== query.toLowerCase());
  history.unshift({ query, score, timestamp: Date.now() });
  if (history.length > 20) history = history.slice(0, 20);

  if (redis) {
    await redis.set(HISTORY_KEY, history);
  } else {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }
};