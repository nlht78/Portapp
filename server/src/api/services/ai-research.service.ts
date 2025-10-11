import { ResearchQuery, ResearchResult, ResearchFinding, AISummary, TimelineEvent } from '../interfaces/ai-research.interface';
import { TwitterService } from './twitter.service';
import { GitHubService } from './github.service';
import { ProjectService } from './project.service';

export class AIResearchService {
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private static readonly ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  static async researchToken(query: ResearchQuery): Promise<ResearchResult> {
    try {
      console.log(`🔍 Starting AI research for token: ${query.tokenId}`);
      console.log(`🔍 Query:`, query);
      
      // 1. Collect data from multiple sources
      console.log(`🔍 Step 1: Collecting data from sources...`);
      const rawData = await this.collectDataFromSources(query);
      console.log(`🔍 Raw data collected:`, Object.keys(rawData));
      
      // 2. Generate AI response directly
      console.log(`🔍 Step 2: Generating AI response...`);
      const aiResponse = await this.generateAIResearchResponse(query, rawData);
      console.log(`🔍 AI Response received:`, !!aiResponse);
      console.log(`🔍 AI Response keys:`, Object.keys(aiResponse || {}));
      
      // 3. Parse AI response into structured data
      console.log(`🔍 Step 3: Parsing AI response...`);
      const findings = this.parseAIResponseToFindings(aiResponse, query.tokenId);
      console.log(`🔍 Findings count:`, findings.length);
      
      // 4. Create timeline
      console.log(`🔍 Step 4: Creating timeline...`);
      const timeline = this.createTimeline(findings);
      
      // 5. Calculate confidence score
      console.log(`🔍 Step 5: Calculating confidence...`);
      const confidence = this.calculateConfidence(findings);
      
      const result: ResearchResult = {
        id: `research-${query.tokenId}-${Date.now()}`,
        query: query.query,
        tokenId: query.tokenId,
        summary: aiResponse.executiveSummary || 'AI research completed',
        detailedAnalysis: aiResponse.detailedAnalysis || aiResponse.fullResponse,
        sources: this.extractSources(findings),
        findings,
        confidence,
        lastUpdated: new Date(),
        metadata: {
          totalSources: findings.length,
          officialSources: findings.filter(f => f.source.isOfficial).length,
          timeRange: query.timeRange,
          keyTopics: this.extractKeyTopics(findings),
        },
      };

      console.log(`🔍 Research completed successfully!`);
      return result;
    } catch (error) {
      console.error('❌ Error in AI research:', error);
      return this.getMockResearchResult(query);
    }
  }

  private static async collectDataFromSources(query: ResearchQuery) {
    const data: any = {
      twitter: [],
      github: [],
      project: null,
      news: [],
      reddit: [],
      whitepaper: null,
    };

    // Collect from existing services
    try {
      // Get project data
      const tokenResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${query.tokenId}`);
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        data.project = await ProjectService.getProjectData(query.tokenId, tokenData);
      }

      // Get Twitter data if available
      if (query.sources.includes('twitter') && data.project?.sources?.twitter) {
        const twitterHandle = this.extractTwitterHandle(data.project.sources.twitter);
        if (twitterHandle) {
          data.twitter = await TwitterService.getProjectUpdates(twitterHandle, 50);
        }
      }

      // Get GitHub data if available
      if (query.sources.includes('github') && data.project?.sources?.github) {
        const githubRepo = this.extractGitHubRepo(data.project.sources.github);
        if (githubRepo) {
          const githubData = await GitHubService.getProjectActivity(githubRepo.owner, githubRepo.repo);
          data.github = githubData.updates;
        }
      }
    } catch (error) {
      console.error('Error collecting data:', error);
    }

    return data;
  }

  private static async analyzeFindings(rawData: any, query: ResearchQuery): Promise<ResearchFinding[]> {
    const findings: ResearchFinding[] = [];

    // Analyze Twitter data
    if (rawData.twitter.length > 0) {
      const twitterFindings = this.analyzeTwitterData(rawData.twitter, query);
      findings.push(...twitterFindings);
    }

    // Analyze GitHub data
    if (rawData.github.length > 0) {
      const githubFindings = this.analyzeGitHubData(rawData.github, query);
      findings.push(...githubFindings);
    }

    // Analyze project data
    if (rawData.project) {
      const projectFindings = this.analyzeProjectData(rawData.project, query);
      findings.push(...projectFindings);
    }

    // Add mock findings for demonstration
    console.log(`Generating mock findings for token: ${query.tokenId}`);
    const mockFindings = this.generateMockFindings(query.tokenId);
    console.log(`Generated ${mockFindings.length} mock findings for ${query.tokenId}`);
    findings.push(...mockFindings);

    console.log(`Total findings: ${findings.length}`);
    return findings.sort((a, b) => b.confidence - a.confidence);
  }

  private static analyzeTwitterData(tweets: any[], query: ResearchQuery): ResearchFinding[] {
    const findings: ResearchFinding[] = [];

    tweets.forEach((tweet, index) => {
      const category = this.categorizeContent(tweet.content);
      const impact = this.assessImpact(tweet.engagement);
      const status = this.assessStatus(tweet.author, tweet.sentiment);

      findings.push({
        id: `twitter-${tweet.id}`,
        category,
        title: tweet.title,
        description: tweet.summary,
        source: {
          id: `twitter-${index}`,
          name: 'Twitter/X',
          type: 'twitter',
          url: tweet.url,
          lastUpdated: tweet.publishedAt,
          reliability: 0.8,
          isOfficial: tweet.author.toLowerCase().includes(query.tokenId.toLowerCase()),
        },
        date: tweet.publishedAt,
        confidence: this.calculateFindingConfidence(tweet),
        impact,
        status,
        tags: tweet.tags,
        relatedFindings: [],
      });
    });

    return findings;
  }

  private static analyzeGitHubData(commits: any[], query: ResearchQuery): ResearchFinding[] {
    const findings: ResearchFinding[] = [];

    commits.forEach((commit, index) => {
      const category = this.categorizeContent(commit.content);
      
      findings.push({
        id: `github-${commit.id}`,
        category,
        title: commit.title,
        description: commit.summary,
        source: {
          id: `github-${index}`,
          name: 'GitHub',
          type: 'github',
          url: commit.url,
          lastUpdated: commit.publishedAt,
          reliability: 0.9,
          isOfficial: true,
        },
        date: commit.publishedAt,
        confidence: 0.9,
        impact: 'medium',
        status: 'confirmed',
        tags: commit.tags,
        relatedFindings: [],
      });
    });

    return findings;
  }

  private static analyzeProjectData(projectData: any, query: ResearchQuery): ResearchFinding[] {
    const findings: ResearchFinding[] = [];

    // Analyze roadmap if exists
    if (projectData.roadmap && Array.isArray(projectData.roadmap)) {
      projectData.roadmap.forEach((item: any, index: number) => {
        findings.push({
          id: `roadmap-${item.id}`,
          category: 'roadmap',
          title: item.title,
          description: item.description,
          source: {
            id: `project-${index}`,
            name: 'Project Data',
            type: 'website',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.85,
            isOfficial: true,
          },
          date: new Date(),
          confidence: 0.85,
          impact: item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low',
          status: item.status === 'completed' ? 'confirmed' : 'speculation',
          tags: [item.category, item.priority],
          relatedFindings: [],
        });
      });
    }

    // Analyze earning mechanisms if exists
    if (projectData.earningMechanisms && Array.isArray(projectData.earningMechanisms)) {
      projectData.earningMechanisms.forEach((mechanism: any, index: number) => {
        findings.push({
          id: `earning-${mechanism.id}`,
          category: 'earning',
          title: mechanism.name,
          description: mechanism.description,
          source: {
            id: `project-earning-${index}`,
            name: 'Project Data',
            type: 'website',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.8,
            isOfficial: true,
          },
          date: new Date(),
          confidence: 0.8,
          impact: 'high',
          status: mechanism.isActive ? 'confirmed' : 'speculation',
          tags: [mechanism.type, 'apy'],
          relatedFindings: [],
        });
      });
    }

    return findings;
  }

  private static generateMockFindings(tokenId: string): ResearchFinding[] {
    // Generate dynamic mock data based on token type
    const tokenType = this.getTokenType(tokenId);
    const mockFindings: ResearchFinding[] = [];

    // Add token-specific findings
    switch (tokenType) {
      case 'defi':
        mockFindings.push(
          {
            id: 'mock-1',
            category: 'roadmap',
            title: 'Enhanced DeFi Protocol Launch',
            description: `${tokenId.toUpperCase()} is planning to launch enhanced DeFi protocols with improved yield farming and liquidity mining features in the next quarter.`,
            source: {
              id: 'mock-source-1',
              name: 'Official Announcement',
              type: 'website',
              url: `https://${tokenId}.com`,
              lastUpdated: new Date(),
              reliability: 0.9,
              isOfficial: true,
            },
            date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            confidence: 0.9,
            impact: 'high',
            status: 'confirmed',
            tags: ['defi', 'yield-farming', 'liquidity'],
            relatedFindings: [],
          },
          {
            id: 'mock-2',
            category: 'tokenomics',
            title: 'Governance Token Distribution',
            description: `New governance token distribution mechanism planned for ${tokenId.toUpperCase()} holders with voting rights and staking rewards.`,
            source: {
              id: 'mock-source-2',
              name: 'Whitepaper Update',
              type: 'whitepaper',
              url: `https://whitepaper.${tokenId}.com`,
              lastUpdated: new Date(),
              reliability: 0.85,
              isOfficial: true,
            },
            date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            confidence: 0.85,
            impact: 'high',
            status: 'confirmed',
            tags: ['governance', 'staking', 'tokenomics'],
            relatedFindings: [],
          }
        );
        break;

      case 'gaming':
        // Special detailed data for AXS
        if (tokenId.toLowerCase() === 'axs') {
          mockFindings.push(
            {
              id: 'mock-1',
              category: 'roadmap',
              title: 'Atia\'s Legacy – Axie MMO',
              description: 'Playtest mở đăng ký từ đầu tháng 7/2025, là phiên bản early‑access của trò chơi MMO trong vũ trụ Axie. Người chơi có thể đăng ký tham gia trước khi ra mắt chính thức.',
              source: {
                id: 'mock-source-1',
                name: 'castlecrypto.gg',
                type: 'news',
                url: 'https://castlecrypto.gg',
                lastUpdated: new Date(),
                reliability: 0.9,
                isOfficial: false,
              },
              date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
              confidence: 0.95,
              impact: 'high',
              status: 'confirmed',
              tags: ['mmo', 'gaming', 'playtest', 'launch'],
              relatedFindings: [],
            },
            {
              id: 'mock-2',
              category: 'roadmap',
              title: 'Classic Competitive Season 10',
              description: 'Sự kiện Season 10 của Axie Classic Competitive bắt đầu vào ngày 3/7/2025, kèm theo nhiều cân bằng gameplay mới để cải thiện trò chơi.',
              source: {
                id: 'mock-source-2',
                name: 'TradingView',
                type: 'news',
                url: 'https://tradingview.com',
                lastUpdated: new Date(),
                reliability: 0.85,
                isOfficial: false,
              },
              date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              confidence: 0.9,
              impact: 'high',
              status: 'confirmed',
              tags: ['competitive', 'season', 'gameplay', 'balancing'],
              relatedFindings: [],
            },
            {
              id: 'mock-3',
              category: 'roadmap',
              title: 'Collection & Trait Offers',
              description: 'Tính năng mới cho phép người dùng tạo các offer dựa theo collection hoặc trait trực tiếp trên App.axie, ra mắt ngày 25/7/2025.',
              source: {
                id: 'mock-source-3',
                name: 'whitepaper.axieinfinity.com',
                type: 'whitepaper',
                url: 'https://whitepaper.axieinfinity.com',
                lastUpdated: new Date(),
                reliability: 0.95,
                isOfficial: true,
              },
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              confidence: 0.95,
              impact: 'medium',
              status: 'confirmed',
              tags: ['collection', 'trait', 'offers', 'marketplace'],
              relatedFindings: [],
            },
            {
              id: 'mock-4',
              category: 'airdrop',
              title: 'Airdrop phụ kiện "Nightmare"',
              description: 'Airdrop lần 2 dành cho Nightmare Accessory đã được phân phối trong tháng 6/2025.',
              source: {
                id: 'mock-source-4',
                name: 'Coindar — Cryptocurrency Calendar',
                type: 'calendar',
                url: 'https://coindar.org',
                lastUpdated: new Date(),
                reliability: 0.8,
                isOfficial: false,
              },
              date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
              confidence: 0.8,
              impact: 'medium',
              status: 'confirmed',
              tags: ['airdrop', 'accessory', 'nightmare', 'reward'],
              relatedFindings: [],
            },
            {
              id: 'mock-5',
              category: 'tokenomics',
              title: 'AXS Staking Halving',
              description: 'Vào ngày 1/7/2025, Axie Infinity thực hiện giảm 50% lượng phát hành AXS staking reward, giảm ~35% lượng phát hành hiện tại theo whitepaper roadmap.',
              source: {
                id: 'mock-source-5',
                name: 'twitter.com',
                type: 'twitter',
                url: 'https://twitter.com/AxieInfinity',
                lastUpdated: new Date(),
                reliability: 0.9,
                isOfficial: true,
              },
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              confidence: 0.95,
              impact: 'high',
              status: 'confirmed',
              tags: ['staking', 'halving', 'tokenomics', 'reward'],
              relatedFindings: [],
            },
            {
              id: 'mock-6',
              category: 'tokenomics',
              title: 'Unlock token sắp tới',
              description: 'Sự kiện unlock tiếp theo vào ngày 10/8/2025, chuyển khoảng token sang mục Staking Rewards (~9M AXS tương đương ~5–6% tổng cung).',
              source: {
                id: 'mock-source-6',
                name: 'tokenomist.ai',
                type: 'analytics',
                url: 'https://tokenomist.ai',
                lastUpdated: new Date(),
                reliability: 0.85,
                isOfficial: false,
              },
              date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              confidence: 0.85,
              impact: 'high',
              status: 'confirmed',
              tags: ['unlock', 'tokenomics', 'supply', 'staking'],
              relatedFindings: [],
            },
            {
              id: 'mock-7',
              category: 'earning',
              title: 'Play-to-Earn trong game',
              description: 'Classic Season 10 và các giải đấu tiếp theo vẫn thưởng AXS cho người thắng/archetype clans.',
              source: {
                id: 'mock-source-7',
                name: 'Coindar — Cryptocurrency Calendar',
                type: 'calendar',
                url: 'https://coindar.org',
                lastUpdated: new Date(),
                reliability: 0.8,
                isOfficial: false,
              },
              date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              confidence: 0.9,
              impact: 'high',
              status: 'confirmed',
              tags: ['play-to-earn', 'competitive', 'rewards', 'pvp'],
              relatedFindings: [],
            },
            {
              id: 'mock-8',
              category: 'earning',
              title: 'Airdrop và reward task',
              description: 'Ví dụ như Nightmare Accessory airdrop, bounty board, offers dựa trait.',
              source: {
                id: 'mock-source-8',
                name: 'GAM3S.GG',
                type: 'gaming',
                url: 'https://gam3s.gg',
                lastUpdated: new Date(),
                reliability: 0.75,
                isOfficial: false,
              },
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              confidence: 0.75,
              impact: 'medium',
              status: 'confirmed',
              tags: ['airdrop', 'bounty', 'rewards', 'tasks'],
              relatedFindings: [],
            },
            {
              id: 'mock-9',
              category: 'earning',
              title: 'Staking rewards',
              description: 'Người dùng vẫn có thể stake AXS để nhận phần thưởng, dù đã giảm mạnh. Phần này tiếp tục kéo dài đến 3/2026.',
              source: {
                id: 'mock-source-9',
                name: 'rootdata.com',
                type: 'analytics',
                url: 'https://rootdata.com',
                lastUpdated: new Date(),
                reliability: 0.9,
                isOfficial: false,
              },
              date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
              confidence: 0.9,
              impact: 'high',
              status: 'confirmed',
              tags: ['staking', 'rewards', 'apy', 'long-term'],
              relatedFindings: [],
            },
            {
              id: 'mock-10',
              category: 'roadmap',
              title: 'Dự án MMO và UGC',
              description: 'Atia\'s Legacy MMO và các dự án sử dụng Lunacia SDK (game do community phát triển) có thể phát triển thêm nguồn AXS reward mới.',
              source: {
                id: 'mock-source-10',
                name: 'X (formerly Twitter)',
                type: 'twitter',
                url: 'https://twitter.com/AxieInfinity',
                lastUpdated: new Date(),
                reliability: 0.8,
                isOfficial: true,
              },
              date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
              confidence: 0.8,
              impact: 'high',
              status: 'speculation',
              tags: ['mmo', 'ugc', 'sdk', 'community'],
              relatedFindings: [],
            }
          );
        } else {
          // Generic gaming data for other gaming tokens
          mockFindings.push(
            {
              id: 'mock-1',
              category: 'roadmap',
              title: 'Gaming Ecosystem Expansion',
              description: `${tokenId.toUpperCase()} is expanding its gaming ecosystem with new play-to-earn games and NFT marketplace features.`,
              source: {
                id: 'mock-source-1',
                name: 'Official Announcement',
                type: 'website',
                url: `https://${tokenId}.com`,
                lastUpdated: new Date(),
                reliability: 0.9,
                isOfficial: true,
              },
              date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              confidence: 0.9,
              impact: 'high',
              status: 'confirmed',
              tags: ['gaming', 'nft', 'play-to-earn'],
              relatedFindings: [],
            },
            {
              id: 'mock-2',
              category: 'earning',
              title: 'New Gaming Rewards System',
              description: `Enhanced reward system for ${tokenId.toUpperCase()} gamers with improved token distribution and achievement-based rewards.`,
              source: {
                id: 'mock-source-2',
                name: 'Community Update',
                type: 'discord',
                url: `https://discord.gg/${tokenId}`,
                lastUpdated: new Date(),
                reliability: 0.75,
                isOfficial: false,
              },
              date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
              confidence: 0.75,
              impact: 'medium',
              status: 'speculation',
              tags: ['gaming', 'rewards', 'achievements'],
              relatedFindings: [],
            }
          );
        }
        break;

      case 'infrastructure':
        mockFindings.push(
          {
            id: 'mock-1',
            category: 'development',
            title: 'Infrastructure Upgrade',
            description: `${tokenId.toUpperCase()} is planning major infrastructure upgrades to improve scalability and transaction throughput.`,
            source: {
              id: 'mock-source-1',
              name: 'Technical Update',
              type: 'github',
              url: `https://github.com/${tokenId}`,
              lastUpdated: new Date(),
              reliability: 0.95,
              isOfficial: true,
            },
            date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
            confidence: 0.95,
            impact: 'high',
            status: 'confirmed',
            tags: ['infrastructure', 'scalability', 'development'],
            relatedFindings: [],
          },
          {
            id: 'mock-2',
            category: 'partnership',
            title: 'Enterprise Partnerships',
            description: `Strategic partnerships with enterprise clients to expand ${tokenId.toUpperCase()} adoption in corporate environments.`,
            source: {
              id: 'mock-source-2',
              name: 'Business Update',
              type: 'news',
              url: 'https://cryptonews.com',
              lastUpdated: new Date(),
              reliability: 0.7,
              isOfficial: false,
            },
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            confidence: 0.7,
            impact: 'high',
            status: 'speculation',
            tags: ['partnership', 'enterprise', 'adoption'],
            relatedFindings: [],
          }
        );
        break;

      default:
        mockFindings.push(
          {
            id: 'mock-1',
            category: 'roadmap',
            title: 'Ecosystem Development',
            description: `${tokenId.toUpperCase()} is actively developing its ecosystem with new features and partnerships planned for the upcoming months.`,
            source: {
              id: 'mock-source-1',
              name: 'Official Update',
              type: 'website',
              url: `https://${tokenId}.com`,
              lastUpdated: new Date(),
              reliability: 0.8,
              isOfficial: true,
            },
            date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
            confidence: 0.8,
            impact: 'medium',
            status: 'confirmed',
            tags: ['ecosystem', 'development', 'partnerships'],
            relatedFindings: [],
          },
          {
            id: 'mock-2',
            category: 'earning',
            title: 'Staking Opportunities',
            description: `New staking opportunities for ${tokenId.toUpperCase()} holders with competitive APY rates and flexible lock periods.`,
            source: {
              id: 'mock-source-2',
              name: 'Community Update',
              type: 'telegram',
              url: `https://t.me/${tokenId}`,
              lastUpdated: new Date(),
              reliability: 0.65,
              isOfficial: false,
            },
            date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            confidence: 0.65,
            impact: 'medium',
            status: 'speculation',
            tags: ['staking', 'apy', 'rewards'],
            relatedFindings: [],
          }
        );
    }

    return mockFindings;
  }

  private static getTokenType(tokenId: string): 'defi' | 'gaming' | 'infrastructure' | 'other' {
    const defiTokens = ['uniswap', 'aave', 'compound', 'curve', 'sushi', 'yearn', 'balancer'];
    const gamingTokens = ['axs', 'sand', 'mana', 'enj', 'gala', 'ilv', 'hero'];
    const infrastructureTokens = ['eth', 'sol', 'ada', 'dot', 'avax', 'matic', 'link'];

    if (defiTokens.includes(tokenId.toLowerCase())) return 'defi';
    if (gamingTokens.includes(tokenId.toLowerCase())) return 'gaming';
    if (infrastructureTokens.includes(tokenId.toLowerCase())) return 'infrastructure';
    return 'other';
  }

  private static async generateAISummary(findings: ResearchFinding[], query: ResearchQuery): Promise<AISummary> {
    if (this.OPENAI_API_KEY) {
      return this.generateOpenAISummary(findings, query);
    }

    return this.generateMockAISummary(findings, query);
  }

  private static async generateOpenAISummary(findings: ResearchFinding[], query: ResearchQuery): Promise<AISummary> {
    try {
      const prompt = this.buildAIPrompt(findings, query);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a cryptocurrency research analyst. Provide comprehensive analysis based on the provided data.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 2000,
          temperature: 0.3,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return this.parseAIResponse(data.choices[0].message.content);
      }
    } catch (error) {
      console.error('OpenAI API error:', error);
    }

    return this.generateMockAISummary(findings, query);
  }

  private static buildAIPrompt(findings: ResearchFinding[], query: ResearchQuery): string {
    const findingsText = findings.map(f => 
      `- ${f.category.toUpperCase()}: ${f.title} (${f.status}, confidence: ${f.confidence})
       Description: ${f.description}
       Source: ${f.source.name} (${f.source.isOfficial ? 'Official' : 'Unofficial'})
       Date: ${f.date.toISOString()}`
    ).join('\n\n');

    return `
Analyze the following findings for ${query.tokenId} and provide a comprehensive research summary:

FINDINGS:
${findingsText}

QUERY: ${query.query}

Please provide:
1. Executive Summary (2-3 sentences)
2. Key Highlights (5-7 bullet points)
3. Timeline of important events
4. Investment Recommendations
5. Potential Risks
6. Opportunities
7. Next Steps for investors

Format the response as JSON with the following structure:
{
  "executiveSummary": "...",
  "keyHighlights": ["...", "..."],
  "timeline": [
    {
      "date": "2025-07-01",
      "title": "...",
      "description": "...",
      "category": "...",
      "status": "upcoming"
    }
  ],
  "recommendations": ["...", "..."],
  "risks": ["...", "..."],
  "opportunities": ["...", "..."],
  "nextSteps": ["...", "..."]
}
    `;
  }

  private static parseAIResponse(response: string): AISummary {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      console.error('Error parsing AI response:', error);
    }

    return this.generateMockAISummary([], { tokenId: '', query: '', sources: [], timeRange: '30d', includeHistorical: false });
  }

  private static generateMockAISummary(findings: ResearchFinding[], query: ResearchQuery): AISummary {
    const tokenType = this.getTokenType(query.tokenId);
    const tokenName = query.tokenId.toUpperCase();

    let executiveSummary = '';
    let keyHighlights: string[] = [];
    let timeline: TimelineEvent[] = [];
    let recommendations: string[] = [];
    let risks: string[] = [];
    let opportunities: string[] = [];
    let nextSteps: string[] = [];

    switch (tokenType) {
      case 'defi':
        executiveSummary = `${tokenName} demonstrates strong DeFi ecosystem development with enhanced protocols, governance mechanisms, and yield farming opportunities. The project shows clear focus on decentralized finance innovation.`;
        keyHighlights = [
          'Enhanced DeFi protocol launch planned',
          'New governance token distribution mechanism',
          'Improved yield farming and liquidity mining',
          'Strong community governance participation',
          'Expanding DeFi ecosystem partnerships',
          'Competitive APY rates for stakers',
          'Advanced smart contract security measures'
        ];
        timeline = [
          {
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            title: 'Enhanced DeFi Protocol Launch',
            description: 'New DeFi protocols with improved features',
            category: 'roadmap',
            status: 'upcoming',
            source: 'Official Announcement'
          },
          {
            date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            title: 'Governance Token Distribution',
            description: 'New governance mechanism implementation',
            category: 'tokenomics',
            status: 'upcoming',
            source: 'Whitepaper Update'
          }
        ];
        recommendations = [
          'Monitor DeFi protocol launches for early access',
          'Participate in governance voting for rewards',
          'Diversify into new yield farming pools',
          'Follow official announcements for updates'
        ];
        risks = [
          'Smart contract vulnerabilities in new protocols',
          'Market volatility during protocol launches',
          'Competition from other DeFi platforms',
          'Regulatory changes affecting DeFi'
        ];
        opportunities = [
          'Early access to new DeFi protocols',
          'Governance rewards and voting rights',
          'Enhanced yield farming opportunities',
          'Strategic DeFi partnerships'
        ];
        nextSteps = [
          'Set up wallet for protocol access',
          'Monitor governance proposals',
          'Research new yield farming strategies',
          'Join community discussions'
        ];
        break;

      case 'gaming':
        // Special detailed summary for AXS
        if (query.tokenId.toLowerCase() === 'axs') {
          executiveSummary = 'AXS đang trong giai đoạn phát triển mạnh mẽ với nhiều sự kiện quan trọng sắp diễn ra trong tháng 7-8/2025. Dự án tập trung vào việc mở rộng hệ sinh thái gaming và cải thiện tokenomics.';
          keyHighlights = [
            'Atia\'s Legacy MMO playtest mở đăng ký từ tháng 7/2025',
            'Classic Competitive Season 10 bắt đầu ngày 3/7/2025',
            'Collection & Trait Offers ra mắt ngày 25/7/2025',
            'AXS Staking Halving giảm 50% từ 1/7/2025',
            'Unlock token tiếp theo vào 10/8/2025 (~9M AXS)',
            'Airdrop Nightmare Accessory đã phân phối tháng 6/2025',
            'Staking rewards tiếp tục đến tháng 3/2026'
          ];
          timeline = [
            {
              date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
              title: 'Classic Competitive Season 10',
              description: 'Sự kiện Season 10 với cân bằng gameplay mới',
              category: 'roadmap',
              status: 'upcoming',
              source: 'TradingView'
            },
            {
              date: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
              title: 'Collection & Trait Offers',
              description: 'Tính năng mới trên App.axie',
              category: 'roadmap',
              status: 'upcoming',
              source: 'whitepaper.axieinfinity.com'
            },
            {
              date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              title: 'Unlock token tiếp theo',
              description: '~9M AXS chuyển sang Staking Rewards',
              category: 'tokenomics',
              status: 'upcoming',
              source: 'tokenomist.ai'
            },
            {
              date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
              title: 'Atia\'s Legacy MMO Playtest',
              description: 'Early-access cho trò chơi MMO mới',
              category: 'roadmap',
              status: 'upcoming',
              source: 'castlecrypto.gg'
            }
          ];
          recommendations = [
            'Đăng ký tham gia Atia\'s Legacy MMO playtest',
            'Chuẩn bị cho Classic Season 10',
            'Theo dõi Collection & Trait Offers',
            'Cân nhắc staking AXS dù đã giảm reward',
            'Tham gia các giải đấu PvP để kiếm AXS'
          ];
          risks = [
            'Staking reward giảm 50% có thể ảnh hưởng đến thu nhập',
            'Game development có thể bị delay',
            'Market volatility trong thời gian unlock',
            'Competition từ các gaming token khác'
          ];
          opportunities = [
            'Early access vào MMO mới với reward cao',
            'Trading Collection & Trait Offers',
            'Tham gia competitive events với prize pool',
            'Staking dài hạn với reward ổn định',
            'Airdrop và bounty opportunities'
          ];
          nextSteps = [
            'Follow @AxieInfinity trên Twitter',
            'Theo dõi Coindar/tokenomist cho events',
            'Tham gia Discord community',
            'Chuẩn bị wallet cho các tính năng mới',
            'Research trading strategies cho Collection Offers'
          ];
        } else {
          // Generic gaming summary for other gaming tokens
          executiveSummary = `${tokenName} is expanding its gaming ecosystem with new play-to-earn features, NFT marketplace enhancements, and improved reward systems. The project shows strong gaming industry focus.`;
          keyHighlights = [
            'Gaming ecosystem expansion planned',
            'New play-to-earn game releases',
            'Enhanced NFT marketplace features',
            'Improved gaming reward systems',
            'Strategic gaming partnerships',
            'Achievement-based token rewards',
            'Cross-platform gaming integration'
          ];
          timeline = [
            {
              date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
              title: 'Gaming Ecosystem Expansion',
              description: 'New games and NFT marketplace features',
              category: 'roadmap',
              status: 'upcoming',
              source: 'Official Announcement'
            },
            {
              date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              title: 'Enhanced Reward System',
              description: 'Improved token distribution for gamers',
              category: 'earning',
              status: 'upcoming',
              source: 'Community Update'
            }
          ];
          recommendations = [
            'Prepare for new game releases',
            'Monitor NFT marketplace updates',
            'Participate in gaming events for rewards',
            'Follow gaming partnership announcements'
          ];
          risks = [
            'Game development delays',
            'Market competition from other gaming tokens',
            'NFT market volatility',
            'Gaming industry regulatory changes'
          ];
          opportunities = [
            'Early access to new games',
            'NFT marketplace trading opportunities',
            'Gaming achievement rewards',
            'Cross-platform gaming benefits'
          ];
          nextSteps = [
            'Set up gaming wallet',
            'Monitor new game announcements',
            'Participate in gaming events',
            'Research NFT trading strategies'
          ];
        }
        break;

      case 'infrastructure':
        executiveSummary = `${tokenName} is planning major infrastructure upgrades to improve scalability, transaction throughput, and enterprise adoption. The project focuses on technical excellence and enterprise partnerships.`;
        keyHighlights = [
          'Major infrastructure upgrade planned',
          'Scalability improvements',
          'Enterprise partnership expansion',
          'Enhanced transaction throughput',
          'Developer tool improvements',
          'Cross-chain integration features',
          'Advanced security implementations'
        ];
        timeline = [
          {
            date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            title: 'Infrastructure Upgrade',
            description: 'Major scalability and performance improvements',
            category: 'development',
            status: 'upcoming',
            source: 'Technical Update'
          },
          {
            date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            title: 'Enterprise Partnerships',
            description: 'Strategic corporate adoption initiatives',
            category: 'partnership',
            status: 'upcoming',
            source: 'Business Update'
          }
        ];
        recommendations = [
          'Monitor infrastructure upgrade progress',
          'Follow enterprise partnership announcements',
          'Consider long-term holding strategy',
          'Track developer ecosystem growth'
        ];
        risks = [
          'Technical implementation challenges',
          'Enterprise adoption delays',
          'Competition from other infrastructure projects',
          'Regulatory compliance requirements'
        ];
        opportunities = [
          'Early access to upgraded infrastructure',
          'Enterprise adoption benefits',
          'Developer ecosystem growth',
          'Cross-chain integration opportunities'
        ];
        nextSteps = [
          'Monitor technical updates',
          'Follow enterprise news',
          'Track developer activity',
          'Research long-term potential'
        ];
        break;

      default:
        executiveSummary = `${tokenName} is actively developing its ecosystem with new features, partnerships, and staking opportunities. The project shows steady development momentum.`;
        keyHighlights = [
          'Ecosystem development initiatives',
          'New staking opportunities',
          'Strategic partnership expansion',
          'Community engagement programs',
          'Feature development roadmap',
          'Competitive APY rates',
          'Flexible staking options'
        ];
        timeline = [
          {
            date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            title: 'Ecosystem Development',
            description: 'New features and partnerships',
            category: 'roadmap',
            status: 'upcoming',
            source: 'Official Update'
          },
          {
            date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            title: 'Staking Opportunities',
            description: 'New staking pools with competitive APY',
            category: 'earning',
            status: 'upcoming',
            source: 'Community Update'
          }
        ];
        recommendations = [
          'Monitor ecosystem development progress',
          'Consider staking for passive income',
          'Follow partnership announcements',
          'Participate in community events'
        ];
        risks = [
          'Development timeline delays',
          'Market competition',
          'Staking reward fluctuations',
          'Partnership execution risks'
        ];
        opportunities = [
          'Early access to new features',
          'Staking reward accumulation',
          'Partnership benefits',
          'Community participation rewards'
        ];
        nextSteps = [
          'Set up staking positions',
          'Monitor development updates',
          'Join community discussions',
          'Research partnership potential'
        ];
    }

    return {
      executiveSummary,
      keyHighlights,
      timeline,
      recommendations,
      risks,
      opportunities,
      nextSteps
    };
  }

  private static createTimeline(findings: ResearchFinding[]): TimelineEvent[] {
    const timeline: TimelineEvent[] = [];

    findings.forEach(finding => {
      timeline.push({
        date: finding.date,
        title: finding.title,
        description: finding.description,
        category: finding.category,
        status: finding.status === 'confirmed' ? 'upcoming' : 'ongoing',
        source: finding.source.name
      });
    });

    return timeline.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private static calculateConfidence(findings: ResearchFinding[]): number {
    if (findings.length === 0) return 0;

    const totalConfidence = findings.reduce((sum, finding) => sum + finding.confidence, 0);
    const officialWeight = findings.filter(f => f.source.isOfficial).length / findings.length;
    
    return (totalConfidence / findings.length) * (0.7 + 0.3 * officialWeight);
  }

  private static generateDetailedAnalysis(aiSummary: AISummary, findings: ResearchFinding[]): string {
    return `
# ${aiSummary.executiveSummary}

## Key Highlights
${aiSummary.keyHighlights.map(h => `- ${h}`).join('\n')}

## Timeline Analysis
${aiSummary.timeline.map(t => `**${t.date.toLocaleDateString()}**: ${t.title} - ${t.description}`).join('\n')}

## Investment Recommendations
${aiSummary.recommendations.map(r => `- ${r}`).join('\n')}

## Risk Assessment
${aiSummary.risks.map(r => `- ${r}`).join('\n')}

## Opportunities
${aiSummary.opportunities.map(o => `- ${o}`).join('\n')}

## Next Steps
${aiSummary.nextSteps.map(s => `- ${s}`).join('\n')}

## Data Sources
Based on analysis of ${findings.length} findings from ${findings.filter(f => f.source.isOfficial).length} official sources.
    `;
  }

  private static extractSources(findings: ResearchFinding[]) {
    const sourceMap = new Map();
    
    findings.forEach(finding => {
      const key = finding.source.id;
      if (!sourceMap.has(key)) {
        sourceMap.set(key, finding.source);
      }
    });

    return Array.from(sourceMap.values());
  }

  private static extractKeyTopics(findings: ResearchFinding[]): string[] {
    const topics = new Set<string>();
    
    findings.forEach(finding => {
      finding.tags.forEach(tag => topics.add(tag));
      topics.add(finding.category);
    });

    return Array.from(topics).slice(0, 10);
  }

  private static categorizeContent(content: string): ResearchFinding['category'] {
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('roadmap') || lowerContent.includes('launch') || lowerContent.includes('release')) {
      return 'roadmap';
    }
    if (lowerContent.includes('staking') || lowerContent.includes('tokenomics') || lowerContent.includes('halving')) {
      return 'tokenomics';
    }
    if (lowerContent.includes('earning') || lowerContent.includes('yield') || lowerContent.includes('apy')) {
      return 'earning';
    }
    if (lowerContent.includes('partnership') || lowerContent.includes('collaboration')) {
      return 'partnership';
    }
    if (lowerContent.includes('airdrop') || lowerContent.includes('reward')) {
      return 'airdrop';
    }
    
    return 'development';
  }

  private static assessImpact(engagement?: any): ResearchFinding['impact'] {
    if (!engagement) return 'medium';
    
    const totalEngagement = (engagement.likes || 0) + (engagement.retweets || 0) + (engagement.comments || 0);
    
    if (totalEngagement > 1000) return 'high';
    if (totalEngagement > 100) return 'medium';
    return 'low';
  }

  private static assessStatus(author: string, sentiment: string): ResearchFinding['status'] {
    if (author.toLowerCase().includes('official') || author.toLowerCase().includes('team')) {
      return 'confirmed';
    }
    if (sentiment === 'positive') {
      return 'speculation';
    }
    return 'rumor';
  }

  private static calculateFindingConfidence(tweet: any): number {
    let confidence = 0.5;
    
    // Official source bonus
    if (tweet.author.toLowerCase().includes('official')) confidence += 0.3;
    
    // Engagement bonus
    const engagement = (tweet.engagement?.likes || 0) + (tweet.engagement?.retweets || 0);
    if (engagement > 1000) confidence += 0.2;
    else if (engagement > 100) confidence += 0.1;
    
    // Sentiment bonus
    if (tweet.sentiment === 'positive') confidence += 0.1;
    
    return Math.min(confidence, 1.0);
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

  private static getMockResearchResult(query: ResearchQuery): ResearchResult {
    const mockFindings = this.generateMockFindings(query.tokenId);
    const mockSummary = this.generateMockAISummary(mockFindings, query);
    
    return {
      id: `mock-research-${query.tokenId}`,
      query: query.query,
      tokenId: query.tokenId,
      summary: mockSummary.executiveSummary,
      detailedAnalysis: this.generateDetailedAnalysis(mockSummary, mockFindings),
      sources: this.extractSources(mockFindings),
      findings: mockFindings,
      confidence: 0.75,
      lastUpdated: new Date(),
      metadata: {
        totalSources: mockFindings.length,
        officialSources: mockFindings.filter(f => f.source.isOfficial).length,
        timeRange: query.timeRange,
        keyTopics: this.extractKeyTopics(mockFindings),
      },
    };
  }

  private static async generateAIResearchResponse(query: ResearchQuery, rawData: any): Promise<any> {
    console.log('🔍 AI Research Debug:');
    console.log('- OPENAI_API_KEY exists:', !!this.OPENAI_API_KEY);
    console.log('- ANTHROPIC_API_KEY exists:', !!this.ANTHROPIC_API_KEY);
    console.log('- Query:', query);
    
    if (this.OPENAI_API_KEY) {
      console.log('🤖 Using OpenAI API...');
      return this.generateOpenAIResearchResponse(query, rawData);
    } else if (this.ANTHROPIC_API_KEY) {
      console.log('🤖 Using Anthropic API...');
      return this.generateAnthropicResearchResponse(query, rawData);
    } else {
      console.log('🤖 Using Mock AI Response...');
      return this.generateMockAIResponse(query, rawData);
    }
  }

  private static async generateOpenAIResearchResponse(query: ResearchQuery, rawData: any): Promise<any> {
    try {
      console.log('🤖 OpenAI: Starting API call...');
      const prompt = this.buildResearchPrompt(query, rawData);
      console.log('🤖 OpenAI: Prompt length:', prompt.length);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'Bạn là một chuyên gia phân tích cryptocurrency và blockchain. Hãy cung cấp phân tích chi tiết, chính xác và có cấu trúc về các dự án token. Trả lời bằng tiếng Việt.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4000,
          temperature: 0.3,
        }),
      });

      console.log('🤖 OpenAI: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('🤖 OpenAI: Response received, choices:', data.choices?.length);
        const aiResponse = data.choices[0].message.content;
        console.log('🤖 OpenAI: AI Response length:', aiResponse?.length);
        return this.parseAIResponseToStructured(aiResponse, query.tokenId);
      } else {
        const errorText = await response.text();
        console.error('🤖 OpenAI: API Error:', response.status, errorText);
      }
    } catch (error) {
      console.error('🤖 OpenAI: Network/Other error:', error);
    }

    console.log('🤖 OpenAI: Falling back to mock response');
    return this.generateMockAIResponse(query, rawData);
  }

  private static async generateAnthropicResearchResponse(query: ResearchQuery, rawData: any): Promise<any> {
    try {
      const prompt = this.buildResearchPrompt(query, rawData);
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.ANTHROPIC_API_KEY}`,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 4000,
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponse = data.content[0].text;
        return this.parseAIResponseToStructured(aiResponse, query.tokenId);
      }
    } catch (error) {
      console.error('Anthropic API error:', error);
    }

    return this.generateMockAIResponse(query, rawData);
  }

  private static buildResearchPrompt(query: ResearchQuery, rawData: any): string {
    const tokenName = query.tokenId.toUpperCase();
    
    return `Bạn có thể tìm kiếm, phân tích và tổng hợp thông tin từ các nguồn khác nhau như Twitter, GitHub, whitepaper, news, website chính thức để biết được sắp tới các dự định, roadmap, chức năng, cơ chế, cách kiếm tiền, thời gian ra mắt và các thông tin quan trọng khác của ${tokenName} sắp tới đây được không?

Hãy cung cấp phân tích chi tiết và toàn diện về:

📅 ROADMAP & KẾ HOẠCH SẮP TỚI:
- Các sự kiện quan trọng sắp diễn ra
- Tính năng mới sẽ ra mắt
- Cập nhật game/ecosystem
- Partnerships và collaborations

💸 TOKENOMICS & CƠ CHẾ TOKEN:
- Thay đổi tokenomics sắp tới
- Staking rewards và mechanisms
- Token distribution và unlock schedule
- Governance và voting

🎮 CƠ HỘI KIẾM TIỀN:
- Play-to-earn opportunities
- Staking và yield farming
- Airdrops và rewards
- Trading opportunities

🔧 PHÁT TRIỂN & ĐỐI TÁC:
- Technical updates
- Platform improvements
- Strategic partnerships
- Developer activities

🗳️ QUẢN TRỊ & AIRDROP:
- Governance proposals
- Community voting
- Airdrop events
- Community rewards

Hãy trả lời bằng tiếng Việt với cấu trúc rõ ràng, chi tiết và có thông tin cụ thể. Sử dụng thông tin thực tế và cập nhật nhất có thể từ các nguồn đáng tin cậy.`;
  }

  private static parseAIResponseToStructured(aiResponse: string, tokenId: string): any {
    // Return the AI response directly as structured data
    return {
      executiveSummary: `Phân tích ${tokenId.toUpperCase()} từ AI Research`,
      detailedAnalysis: aiResponse,
      fullResponse: aiResponse,
      roadmap: this.extractRoadmapFromText(aiResponse),
      tokenomics: this.extractTokenomicsFromText(aiResponse),
      earning: this.extractEarningFromText(aiResponse),
      development: this.extractDevelopmentFromText(aiResponse),
      partnerships: this.extractPartnershipsFromText(aiResponse),
      governance: this.extractGovernanceFromText(aiResponse),
      airdrops: this.extractAirdropsFromText(aiResponse),
      sources: this.extractSourcesFromText(aiResponse),
      conclusion: this.extractConclusionFromText(aiResponse),
      confidence: 0.85
    };
  }

  private static extractRoadmapFromText(text: string): any[] {
    const roadmap: any[] = [];
    const lines = text.split('\n');
    let inRoadmapSection = false;
    
    for (const line of lines) {
      if (line.includes('📅') || line.includes('ROADMAP')) {
        inRoadmapSection = true;
        continue;
      }
      if (inRoadmapSection && (line.includes('💸') || line.includes('🎮') || line.includes('🔧') || line.includes('🗳️'))) {
        break;
      }
      if (inRoadmapSection && (line.includes('🔹') || line.includes('🔸') || line.includes('•'))) {
        const title = line.replace(/[🔹🔸•]/g, '').trim();
        if (title) {
          roadmap.push({
            title,
            description: `Thông tin roadmap cho ${title}`,
            source: 'AI Analysis',
            status: 'speculation',
            date: 'Sắp tới'
          });
        }
      }
    }
    
    return roadmap;
  }

  private static extractTokenomicsFromText(text: string): any[] {
    const tokenomics: any[] = [];
    const lines = text.split('\n');
    let inTokenomicsSection = false;
    
    for (const line of lines) {
      if (line.includes('💸') || line.includes('TOKENOMICS')) {
        inTokenomicsSection = true;
        continue;
      }
      if (inTokenomicsSection && (line.includes('🎮') || line.includes('🔧') || line.includes('🗳️'))) {
        break;
      }
      if (inTokenomicsSection && (line.includes('🔹') || line.includes('🔸') || line.includes('•'))) {
        const title = line.replace(/[🔹🔸•]/g, '').trim();
        if (title) {
          tokenomics.push({
            title,
            description: `Thông tin tokenomics cho ${title}`,
            impact: 'medium',
            source: 'AI Analysis'
          });
        }
      }
    }
    
    return tokenomics;
  }

  private static extractEarningFromText(text: string): any[] {
    const earning: any[] = [];
    const lines = text.split('\n');
    let inEarningSection = false;
    
    for (const line of lines) {
      if (line.includes('🎮') || line.includes('KIẾM TIỀN')) {
        inEarningSection = true;
        continue;
      }
      if (inEarningSection && (line.includes('🔧') || line.includes('🗳️'))) {
        break;
      }
      if (inEarningSection && (line.includes('🔹') || line.includes('🔸') || line.includes('•'))) {
        const title = line.replace(/[🔹🔸•]/g, '').trim();
        if (title) {
          earning.push({
            title,
            description: `Cơ hội kiếm tiền: ${title}`,
            confidence: '0.8',
            source: 'AI Analysis'
          });
        }
      }
    }
    
    return earning;
  }

  private static extractDevelopmentFromText(text: string): any[] {
    const development: any[] = [];
    const lines = text.split('\n');
    let inDevSection = false;
    
    for (const line of lines) {
      if (line.includes('🔧') || line.includes('PHÁT TRIỂN')) {
        inDevSection = true;
        continue;
      }
      if (inDevSection && line.includes('🗳️')) {
        break;
      }
      if (inDevSection && (line.includes('🔹') || line.includes('🔸') || line.includes('•'))) {
        const title = line.replace(/[🔹🔸•]/g, '').trim();
        if (title) {
          development.push({
            title,
            description: `Phát triển: ${title}`,
            status: 'speculation'
          });
        }
      }
    }
    
    return development;
  }

  private static extractPartnershipsFromText(text: string): any[] {
    const partnerships: any[] = [];
    const lines = text.split('\n');
    let inPartnershipSection = false;
    
    for (const line of lines) {
      if (line.includes('ĐỐI TÁC') || line.includes('PARTNERSHIP')) {
        inPartnershipSection = true;
        continue;
      }
      if (inPartnershipSection && line.includes('🗳️')) {
        break;
      }
      if (inPartnershipSection && (line.includes('🔹') || line.includes('🔸') || line.includes('•'))) {
        const title = line.replace(/[🔹🔸•]/g, '').trim();
        if (title) {
          partnerships.push({
            title,
            description: `Đối tác: ${title}`,
            impact: 'medium'
          });
        }
      }
    }
    
    return partnerships;
  }

  private static extractGovernanceFromText(text: string): any[] {
    const governance: any[] = [];
    const lines = text.split('\n');
    let inGovSection = false;
    
    for (const line of lines) {
      if (line.includes('🗳️') || line.includes('QUẢN TRỊ')) {
        inGovSection = true;
        continue;
      }
      if (inGovSection && (line.includes('🔹') || line.includes('🔸') || line.includes('•'))) {
        const title = line.replace(/[🔹🔸•]/g, '').trim();
        if (title) {
          governance.push({
            title,
            description: `Quản trị: ${title}`,
            status: 'speculation'
          });
        }
      }
    }
    
    return governance;
  }

  private static extractAirdropsFromText(text: string): any[] {
    const airdrops: any[] = [];
    const lines = text.split('\n');
    let inAirdropSection = false;
    
    for (const line of lines) {
      if (line.includes('AIRDROP')) {
        inAirdropSection = true;
        continue;
      }
      if (inAirdropSection && (line.includes('🔹') || line.includes('🔸') || line.includes('•'))) {
        const title = line.replace(/[🔹🔸•]/g, '').trim();
        if (title) {
          airdrops.push({
            title,
            description: `Airdrop: ${title}`,
            impact: 'medium'
          });
        }
      }
    }
    
    return airdrops;
  }

  private static extractSourcesFromText(text: string): any[] {
    const sources: any[] = [];
    
    // Add AI as a source
    sources.push({
      name: 'AI Analysis',
      type: 'ai',
      isOfficial: false
    });
    
    // Extract mentioned sources from text
    const sourceKeywords = ['Twitter', 'GitHub', 'whitepaper', 'website', 'news', 'blog'];
    sourceKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword.toLowerCase())) {
        sources.push({
          name: keyword,
          type: keyword.toLowerCase() as any,
          isOfficial: false
        });
      }
    });
    
    return sources;
  }

  private static extractConclusionFromText(text: string): string {
    const lines = text.split('\n');
    const conclusionLines: string[] = [];
    let inConclusion = false;
    
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i];
      if (line.includes('KẾT LUẬN') || line.includes('TÓM TẮT') || line.includes('✅')) {
        inConclusion = true;
        continue;
      }
      if (inConclusion && line.trim()) {
        conclusionLines.unshift(line);
      }
      if (inConclusion && conclusionLines.length > 3) {
        break;
      }
    }
    
    return conclusionLines.length > 0 ? conclusionLines.join(' ') : 'Phân tích hoàn thành';
  }

  private static parseAIResponseToFindings(aiResponse: any, tokenId: string): ResearchFinding[] {
    const findings: ResearchFinding[] = [];
    let idCounter = 1;

    // Parse roadmap
    if (aiResponse.roadmap && Array.isArray(aiResponse.roadmap)) {
      aiResponse.roadmap.forEach((item: any) => {
        findings.push({
          id: `ai-roadmap-${idCounter++}`,
          category: 'roadmap',
          title: item.title,
          description: item.description,
          source: {
            id: `ai-source-${idCounter}`,
            name: item.source || 'AI Analysis',
            type: 'ai',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.8,
            isOfficial: false,
          },
          date: new Date(),
          confidence: parseFloat(item.confidence) || 0.7,
          impact: item.impact || 'medium',
          status: item.status || 'speculation',
          tags: ['roadmap', 'ai-analysis'],
          relatedFindings: [],
        });
      });
    }

    // Parse tokenomics
    if (aiResponse.tokenomics && Array.isArray(aiResponse.tokenomics)) {
      aiResponse.tokenomics.forEach((item: any) => {
        findings.push({
          id: `ai-tokenomics-${idCounter++}`,
          category: 'tokenomics',
          title: item.title,
          description: item.description,
          source: {
            id: `ai-source-${idCounter}`,
            name: item.source || 'AI Analysis',
            type: 'ai',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.8,
            isOfficial: false,
          },
          date: new Date(),
          confidence: parseFloat(item.confidence) || 0.7,
          impact: item.impact || 'medium',
          status: 'speculation',
          tags: ['tokenomics', 'ai-analysis'],
          relatedFindings: [],
        });
      });
    }

    // Parse earning
    if (aiResponse.earning && Array.isArray(aiResponse.earning)) {
      aiResponse.earning.forEach((item: any) => {
        findings.push({
          id: `ai-earning-${idCounter++}`,
          category: 'earning',
          title: item.title,
          description: item.description,
          source: {
            id: `ai-source-${idCounter}`,
            name: item.source || 'AI Analysis',
            type: 'ai',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.8,
            isOfficial: false,
          },
          date: new Date(),
          confidence: parseFloat(item.confidence) || 0.7,
          impact: item.impact || 'medium',
          status: 'speculation',
          tags: ['earning', 'ai-analysis'],
          relatedFindings: [],
        });
      });
    }

    // Parse development
    if (aiResponse.development && Array.isArray(aiResponse.development)) {
      aiResponse.development.forEach((item: any) => {
        findings.push({
          id: `ai-development-${idCounter++}`,
          category: 'development',
          title: item.title,
          description: item.description,
          source: {
            id: `ai-source-${idCounter}`,
            name: item.source || 'AI Analysis',
            type: 'ai',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.8,
            isOfficial: false,
          },
          date: new Date(),
          confidence: parseFloat(item.confidence) || 0.7,
          impact: item.impact || 'medium',
          status: item.status || 'speculation',
          tags: ['development', 'ai-analysis'],
          relatedFindings: [],
        });
      });
    }

    // Parse partnerships
    if (aiResponse.partnerships && Array.isArray(aiResponse.partnerships)) {
      aiResponse.partnerships.forEach((item: any) => {
        findings.push({
          id: `ai-partnership-${idCounter++}`,
          category: 'partnership',
          title: item.title,
          description: item.description,
          source: {
            id: `ai-source-${idCounter}`,
            name: item.source || 'AI Analysis',
            type: 'ai',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.8,
            isOfficial: false,
          },
          date: new Date(),
          confidence: parseFloat(item.confidence) || 0.7,
          impact: item.impact || 'medium',
          status: 'speculation',
          tags: ['partnership', 'ai-analysis'],
          relatedFindings: [],
        });
      });
    }

    // Parse governance
    if (aiResponse.governance && Array.isArray(aiResponse.governance)) {
      aiResponse.governance.forEach((item: any) => {
        findings.push({
          id: `ai-governance-${idCounter++}`,
          category: 'governance',
          title: item.title,
          description: item.description,
          source: {
            id: `ai-source-${idCounter}`,
            name: item.source || 'AI Analysis',
            type: 'ai',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.8,
            isOfficial: false,
          },
          date: new Date(),
          confidence: parseFloat(item.confidence) || 0.7,
          impact: item.impact || 'medium',
          status: item.status || 'speculation',
          tags: ['governance', 'ai-analysis'],
          relatedFindings: [],
        });
      });
    }

    // Parse airdrops
    if (aiResponse.airdrops && Array.isArray(aiResponse.airdrops)) {
      aiResponse.airdrops.forEach((item: any) => {
        findings.push({
          id: `ai-airdrop-${idCounter++}`,
          category: 'airdrop',
          title: item.title,
          description: item.description,
          source: {
            id: `ai-source-${idCounter}`,
            name: item.source || 'AI Analysis',
            type: 'ai',
            url: '',
            lastUpdated: new Date(),
            reliability: 0.8,
            isOfficial: false,
          },
          date: new Date(),
          confidence: parseFloat(item.confidence) || 0.7,
          impact: item.impact || 'medium',
          status: 'speculation',
          tags: ['airdrop', 'ai-analysis'],
          relatedFindings: [],
        });
      });
    }

    return findings;
  }

  private static generateMockAIResponse(query: ResearchQuery, rawData: any): any {
    // Fallback mock response when AI APIs are not available
    return {
      executiveSummary: `Phân tích ${query.tokenId.toUpperCase()} dựa trên dữ liệu có sẵn`,
      detailedAnalysis: `Đây là phân tích mock cho ${query.tokenId.toUpperCase()}. Vui lòng cấu hình API key để nhận phân tích AI thực sự.`,
      fullResponse: `Mock response for ${query.tokenId}`,
      roadmap: [],
      tokenomics: [],
      earning: [],
      development: [],
      partnerships: [],
      governance: [],
      airdrops: [],
      sources: [],
      conclusion: 'Mock analysis completed',
      confidence: 0.5
    };
  }
} 