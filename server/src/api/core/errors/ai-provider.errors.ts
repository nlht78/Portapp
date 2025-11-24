/**
 * AI Provider Error Classes
 * Defines error hierarchy for AI provider-specific errors
 */

/**
 * Base error class for all AI provider errors
 */
export class AIProviderError extends Error {
  public readonly provider: string;
  public readonly code: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    provider: string,
    code: string,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIProviderError';
    this.provider = provider;
    this.code = code;
    this.retryable = retryable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error thrown when an AI provider request times out
 */
export class AIProviderTimeoutError extends AIProviderError {
  constructor(provider: string, timeout?: number) {
    const message = timeout
      ? `Provider ${provider} timed out after ${timeout}ms`
      : `Provider ${provider} timed out`;
    super(message, provider, 'TIMEOUT', true);
    this.name = 'AIProviderTimeoutError';
  }
}

/**
 * Error thrown when an AI provider rate limit is exceeded
 */
export class AIProviderRateLimitError extends AIProviderError {
  public readonly retryAfter?: number;

  constructor(provider: string, retryAfter?: number) {
    const message = retryAfter
      ? `Provider ${provider} rate limit exceeded. Retry after ${retryAfter}ms`
      : `Provider ${provider} rate limit exceeded`;
    super(message, provider, 'RATE_LIMIT', true);
    this.name = 'AIProviderRateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Error thrown when AI provider authentication fails
 */
export class AIProviderAuthError extends AIProviderError {
  constructor(provider: string, details?: string) {
    const message = details
      ? `Provider ${provider} authentication failed: ${details}`
      : `Provider ${provider} authentication failed`;
    super(message, provider, 'AUTH_ERROR', false);
    this.name = 'AIProviderAuthError';
  }
}

/**
 * Error thrown when AI provider response validation fails
 */
export class AIProviderValidationError extends AIProviderError {
  public readonly validationDetails: string;

  constructor(provider: string, details: string) {
    const message = `Provider ${provider} response validation failed: ${details}`;
    super(message, provider, 'VALIDATION_ERROR', false);
    this.name = 'AIProviderValidationError';
    this.validationDetails = details;
  }
}
