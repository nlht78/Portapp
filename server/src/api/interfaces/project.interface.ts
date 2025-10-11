export interface ProjectUpdate {
  id: string;
  title: string;
  content: string;
  summary: string;
  source: 'twitter' | 'github' | 'medium' | 'discord' | 'telegram' | 'website';
  url: string;
  author: string;
  publishedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  tags: string[];
  engagement?: {
    likes: number;
    retweets: number;
    comments: number;
  };
}

export interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'delayed';
  category: 'development' | 'marketing' | 'partnership' | 'feature' | 'governance';
  targetDate?: Date;
  completedDate?: Date;
  progress?: number; // 0-100
  priority: 'high' | 'medium' | 'low';
}

export interface EarningMechanism {
  id: string;
  name: string;
  description: string;
  type: 'staking' | 'yield-farming' | 'liquidity-mining' | 'governance' | 'airdrops' | 'referral' | 'trading-fees';
  apy?: number;
  requirements: string[];
  risks: string[];
  rewards: string[];
  isActive: boolean;
  startDate?: Date;
  endDate?: Date;
}

export interface ProjectData {
  tokenId: string;
  roadmap: RoadmapItem[];
  earningMechanisms: EarningMechanism[];
  updates: ProjectUpdate[];
  stats: {
    totalUpdates: number;
    lastUpdate: Date;
    averageSentiment: number;
    topSources: string[];
  };
  sources: {
    twitter?: string;
    github?: string;
    medium?: string;
    discord?: string;
    telegram?: string;
    website?: string;
  };
}

export interface ProjectDataResponse {
  status: number;
  message: string;
  metadata: ProjectData;
} 