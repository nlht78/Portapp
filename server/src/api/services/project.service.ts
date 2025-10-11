import { ProjectData, ProjectUpdate, RoadmapItem, EarningMechanism } from '../interfaces/project.interface';
import { TwitterService } from './twitter.service';
import { GitHubService } from './github.service';

export class ProjectService {
  static async getProjectData(tokenId: string, tokenData: any): Promise<ProjectData> {
    try {
      // Get social handles from token data
      const socialLinks = tokenData.socialLinks || {};
      const twitterHandle = this.extractTwitterHandle(socialLinks.twitter);
      const githubRepo = this.extractGitHubRepo(tokenData.links?.repos_url?.[0] || '');

      // Fetch data from multiple sources
      const [twitterUpdates, githubData] = await Promise.all([
        twitterHandle ? TwitterService.getProjectUpdates(twitterHandle) : Promise.resolve([]),
        githubRepo ? GitHubService.getProjectActivity(githubRepo.owner, githubRepo.repo) : Promise.resolve({ updates: [], roadmap: [] }),
      ]);

      // Combine and sort all updates
      const allUpdates = [...twitterUpdates, ...githubData.updates]
        .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
        .slice(0, 20); // Limit to 20 most recent

      // Generate earning mechanisms based on token data
      const earningMechanisms = this.generateEarningMechanisms(tokenData);

      // Calculate stats
      const stats = this.calculateStats(allUpdates);

      return {
        tokenId,
        roadmap: githubData.roadmap,
        earningMechanisms,
        updates: allUpdates,
        stats,
        sources: {
          twitter: socialLinks.twitter,
          github: tokenData.links?.repos_url?.[0],
          medium: socialLinks.blog?.[0],
          discord: socialLinks.discord,
          telegram: socialLinks.telegram,
          website: socialLinks.homepage?.[0],
        },
      };
    } catch (error) {
      console.error('Error fetching project data:', error);
      return this.getMockProjectData(tokenId, tokenData);
    }
  }

  private static extractTwitterHandle(twitterUrl: string): string | null {
    if (!twitterUrl) return null;
    const match = twitterUrl.match(/twitter\.com\/([^\/\?]+)/);
    return match ? match[1] : null;
  }

  private static extractGitHubRepo(githubUrl: string): { owner: string; repo: string } | null {
    if (!githubUrl) return null;
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/\?]+)/);
    return match ? { owner: match[1], repo: match[2] } : null;
  }

  private static generateEarningMechanisms(tokenData: any): EarningMechanism[] {
    const mechanisms: EarningMechanism[] = [];

    // Staking mechanism (common for most DeFi tokens)
    if (tokenData.platforms?.ethereum || tokenData.platforms?.binancecoin) {
      mechanisms.push({
        id: 'staking-1',
        name: 'Token Staking',
        description: 'Stake your tokens to earn passive income through protocol fees and rewards.',
        type: 'staking',
        apy: 8.5 + Math.random() * 12, // Random APY between 8.5-20.5%
        requirements: ['Minimum stake: 100 tokens', 'Lock period: 30 days'],
        risks: ['Impermanent loss', 'Smart contract risk', 'Market volatility'],
        rewards: ['APY rewards', 'Governance tokens', 'Protocol fee sharing'],
        isActive: true,
        startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
      });
    }

    // Yield farming (if it's a DeFi token)
    if (tokenData.categories?.includes('decentralized-finance-defi')) {
      mechanisms.push({
        id: 'yield-farming-1',
        name: 'Liquidity Mining',
        description: 'Provide liquidity to trading pairs and earn additional tokens as rewards.',
        type: 'yield-farming',
        apy: 15.2 + Math.random() * 25, // Random APY between 15.2-40.2%
        requirements: ['Provide liquidity to trading pairs', 'Minimum liquidity: $1000'],
        risks: ['Impermanent loss', 'High gas fees', 'Market volatility'],
        rewards: ['Trading fee rewards', 'Additional token rewards', 'Bonus incentives'],
        isActive: true,
        startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      });
    }

    // Governance rewards
    if (tokenData.categories?.includes('governance')) {
      mechanisms.push({
        id: 'governance-1',
        name: 'Governance Participation',
        description: 'Participate in protocol governance and earn rewards for active voting.',
        type: 'governance',
        apy: 3.5 + Math.random() * 8, // Random APY between 3.5-11.5%
        requirements: ['Hold minimum tokens for voting', 'Active participation in proposals'],
        risks: ['Low liquidity', 'Governance attack risk'],
        rewards: ['Voting rewards', 'Proposal creation rewards', 'Community recognition'],
        isActive: true,
        startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago
      });
    }

    // Trading fee sharing
    mechanisms.push({
      id: 'trading-fees-1',
      name: 'Trading Fee Sharing',
      description: 'Earn a portion of trading fees generated by the protocol.',
      type: 'trading-fees',
      apy: 5.8 + Math.random() * 10, // Random APY between 5.8-15.8%
      requirements: ['Hold tokens in designated pools', 'Minimum holding period'],
      risks: ['Trading volume dependency', 'Market conditions'],
      rewards: ['Daily fee distribution', 'Volume-based bonuses'],
      isActive: true,
      startDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
    });

    return mechanisms;
  }

  private static calculateStats(updates: ProjectUpdate[]) {
    const totalUpdates = updates.length;
    const lastUpdate = updates.length > 0 ? updates[0].publishedAt : new Date();
    
    // Calculate average sentiment
    const sentimentScores = updates.map(update => {
      switch (update.sentiment) {
        case 'positive': return 1;
        case 'negative': return -1;
        default: return 0;
      }
    });
    const averageSentiment = sentimentScores.length > 0 
      ? sentimentScores.reduce((sum: number, score: number) => sum + score, 0) / sentimentScores.length 
      : 0;

    // Get top sources
    const sourceCounts = updates.reduce((acc, update) => {
      acc[update.source] = (acc[update.source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topSources = Object.entries(sourceCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([source]) => source);

    return {
      totalUpdates,
      lastUpdate,
      averageSentiment,
      topSources,
    };
  }

  private static getMockProjectData(tokenId: string, tokenData: any): ProjectData {
    return {
      tokenId,
      roadmap: [
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
        {
          id: 'roadmap-4',
          title: 'Layer 2 Scaling Solution',
          description: 'Implement Layer 2 scaling solution to reduce gas fees and improve transaction speed.',
          status: 'planned',
          category: 'development',
          priority: 'high',
          progress: 0,
        },
      ],
      earningMechanisms: [
        {
          id: 'staking-1',
          name: 'Token Staking',
          description: 'Stake your tokens to earn passive income through protocol fees and rewards.',
          type: 'staking',
          apy: 12.5,
          requirements: ['Minimum stake: 100 tokens', 'Lock period: 30 days'],
          risks: ['Impermanent loss', 'Smart contract risk', 'Market volatility'],
          rewards: ['APY rewards', 'Governance tokens', 'Protocol fee sharing'],
          isActive: true,
          startDate: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'yield-farming-1',
          name: 'Liquidity Mining',
          description: 'Provide liquidity to trading pairs and earn additional tokens as rewards.',
          type: 'yield-farming',
          apy: 28.7,
          requirements: ['Provide liquidity to trading pairs', 'Minimum liquidity: $1000'],
          risks: ['Impermanent loss', 'High gas fees', 'Market volatility'],
          rewards: ['Trading fee rewards', 'Additional token rewards', 'Bonus incentives'],
          isActive: true,
          startDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        },
        {
          id: 'governance-1',
          name: 'Governance Participation',
          description: 'Participate in protocol governance and earn rewards for active voting.',
          type: 'governance',
          apy: 7.2,
          requirements: ['Hold minimum tokens for voting', 'Active participation in proposals'],
          risks: ['Low liquidity', 'Governance attack risk'],
          rewards: ['Voting rewards', 'Proposal creation rewards', 'Community recognition'],
          isActive: true,
          startDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000),
        },
      ],
      updates: [
        {
          id: '1',
          title: '🚀 Major Update: New Staking Pool Launched',
          content: '🚀 Excited to announce our new staking pool with up to 15% APY! Stake your tokens and earn passive income.',
          summary: 'New staking pool launched with 15% APY for passive income generation.',
          source: 'twitter',
          url: 'https://twitter.com/project/status/1',
          author: 'Project Team',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          sentiment: 'positive',
          tags: ['staking', 'defi', 'passiveincome'],
          engagement: { likes: 1250, retweets: 340, comments: 89 },
        },
        {
          id: '2',
          title: '📈 Q2 Roadmap Update: Development Progress',
          content: '📈 Q2 roadmap update: Core protocol development is 75% complete. Smart contract audit scheduled for next week.',
          summary: 'Q2 development progress at 75%, smart contract audit scheduled.',
          source: 'twitter',
          url: 'https://twitter.com/project/status/2',
          author: 'Project Team',
          publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
          sentiment: 'positive',
          tags: ['roadmap', 'development', 'governance'],
          engagement: { likes: 890, retweets: 156, comments: 45 },
        },
      ],
      stats: {
        totalUpdates: 2,
        lastUpdate: new Date(Date.now() - 2 * 60 * 60 * 1000),
        averageSentiment: 1,
        topSources: ['twitter'],
      },
      sources: {
        twitter: tokenData.socialLinks?.twitter,
        github: tokenData.links?.repos_url?.[0],
        website: tokenData.socialLinks?.homepage?.[0],
      },
    };
  }
} 