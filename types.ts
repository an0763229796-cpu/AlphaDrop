export interface ProjectAnalysis {
  projectName: string;
  narrative: string;
  score: number; // 1-10
  signals: {
    smartMoney: string; // Assessment of backing
    community: string; // Social sentiment
    stage: string; // Testnet, Mainnet, etc.
  };
  verdict: string;
  strategy: string[]; // Steps to farm
  sources: Array<{ title: string; uri: string }>;
}

export interface FarmingTask {
  id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'high' | 'medium' | 'low';
}

export interface StoredProject {
  id: string;
  name: string;
  ticker?: string;
  addedAt: number;
  startDate?: string; // ISO Date string
  targetDate?: string; // ISO Date string (Estimated Airdrop/Snapshot)
  status: 'researching' | 'farming' | 'claimed' | 'ignored';
  tier: 'S' | 'A' | 'B' | 'C'; // Based on AZ9 signals
  analysis?: ProjectAnalysis; // Cached analysis
  tasks: FarmingTask[];
  notes?: string;
}

export interface DiscoverySignal {
  id: string;
  name: string;
  handle: string;
  source: string;
  rawNarrative: string;
  az9Analysis?: {
    isMatch: boolean;
    reason: string;
    score: number;
  };
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}
