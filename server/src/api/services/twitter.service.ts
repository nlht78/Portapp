import axios from 'axios';
import { ProjectUpdate } from '../interfaces/project.interface';

export class TwitterService {
  private static readonly BASE_URL = 'https://api.twitter.com/2';
  private static readonly API_KEY = process.env.TWITTER_API_KEY;
  private static readonly API_SECRET = process.env.TWITTER_API_SECRET;
  private static readonly BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

  static async getProjectUpdates(username: string, count: number = 20): Promise<ProjectUpdate[]> {
    if (!this.BEARER_TOKEN) {
      console.log('Twitter API not configured, using mock data');
      return this.getMockTwitterData(username);
    }

    try {
      const response = await axios.get(`${this.BASE_URL}/users/by/username/${username}/tweets`, {
        headers: {
          'Authorization': `Bearer ${this.BEARER_TOKEN}`,
          'Content-Type': 'application/json',
        },
        params: {
          'max_results': count,
          'tweet.fields': 'created_at,public_metrics,entities',
          'expansions': 'author_id',
          'user.fields': 'name,username',
        },
      });

      return this.formatTwitterData(response.data);
    } catch (error) {
      console.error('Twitter API error:', error);
      return this.getMockTwitterData(username);
    }
  }

  private static formatTwitterData(data: any): ProjectUpdate[] {
    if (!data.data) return [];

    return data.data.map((tweet: any) => ({
      id: tweet.id,
      title: this.extractTitle(tweet.text),
      content: tweet.text,
      summary: this.generateSummary(tweet.text),
      source: 'twitter' as const,
      url: `https://twitter.com/user/status/${tweet.id}`,
      author: data.includes?.users?.[0]?.name || 'Unknown',
      publishedAt: new Date(tweet.created_at),
      sentiment: this.analyzeSentiment(tweet.text),
      tags: this.extractTags(tweet.text),
      engagement: {
        likes: tweet.public_metrics?.like_count || 0,
        retweets: tweet.public_metrics?.retweet_count || 0,
        comments: tweet.public_metrics?.reply_count || 0,
      },
    }));
  }

  private static extractTitle(text: string): string {
    const lines = text.split('\n');
    return lines[0].substring(0, 100) + (lines[0].length > 100 ? '...' : '');
  }

  private static generateSummary(text: string): string {
    // Simple summary generation - in production, use AI service
    const words = text.split(' ').slice(0, 20);
    return words.join(' ') + (text.split(' ').length > 20 ? '...' : '');
  }

  private static analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['launch', 'update', 'release', 'partnership', 'growth', 'success', 'announcement', 'new', 'improved'];
    const negativeWords = ['delay', 'issue', 'problem', 'bug', 'hack', 'scam', 'dump', 'crash'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private static extractTags(text: string): string[] {
    const hashtags = text.match(/#\w+/g) || [];
    return hashtags.map(tag => tag.substring(1));
  }

  private static getMockTwitterData(username: string): ProjectUpdate[] {
    const mockUpdates = [
      {
        id: '1',
        title: '🚀 Major Update: New Staking Pool Launched',
        content: '🚀 Excited to announce our new staking pool with up to 15% APY! Stake your tokens and earn passive income. More details in our latest blog post. #staking #defi #passiveincome',
        summary: 'New staking pool launched with 15% APY for passive income generation.',
        source: 'twitter' as const,
        url: `https://twitter.com/${username}/status/1`,
        author: username,
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        sentiment: 'positive' as const,
        tags: ['staking', 'defi', 'passiveincome'],
        engagement: { likes: 1250, retweets: 340, comments: 89 },
      },
      {
        id: '2',
        title: '📈 Q2 Roadmap Update: Development Progress',
        content: '📈 Q2 roadmap update: Core protocol development is 75% complete. Smart contract audit scheduled for next week. Governance proposal for new features coming soon! #roadmap #development #governance',
        summary: 'Q2 development progress at 75%, smart contract audit scheduled, governance proposal coming.',
        source: 'twitter' as const,
        url: `https://twitter.com/${username}/status/2`,
        author: username,
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        sentiment: 'positive' as const,
        tags: ['roadmap', 'development', 'governance'],
        engagement: { likes: 890, retweets: 156, comments: 45 },
      },
      {
        id: '3',
        title: '🤝 New Partnership Announcement',
        content: '🤝 Thrilled to announce our partnership with @MajorDeFiProtocol! This collaboration will bring new liquidity pools and yield farming opportunities to our community. Stay tuned for more details! #partnership #defi #yieldfarming',
        summary: 'New partnership announced with major DeFi protocol for liquidity pools and yield farming.',
        source: 'twitter' as const,
        url: `https://twitter.com/${username}/status/3`,
        author: username,
        publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        sentiment: 'positive' as const,
        tags: ['partnership', 'defi', 'yieldfarming'],
        engagement: { likes: 2100, retweets: 567, comments: 123 },
      },
      {
        id: '4',
        title: '🔧 Technical Update: Bug Fixes and Improvements',
        content: '🔧 Technical update: Fixed minor UI bugs and improved transaction speed by 25%. New features include enhanced wallet integration and better error handling. Update your app to version 2.1.0! #update #bugfix #improvement',
        summary: 'Bug fixes and performance improvements released in version 2.1.0.',
        source: 'twitter' as const,
        url: `https://twitter.com/${username}/status/4`,
        author: username,
        publishedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        sentiment: 'positive' as const,
        tags: ['update', 'bugfix', 'improvement'],
        engagement: { likes: 567, retweets: 89, comments: 34 },
      },
      {
        id: '5',
        title: '📊 Community Governance: New Proposal Live',
        content: '📊 Community governance proposal #15 is now live! Vote on whether to add new yield farming strategies. Your voice matters in shaping the future of our protocol. Vote now at governance.website.com #governance #voting #community',
        summary: 'New governance proposal for yield farming strategies is open for community voting.',
        source: 'twitter' as const,
        url: `https://twitter.com/${username}/status/5`,
        author: username,
        publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        sentiment: 'neutral' as const,
        tags: ['governance', 'voting', 'community'],
        engagement: { likes: 445, retweets: 78, comments: 156 },
      },
    ];

    return mockUpdates;
  }
} 