import { ResearchQuery, ResearchResult, ResearchFinding, AISummary, TimelineEvent } from '../interfaces/ai-research.interface';
import { TwitterService } from './twitter.service';
import { GitHubService } from './github.service';
import { ProjectService } from './project.service';
import { AIProviderManager } from './ai-provider-manager.service';
import { ProviderStrategy, AIProviderRequest } from '../interfaces/ai-provider.interface';
import { OpenAIProvider } from './providers/openai.provider';
import { AnthropicProvider } from './providers/anthropic.provider';
import { MegaLLMProvider } from './providers/megallm.provider';
import { MockProvider } from './providers/mock.provider';
import { ConfigValidator } from '../utils/config-validator';

export class AIResearchService {
  private static providerManager: AIProviderManager;

  /**
   * Initialize the AI Research Service with provider manager
   * Should be called on application startup
   */
  static initialize(): void {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('[AIResearchService] Initializing AI Provider Manager...');
    console.log('═══════════════════════════════════════════════════════════');

    // Step 1: Validate configuration
    console.log('\n[Step 1] Validating configuration...');
    const validator = new ConfigValidator();
    const validationResult = validator.validateAIProviderConfig();

    // Log validation warnings
    if (validationResult.warnings.length > 0) {
      console.log('\n⚠️  Configuration Warnings:');
      validationResult.warnings.forEach((warning) => {
        console.log(`   - ${warning}`);
      });
    }

    // Log validation errors and throw if invalid
    if (!validationResult.isValid) {
      console.log('\n❌ Configuration Errors:');
      validationResult.errors.forEach((error) => {
        console.error(`   - ${error}`);
      });
      throw new Error('Invalid AI provider configuration. Please check the errors above.');
    }

    console.log('✓ Configuration validation passed');

    // Step 2: Log configuration summary
    console.log('\n[Step 2] Configuration Summary:');
    const configSummary = ConfigValidator.getProviderConfigSummary();
    
    // Log provider strategy
    const strategyEnv = process.env.AI_PROVIDER_STRATEGY || 'fallback-chain';
    console.log(`   Strategy: ${strategyEnv}`);
    
    // Log cache configuration
    const cacheEnabled = process.env.AI_RESPONSE_CACHE_ENABLED !== 'false';
    const cacheTTL = parseInt(process.env.AI_RESPONSE_CACHE_TTL || '3600000');
    console.log(`   Cache: ${cacheEnabled ? 'Enabled' : 'Disabled'} (TTL: ${cacheTTL}ms)`);
    
    // Log cost limits if configured
    if (process.env.AI_DAILY_COST_LIMIT_USD) {
      console.log(`   Daily Cost Limit: $${process.env.AI_DAILY_COST_LIMIT_USD}`);
    }
    if (process.env.AI_COST_ALERT_THRESHOLD_USD) {
      console.log(`   Cost Alert Threshold: $${process.env.AI_COST_ALERT_THRESHOLD_USD}`);
    }

    // Step 3: Initialize provider manager with strategy
    console.log('\n[Step 3] Initializing provider manager...');
    let strategy: ProviderStrategy;

    switch (strategyEnv.toLowerCase()) {
      case 'primary-only':
        strategy = ProviderStrategy.PRIMARY_ONLY;
        break;
      case 'fallback-chain':
        strategy = ProviderStrategy.FALLBACK_CHAIN;
        break;
      case 'parallel-comparison':
        strategy = ProviderStrategy.PARALLEL_COMPARISON;
        break;
      case 'cost-optimized':
        strategy = ProviderStrategy.COST_OPTIMIZED;
        break;
      default:
        console.warn(`   ⚠️  Unknown strategy '${strategyEnv}', defaulting to fallback-chain`);
        strategy = ProviderStrategy.FALLBACK_CHAIN;
    }

    // Instantiate provider manager with configured strategy
    this.providerManager = new AIProviderManager(strategy);
    console.log(`   ✓ Provider manager created with strategy: ${strategyEnv}`);

    // Step 4: Register providers
    console.log('\n[Step 4] Registering AI providers...');
    let registeredCount = 0;

    // Register OpenAI provider if API key is configured
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_ENABLED !== 'false') {
      try {
        const config = configSummary.openai;
        const openaiProvider = new OpenAIProvider({
          name: 'OpenAI',
          apiKey: process.env.OPENAI_API_KEY,
          model: config.model || 'gpt-4',
          maxTokens: config.maxTokens || 4000,
          temperature: config.temperature || 0.3,
          timeout: config.timeout || 30000,
          enabled: config.enabled ?? true,
          priority: config.priority || 1,
        });
        this.providerManager.registerProvider(openaiProvider);
        console.log(`   ✓ OpenAI (Priority: ${config.priority}, Model: ${config.model})`);
        registeredCount++;
      } catch (error) {
        console.error(`   ✗ Failed to register OpenAI provider: ${(error as Error).message}`);
      }
    } else {
      console.log('   ⊘ OpenAI provider not configured');
    }

    // Register MegaLLM provider if API key is configured
    if (process.env.MEGALLM_API_KEY && process.env.MEGALLM_ENDPOINT && process.env.MEGALLM_ENABLED !== 'false') {
      try {
        const config = configSummary.megallm;
        
        // DEBUG: Log API key info
        const apiKey = process.env.MEGALLM_API_KEY;
        console.log(`   🔑 MegaLLM API Key (first 20 chars): ${apiKey.substring(0, 20)}...`);
        console.log(`   🔑 MegaLLM API Key (last 10 chars): ...${apiKey.substring(apiKey.length - 10)}`);
        console.log(`   🔑 MegaLLM API Key length: ${apiKey.length}`);
        
        const megallmProvider = new MegaLLMProvider({
          name: 'MegaLLM',
          apiKey: process.env.MEGALLM_API_KEY,
          endpoint: config.endpoint!,
          model: config.model || 'default',
          maxTokens: config.maxTokens || 4000,
          temperature: config.temperature || 0.3,
          timeout: config.timeout || 30000,
          enabled: config.enabled ?? true,
          priority: config.priority || 2,
        });
        this.providerManager.registerProvider(megallmProvider);
        console.log(`   ✓ MegaLLM (Priority: ${config.priority}, Model: ${config.model}, Endpoint: ${this.maskUrl(config.endpoint!)})`);
        registeredCount++;
      } catch (error) {
        console.error(`   ✗ Failed to register MegaLLM provider: ${(error as Error).message}`);
      }
    } else {
      console.log('   ⊘ MegaLLM provider not configured');
    }

    // Register Anthropic provider if API key is configured
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_ENABLED !== 'false') {
      try {
        const config = configSummary.anthropic;
        const anthropicProvider = new AnthropicProvider({
          name: 'Anthropic',
          apiKey: process.env.ANTHROPIC_API_KEY,
          model: config.model || 'claude-3-sonnet-20240229',
          maxTokens: config.maxTokens || 4000,
          temperature: config.temperature || 0.3,
          timeout: config.timeout || 30000,
          enabled: config.enabled ?? true,
          priority: config.priority || 3,
        });
        this.providerManager.registerProvider(anthropicProvider);
        console.log(`   ✓ Anthropic (Priority: ${config.priority}, Model: ${config.model})`);
        registeredCount++;
      } catch (error) {
        console.error(`   ✗ Failed to register Anthropic provider: ${(error as Error).message}`);
      }
    } else {
      console.log('   ⊘ Anthropic provider not configured');
    }

    // Always register mock provider as ultimate fallback
    try {
      const mockProvider = new MockProvider({
        name: 'Mock',
        apiKey: '',
        enabled: true,
        priority: 999, // Lowest priority
      });
      this.providerManager.registerProvider(mockProvider);
      console.log('   ✓ Mock (Priority: 999, Fallback)');
      registeredCount++;
    } catch (error) {
      console.error(`   ✗ Failed to register Mock provider: ${(error as Error).message}`);
    }

    // Step 5: Log summary
    console.log('\n[Step 5] Initialization Summary:');
    console.log(`   Total providers registered: ${registeredCount}`);
    this.providerManager.logRegisteredProviders();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✓ AI Provider Manager initialized successfully');
    console.log('═══════════════════════════════════════════════════════════\n');
  }

  /**
   * Get the provider manager instance
   * Used for health checks and monitoring
   */
  static getProviderManager(): AIProviderManager | null {
    return this.providerManager || null;
  }

  /**
   * Mask sensitive parts of URLs for logging
   */
  private static maskUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch {
      return url;
    }
  }

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
      // Add price data fields for prompt
      currentPrice: null,
      priceChange24h: null,
      marketCap: null,
      volume24h: null,
    };

    // Collect from existing services
    try {
      // Map token ID to CoinGecko format (remove prefix if exists)
      // e.g., "sol-solana" -> "solana", "btc-bitcoin" -> "bitcoin"
      const coinGeckoId = this.mapToCoinGeckoId(query.tokenId);
      console.log(`🔄 Token ID mapping: ${query.tokenId} → ${coinGeckoId}`);
      
      // Get project data
      const tokenResponse = await fetch(`https://api.coingecko.com/api/v3/coins/${coinGeckoId}`);
      if (tokenResponse.ok) {
        const tokenData = await tokenResponse.json();
        // Use original tokenId for project data, but coinGeckoId was used for fetching
        data.project = await ProjectService.getProjectData(coinGeckoId, tokenData);
        
        // Extract price data for prompt
        if (tokenData.market_data) {
          data.currentPrice = tokenData.market_data.current_price?.usd;
          data.priceChange24h = tokenData.market_data.price_change_percentage_24h;
          data.marketCap = tokenData.market_data.market_cap?.usd;
          data.volume24h = tokenData.market_data.total_volume?.usd;
          
          console.log(`💰 Price data extracted: $${data.currentPrice}, 24h: ${data.priceChange24h}%`);
        }
      }

      // Fallback: If no price data from CoinGecko, try Multi-Pricing API
      if (!data.currentPrice) {
        console.log(`🔄 Fallback: Fetching price from multi-pricing API for ${query.tokenId}`);
        try {
          const pricingResponse = await fetch(`http://localhost:8080/api/v1/multi-pricing/prices?ids=${query.tokenId}`);
          if (pricingResponse.ok) {
            const pricingData = await pricingResponse.json();
            const priceInfo = pricingData.metadata?.prices?.[query.tokenId];
            
            if (priceInfo) {
              data.currentPrice = priceInfo.price;
              data.priceChange24h = priceInfo.change24h;
              data.marketCap = priceInfo.marketCap;
              data.volume24h = priceInfo.volume24h;
              
              console.log(`💰 Price data from multi-pricing: $${data.currentPrice}, 24h: ${data.priceChange24h}%`);
            }
          }
        } catch (error) {
          console.error(`❌ Multi-pricing API also failed:`, error);
        }
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

  /**
   * Map token ID to CoinGecko format
   * Handles both CoinGecko format (bitcoin) and CoinPaprika format (btc-bitcoin)
   */
  private static mapToCoinGeckoId(tokenId: string): string {
    // Common mappings from CoinPaprika/other formats to CoinGecko
    const mapping: Record<string, string> = {
      'btc-bitcoin': 'bitcoin',
      'eth-ethereum': 'ethereum',
      'sol-solana': 'solana',
      'ada-cardano': 'cardano',
      'dot-polkadot': 'polkadot',
      'matic-polygon': 'polygon',
      'avax-avalanche': 'avalanche-2',
      'link-chainlink': 'chainlink',
      'uni-uniswap': 'uniswap',
      'atom-cosmos': 'cosmos',
      'xrp-xrp': 'ripple',
      'doge-dogecoin': 'dogecoin',
      'shib-shiba-inu': 'shiba-inu',
      'bnb-binance-coin': 'binancecoin',
      'usdt-tether': 'tether',
      'usdc-usd-coin': 'usd-coin',
    };

    // Check if mapping exists
    const lowerTokenId = tokenId.toLowerCase();
    if (mapping[lowerTokenId]) {
      return mapping[lowerTokenId];
    }

    // If token ID has format "xxx-name", try to extract the name part
    // e.g., "sol-solana" -> "solana"
    if (lowerTokenId.includes('-')) {
      const parts = lowerTokenId.split('-');
      if (parts.length >= 2) {
        // Return the part after first dash (usually the full name)
        return parts.slice(1).join('-');
      }
    }

    // Return as-is if no mapping found
    return lowerTokenId;
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
    console.log('- Query:', query);
    console.log('- Using AI Provider Manager with strategy:', this.providerManager?.getStrategy());
    
    // Check if provider manager is initialized
    if (!this.providerManager) {
      console.warn('🤖 Provider manager not initialized, using mock response');
      return this.generateMockAIResponse(query, rawData);
    }

    try {
      // Build the research prompt
      const prompt = this.buildResearchPrompt(query, rawData);
      
      // Build the AI provider request
      const request: AIProviderRequest = {
        prompt,
        systemPrompt: 'Bạn là một chuyên gia phân tích đầu tư cryptocurrency và blockchain với nhiều năm kinh nghiệm. Hãy cung cấp phân tích chi tiết, khách quan và có cấu trúc về các dự án token, bao gồm đánh giá rủi ro và tiềm năng đầu tư. Sử dụng thang điểm 0-10 để đánh giá các khía cạnh khác nhau. Trả lời bằng tiếng Việt.',
        maxTokens: 4000,
        temperature: 0.3,
        metadata: {
          tokenId: query.tokenId,
          timeRange: query.timeRange,
          sources: query.sources,
        },
      };

      console.log('🤖 Calling provider manager...');
      
      // Call provider manager to generate response
      const response = await this.providerManager.generateResponse(request);
      
      console.log(`🤖 Response received from ${response.provider} (cached: ${response.cached})`);
      console.log(`🤖 Response time: ${response.responseTime}ms, tokens: ${response.tokensUsed || 'N/A'}`);
      
      // Parse the AI response to structured format
      return this.parseAIResponseToStructured(response.content, query.tokenId);
      
    } catch (error) {
      console.error('🤖 Provider manager error:', (error as Error).message);
      console.log('🤖 Falling back to mock response');
      
      // Fallback to mock data if all providers fail
      return this.generateMockAIResponse(query, rawData);
    }
  }

  private static buildResearchPrompt(query: ResearchQuery, rawData: any): string {
    const tokenName = query.tokenId.toUpperCase();
    
    // Extract real-time price data from rawData if available
    let priceContext = '';
    if (rawData) {
      const currentPrice = rawData.currentPrice || rawData.price || rawData.current_price;
      const priceChange24h = rawData.priceChange24h || rawData.price_change_24h || rawData.price_change_percentage_24h;
      const marketCap = rawData.marketCap || rawData.market_cap;
      const volume24h = rawData.volume24h || rawData.total_volume;
      
      if (currentPrice) {
        priceContext = `\n📊 DỮ LIỆU GIÁ REALTIME (quan trọng - sử dụng để phân tích):\n`;
        priceContext += `- Giá hiện tại: $${typeof currentPrice === 'number' ? currentPrice.toLocaleString() : currentPrice}\n`;
        
        if (priceChange24h !== undefined && priceChange24h !== null) {
          priceContext += `- Biến động 24h: ${priceChange24h > 0 ? '+' : ''}${typeof priceChange24h === 'number' ? priceChange24h.toFixed(2) : priceChange24h}%\n`;
        }
        
        if (marketCap) {
          priceContext += `- Market Cap: $${typeof marketCap === 'number' ? marketCap.toLocaleString() : marketCap}\n`;
        }
        
        if (volume24h) {
          priceContext += `- Volume 24h: $${typeof volume24h === 'number' ? volume24h.toLocaleString() : volume24h}\n`;
        }
        
        priceContext += `\n⚠️ LƯU Ý: Đây là dữ liệu giá THỰC TẾ từ API. Hãy sử dụng các con số này trong phân tích của bạn, KHÔNG tự tạo ra số liệu giả.\n\n`;
      }
    }
    
    return `${priceContext}Bạn có thể tìm kiếm, phân tích và tổng hợp thông tin từ các nguồn khác nhau như Twitter, GitHub, whitepaper, news, website để đưa ra các thông tin từ dự án ${tokenName} theo các yêu cầu sau:

📋 1. THÔNG TIN DỰ ÁN:
- Mô tả đầy đủ về dự án: ${tokenName} làm về gì?
- Link X (Twitter) chính thức
- Thông tin về team/founder
- Thông tin về token (symbol, supply, contract address)
- Các đối tác chiến lược
- Nhà đầu tư: Đã gọi vốn được bao nhiêu từ các quỹ, nhà đầu tư nào?
- Các vòng gọi vốn (seed, private, public)

💰 2. CƠ CHẾ TOKEN & HOẠT ĐỘNG:
- Cơ chế token: utility, governance, staking
- Doanh thu của dự án (nếu có)
- Các update gần đây (cho thấy dự án đang phát triển và còn hoạt động)
- Roadmap đã thực hiện và sắp tới
- Tình hình phát triển sản phẩm

👥 3. CỘNG ĐỒNG & NGƯỜI DÙNG:
- Cộng đồng có active nhiều không?
- Số lượng holders, trading volume
- Người dùng có tin tưởng dự án nhiều không?
- Sentiment trên social media
- Dự án có phần thưởng gì cho cộng đồng không? (airdrop, staking rewards, etc.)

🎉 4. SỰ KIỆN & CHƯƠNG TRÌNH:
- Hiện tại có chương trình/sự kiện nào đang chạy không?
- Airdrop campaigns
- Staking programs
- Partnership announcements
- Upcoming events

📊 5. PHÂN TÍCH GIÁ:
- Cho biết tại sao có biến động giá 24h qua
- Các yếu tố ảnh hưởng đến giá
- Volume trading thay đổi như thế nào
- Tin tức/sự kiện gây ảnh hưởng

⭐ 6. ĐÁNH GIÁ & GỢI Ý (QUAN TRỌNG):
Tự phân tích, tổng hợp lại từ các thông tin trên để đưa ra các gợi ý với thang điểm từ 0-10:

🎯 Có nên đầu tư? [X/10]
- Lý do: ...
- Rủi ro: ...
- Cơ hội: ...

🚀 Dự án tiềm năng? [X/10]
- Lý do: ...
- Điểm mạnh: ...
- Điểm yếu: ...

🔮 Dự án có tầm nhìn dài hạn? [X/10]
- Lý do: ...
- Roadmap: ...
- Sustainability: ...

📝 KẾT LUẬN TỔNG QUAN:
- Tóm tắt đánh giá chung
- Khuyến nghị cho nhà đầu tư
- Mức độ rủi ro: Thấp/Trung bình/Cao

Hãy trả lời bằng tiếng Việt với cấu trúc rõ ràng, chi tiết và có thông tin cụ thể. Sử dụng thông tin thực tế và cập nhật nhất có thể từ các nguồn đáng tin cậy. Đưa ra đánh giá khách quan dựa trên dữ liệu thực tế.`;
  }

  private static parseAIResponseToStructured(aiResponse: string, tokenId: string): any {
    // Return the AI response directly as structured data with new structure
    return {
      executiveSummary: `Phân tích đầu tư ${tokenId.toUpperCase()} từ AI Research`,
      detailedAnalysis: aiResponse,
      fullResponse: aiResponse,
      
      // Section 1: Project Info
      projectInfo: this.extractProjectInfoFromText(aiResponse),
      
      // Section 2: Tokenomics & Operations
      tokenomics: this.extractTokenomicsFromText(aiResponse),
      operations: this.extractOperationsFromText(aiResponse),
      
      // Section 3: Community
      community: this.extractCommunityFromText(aiResponse),
      
      // Section 4: Events
      events: this.extractEventsFromText(aiResponse),
      
      // Section 5: Price Analysis
      priceAnalysis: this.extractPriceAnalysisFromText(aiResponse),
      
      // Section 6: Investment Ratings (NEW - IMPORTANT)
      ratings: this.extractRatingsFromText(aiResponse),
      
      // Legacy fields for backward compatibility
      roadmap: this.extractRoadmapFromText(aiResponse),
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

  // NEW EXTRACTION METHODS FOR NEW PROMPT STRUCTURE

  private static extractProjectInfoFromText(text: string): any {
    const info: any = {
      description: '',
      socialLinks: [],
      team: '',
      token: '',
      partners: [],
      investors: [],
      funding: ''
    };
    
    const lines = text.split('\n');
    let inProjectSection = false;
    
    for (const line of lines) {
      if (line.includes('📋') || line.includes('THÔNG TIN DỰ ÁN')) {
        inProjectSection = true;
        continue;
      }
      if (inProjectSection && (line.includes('💰') || line.includes('CƠ CHẾ TOKEN'))) {
        break;
      }
      if (inProjectSection && line.trim()) {
        if (line.toLowerCase().includes('mô tả') || line.toLowerCase().includes('làm về')) {
          info.description += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('twitter') || line.toLowerCase().includes('link x')) {
          info.socialLinks.push(line.trim());
        }
        if (line.toLowerCase().includes('team') || line.toLowerCase().includes('founder')) {
          info.team += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('token') || line.toLowerCase().includes('symbol')) {
          info.token += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('đối tác') || line.toLowerCase().includes('partner')) {
          info.partners.push(line.replace(/[-•🔹🔸]/g, '').trim());
        }
        if (line.toLowerCase().includes('nhà đầu tư') || line.toLowerCase().includes('investor')) {
          info.investors.push(line.replace(/[-•🔹🔸]/g, '').trim());
        }
        if (line.toLowerCase().includes('gọi vốn') || line.toLowerCase().includes('funding')) {
          info.funding += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
      }
    }
    
    return info;
  }

  private static extractOperationsFromText(text: string): any {
    const operations: any = {
      revenue: '',
      recentUpdates: [],
      roadmap: '',
      development: ''
    };
    
    const lines = text.split('\n');
    let inOperationsSection = false;
    
    for (const line of lines) {
      if (line.includes('💰') || line.includes('CƠ CHẾ TOKEN & HOẠT ĐỘNG')) {
        inOperationsSection = true;
        continue;
      }
      if (inOperationsSection && (line.includes('👥') || line.includes('CỘNG ĐỒNG'))) {
        break;
      }
      if (inOperationsSection && line.trim()) {
        if (line.toLowerCase().includes('doanh thu') || line.toLowerCase().includes('revenue')) {
          operations.revenue += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('update') || line.toLowerCase().includes('cập nhật')) {
          operations.recentUpdates.push(line.replace(/[-•🔹🔸]/g, '').trim());
        }
        if (line.toLowerCase().includes('roadmap')) {
          operations.roadmap += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('phát triển') || line.toLowerCase().includes('development')) {
          operations.development += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
      }
    }
    
    return operations;
  }

  private static extractCommunityFromText(text: string): any {
    const community: any = {
      isActive: false,
      holders: '',
      sentiment: '',
      trust: '',
      rewards: []
    };
    
    const lines = text.split('\n');
    let inCommunitySection = false;
    
    for (const line of lines) {
      if (line.includes('👥') || line.includes('CỘNG ĐỒNG')) {
        inCommunitySection = true;
        continue;
      }
      if (inCommunitySection && (line.includes('🎉') || line.includes('SỰ KIỆN'))) {
        break;
      }
      if (inCommunitySection && line.trim()) {
        if (line.toLowerCase().includes('active')) {
          community.isActive = !line.toLowerCase().includes('không');
        }
        if (line.toLowerCase().includes('holder') || line.toLowerCase().includes('volume')) {
          community.holders += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('tin tưởng') || line.toLowerCase().includes('trust')) {
          community.trust += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('sentiment')) {
          community.sentiment += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('phần thưởng') || line.toLowerCase().includes('reward') || line.toLowerCase().includes('airdrop')) {
          community.rewards.push(line.replace(/[-•🔹🔸]/g, '').trim());
        }
      }
    }
    
    return community;
  }

  private static extractEventsFromText(text: string): any[] {
    const events: any[] = [];
    const lines = text.split('\n');
    let inEventsSection = false;
    
    for (const line of lines) {
      if (line.includes('🎉') || line.includes('SỰ KIỆN')) {
        inEventsSection = true;
        continue;
      }
      if (inEventsSection && (line.includes('📊') || line.includes('PHÂN TÍCH GIÁ'))) {
        break;
      }
      if (inEventsSection && (line.includes('🔹') || line.includes('🔸') || line.includes('•') || line.includes('-'))) {
        const eventText = line.replace(/[🔹🔸•-]/g, '').trim();
        if (eventText) {
          events.push({
            title: eventText,
            description: eventText,
            status: 'ongoing',
            source: 'AI Analysis'
          });
        }
      }
    }
    
    return events;
  }

  private static extractPriceAnalysisFromText(text: string): any {
    const analysis: any = {
      reason24h: '',
      factors: [],
      volumeChange: '',
      newsImpact: ''
    };
    
    const lines = text.split('\n');
    let inPriceSection = false;
    
    for (const line of lines) {
      if (line.includes('📊') || line.includes('PHÂN TÍCH GIÁ')) {
        inPriceSection = true;
        continue;
      }
      if (inPriceSection && (line.includes('⭐') || line.includes('ĐÁNH GIÁ'))) {
        break;
      }
      if (inPriceSection && line.trim()) {
        if (line.toLowerCase().includes('biến động') || line.toLowerCase().includes('24h')) {
          analysis.reason24h += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('yếu tố') || line.toLowerCase().includes('factor')) {
          analysis.factors.push(line.replace(/[-•🔹🔸]/g, '').trim());
        }
        if (line.toLowerCase().includes('volume')) {
          analysis.volumeChange += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
        if (line.toLowerCase().includes('tin tức') || line.toLowerCase().includes('news') || line.toLowerCase().includes('sự kiện')) {
          analysis.newsImpact += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
        }
      }
    }
    
    return analysis;
  }

  private static extractRatingsFromText(text: string): any {
    const ratings: any = {
      investment: { score: 0, reason: '', risks: '', opportunities: '' },
      potential: { score: 0, reason: '', strengths: '', weaknesses: '' },
      longTerm: { score: 0, reason: '', roadmap: '', sustainability: '' },
      overallConclusion: '',
      recommendation: '',
      riskLevel: 'Trung bình'
    };
    
    const lines = text.split('\n');
    let currentSection = '';
    
    for (const line of lines) {
      // Detect rating sections
      if (line.includes('⭐') || line.includes('ĐÁNH GIÁ')) {
        currentSection = 'ratings';
        continue;
      }
      if (line.includes('🎯') || line.includes('Có nên đầu tư')) {
        currentSection = 'investment';
        // Extract score from [X/10] format
        const scoreMatch = line.match(/\[(\d+)\/10\]/);
        if (scoreMatch) {
          ratings.investment.score = parseInt(scoreMatch[1]);
        }
        continue;
      }
      if (line.includes('🚀') || line.includes('Dự án tiềm năng')) {
        currentSection = 'potential';
        const scoreMatch = line.match(/\[(\d+)\/10\]/);
        if (scoreMatch) {
          ratings.potential.score = parseInt(scoreMatch[1]);
        }
        continue;
      }
      if (line.includes('🔮') || line.includes('tầm nhìn dài hạn')) {
        currentSection = 'longTerm';
        const scoreMatch = line.match(/\[(\d+)\/10\]/);
        if (scoreMatch) {
          ratings.longTerm.score = parseInt(scoreMatch[1]);
        }
        continue;
      }
      if (line.includes('📝') || line.includes('KẾT LUẬN')) {
        currentSection = 'conclusion';
        continue;
      }
      
      // Extract content based on current section
      if (line.trim()) {
        if (currentSection === 'investment') {
          if (line.toLowerCase().includes('lý do')) {
            ratings.investment.reason += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
          if (line.toLowerCase().includes('rủi ro')) {
            ratings.investment.risks += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
          if (line.toLowerCase().includes('cơ hội')) {
            ratings.investment.opportunities += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
        }
        if (currentSection === 'potential') {
          if (line.toLowerCase().includes('lý do')) {
            ratings.potential.reason += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
          if (line.toLowerCase().includes('điểm mạnh')) {
            ratings.potential.strengths += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
          if (line.toLowerCase().includes('điểm yếu')) {
            ratings.potential.weaknesses += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
        }
        if (currentSection === 'longTerm') {
          if (line.toLowerCase().includes('lý do')) {
            ratings.longTerm.reason += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
          if (line.toLowerCase().includes('roadmap')) {
            ratings.longTerm.roadmap += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
          if (line.toLowerCase().includes('sustainability')) {
            ratings.longTerm.sustainability += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
        }
        if (currentSection === 'conclusion') {
          if (line.toLowerCase().includes('tóm tắt')) {
            ratings.overallConclusion += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
          if (line.toLowerCase().includes('khuyến nghị')) {
            ratings.recommendation += line.replace(/[-•🔹🔸]/g, '').trim() + ' ';
          }
          if (line.toLowerCase().includes('rủi ro')) {
            const riskMatch = line.match(/(Thấp|Trung bình|Cao)/i);
            if (riskMatch) {
              ratings.riskLevel = riskMatch[1];
            }
          }
        }
      }
    }
    
    return ratings;
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