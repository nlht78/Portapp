/**
 * AI Provider Manager Service
 * Orchestrates multiple AI providers with different strategies
 */

import {
  IAIProvider,
  AIProviderRequest,
  AIProviderResponse,
  ProviderStrategy,
} from '../interfaces/ai-provider.interface';
import { ResponseCache } from './response-cache.service';
import { AIProviderError } from '../core/errors/ai-provider.errors';
import { AIMetricsService } from './ai-metrics.service';
import { AICostTrackerService } from './ai-cost-tracker.service';
import { AILogger } from '../utils/ai-logger.util';

/**
 * Provider health tracking information
 */
interface ProviderHealth {
  provider: string;
  successCount: number;
  failureCount: number;
  consecutiveFailures: number;
  lastFailureTime?: number;
  disabled: boolean;
  disabledUntil?: number;
}

/**
 * AI Provider Manager
 * Manages multiple AI providers and executes requests using configured strategy
 */
export class AIProviderManager {
  private providers: Map<string, IAIProvider>;
  private strategy: ProviderStrategy;
  private cache: ResponseCache;
  private healthTracking: Map<string, ProviderHealth>;
  private metricsService: AIMetricsService;
  private costTracker: AICostTrackerService;

  // Configuration constants
  private readonly MAX_CONSECUTIVE_FAILURES = 5;
  private readonly COOLDOWN_PERIOD_MS = 5 * 60 * 1000; // 5 minutes
  private readonly QUALITY_THRESHOLD = 0.6;

  /**
   * Initialize the provider manager with a strategy
   * @param strategy The provider selection strategy to use
   */
  constructor(strategy: ProviderStrategy = ProviderStrategy.FALLBACK_CHAIN) {
    this.providers = new Map<string, IAIProvider>();
    this.strategy = strategy;
    this.cache = new ResponseCache();
    this.healthTracking = new Map<string, ProviderHealth>();
    this.metricsService = AIMetricsService.getInstance();
    this.costTracker = AICostTrackerService.getInstance();

    console.log(`[AIProviderManager] Initialized with strategy: ${strategy}`);
  }

  /**
   * Get the current strategy
   */
  public getStrategy(): ProviderStrategy {
    return this.strategy;
  }

  /**
   * Set a new strategy
   * @param strategy The new provider selection strategy
   */
  public setStrategy(strategy: ProviderStrategy): void {
    this.strategy = strategy;
    console.log(`[AIProviderManager] Strategy changed to: ${strategy}`);
  }

  /**
   * Get the response cache instance
   */
  public getCache(): ResponseCache {
    return this.cache;
  }

  /**
   * Get all registered providers
   */
  public getProviders(): IAIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by name
   * @param name The provider name
   */
  public getProvider(name: string): IAIProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Get provider health information
   * @param name The provider name
   */
  public getProviderHealth(name: string): ProviderHealth | undefined {
    return this.healthTracking.get(name);
  }

  /**
   * Get all provider health information
   */
  public getAllProviderHealth(): Map<string, ProviderHealth> {
    return new Map(this.healthTracking);
  }

  /**
   * Register a provider with the manager
   * @param provider The AI provider to register
   */
  public registerProvider(provider: IAIProvider): void {
    // Validate provider
    if (!provider) {
      throw new Error('Provider cannot be null or undefined');
    }

    if (!provider.name) {
      throw new Error('Provider must have a name');
    }

    if (!provider.config) {
      throw new Error(`Provider ${provider.name} must have a config`);
    }

    // Check if provider already registered
    if (this.providers.has(provider.name)) {
      console.warn(
        `[AIProviderManager] Provider ${provider.name} is already registered. Replacing...`
      );
    }

    // Register the provider
    this.providers.set(provider.name, provider);

    // Initialize health tracking
    this.healthTracking.set(provider.name, {
      provider: provider.name,
      successCount: 0,
      failureCount: 0,
      consecutiveFailures: 0,
      disabled: false,
    });

    console.log(
      `[AIProviderManager] Registered provider: ${provider.name} (priority: ${provider.config.priority}, enabled: ${provider.config.enabled})`
    );
  }

  /**
   * Unregister a provider from the manager
   * @param name The provider name to unregister
   */
  public unregisterProvider(name: string): boolean {
    const removed = this.providers.delete(name);
    if (removed) {
      this.healthTracking.delete(name);
      console.log(`[AIProviderManager] Unregistered provider: ${name}`);
    }
    return removed;
  }

  /**
   * Get providers sorted by priority (lower number = higher priority)
   * Filters out disabled and unavailable providers
   */
  private getSortedProviders(): IAIProvider[] {
    return Array.from(this.providers.values())
      .filter((provider) => {
        // Check if provider is available
        if (!provider.isAvailable()) {
          return false;
        }

        // Check if provider is temporarily disabled due to health issues
        const health = this.healthTracking.get(provider.name);
        if (health?.disabled) {
          // Check if cooldown period has passed
          if (health.disabledUntil && Date.now() >= health.disabledUntil) {
            // Re-enable the provider
            health.disabled = false;
            health.consecutiveFailures = 0;
            health.disabledUntil = undefined;
            console.log(
              `[AIProviderManager] Re-enabled provider ${provider.name} after cooldown`
            );
            return true;
          }
          return false;
        }

        return true;
      })
      .sort((a, b) => a.config.priority - b.config.priority);
  }

  /**
   * Log all registered providers on startup
   */
  public logRegisteredProviders(): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AIProviderManager] Registered Providers:`);

    if (this.providers.size === 0) {
      console.log('  No providers registered');
      return;
    }

    const sortedProviders = Array.from(this.providers.values()).sort(
      (a, b) => a.config.priority - b.config.priority
    );

    sortedProviders.forEach((provider) => {
      const status = provider.isAvailable() ? '✓ Available' : '✗ Unavailable';
      const health = this.healthTracking.get(provider.name);
      const healthStatus = health?.disabled ? ' [DISABLED]' : '';

      console.log(
        `  ${provider.name}: Priority ${provider.config.priority} - ${status}${healthStatus}`
      );
    });
  }

  /**
   * Execute primary-only strategy
   * Uses only the highest priority available provider
   * @param request The AI provider request
   * @param correlationId Correlation ID for tracing
   * @param attemptedProviders List to track attempted providers
   * @returns The AI provider response
   * @throws Error if primary provider fails
   */
  private async executePrimaryOnly(
    request: AIProviderRequest,
    correlationId?: string,
    attemptedProviders?: string[]
  ): Promise<AIProviderResponse> {
    const sortedProviders = this.getSortedProviders();

    if (sortedProviders.length === 0) {
      throw new AIProviderError(
        'No available providers',
        'AIProviderManager',
        'NO_PROVIDERS',
        false
      );
    }

    // Get the highest priority provider (first in sorted list)
    const primaryProvider = sortedProviders[0];
    
    if (attemptedProviders) {
      attemptedProviders.push(primaryProvider.name);
    }

    // Check cost limits
    if (!this.canMakeRequestWithinCostLimit(primaryProvider, request)) {
      throw new AIProviderError(
        `Primary provider ${primaryProvider.name} would exceed daily cost limit`,
        primaryProvider.name,
        'COST_LIMIT_EXCEEDED',
        false
      );
    }

    console.log(
      `[AIProviderManager] Using primary provider: ${primaryProvider.name}`
    );

    const startTime = Date.now();
    const estimatedTokens = this.estimateRequestTokens(request);

    // Log provider request
    AILogger.logProviderRequest(primaryProvider.name, request, correlationId);

    try {
      const response = await primaryProvider.generateResponse(request);

      // Validate response
      if (!primaryProvider.validateResponse(response)) {
        throw new AIProviderError(
          'Response validation failed',
          primaryProvider.name,
          'VALIDATION_ERROR',
          false
        );
      }

      // Track success
      this.trackSuccess(primaryProvider.name);

      // Track cost
      this.trackCost(primaryProvider, response, estimatedTokens);

      // Log response time
      const responseTime = Date.now() - startTime;
      AILogger.logProviderResponse(primaryProvider.name, response, responseTime, correlationId);
      
      console.log(
        `[AIProviderManager] Primary provider ${primaryProvider.name} succeeded in ${responseTime}ms`
      );

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log provider error
      AILogger.logProviderError(
        primaryProvider.name,
        error as Error,
        responseTime,
        request,
        correlationId
      );
      
      // Track failure
      this.trackFailure(primaryProvider.name, error as Error);

      // Re-throw the error (no fallback in primary-only mode)
      throw new AIProviderError(
        `Primary provider ${primaryProvider.name} failed: ${(error as Error).message}`,
        primaryProvider.name,
        'PRIMARY_FAILED',
        false
      );
    }
  }

  /**
   * Execute fallback-chain strategy
   * Tries providers in priority order until one succeeds
   * @param request The AI provider request
   * @param correlationId Correlation ID for tracing
   * @param attemptedProviders List to track attempted providers
   * @returns The AI provider response from the first successful provider
   * @throws Error if all providers fail
   */
  private async executeFallbackChain(
    request: AIProviderRequest,
    correlationId?: string,
    attemptedProviders?: string[]
  ): Promise<AIProviderResponse> {
    const sortedProviders = this.getSortedProviders();

    if (sortedProviders.length === 0) {
      throw new AIProviderError(
        'No available providers',
        'AIProviderManager',
        'NO_PROVIDERS',
        false
      );
    }

    const errors: Array<{ provider: string; error: Error }> = [];

    console.log(
      `[AIProviderManager] Attempting fallback chain with ${sortedProviders.length} providers`
    );

    // Try each provider in order
    const estimatedTokens = this.estimateRequestTokens(request);
    
    for (const provider of sortedProviders) {
      if (attemptedProviders) {
        attemptedProviders.push(provider.name);
      }
      
      // Check cost limits before trying provider
      if (!this.canMakeRequestWithinCostLimit(provider, request)) {
        console.warn(
          `[AIProviderManager] Skipping provider ${provider.name}: would exceed daily cost limit`
        );
        continue;
      }

      const startTime = Date.now();

      try {
        console.log(
          `[AIProviderManager] Trying provider: ${provider.name} (priority: ${provider.config.priority})`
        );

        // Log provider request
        AILogger.logProviderRequest(provider.name, request, correlationId);

        const response = await provider.generateResponse(request);

        // Validate response
        if (!provider.validateResponse(response)) {
          const validationError = new AIProviderError(
            'Response validation failed',
            provider.name,
            'VALIDATION_ERROR',
            false
          );
          errors.push({ provider: provider.name, error: validationError });
          this.trackFailure(provider.name, validationError);

          const responseTime = Date.now() - startTime;
          AILogger.logProviderError(
            provider.name,
            validationError,
            responseTime,
            request,
            correlationId
          );

          console.warn(
            `[AIProviderManager] Provider ${provider.name} validation failed, trying next provider`
          );
          continue;
        }

        // Track success
        this.trackSuccess(provider.name);

        // Track cost
        this.trackCost(provider, response, estimatedTokens);

        // Log success
        const responseTime = Date.now() - startTime;
        AILogger.logProviderResponse(provider.name, response, responseTime, correlationId);
        
        console.log(
          `[AIProviderManager] Provider ${provider.name} succeeded in ${responseTime}ms`
        );

        return response;
      } catch (error) {
        const err = error as Error;
        const responseTime = Date.now() - startTime;
        
        errors.push({ provider: provider.name, error: err });

        // Log provider error
        AILogger.logProviderError(provider.name, err, responseTime, request, correlationId);

        // Track failure
        this.trackFailure(provider.name, err);

        // Log failure and continue to next provider
        console.error(
          `[AIProviderManager] Provider ${provider.name} failed: ${err.message}`
        );
        console.log(
          `[AIProviderManager] Falling back to next provider...`
        );
      }
    }

    // All providers failed
    const errorSummary = errors
      .map((e) => `${e.provider}: ${e.error.message}`)
      .join('; ');

    throw new AIProviderError(
      `All providers failed. Errors: ${errorSummary}`,
      'AIProviderManager',
      'ALL_PROVIDERS_FAILED',
      false
    );
  }

  /**
   * Execute parallel-comparison strategy
   * Sends requests to multiple providers simultaneously and compares results
   * @param request The AI provider request
   * @param correlationId Correlation ID for tracing
   * @param attemptedProviders List to track attempted providers
   * @returns The best AI provider response based on quality comparison
   */
  private async executeParallelComparison(
    request: AIProviderRequest,
    correlationId?: string,
    attemptedProviders?: string[]
  ): Promise<AIProviderResponse> {
    const sortedProviders = this.getSortedProviders();

    if (sortedProviders.length === 0) {
      throw new AIProviderError(
        'No available providers',
        'AIProviderManager',
        'NO_PROVIDERS',
        false
      );
    }

    console.log(
      `[AIProviderManager] Executing parallel comparison with ${sortedProviders.length} providers`
    );

    // Create promises for all providers
    const providerPromises = sortedProviders.map(async (provider) => {
      const startTime = Date.now();
      try {
        const response = await provider.generateResponse(request);

        // Validate response
        if (!provider.validateResponse(response)) {
          throw new AIProviderError(
            'Response validation failed',
            provider.name,
            'VALIDATION_ERROR',
            false
          );
        }

        const responseTime = Date.now() - startTime;
        console.log(
          `[AIProviderManager] Provider ${provider.name} completed in ${responseTime}ms`
        );

        return { provider, response, error: null };
      } catch (error) {
        console.error(
          `[AIProviderManager] Provider ${provider.name} failed: ${(error as Error).message}`
        );
        return { provider, response: null, error: error as Error };
      }
    });

    // Wait for all providers to complete (or fail)
    const results = await Promise.all(providerPromises);

    // Filter successful responses
    const successfulResults = results.filter((r) => r.response !== null);

    if (successfulResults.length === 0) {
      // All providers failed
      results.forEach((r) => {
        if (r.error) {
          this.trackFailure(r.provider.name, r.error);
        }
      });

      const errorSummary = results
        .filter((r) => r.error)
        .map((r) => `${r.provider.name}: ${r.error!.message}`)
        .join('; ');

      throw new AIProviderError(
        `All providers failed in parallel comparison. Errors: ${errorSummary}`,
        'AIProviderManager',
        'ALL_PROVIDERS_FAILED',
        false
      );
    }

    // Compare responses and select the best one
    const bestResult = this.selectBestResponse(successfulResults);

    // Track success for the winning provider and failures for others
    results.forEach((r) => {
      if (r.response) {
        if (r.provider.name === bestResult.provider.name) {
          this.trackSuccess(r.provider.name);
        }
      } else if (r.error) {
        this.trackFailure(r.provider.name, r.error);
      }
    });

    console.log(
      `[AIProviderManager] Selected best response from provider: ${bestResult.provider.name}`
    );

    return bestResult.response!;
  }

  /**
   * Select the best response from multiple provider responses
   * Uses quality scoring based on content length, validation, and provider priority
   * @param results Array of successful provider results
   * @returns The best result
   */
  private selectBestResponse(
    results: Array<{
      provider: IAIProvider;
      response: AIProviderResponse | null;
      error: Error | null;
    }>
  ): { provider: IAIProvider; response: AIProviderResponse | null } {
    // Score each response
    const scoredResults = results.map((result) => {
      let score = 0;

      if (!result.response) {
        return { ...result, score: 0 };
      }

      // Content length score (longer responses generally more detailed)
      const contentLength = result.response.content.length;
      score += Math.min(contentLength / 100, 50); // Max 50 points for length

      // Response time score (faster is better, but not weighted too heavily)
      const responseTime = result.response.responseTime;
      score += Math.max(0, 20 - responseTime / 1000); // Max 20 points for speed

      // Token usage efficiency (more tokens used = more detailed)
      if (result.response.tokensUsed) {
        score += Math.min(result.response.tokensUsed / 100, 30); // Max 30 points
      }

      // Provider priority bonus (lower priority number = higher bonus)
      score += Math.max(0, 10 - result.provider.config.priority);

      return { ...result, score };
    });

    // Sort by score (highest first)
    scoredResults.sort((a, b) => b.score - a.score);

    // Log comparison results
    console.log('[AIProviderManager] Response comparison scores:');
    scoredResults.forEach((r) => {
      console.log(
        `  ${r.provider.name}: ${r.score.toFixed(2)} points (length: ${r.response?.content.length}, time: ${r.response?.responseTime}ms)`
      );
    });

    // Return the highest scoring result
    return scoredResults[0];
  }

  /**
   * Execute cost-optimized strategy
   * Selects the provider with the lowest estimated cost that meets quality threshold
   * @param request The AI provider request
   * @param correlationId Correlation ID for tracing
   * @param attemptedProviders List to track attempted providers
   * @returns The AI provider response from the most cost-effective provider
   */
  private async executeCostOptimized(
    request: AIProviderRequest,
    correlationId?: string,
    attemptedProviders?: string[]
  ): Promise<AIProviderResponse> {
    const sortedProviders = this.getSortedProviders();

    if (sortedProviders.length === 0) {
      throw new AIProviderError(
        'No available providers',
        'AIProviderManager',
        'NO_PROVIDERS',
        false
      );
    }

    console.log(
      `[AIProviderManager] Executing cost-optimized strategy with ${sortedProviders.length} providers`
    );

    // Estimate tokens for the request (rough estimate based on prompt length)
    const estimatedTokens = this.estimateRequestTokens(request);

    // Calculate cost estimates for each provider
    const providerCosts = sortedProviders.map((provider) => {
      const estimatedCost = provider.estimateCost(estimatedTokens);
      return { provider, estimatedCost };
    });

    // Sort by cost (lowest first)
    providerCosts.sort((a, b) => a.estimatedCost - b.estimatedCost);

    console.log('[AIProviderManager] Provider cost estimates:');
    providerCosts.forEach((pc) => {
      console.log(
        `  ${pc.provider.name}: $${pc.estimatedCost.toFixed(4)} (${estimatedTokens} tokens)`
      );
    });

    // Try providers in order of cost, but ensure quality threshold is met
    const errors: Array<{ provider: string; error: Error }> = [];

    for (const { provider, estimatedCost } of providerCosts) {
      const startTime = Date.now();

      try {
        console.log(
          `[AIProviderManager] Trying cost-effective provider: ${provider.name} (estimated cost: $${estimatedCost.toFixed(4)})`
        );

        const response = await provider.generateResponse(request);

        // Validate response
        if (!provider.validateResponse(response)) {
          const validationError = new AIProviderError(
            'Response validation failed',
            provider.name,
            'VALIDATION_ERROR',
            false
          );
          errors.push({ provider: provider.name, error: validationError });
          this.trackFailure(provider.name, validationError);

          console.warn(
            `[AIProviderManager] Provider ${provider.name} validation failed, trying next provider`
          );
          continue;
        }

        // Check quality threshold
        const qualityScore = this.calculateQualityScore(response);
        if (qualityScore < this.QUALITY_THRESHOLD) {
          const qualityError = new AIProviderError(
            `Quality score ${qualityScore.toFixed(2)} below threshold ${this.QUALITY_THRESHOLD}`,
            provider.name,
            'QUALITY_THRESHOLD',
            false
          );
          errors.push({ provider: provider.name, error: qualityError });
          this.trackFailure(provider.name, qualityError);

          console.warn(
            `[AIProviderManager] Provider ${provider.name} quality below threshold, trying next provider`
          );
          continue;
        }

        // Track success
        this.trackSuccess(provider.name);

        // Calculate actual cost
        const actualTokens = response.tokensUsed || estimatedTokens;
        const actualCost = provider.estimateCost(actualTokens);

        // Log success with cost information
        const responseTime = Date.now() - startTime;
        console.log(
          `[AIProviderManager] Provider ${provider.name} succeeded in ${responseTime}ms`
        );
        console.log(
          `[AIProviderManager] Actual cost: $${actualCost.toFixed(4)} (${actualTokens} tokens)`
        );

        return response;
      } catch (error) {
        const err = error as Error;
        errors.push({ provider: provider.name, error: err });

        // Track failure
        this.trackFailure(provider.name, err);

        // Log failure and continue to next provider
        console.error(
          `[AIProviderManager] Provider ${provider.name} failed: ${err.message}`
        );
        console.log(
          `[AIProviderManager] Trying next cost-effective provider...`
        );
      }
    }

    // All providers failed
    const errorSummary = errors
      .map((e) => `${e.provider}: ${e.error.message}`)
      .join('; ');

    throw new AIProviderError(
      `All providers failed in cost-optimized strategy. Errors: ${errorSummary}`,
      'AIProviderManager',
      'ALL_PROVIDERS_FAILED',
      false
    );
  }

  /**
   * Estimate the number of tokens in a request
   * Uses a rough approximation: ~4 characters per token
   * @param request The AI provider request
   * @returns Estimated token count
   */
  private estimateRequestTokens(request: AIProviderRequest): number {
    const promptLength = request.prompt.length;
    const systemPromptLength = request.systemPrompt?.length || 0;
    const totalChars = promptLength + systemPromptLength;

    // Rough estimate: 4 characters per token
    const estimatedInputTokens = Math.ceil(totalChars / 4);

    // Add estimated output tokens (use maxTokens if specified, otherwise default)
    const estimatedOutputTokens = request.maxTokens || 1000;

    return estimatedInputTokens + estimatedOutputTokens;
  }

  /**
   * Calculate a quality score for a response
   * Based on content length, structure, and completeness
   * @param response The AI provider response
   * @returns Quality score between 0 and 1
   */
  private calculateQualityScore(response: AIProviderResponse): number {
    let score = 0;

    // Content length score (minimum 100 characters for reasonable quality)
    const contentLength = response.content.length;
    if (contentLength >= 100) {
      score += 0.3;
    } else {
      score += (contentLength / 100) * 0.3;
    }

    // Check for structured content (JSON-like or markdown)
    const hasStructure =
      response.content.includes('{') ||
      response.content.includes('[') ||
      response.content.includes('#') ||
      response.content.includes('*');
    if (hasStructure) {
      score += 0.2;
    }

    // Check for completeness (not truncated)
    const seemsComplete =
      !response.content.endsWith('...') &&
      !response.content.includes('[truncated]');
    if (seemsComplete) {
      score += 0.2;
    }

    // Token usage indicates thoroughness
    if (response.tokensUsed && response.tokensUsed > 100) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Track a successful provider response
   * Updates health metrics and resets consecutive failures
   * @param providerName The name of the provider
   */
  private trackSuccess(providerName: string): void {
    const health = this.healthTracking.get(providerName);
    if (!health) {
      console.warn(
        `[AIProviderManager] Health tracking not found for provider: ${providerName}`
      );
      return;
    }

    health.successCount++;
    health.consecutiveFailures = 0;
    health.lastFailureTime = undefined;

    // Re-enable provider if it was disabled
    if (health.disabled) {
      health.disabled = false;
      health.disabledUntil = undefined;
      console.log(
        `[AIProviderManager] Re-enabled provider ${providerName} after successful response`
      );
    }
  }

  /**
   * Track a failed provider response
   * Updates health metrics and disables provider if threshold exceeded
   * @param providerName The name of the provider
   * @param error The error that occurred
   */
  private trackFailure(providerName: string, error: Error): void {
    const health = this.healthTracking.get(providerName);
    if (!health) {
      console.warn(
        `[AIProviderManager] Health tracking not found for provider: ${providerName}`
      );
      return;
    }

    health.failureCount++;
    health.consecutiveFailures++;
    health.lastFailureTime = Date.now();

    console.log(
      `[AIProviderManager] Provider ${providerName} failure tracked: ${health.consecutiveFailures}/${this.MAX_CONSECUTIVE_FAILURES} consecutive failures`
    );

    // Check if provider should be disabled
    if (
      health.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES &&
      !health.disabled
    ) {
      health.disabled = true;
      health.disabledUntil = Date.now() + this.COOLDOWN_PERIOD_MS;

      const cooldownMinutes = this.COOLDOWN_PERIOD_MS / 60000;
      console.error(
        `[AIProviderManager] Provider ${providerName} disabled due to ${health.consecutiveFailures} consecutive failures. Will retry after ${cooldownMinutes} minutes.`
      );
    }
  }

  /**
   * Manually disable a provider
   * @param providerName The name of the provider to disable
   * @param cooldownMs Optional cooldown period in milliseconds
   */
  public disableProvider(
    providerName: string,
    cooldownMs?: number
  ): boolean {
    const health = this.healthTracking.get(providerName);
    if (!health) {
      console.warn(
        `[AIProviderManager] Cannot disable unknown provider: ${providerName}`
      );
      return false;
    }

    health.disabled = true;
    health.disabledUntil = Date.now() + (cooldownMs || this.COOLDOWN_PERIOD_MS);

    console.log(
      `[AIProviderManager] Provider ${providerName} manually disabled`
    );
    return true;
  }

  /**
   * Manually enable a provider
   * @param providerName The name of the provider to enable
   */
  public enableProvider(providerName: string): boolean {
    const health = this.healthTracking.get(providerName);
    if (!health) {
      console.warn(
        `[AIProviderManager] Cannot enable unknown provider: ${providerName}`
      );
      return false;
    }

    health.disabled = false;
    health.disabledUntil = undefined;
    health.consecutiveFailures = 0;

    console.log(
      `[AIProviderManager] Provider ${providerName} manually enabled`
    );
    return true;
  }

  /**
   * Get success rate for a provider
   * @param providerName The name of the provider
   * @returns Success rate between 0 and 1, or null if provider not found
   */
  public getProviderSuccessRate(providerName: string): number | null {
    const health = this.healthTracking.get(providerName);
    if (!health) {
      return null;
    }

    const totalRequests = health.successCount + health.failureCount;
    if (totalRequests === 0) {
      return 0;
    }

    return health.successCount / totalRequests;
  }

  /**
   * Log health status for all providers
   */
  public logProviderHealth(): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [AIProviderManager] Provider Health Status:`);

    if (this.healthTracking.size === 0) {
      console.log('  No providers registered');
      return;
    }

    for (const [name, health] of this.healthTracking.entries()) {
      const totalRequests = health.successCount + health.failureCount;
      const successRate =
        totalRequests > 0
          ? ((health.successCount / totalRequests) * 100).toFixed(2)
          : '0.00';

      const status = health.disabled ? '✗ DISABLED' : '✓ Active';
      const cooldownInfo = health.disabledUntil
        ? ` (until ${new Date(health.disabledUntil).toISOString()})`
        : '';

      console.log(
        `  ${name}: ${status}${cooldownInfo} - Success: ${health.successCount}, Failures: ${health.failureCount} (${successRate}% success rate)`
      );
    }
  }

  /**
   * Reset health tracking for a provider
   * @param providerName The name of the provider
   */
  public resetProviderHealth(providerName: string): boolean {
    const health = this.healthTracking.get(providerName);
    if (!health) {
      return false;
    }

    health.successCount = 0;
    health.failureCount = 0;
    health.consecutiveFailures = 0;
    health.lastFailureTime = undefined;
    health.disabled = false;
    health.disabledUntil = undefined;

    console.log(
      `[AIProviderManager] Health tracking reset for provider: ${providerName}`
    );
    return true;
  }

  /**
   * Reset health tracking for all providers
   */
  public resetAllProviderHealth(): void {
    for (const [name] of this.healthTracking.entries()) {
      this.resetProviderHealth(name);
    }
    console.log('[AIProviderManager] Health tracking reset for all providers');
  }

  /**
   * Generate a response using the configured strategy
   * Checks cache first, then executes the appropriate strategy
   * @param request The AI provider request
   * @returns The AI provider response
   */
  public async generateResponse(
    request: AIProviderRequest
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    const correlationId = AILogger.generateCorrelationId();

    // Log strategy start
    const availableProviders = this.getSortedProviders().map(p => p.name);
    AILogger.logStrategyStart(this.strategy, availableProviders, correlationId);

    // Check if caching is enabled
    const cacheEnabled =
      process.env.AI_RESPONSE_CACHE_ENABLED !== 'false';

    // Check cache first
    if (cacheEnabled) {
      const cachedResponse = await this.cache.get(request);
      if (cachedResponse) {
        const responseTime = Date.now() - startTime;
        AILogger.logCacheHit(cachedResponse.provider, correlationId);
        console.log(
          `[AIProviderManager] Cache hit! Returning cached response (${responseTime}ms)`
        );
        return cachedResponse;
      }
      AILogger.logCacheMiss(correlationId);
      console.log('[AIProviderManager] Cache miss, executing strategy');
    }

    // Execute the appropriate strategy
    let response: AIProviderResponse;
    const attemptedProviders: string[] = [];

    try {
      switch (this.strategy) {
        case ProviderStrategy.PRIMARY_ONLY:
          response = await this.executePrimaryOnly(request, correlationId, attemptedProviders);
          break;

        case ProviderStrategy.FALLBACK_CHAIN:
          response = await this.executeFallbackChain(request, correlationId, attemptedProviders);
          break;

        case ProviderStrategy.PARALLEL_COMPARISON:
          response = await this.executeParallelComparison(request, correlationId, attemptedProviders);
          break;

        case ProviderStrategy.COST_OPTIMIZED:
          response = await this.executeCostOptimized(request, correlationId, attemptedProviders);
          break;

        default:
          console.warn(
            `[AIProviderManager] Unknown strategy: ${this.strategy}, falling back to FALLBACK_CHAIN`
          );
          response = await this.executeFallbackChain(request, correlationId, attemptedProviders);
      }

      // Cache the successful response
      if (cacheEnabled) {
        await this.cache.set(request, response);
        console.log('[AIProviderManager] Response cached');
      }

      // Log strategy completion
      const totalTime = Date.now() - startTime;
      AILogger.logStrategyComplete(this.strategy, response.provider, totalTime, correlationId);

      return response;
    } catch (error) {
      const totalTime = Date.now() - startTime;
      
      // Log strategy failure
      AILogger.logStrategyFailure(
        this.strategy,
        error as Error,
        totalTime,
        attemptedProviders,
        correlationId
      );
      
      console.error(
        `[AIProviderManager] All strategies failed after ${totalTime}ms:`,
        (error as Error).message
      );
      throw error;
    }
  }

  /**
   * Invalidate cache for a specific request
   * @param request The AI provider request to invalidate
   */
  public invalidateCache(request: AIProviderRequest): boolean {
    return this.cache.invalidate(request);
  }

  /**
   * Clear all cached responses
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache metrics
   */
  public getCacheMetrics() {
    return this.cache.getMetrics();
  }

  /**
   * Log cache statistics
   */
  public logCacheStatistics(): void {
    this.cache.logStatistics();
  }

  /**
   * Get metrics service instance
   */
  public getMetricsService(): AIMetricsService {
    return this.metricsService;
  }

  /**
   * Get aggregated metrics
   */
  public getAggregatedMetrics() {
    return this.metricsService.getAggregatedMetrics();
  }

  /**
   * Log metrics for all providers
   */
  public logMetrics(): void {
    this.metricsService.logAggregatedMetrics();
  }

  /**
   * Get cost tracker service instance
   */
  public getCostTracker(): AICostTrackerService {
    return this.costTracker;
  }

  /**
   * Log cost summary for all providers
   */
  public logCosts(): void {
    this.costTracker.logAggregatedCostSummary();
  }

  /**
   * Track cost for a provider response
   * @param provider The provider
   * @param response The response
   * @param estimatedTokens The estimated tokens
   */
  private trackCost(provider: IAIProvider, response: AIProviderResponse, estimatedTokens: number): void {
    const actualTokens = response.tokensUsed || estimatedTokens;
    const estimatedCost = provider.estimateCost(estimatedTokens);
    const actualCost = provider.estimateCost(actualTokens);
    
    this.costTracker.recordCost(provider.name, estimatedCost, actualCost, actualTokens);
  }

  /**
   * Check if a provider can make a request based on cost limits
   * @param provider The provider
   * @param request The request
   * @returns True if the request can proceed
   */
  private canMakeRequestWithinCostLimit(provider: IAIProvider, request: AIProviderRequest): boolean {
    const estimatedTokens = this.estimateRequestTokens(request);
    const estimatedCost = provider.estimateCost(estimatedTokens);
    return this.costTracker.canMakeRequest(provider.name, estimatedCost);
  }

  /**
   * Shutdown the provider manager
   * Stops cache cleanup and logs final statistics
   */
  public shutdown(): void {
    console.log('[AIProviderManager] Shutting down...');
    this.cache.stopCleanup();
    this.logProviderHealth();
    this.logCacheStatistics();
    this.logMetrics();
    this.logCosts();
    console.log('[AIProviderManager] Shutdown complete');
  }
}
