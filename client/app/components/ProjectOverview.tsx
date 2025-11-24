import { useState, useEffect } from 'react';
import { Link } from '@remix-run/react';

interface ProjectUpdate {
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

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'planned' | 'delayed';
  category: 'development' | 'marketing' | 'partnership' | 'feature' | 'governance';
  targetDate?: Date;
  completedDate?: Date;
  progress?: number;
  priority: 'high' | 'medium' | 'low';
}

interface EarningMechanism {
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

interface ProjectData {
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

interface ProjectOverviewProps {
  tokenId: string;
  tokenData: any;
}

export default function ProjectOverview({ tokenId, tokenData }: ProjectOverviewProps) {
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'roadmap' | 'earning' | 'updates'>('overview');

  useEffect(() => {
    fetchProjectData();
  }, [tokenId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const API_URL = process.env.API_URL || 'http://localhost:8080';
      const response = await fetch(`${API_URL}/api/v1/project/${tokenId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectData(data.metadata);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: RoadmapItem['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'planned': return 'bg-yellow-100 text-yellow-800';
      case 'delayed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: RoadmapItem['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSentimentColor = (sentiment: ProjectUpdate['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getSourceIcon = (source: ProjectUpdate['source']) => {
    switch (source) {
      case 'twitter': return '🐦';
      case 'github': return '💻';
      case 'medium': return '📝';
      case 'discord': return '🎮';
      case 'telegram': return '📱';
      case 'website': return '🌐';
      default: return '📄';
    }
  };

  const getTypeIcon = (type: EarningMechanism['type']) => {
    switch (type) {
      case 'staking': return '🔒';
      case 'yield-farming': return '🌾';
      case 'liquidity-mining': return '💧';
      case 'governance': return '🗳️';
      case 'airdrops': return '🎁';
      case 'referral': return '👥';
      case 'trading-fees': return '💰';
      default: return '💎';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Project data not available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Project Overview</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'roadmap'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Roadmap
            </button>
            <button
              onClick={() => setActiveTab('earning')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'earning'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Earning
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                activeTab === 'updates'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Updates
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-600">Total Updates</p>
            <p className="text-2xl font-bold text-blue-900">{projectData.stats.totalUpdates}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-600">Last Update</p>
            <p className="text-sm font-bold text-green-900">{formatDate(projectData.stats.lastUpdate)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-600">Sentiment</p>
            <p className="text-2xl font-bold text-purple-900">
              {projectData.stats.averageSentiment > 0 ? '+' : ''}{projectData.stats.averageSentiment.toFixed(1)}
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm font-medium text-orange-600">Top Source</p>
            <p className="text-sm font-bold text-orange-900 capitalize">{projectData.stats.topSources[0] || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Updates */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Updates</h3>
            <div className="space-y-4">
              {projectData.updates.slice(0, 3).map((update) => (
                <div key={update.id} className="border-l-4 border-indigo-500 pl-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{update.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{update.summary}</p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className="text-xs">{getSourceIcon(update.source)}</span>
                        <span className={`text-xs ${getSentimentColor(update.sentiment)}`}>
                          {update.sentiment}
                        </span>
                        <span className="text-xs text-gray-500">{formatDate(update.publishedAt)}</span>
                      </div>
                    </div>
                    <a
                      href={update.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:text-indigo-900 text-sm"
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Earning Mechanisms */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Active Earning</h3>
            <div className="space-y-4">
              {projectData.earningMechanisms.filter(m => m.isActive).slice(0, 3).map((mechanism) => (
                <div key={mechanism.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(mechanism.type)}</span>
                      <h4 className="font-medium text-gray-900">{mechanism.name}</h4>
                    </div>
                    {mechanism.apy && (
                      <span className="text-lg font-bold text-green-600">{mechanism.apy.toFixed(1)}% APY</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{mechanism.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roadmap' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Development Roadmap</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {projectData.roadmap.map((item) => (
                <div key={item.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h4>
                      <p className="text-gray-600 mb-3">{item.description}</p>
                      <div className="flex items-center space-x-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                          {item.status}
                        </span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(item.priority)}`}>
                          {item.priority} priority
                        </span>
                        <span className="text-sm text-gray-500 capitalize">{item.category}</span>
                      </div>
                    </div>
                    {item.progress !== undefined && (
                      <div className="text-right">
                        <div className="text-2xl font-bold text-indigo-600">{item.progress}%</div>
                        <div className="w-16 h-2 bg-gray-200 rounded-full mt-2">
                          <div
                            className="h-2 bg-indigo-600 rounded-full"
                            style={{ width: `${item.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  {item.targetDate && (
                    <div className="text-sm text-gray-500">
                      Target: {formatDate(item.targetDate)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'earning' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Earning Mechanisms</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectData.earningMechanisms.map((mechanism) => (
                <div key={mechanism.id} className="border rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{getTypeIcon(mechanism.type)}</span>
                      <h4 className="text-lg font-medium text-gray-900">{mechanism.name}</h4>
                    </div>
                    {mechanism.apy && (
                      <span className="text-2xl font-bold text-green-600">{mechanism.apy.toFixed(1)}%</span>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4">{mechanism.description}</p>
                  
                  <div className="space-y-3">
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Requirements:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {mechanism.requirements.map((req, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Rewards:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {mechanism.rewards.map((reward, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></span>
                            {reward}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-medium text-gray-900 mb-1">Risks:</h5>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {mechanism.risks.map((risk, index) => (
                          <li key={index} className="flex items-center">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mr-2"></span>
                            {risk}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'updates' && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Project Updates</h3>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {projectData.updates.map((update) => (
                <div key={update.id} className="border rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getSourceIcon(update.source)}</span>
                        <h4 className="text-lg font-medium text-gray-900">{update.title}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          update.sentiment === 'positive' ? 'bg-green-100 text-green-800' :
                          update.sentiment === 'negative' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {update.sentiment}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{update.summary}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>By {update.author}</span>
                          <span>{formatDate(update.publishedAt)}</span>
                          {update.engagement && (
                            <span>❤️ {update.engagement.likes} 🔄 {update.engagement.retweets}</span>
                          )}
                        </div>
                        <a
                          href={update.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Read More →
                        </a>
                      </div>
                    </div>
                  </div>
                  {update.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {update.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 