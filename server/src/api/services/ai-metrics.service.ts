/**
 * AI Metrics Service
 * Collects and tracks performance metrics for AI providers
 */

/**
 * Metrics for a single provider
 */
export interface ProviderMetrics {
  provider: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalResponseTime: number;
  averageResponseTime: number;
  totalTokensUsed: number;
  successRate: number;
  errorsByType: Record<string, number>;
  lastRequestTime?: number;
  lastErrorTime?: number;
  lastError?: string;
}

/**
 * Aggregated metrics across all providers
 */
export interface AggregatedMetrics {
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  overallSuccessRate: number;
  totalTokensUsed: number;
  totalResponseTime: number;
  averageResponseTime: number;
  providerMetrics: ProviderMetrics[];
  startTime: number;
  uptime: number;
}

/**
 * Request metrics data
 */
export interface RequestMetrics {
  provider: string;
  success: boolean;
  responseTime: number;
  tokensUsed?: number;
  errorType?: string;
  errorMessage?: string;
  timestamp: number;
}

/**
 * AI Metrics Service
 * Singleton service for tracking AI provider performance metrics
 */
export class AIMetricsService {
  private static instance: AIMetricsService;
  private metrics: Map<string, ProviderMetrics>;
  private startTime: number;

  private constructor() {
    this.metrics = new Map<string, ProviderMetrics>();
    this.startTime = Date.now();
    console.log('[AIMetricsService] Initialized');
  }

  /**
   * Get the singleton instance
   */
  public static getInstance(): AIMetricsService {
    if (!AIMetricsService.instance) {
      AIMetricsService.instance = new AIMetricsService();
    }
    return AIMetricsService.instance;
  }

  /**
   * Initialize metrics for a provider
   * @param providerName The name of the provider
   */
  public initializeProvider(providerName: string): void {
    if (!this.metrics.has(providerName)) {
      this.metrics.set(providerName, {
        provider: providerName,
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalResponseTime: 0,
        averageResponseTime: 0,
        totalTokensUsed: 0,
        successRate: 0,
        errorsByType: {},
      });
      console.log(`[AIMetricsService] Initialized metrics for provider: ${providerName}`);
    }
  }

  /**
   * Record a request metric
   * @param requestMetrics The request metrics to record
   */
  public recordRequest(requestMetrics: RequestMetrics): void {
    const { provider, success, responseTime, tokensUsed, errorType, errorMessage, timestamp } = requestMetrics;

    // Initialize provider if not exists
    this.initializeProvider(provider);

    const metrics = this.metrics.get(provider)!;

    // Update request counts
    metrics.totalRequests++;
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
      
      // Track error by type
      if (errorType) {
        metrics.errorsByType[errorType] = (metrics.errorsByType[errorType] || 0) + 1;
      }
      
      // Store last error
      metrics.lastErrorTime = timestamp;
      metrics.lastError = errorMessage;
    }

    // Update response time
    metrics.totalResponseTime += responseTime;
    metrics.averageResponseTime = metrics.totalResponseTime / metrics.totalRequests;

    // Update token usage
    if (tokensUsed) {
      metrics.totalTokensUsed += tokensUsed;
    }

    // Calculate success rate
    metrics.successRate = metrics.successfulRequests / metrics.totalRequests;

    // Update last request time
    metrics.lastRequestTime = timestamp;
  }

  /**
   * Record a successful request
   * @param provider The provider name
   * @param responseTime The response time in milliseconds
   * @param tokensUsed Optional token usage
   */
  public recordSuccess(provider: string, responseTime: number, tokensUsed?: number): void {
    this.recordRequest({
      provider,
      success: true,
      responseTime,
      tokensUsed,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a failed request
   * @param provider The provider name
   * @param responseTime The response time in milliseconds
   * @param errorType The error type/code
   * @param errorMessage The error message
   */
  public recordFailure(
    provider: string,
    responseTime: number,
    errorType: string,
    errorMessage: string
  ): void {
    this.recordRequest({
      provider,
      success: false,
      responseTime,
      errorType,
      errorMessage,
      timestamp: Date.now(),
    });
  }

  /**
   * Get metrics for a specific provider
   * @param providerName The provider name
   * @returns Provider metrics or undefined if not found
   */
  public getProviderMetrics(providerName: string): ProviderMetrics | undefined {
    return this.metrics.get(providerName);
  }

  /**
   * Get metrics for all providers
   * @returns Array of provider metrics
   */
  public getAllProviderMetrics(): ProviderMetrics[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Get aggregated metrics across all providers
   * @returns Aggregated metrics
   */
  public getAggregatedMetrics(): AggregatedMetrics {
    const providerMetrics = this.getAllProviderMetrics();

    const totalRequests = providerMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
    const totalSuccesses = providerMetrics.reduce((sum, m) => sum + m.successfulRequests, 0);
    const totalFailures = providerMetrics.reduce((sum, m) => sum + m.failedRequests, 0);
    const totalTokensUsed = providerMetrics.reduce((sum, m) => sum + m.totalTokensUsed, 0);
    const totalResponseTime = providerMetrics.reduce((sum, m) => sum + m.totalResponseTime, 0);

    const overallSuccessRate = totalRequests > 0 ? totalSuccesses / totalRequests : 0;
    const averageResponseTime = totalRequests > 0 ? totalResponseTime / totalRequests : 0;
    const uptime = Date.now() - this.startTime;

    return {
      totalRequests,
      totalSuccesses,
      totalFailures,
      overallSuccessRate,
      totalTokensUsed,
      totalResponseTime,
      averageResponseTime,
      providerMetrics,
      startTime: this.startTime,
      uptime,
    };
  }

  /**
   * Reset metrics for a specific provider
   * @param providerName The provider name
   */
  public resetProviderMetrics(providerName: string): boolean {
    if (!this.metrics.has(providerName)) {
      return false;
    }

    this.metrics.set(providerName, {
      provider: providerName,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalResponseTime: 0,
      averageResponseTime: 0,
      totalTokensUsed: 0,
      successRate: 0,
      errorsByType: {},
    });

    console.log(`[AIMetricsService] Reset metrics for provider: ${providerName}`);
    return true;
  }

  /**
   * Reset all metrics
   */
  public resetAllMetrics(): void {
    for (const providerName of this.metrics.keys()) {
      this.resetProviderMetrics(providerName);
    }
    this.startTime = Date.now();
    console.log('[AIMetricsService] Reset all metrics');
  }

  /**
   * Log metrics for a specific provider
   * @param providerName The provider name
   */
  public logProviderMetrics(providerName: string): void {
    const metrics = this.metrics.get(providerName);
    if (!metrics) {
      console.warn(`[AIMetricsService] No metrics found for provider: ${providerName}`);
      return;
    }

    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AIMetricsService] Metrics for ${providerName}:`, {
      totalRequests: metrics.totalRequests,
      successfulRequests: metrics.successfulRequests,
      failedRequests: metrics.failedRequests,
      successRate: `${(metrics.successRate * 100).toFixed(2)}%`,
      averageResponseTime: `${metrics.averageResponseTime.toFixed(2)}ms`,
      totalTokensUsed: metrics.totalTokensUsed,
      errorsByType: metrics.errorsByType,
      lastRequestTime: metrics.lastRequestTime ? new Date(metrics.lastRequestTime).toISOString() : 'N/A',
    });
  }

  /**
   * Log aggregated metrics for all providers
   */
  public logAggregatedMetrics(): void {
    const aggregated = this.getAggregatedMetrics();
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [AIMetricsService] Aggregated Metrics:`, {
      totalRequests: aggregated.totalRequests,
      totalSuccesses: aggregated.totalSuccesses,
      totalFailures: aggregated.totalFailures,
      overallSuccessRate: `${(aggregated.overallSuccessRate * 100).toFixed(2)}%`,
      averageResponseTime: `${aggregated.averageResponseTime.toFixed(2)}ms`,
      totalTokensUsed: aggregated.totalTokensUsed,
      uptime: `${(aggregated.uptime / 1000 / 60).toFixed(2)} minutes`,
    });

    console.log(`[${timestamp}] [AIMetricsService] Provider Breakdown:`);
    for (const providerMetrics of aggregated.providerMetrics) {
      console.log(`  ${providerMetrics.provider}:`, {
        requests: providerMetrics.totalRequests,
        successRate: `${(providerMetrics.successRate * 100).toFixed(2)}%`,
        avgResponseTime: `${providerMetrics.averageResponseTime.toFixed(2)}ms`,
        tokensUsed: providerMetrics.totalTokensUsed,
      });
    }
  }

  /**
   * Get metrics summary for monitoring/health checks
   * @returns Simplified metrics summary
   */
  public getMetricsSummary(): {
    healthy: boolean;
    totalRequests: number;
    successRate: number;
    averageResponseTime: number;
    providers: Array<{
      name: string;
      requests: number;
      successRate: number;
      avgResponseTime: number;
    }>;
  } {
    const aggregated = this.getAggregatedMetrics();
    
    // Consider system healthy if success rate > 80% and average response time < 10s
    const healthy = aggregated.overallSuccessRate > 0.8 && aggregated.averageResponseTime < 10000;

    return {
      healthy,
      totalRequests: aggregated.totalRequests,
      successRate: parseFloat((aggregated.overallSuccessRate * 100).toFixed(2)),
      averageResponseTime: parseFloat(aggregated.averageResponseTime.toFixed(2)),
      providers: aggregated.providerMetrics.map(m => ({
        name: m.provider,
        requests: m.totalRequests,
        successRate: parseFloat((m.successRate * 100).toFixed(2)),
        avgResponseTime: parseFloat(m.averageResponseTime.toFixed(2)),
      })),
    };
  }
}
