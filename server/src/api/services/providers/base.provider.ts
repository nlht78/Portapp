/**
 * Base AI Provider Abstract Class
 * Provides common functionality for all AI provider implementations
 */

import {
  IAIProvider,
  AIProviderConfig,
  AIProviderRequest,
  AIProviderResponse,
} from '../../interfaces/ai-provider.interface';
import {
  AIProviderError,
  AIProviderTimeoutError,
  AIProviderAuthError,
} from '../../core/errors/ai-provider.errors';
import { AIMetricsService } from '../ai-metrics.service';

/**
 * Abstract base class that all AI providers should extend
 * Provides common functionality like timeout handling, logging, and validation
 */
export abstract class BaseAIProvider implements IAIProvider {
  public readonly name: string;
  public readonly config: AIProviderConfig;
  protected readonly metricsService: AIMetricsService;

  protected readonly DEFAULT_TIMEOUT = 30000; // 30 seconds
  protected readonly DEFAULT_MAX_RETRIES = 3;
  protected readonly DEFAULT_RETRY_DELAY = 1000; // 1 second

  constructor(config: AIProviderConfig) {
    this.config = config;
    this.name = config.name;
    this.metricsService = AIMetricsService.getInstance();
    this.validateConfig();
    
    // Initialize metrics for this provider
    this.metricsService.initializeProvider(this.name);
  }

  /**
   * Check if the provider is available and properly configured
   */
  public isAvailable(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  /**
   * Validate provider configuration
   * Throws error if configuration is invalid
   */
  protected validateConfig(): void {
    if (!this.config.name) {
      throw new Error('Provider name is required');
    }
    if (!this.config.apiKey) {
      console.warn(`[${this.name}] API key is not configured`);
    }
    if (this.config.priority === undefined || this.config.priority < 0) {
      throw new Error(`[${this.name}] Priority must be a non-negative number`);
    }
  }

  /**
   * Generate a response from the AI provider
   * Must be implemented by concrete provider classes
   */
  public abstract generateResponse(
    request: AIProviderRequest
  ): Promise<AIProviderResponse>;

  /**
   * Validate that a response meets the expected format
   * Can be overridden by concrete provider classes
   */
  public validateResponse(response: any): boolean {
    if (!response) {
      return false;
    }
    if (typeof response.content !== 'string' || !response.content.trim()) {
      return false;
    }
    return true;
  }

  /**
   * Estimate the cost of a request based on token usage
   * Must be implemented by concrete provider classes
   */
  public abstract estimateCost(tokensUsed: number): number;

  /**
   * Execute a request with timeout handling
   * Wraps the actual request with timeout logic
   */
  protected async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs?: number
  ): Promise<T> {
    const timeout = timeoutMs || this.config.timeout || this.DEFAULT_TIMEOUT;

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new AIProviderTimeoutError(this.name, timeout));
      }, timeout);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Execute a request with retry logic
   * Retries on retryable errors with exponential backoff
   */
  protected async executeWithRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = this.DEFAULT_MAX_RETRIES
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on non-retryable errors
        if (error instanceof AIProviderError && !error.retryable) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === maxRetries - 1) {
          break;
        }

        // Calculate exponential backoff delay
        const delay = this.DEFAULT_RETRY_DELAY * Math.pow(2, attempt);
        this.logRetry(attempt + 1, maxRetries, delay);

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Log a request to the AI provider
   */
  protected logRequest(request: AIProviderRequest): void {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name}] Request:`, {
      promptLength: request.prompt.length,
      systemPromptLength: request.systemPrompt?.length || 0,
      maxTokens: request.maxTokens || this.config.maxTokens,
      temperature: request.temperature || this.config.temperature,
      metadata: request.metadata,
    });
  }

  /**
   * Log a response from the AI provider
   */
  protected logResponse(
    response: AIProviderResponse,
    startTime: number
  ): void {
    const timestamp = new Date().toISOString();
    const duration = Date.now() - startTime;
    console.log(`[${timestamp}] [${this.name}] Response:`, {
      contentLength: response.content.length,
      tokensUsed: response.tokensUsed,
      responseTime: duration,
      cached: response.cached,
      model: response.model,
    });
    
    // Record success metrics
    this.metricsService.recordSuccess(this.name, duration, response.tokensUsed);
  }

  /**
   * Log an error from the AI provider
   */
  protected logError(error: Error, request?: AIProviderRequest, responseTime?: number): void {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.name}] Error:`, {
      error: error.message,
      name: error.name,
      stack: error.stack,
      request: request
        ? {
            promptLength: request.prompt.length,
            metadata: request.metadata,
          }
        : undefined,
    });
    
    // Record failure metrics
    if (responseTime !== undefined) {
      const errorType = error instanceof AIProviderError ? error.code : error.name;
      this.metricsService.recordFailure(this.name, responseTime, errorType, error.message);
    }
  }

  /**
   * Log a retry attempt
   */
  protected logRetry(
    attempt: number,
    maxRetries: number,
    delay: number
  ): void {
    const timestamp = new Date().toISOString();
    console.log(
      `[${timestamp}] [${this.name}] Retry attempt ${attempt}/${maxRetries} after ${delay}ms`
    );
  }

  /**
   * Sleep for a specified duration
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Parse HTTP error response
   */
  protected async parseErrorResponse(response: Response): Promise<string> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const data = await response.json();
        return data.error?.message || data.message || JSON.stringify(data);
      }
      return await response.text();
    } catch {
      return `HTTP ${response.status} ${response.statusText}`;
    }
  }

  /**
   * Handle HTTP error responses
   */
  protected async handleHttpError(response: Response): Promise<never> {
    const errorMessage = await this.parseErrorResponse(response);

    if (response.status === 401 || response.status === 403) {
      throw new AIProviderAuthError(this.name, errorMessage);
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : undefined;
      throw new AIProviderError(
        `Rate limit exceeded: ${errorMessage}`,
        this.name,
        'RATE_LIMIT',
        true
      );
    }

    throw new AIProviderError(
      `HTTP ${response.status}: ${errorMessage}`,
      this.name,
      `HTTP_${response.status}`,
      response.status >= 500 // Retry on server errors
    );
  }
}
