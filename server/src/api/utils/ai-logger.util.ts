/**
 * AI Provider Structured Logging Utility
 * Provides consistent structured logging for AI provider interactions
 */

import { v4 as uuid } from 'uuid';
import { AIProviderRequest, AIProviderResponse } from '../interfaces/ai-provider.interface';

/**
 * Log level enum
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Structured log entry
 */
export interface StructuredLogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  event: string;
  correlationId?: string;
  provider?: string;
  data?: Record<string, any>;
  error?: {
    message: string;
    code?: string;
    stack?: string;
  };
}

/**
 * AI Logger Utility
 * Provides structured logging for AI provider operations
 */
export class AILogger {
  private static correlationIdMap: Map<string, string> = new Map();

  /**
   * Generate a correlation ID for request tracing
   * @returns Correlation ID
   */
  public static generateCorrelationId(): string {
    return uuid();
  }

  /**
   * Store correlation ID for a request
   * @param requestKey Unique key for the request
   * @param correlationId Correlation ID
   */
  public static setCorrelationId(requestKey: string, correlationId: string): void {
    this.correlationIdMap.set(requestKey, correlationId);
  }

  /**
   * Get correlation ID for a request
   * @param requestKey Unique key for the request
   * @returns Correlation ID or undefined
   */
  public static getCorrelationId(requestKey: string): string | undefined {
    return this.correlationIdMap.get(requestKey);
  }

  /**
   * Clear correlation ID for a request
   * @param requestKey Unique key for the request
   */
  public static clearCorrelationId(requestKey: string): void {
    this.correlationIdMap.delete(requestKey);
  }

  /**
   * Create a structured log entry
   * @param level Log level
   * @param component Component name
   * @param event Event name
   * @param data Additional data
   * @param correlationId Optional correlation ID
   * @returns Structured log entry
   */
  private static createLogEntry(
    level: LogLevel,
    component: string,
    event: string,
    data?: Record<string, any>,
    correlationId?: string
  ): StructuredLogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      component,
      event,
      correlationId,
      data,
    };
  }

  /**
   * Format and output a structured log entry
   * @param entry Structured log entry
   */
  private static outputLog(entry: StructuredLogEntry): void {
    const logString = JSON.stringify(entry);

    switch (entry.level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(logString);
        break;
      case LogLevel.WARN:
        console.warn(logString);
        break;
      case LogLevel.ERROR:
        console.error(logString);
        break;
    }
  }

  /**
   * Log a provider request
   * @param provider Provider name
   * @param request AI provider request
   * @param correlationId Correlation ID for tracing
   */
  public static logProviderRequest(
    provider: string,
    request: AIProviderRequest,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      'AIProvider',
      'request_started',
      {
        provider,
        promptLength: request.prompt.length,
        systemPromptLength: request.systemPrompt?.length || 0,
        maxTokens: request.maxTokens,
        temperature: request.temperature,
        metadata: request.metadata,
      },
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log a provider response
   * @param provider Provider name
   * @param response AI provider response
   * @param responseTime Response time in milliseconds
   * @param correlationId Correlation ID for tracing
   */
  public static logProviderResponse(
    provider: string,
    response: AIProviderResponse,
    responseTime: number,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      'AIProvider',
      'request_completed',
      {
        provider,
        model: response.model,
        contentLength: response.content.length,
        tokensUsed: response.tokensUsed,
        responseTime,
        cached: response.cached,
      },
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log a provider error
   * @param provider Provider name
   * @param error Error object
   * @param responseTime Response time in milliseconds
   * @param request Optional request for context
   * @param correlationId Correlation ID for tracing
   */
  public static logProviderError(
    provider: string,
    error: Error,
    responseTime: number,
    request?: AIProviderRequest,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      LogLevel.ERROR,
      'AIProvider',
      'request_failed',
      {
        provider,
        responseTime,
        request: request
          ? {
              promptLength: request.prompt.length,
              metadata: request.metadata,
            }
          : undefined,
      },
      correlationId
    );

    entry.error = {
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
    };

    this.outputLog(entry);
  }

  /**
   * Log a strategy execution start
   * @param strategy Strategy name
   * @param providers List of provider names
   * @param correlationId Correlation ID for tracing
   */
  public static logStrategyStart(
    strategy: string,
    providers: string[],
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      'AIProviderManager',
      'strategy_started',
      {
        strategy,
        providers,
        providerCount: providers.length,
      },
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log a strategy execution completion
   * @param strategy Strategy name
   * @param selectedProvider Provider that was used
   * @param totalTime Total execution time in milliseconds
   * @param correlationId Correlation ID for tracing
   */
  public static logStrategyComplete(
    strategy: string,
    selectedProvider: string,
    totalTime: number,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      'AIProviderManager',
      'strategy_completed',
      {
        strategy,
        selectedProvider,
        totalTime,
      },
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log a strategy execution failure
   * @param strategy Strategy name
   * @param error Error object
   * @param totalTime Total execution time in milliseconds
   * @param attemptedProviders List of providers that were attempted
   * @param correlationId Correlation ID for tracing
   */
  public static logStrategyFailure(
    strategy: string,
    error: Error,
    totalTime: number,
    attemptedProviders: string[],
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      LogLevel.ERROR,
      'AIProviderManager',
      'strategy_failed',
      {
        strategy,
        totalTime,
        attemptedProviders,
        attemptCount: attemptedProviders.length,
      },
      correlationId
    );

    entry.error = {
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
    };

    this.outputLog(entry);
  }

  /**
   * Log a cache hit
   * @param provider Provider name (from cached response)
   * @param correlationId Correlation ID for tracing
   */
  public static logCacheHit(provider: string, correlationId?: string): void {
    const entry = this.createLogEntry(
      LogLevel.INFO,
      'ResponseCache',
      'cache_hit',
      {
        provider,
      },
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log a cache miss
   * @param correlationId Correlation ID for tracing
   */
  public static logCacheMiss(correlationId?: string): void {
    const entry = this.createLogEntry(
      LogLevel.DEBUG,
      'ResponseCache',
      'cache_miss',
      {},
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log a cost limit warning
   * @param provider Provider name
   * @param currentCost Current daily cost
   * @param limit Daily cost limit
   * @param correlationId Correlation ID for tracing
   */
  public static logCostWarning(
    provider: string,
    currentCost: number,
    limit: number,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      LogLevel.WARN,
      'CostTracker',
      'cost_limit_warning',
      {
        provider,
        currentCost: parseFloat(currentCost.toFixed(4)),
        limit,
        percentage: parseFloat(((currentCost / limit) * 100).toFixed(2)),
      },
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log a cost limit exceeded error
   * @param provider Provider name
   * @param currentCost Current daily cost
   * @param limit Daily cost limit
   * @param correlationId Correlation ID for tracing
   */
  public static logCostLimitExceeded(
    provider: string,
    currentCost: number,
    limit: number,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      LogLevel.ERROR,
      'CostTracker',
      'cost_limit_exceeded',
      {
        provider,
        currentCost: parseFloat(currentCost.toFixed(4)),
        limit,
        exceeded: parseFloat((currentCost - limit).toFixed(4)),
      },
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log a provider health status change
   * @param provider Provider name
   * @param status New status (enabled/disabled)
   * @param reason Reason for status change
   * @param correlationId Correlation ID for tracing
   */
  public static logHealthStatusChange(
    provider: string,
    status: 'enabled' | 'disabled',
    reason: string,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(
      status === 'disabled' ? LogLevel.WARN : LogLevel.INFO,
      'ProviderHealth',
      'status_changed',
      {
        provider,
        status,
        reason,
      },
      correlationId
    );

    this.outputLog(entry);
  }

  /**
   * Log general debug information
   * @param component Component name
   * @param event Event name
   * @param data Additional data
   * @param correlationId Correlation ID for tracing
   */
  public static debug(
    component: string,
    event: string,
    data?: Record<string, any>,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, component, event, data, correlationId);
    this.outputLog(entry);
  }

  /**
   * Log general info
   * @param component Component name
   * @param event Event name
   * @param data Additional data
   * @param correlationId Correlation ID for tracing
   */
  public static info(
    component: string,
    event: string,
    data?: Record<string, any>,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(LogLevel.INFO, component, event, data, correlationId);
    this.outputLog(entry);
  }

  /**
   * Log general warning
   * @param component Component name
   * @param event Event name
   * @param data Additional data
   * @param correlationId Correlation ID for tracing
   */
  public static warn(
    component: string,
    event: string,
    data?: Record<string, any>,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(LogLevel.WARN, component, event, data, correlationId);
    this.outputLog(entry);
  }

  /**
   * Log general error
   * @param component Component name
   * @param event Event name
   * @param error Error object
   * @param data Additional data
   * @param correlationId Correlation ID for tracing
   */
  public static error(
    component: string,
    event: string,
    error: Error,
    data?: Record<string, any>,
    correlationId?: string
  ): void {
    const entry = this.createLogEntry(LogLevel.ERROR, component, event, data, correlationId);
    entry.error = {
      message: error.message,
      code: (error as any).code,
      stack: error.stack,
    };
    this.outputLog(entry);
  }
}
