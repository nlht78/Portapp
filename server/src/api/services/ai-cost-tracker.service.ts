/**
 * AI Cost Tracker Service
 * Tracks estimated and actual costs per provider with daily limits
 */

/**
 * Cost entry for a single request
 */
export interface CostEntry {
  provider: string;
  timestamp: number;
  estimatedCost: number;
  actualCost: number;
  tokensUsed: number;
  date: string; // YYYY-MM-DD format
}

/**
 * Daily cost summary for a provider
 */
export interface DailyCostSummary {
  provider: string;
  date: string;
  totalCost: number;
  totalRequests: number;
  totalTokens: number;
  averageCostPerRequest: number;
}

/**
 * Cost tracking configuration
 */
export interface CostTrackingConfig {
  dailyLimitUSD?: number;
  alertThresholdUSD?: number;
  enabled: boolean;
}

/**
 * AI Cost Tracker Service
 * Singleton service for tracking AI provider costs
 */
export class AICostTrackerService {
  private static instance: AICostTrackerService;
  private costEntries: CostEntry[];
  private config: CostTrackingConfig;
  private dailyCosts: Map<string, Map<string, number>>; // provider -> date -> cost

  private constructor() {
    this.costEntries = [];
    this.dailyCosts = new Map();
    
    // Load configuration from environment
    this.config = {
      dailyLimitUSD: process.env.AI_DAILY_COST_LIMIT_USD 
        ? parseFloat(process.env.AI_DAILY_COST_LIMIT_USD) 
        : undefined,
      alertThresholdUSD: process.env.AI_COST_ALERT_THRESHOLD_USD 
        ? parseFloat(process.env.AI_COST_ALERT_THRESHOLD_USD) 
        : undefined,
      enabled: process.env.AI_COST_TRACKING_ENABLED !== 'false',
    };

    console.log('[AICostTrackerService] Initialized with config:', {
      dailyLimit: this.config.dailyLimitUSD ? `$${this.config.dailyLimitUSD}` : 'None',
      alertThreshold: this.config.alertThresholdUSD ? `$${this.config.alertThresholdUSD}` : 'None',
      enabled: this.config.enabled,
    });
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AICostTrackerService {
    if (!AICostTrackerService.instance) {
      AICostTrackerService.instance = new AICostTrackerService();
    }
    return AICostTrackerService.instance;
  }

  /**
   * Get current date in YYYY-MM-DD format
   */
  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  /**
   * Record a cost entry
   * @param provider The provider name
   * @param estimatedCost The estimated cost in USD
   * @param actualCost The actual cost in USD
   * @param tokensUsed The number of tokens used
   */
  public recordCost(
    provider: string,
    estimatedCost: number,
    actualCost: number,
    tokensUsed: number
  ): void {
    if (!this.config.enabled) {
      return;
    }

    const date = this.getCurrentDate();
    const entry: CostEntry = {
      provider,
      timestamp: Date.now(),
      estimatedCost,
      actualCost,
      tokensUsed,
      date,
    };

    this.costEntries.push(entry);

    // Update daily costs
    if (!this.dailyCosts.has(provider)) {
      this.dailyCosts.set(provider, new Map());
    }
    
    const providerDailyCosts = this.dailyCosts.get(provider)!;
    const currentDailyCost = providerDailyCosts.get(date) || 0;
    const newDailyCost = currentDailyCost + actualCost;
    providerDailyCosts.set(date, newDailyCost);

    // Check if we should log a warning
    this.checkCostThresholds(provider, newDailyCost);
  }

  /**
   * Check if cost thresholds have been exceeded
   * @param provider The provider name
   * @param dailyCost The current daily cost
   */
  private checkCostThresholds(provider: string, dailyCost: number): void {
    // Check alert threshold
    if (this.config.alertThresholdUSD && dailyCost >= this.config.alertThresholdUSD) {
      const percentage = this.config.dailyLimitUSD 
        ? ((dailyCost / this.config.dailyLimitUSD) * 100).toFixed(1)
        : 'N/A';
      
      console.warn(
        `⚠️  [AICostTrackerService] Cost alert for ${provider}: $${dailyCost.toFixed(4)} ` +
        `(${percentage}% of daily limit)`
      );
    }

    // Check daily limit
    if (this.config.dailyLimitUSD && dailyCost >= this.config.dailyLimitUSD) {
      console.error(
        `🚨 [AICostTrackerService] Daily cost limit exceeded for ${provider}: ` +
        `$${dailyCost.toFixed(4)} / $${this.config.dailyLimitUSD}`
      );
    }
  }

  /**
   * Check if a provider can make a request based on cost limits
   * @param provider The provider name
   * @param estimatedCost The estimated cost of the request
   * @returns True if the request can proceed, false if it would exceed limits
   */
  public canMakeRequest(provider: string, estimatedCost: number): boolean {
    if (!this.config.enabled || !this.config.dailyLimitUSD) {
      return true; // No limit configured
    }

    const date = this.getCurrentDate();
    const providerDailyCosts = this.dailyCosts.get(provider);
    const currentDailyCost = providerDailyCosts?.get(date) || 0;
    const projectedCost = currentDailyCost + estimatedCost;

    if (projectedCost > this.config.dailyLimitUSD) {
      console.warn(
        `⚠️  [AICostTrackerService] Request blocked for ${provider}: ` +
        `Projected cost $${projectedCost.toFixed(4)} exceeds daily limit $${this.config.dailyLimitUSD}`
      );
      return false;
    }

    return true;
  }

  /**
   * Get daily cost for a provider
   * @param provider The provider name
   * @param date Optional date in YYYY-MM-DD format (defaults to today)
   * @returns Daily cost in USD
   */
  public getDailyCost(provider: string, date?: string): number {
    const targetDate = date || this.getCurrentDate();
    const providerDailyCosts = this.dailyCosts.get(provider);
    return providerDailyCosts?.get(targetDate) || 0;
  }

  /**
   * Get total cost for a provider across all days
   * @param provider The provider name
   * @returns Total cost in USD
   */
  public getTotalCost(provider: string): number {
    const providerDailyCosts = this.dailyCosts.get(provider);
    if (!providerDailyCosts) {
      return 0;
    }

    let total = 0;
    for (const cost of providerDailyCosts.values()) {
      total += cost;
    }
    return total;
  }

  /**
   * Get daily cost summary for a provider
   * @param provider The provider name
   * @param date Optional date in YYYY-MM-DD format (defaults to today)
   * @returns Daily cost summary
   */
  public getDailyCostSummary(provider: string, date?: string): DailyCostSummary {
    const targetDate = date || this.getCurrentDate();
    
    // Filter entries for this provider and date
    const entries = this.costEntries.filter(
      e => e.provider === provider && e.date === targetDate
    );

    const totalCost = entries.reduce((sum, e) => sum + e.actualCost, 0);
    const totalTokens = entries.reduce((sum, e) => sum + e.tokensUsed, 0);
    const averageCostPerRequest = entries.length > 0 ? totalCost / entries.length : 0;

    return {
      provider,
      date: targetDate,
      totalCost,
      totalRequests: entries.length,
      totalTokens,
      averageCostPerRequest,
    };
  }

  /**
   * Get cost summaries for all providers
   * @param date Optional date in YYYY-MM-DD format (defaults to today)
   * @returns Array of daily cost summaries
   */
  public getAllDailyCostSummaries(date?: string): DailyCostSummary[] {
    const providers = Array.from(this.dailyCosts.keys());
    return providers.map(provider => this.getDailyCostSummary(provider, date));
  }

  /**
   * Get cost entries for a provider
   * @param provider The provider name
   * @param limit Optional limit on number of entries to return
   * @returns Array of cost entries
   */
  public getCostEntries(provider: string, limit?: number): CostEntry[] {
    const entries = this.costEntries.filter(e => e.provider === provider);
    
    if (limit) {
      return entries.slice(-limit); // Return last N entries
    }
    
    return entries;
  }

  /**
   * Get all cost entries
   * @param limit Optional limit on number of entries to return
   * @returns Array of cost entries
   */
  public getAllCostEntries(limit?: number): CostEntry[] {
    if (limit) {
      return this.costEntries.slice(-limit);
    }
    return this.costEntries;
  }

  /**
   * Reset cost tracking for a provider
   * @param provider The provider name
   */
  public resetProviderCosts(provider: string): void {
    this.costEntries = this.costEntries.filter(e => e.provider !== provider);
    this.dailyCosts.delete(provider);
    console.log(`[AICostTrackerService] Reset costs for provider: ${provider}`);
  }

  /**
   * Reset all cost tracking
   */
  public resetAllCosts(): void {
    this.costEntries = [];
    this.dailyCosts.clear();
    console.log('[AICostTrackerService] Reset all costs');
  }

  /**
   * Log cost summary for a provider
   * @param provider The provider name
   */
  public logProviderCostSummary(provider: string): void {
    const summary = this.getDailyCostSummary(provider);
    const totalCost = this.getTotalCost(provider);
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [AICostTrackerService] Cost Summary for ${provider}:`, {
      today: `$${summary.totalCost.toFixed(4)}`,
      totalAllTime: `$${totalCost.toFixed(4)}`,
      requestsToday: summary.totalRequests,
      tokensToday: summary.totalTokens,
      avgCostPerRequest: `$${summary.averageCostPerRequest.toFixed(6)}`,
      dailyLimit: this.config.dailyLimitUSD ? `$${this.config.dailyLimitUSD}` : 'None',
      remainingToday: this.config.dailyLimitUSD 
        ? `$${(this.config.dailyLimitUSD - summary.totalCost).toFixed(4)}`
        : 'N/A',
    });
  }

  /**
   * Log aggregated cost summary for all providers
   */
  public logAggregatedCostSummary(): void {
    const summaries = this.getAllDailyCostSummaries();
    const timestamp = new Date().toISOString();

    const totalCostToday = summaries.reduce((sum, s) => sum + s.totalCost, 0);
    const totalRequestsToday = summaries.reduce((sum, s) => sum + s.totalRequests, 0);
    const totalTokensToday = summaries.reduce((sum, s) => sum + s.totalTokens, 0);

    console.log(`[${timestamp}] [AICostTrackerService] Aggregated Cost Summary:`, {
      totalCostToday: `$${totalCostToday.toFixed(4)}`,
      totalRequestsToday,
      totalTokensToday,
      avgCostPerRequest: totalRequestsToday > 0 
        ? `$${(totalCostToday / totalRequestsToday).toFixed(6)}`
        : '$0',
      dailyLimit: this.config.dailyLimitUSD ? `$${this.config.dailyLimitUSD}` : 'None',
    });

    console.log(`[${timestamp}] [AICostTrackerService] Provider Breakdown:`);
    for (const summary of summaries) {
      if (summary.totalRequests > 0) {
        console.log(`  ${summary.provider}:`, {
          cost: `$${summary.totalCost.toFixed(4)}`,
          requests: summary.totalRequests,
          tokens: summary.totalTokens,
          avgCost: `$${summary.averageCostPerRequest.toFixed(6)}`,
        });
      }
    }
  }

  /**
   * Get cost tracking configuration
   */
  public getConfig(): CostTrackingConfig {
    return { ...this.config };
  }

  /**
   * Update cost tracking configuration
   * @param config Partial configuration to update
   */
  public updateConfig(config: Partial<CostTrackingConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[AICostTrackerService] Configuration updated:', this.config);
  }
}
