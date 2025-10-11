export interface ResearchQuery {
  tokenId: string;
  query: string;
  sources: string[];
  timeRange: '1d' | '7d' | '30d' | '90d' | 'all';
  includeHistorical: boolean;
}

export interface ResearchSource {
  id: string;
  name: string;
  type: 'website' | 'twitter' | 'github' | 'medium' | 'reddit' | 'discord' | 'telegram' | 'whitepaper' | 'news' | 'calendar' | 'analytics' | 'gaming' | 'ai';
  url: string;
  lastUpdated: Date;
  reliability: number; // 0-1
  isOfficial: boolean;
}

export interface ResearchResult {
  id: string;
  query: string;
  tokenId: string;
  summary: string;
  detailedAnalysis: string;
  sources: ResearchSource[];
  findings: ResearchFinding[];
  confidence: number; // 0-1
  lastUpdated: Date;
  metadata: {
    totalSources: number;
    officialSources: number;
    timeRange: string;
    keyTopics: string[];
  };
}

export interface ResearchFinding {
  id: string;
  category: 'roadmap' | 'tokenomics' | 'earning' | 'partnership' | 'development' | 'governance' | 'launch' | 'airdrop';
  title: string;
  description: string;
  source: ResearchSource;
  date: Date;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  status: 'confirmed' | 'rumor' | 'speculation' | 'official';
  tags: string[];
  relatedFindings: string[];
}

export interface AISummary {
  executiveSummary: string;
  keyHighlights: string[];
  timeline: TimelineEvent[];
  recommendations: string[];
  risks: string[];
  opportunities: string[];
  nextSteps: string[];
}

export interface TimelineEvent {
  date: Date;
  title: string;
  description: string;
  category: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'delayed';
  source: string;
}

export interface ResearchResponse {
  status: number;
  message: string;
  metadata: ResearchResult;
} 