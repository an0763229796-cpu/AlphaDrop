import { StoredProject, ProjectAnalysis } from '../types';

const STORAGE_KEY = 'az9_projects';
const CACHE_KEY = 'az9_analysis_cache';

// Mock delay to simulate network/DB call
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Projects (Tracker) ---

export const getProjects = async (): Promise<StoredProject[]> => {
  await delay(100); // Simulate latency
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
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
};

export const getProjectById = async (id: string): Promise<StoredProject | undefined> => {
  const projects = await getProjects();
  return projects.find(p => p.id === id);
};

export const deleteProject = async (id: string): Promise<void> => {
  const projects = await getProjects();
  const filtered = projects.filter(p => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// --- Caching (Optimization) ---

interface CacheEntry {
  data: ProjectAnalysis;
  timestamp: number;
}

export const getCachedAnalysis = (projectName: string): ProjectAnalysis | null => {
  const cacheRaw = localStorage.getItem(CACHE_KEY);
  if (!cacheRaw) return null;

  const cache: Record<string, CacheEntry> = JSON.parse(cacheRaw);
  const entry = cache[projectName.toLowerCase()];

  if (!entry) return null;

  // Cache valid for 24 hours
  if (Date.now() - entry.timestamp > 24 * 60 * 60 * 1000) {
    return null;
  }

  return entry.data;
};

export const cacheAnalysis = (projectName: string, data: ProjectAnalysis) => {
  const cacheRaw = localStorage.getItem(CACHE_KEY);
  const cache: Record<string, CacheEntry> = cacheRaw ? JSON.parse(cacheRaw) : {};

  cache[projectName.toLowerCase()] = {
    data,
    timestamp: Date.now()
  };

  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
};
