export interface FundingRound {
  stage: string; // Pre-seed, Seed, Series A
  amount: string;
  investors: string[];
  date?: string;
}

export interface CryptoRankRound {
  type: string; // Seed, Private, Strategic, Public/IDO
  date: string;
  price: string; // Token price per round
  raised: string; // Amount raised
  valuation: string; // FDV at time of raise
  roi: string; // Return on Investment (e.g. 10x)
  investors: string[];
  unlockTerms: string; // Vesting schedule
}

export interface CryptoRankReport {
  projectName: string;
  ticker: string;
  category: string;
  totalRaised: string;
  rounds: CryptoRankRound[];
  tokenomics: {
    initialSupply: string;
    totalSupply: string;
    initialMarketCap: string;
    fullyDilutedValuation: string;
  };
  investorAnalysis: {
    tier1Count: number;
    leadInvestors: string[];
    commentary: string; // AI analysis of the backing quality
  };
  // New field for objective advice
  investmentVerdict: {
    rating: 'Undervalued' | 'Fair Value' | 'Overvalued' | 'High Risk';
    riskLevel: 'Low' | 'Medium' | 'High' | 'Degen';
    summary: string; // 2-3 sentences advising the user
    pros: string[];
    cons: string[];
  };
}

export interface ProjectAnalysis {
  projectName: string;
  
  // 1. TL;DR
  tldr: {
    summary: string;
    problemSolved: string;
    backers: string;
    status: string; // Token/Airdrop status
    quickVerdict: 'Low' | 'Medium' | 'High';
  };

  // 2. Overview
  overview: {
    category: string;
    targetAudience: string;
    socials: {
      website?: string;
      twitter?: string;
      docs?: string;
    };
  };

  // 3. Funding
  funding: {
    rounds: FundingRound[];
    keyBackers: string[]; // Tier 1 VCs
    hasTier1Backing: boolean;
  };

  // 4. Tech & Product
  tech: {
    chain: string;
    architecture: string;
    differentiation: string; // Moat
  };

  // 5. Tokenomics
  tokenomics: {
    tokenStatus: 'Live' | 'Unreleased' | 'Confirmed';
    ticker?: string;
    supply?: string;
    airdropPrediction: string; // How to farm, snapshot info
  };

  // 6. Metrics (On-chain)
  metrics: {
    tvl?: string;
    users?: string; // DAU/WAU
    growthComment: string;
  };

  // 7. Sentiment
  sentiment: {
    twitterVibe: 'Positive' | 'Neutral' | 'Negative';
    narrativeFit: string; // Fits AI, Restaking, etc?
  };

  // 8. Competitors
  competitors: string[]; // Names of rivals

  // 9. Risks
  risks: string[];

  // 10. Conclusion
  verdict: {
    score: number; // 1-10
    finalThoughts: string;
    actionPlan: string[]; // Farming steps
  };

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
  tier: 'S' | 'A' | 'B' | 'C'; // Derived from score
  analysis?: ProjectAnalysis; // Cached analysis
  fundingReport?: CryptoRankReport; // New field for detailed funding
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

export interface SearchHistoryItem {
  query: string;
  timestamp: number;
  score?: number;
}

export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}