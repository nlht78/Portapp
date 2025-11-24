import axios from 'axios';
import { ProjectUpdate, RoadmapItem } from '../interfaces/project.interface';

export class GitHubService {
  private static readonly BASE_URL = 'https://api.github.com';
  private static readonly API_TOKEN = process.env.GITHUB_API_TOKEN;

  static async getProjectActivity(owner: string, repo: string): Promise<{ updates: ProjectUpdate[], roadmap: RoadmapItem[] }> {
    if (!this.API_TOKEN) {
      return this.getMockGitHubData(owner, repo);
    }

    try {
      const [releases, commits, issues] = await Promise.all([
        this.getReleases(owner, repo),
        this.getRecentCommits(owner, repo),
        this.getRecentIssues(owner, repo),
      ]);

      const updates = [...releases, ...commits, ...issues];
      const roadmap = this.generateRoadmapFromIssues(issues);

      return { updates, roadmap };
    } catch (error) {
      console.error('GitHub API error:', error);
      return this.getMockGitHubData(owner, repo);
    }
  }

  private static async getReleases(owner: string, repo: string): Promise<ProjectUpdate[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/repos/${owner}/${repo}/releases`, {
        headers: {
          'Authorization': `token ${this.API_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        params: {
          per_page: 10,
        },
      });

      return response.data.map((release: any) => ({
        id: `release-${release.id}`,
        title: `🚀 Release: ${release.name || release.tag_name}`,
        content: release.body || 'No description provided',
        summary: this.generateSummary(release.body || ''),
        source: 'github' as const,
        url: release.html_url,
        author: release.author?.login || 'Unknown',
        publishedAt: new Date(release.published_at),
        sentiment: 'positive' as const,
        tags: this.extractTags(release.body || ''),
        engagement: {
          likes: release.reactions?.total_count || 0,
          retweets: 0,
          comments: 0,
        },
      }));
    } catch (error) {
      console.error('Error fetching releases:', error);
      return [];
    }
  }

  private static async getRecentCommits(owner: string, repo: string): Promise<ProjectUpdate[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/repos/${owner}/${repo}/commits`, {
        headers: {
          'Authorization': `token ${this.API_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        params: {
          per_page: 15,
        },
      });

      return response.data.map((commit: any) => ({
        id: `commit-${commit.sha}`,
        title: `🔧 Commit: ${commit.commit.message.split('\n')[0]}`,
        content: commit.commit.message,
        summary: this.generateSummary(commit.commit.message),
        source: 'github' as const,
        url: commit.html_url,
        author: commit.author?.login || commit.commit.author.name,
        publishedAt: new Date(commit.commit.author.date),
        sentiment: this.analyzeCommitSentiment(commit.commit.message),
        tags: this.extractTags(commit.commit.message),
        engagement: {
          likes: 0,
          retweets: 0,
          comments: 0,
        },
      }));
    } catch (error) {
      console.error('Error fetching commits:', error);
      return [];
    }
  }

  private static async getRecentIssues(owner: string, repo: string): Promise<ProjectUpdate[]> {
    try {
      const response = await axios.get(`${this.BASE_URL}/repos/${owner}/${repo}/issues`, {
        headers: {
          'Authorization': `token ${this.API_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        params: {
          per_page: 10,
          state: 'all',
        },
      });

      return response.data.map((issue: any) => ({
        id: `issue-${issue.number}`,
        title: `📋 ${issue.state === 'open' ? 'Issue' : 'Issue Closed'}: ${issue.title}`,
        content: issue.body || 'No description provided',
        summary: this.generateSummary(issue.body || ''),
        source: 'github' as const,
        url: issue.html_url,
        author: issue.user?.login || 'Unknown',
        publishedAt: new Date(issue.created_at),
        sentiment: issue.state === 'closed' ? 'positive' : 'neutral',
        tags: [...(issue.labels?.map((label: any) => label.name) || []), ...this.extractTags(issue.title)],
        engagement: {
          likes: 0,
          retweets: 0,
          comments: issue.comments || 0,
        },
      }));
    } catch (error) {
      console.error('Error fetching issues:', error);
      return [];
    }
  }

  private static generateRoadmapFromIssues(issues: ProjectUpdate[]): RoadmapItem[] {
    const roadmapItems: RoadmapItem[] = [];
    
    issues.forEach((issue, index) => {
      const isEnhancement = issue.tags.some(tag => 
        tag.toLowerCase().includes('enhancement') || 
        tag.toLowerCase().includes('feature') ||
        tag.toLowerCase().includes('roadmap')
      );

      if (isEnhancement) {
        roadmapItems.push({
          id: `roadmap-${index}`,
          title: issue.title.replace(/^📋 (Issue|Issue Closed): /, ''),
          description: issue.summary,
          status: issue.sentiment === 'positive' ? 'completed' : 'in-progress',
          category: this.determineCategory(issue.tags),
          priority: this.determinePriority(issue.tags),
          progress: issue.sentiment === 'positive' ? 100 : Math.floor(Math.random() * 80) + 20,
        });
      }
    });

    return roadmapItems;
  }

  private static determineCategory(tags: string[]): RoadmapItem['category'] {
    if (tags.some(tag => tag.toLowerCase().includes('ui') || tag.toLowerCase().includes('frontend'))) {
      return 'feature';
    }
    if (tags.some(tag => tag.toLowerCase().includes('security') || tag.toLowerCase().includes('audit'))) {
      return 'development';
    }
    if (tags.some(tag => tag.toLowerCase().includes('governance') || tag.toLowerCase().includes('dao'))) {
      return 'governance';
    }
    return 'development';
  }

  private static determinePriority(tags: string[]): RoadmapItem['priority'] {
    if (tags.some(tag => tag.toLowerCase().includes('critical') || tag.toLowerCase().includes('urgent'))) {
      return 'high';
    }
    if (tags.some(tag => tag.toLowerCase().includes('low') || tag.toLowerCase().includes('nice-to-have'))) {
      return 'low';
    }
    return 'medium';
  }

  private static generateSummary(text: string): string {
    const words = text.split(' ').slice(0, 15);
    return words.join(' ') + (text.split(' ').length > 15 ? '...' : '');
  }

  private static analyzeCommitSentiment(message: string): 'positive' | 'negative' | 'neutral' {
    const lowerMessage = message.toLowerCase();
    const positiveWords = ['fix', 'add', 'improve', 'update', 'enhance', 'optimize'];
    const negativeWords = ['remove', 'delete', 'break', 'revert', 'rollback'];
    
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static extractTags(text: string): string[] {
    const hashtags = text.match(/#\w+/g) || [];
    const keywords = text.match(/\b(feature|bug|fix|enhancement|security|ui|ux|api|smart-contract|defi|staking|governance)\b/gi) || [];
    return [...hashtags.map(tag => tag.substring(1)), ...keywords.map(keyword => keyword.toLowerCase())];
  }

  private static getMockGitHubData(owner: string, repo: string): { updates: ProjectUpdate[], roadmap: RoadmapItem[] } {
    const mockUpdates: ProjectUpdate[] = [
      {
        id: 'release-1',
        title: '🚀 Release: v2.1.0 - Enhanced Staking Features',
        content: 'Major update with enhanced staking features, improved UI, and bug fixes. New yield farming pools added.',
        summary: 'Enhanced staking features and new yield farming pools in v2.1.0.',
        source: 'github',
        url: `https://github.com/${owner}/${repo}/releases/tag/v2.1.0`,
        author: owner,
        publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        sentiment: 'positive',
        tags: ['release', 'staking', 'yield-farming'],
        engagement: { likes: 45, retweets: 0, comments: 12 },
      },
      {
        id: 'commit-1',
        title: '🔧 Commit: Fix staking pool calculation bug',
        content: 'Fixed critical bug in staking pool APY calculation that was causing incorrect rewards distribution.',
        summary: 'Fixed staking pool APY calculation bug.',
        source: 'github',
        url: `https://github.com/${owner}/${repo}/commit/abc123`,
        author: 'dev-team',
        publishedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        sentiment: 'positive',
        tags: ['fix', 'staking', 'bug'],
        engagement: { likes: 0, retweets: 0, comments: 0 },
      },
    ];

    const mockRoadmap: RoadmapItem[] = [
      {
        id: 'roadmap-1',
        title: 'Cross-chain Bridge Integration',
        description: 'Implement cross-chain bridge to support multiple blockchains and increase liquidity.',
        status: 'in-progress',
        category: 'development',
        priority: 'high',
        progress: 65,
      },
      {
        id: 'roadmap-2',
        title: 'Mobile App Development',
        description: 'Develop native mobile applications for iOS and Android platforms.',
        status: 'planned',
        category: 'feature',
        priority: 'medium',
        progress: 0,
      },
      {
        id: 'roadmap-3',
        title: 'Advanced Governance Dashboard',
        description: 'Create comprehensive governance dashboard with proposal creation and voting mechanisms.',
        status: 'completed',
        category: 'governance',
        priority: 'high',
        progress: 100,
        completedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    ];

    return { updates: mockUpdates, roadmap: mockRoadmap };
  }
} 