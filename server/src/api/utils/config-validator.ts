/**
 * Configuration Validator for AI Provider System
 * Validates environment variables and configuration on startup
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ProviderConfig {
  name: string;
  apiKey?: string;
  endpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  enabled?: boolean;
  priority?: number;
}

export class ConfigValidator {
  private errors: string[] = [];
  private warnings: string[] = [];

  /**
   * Validate all AI provider configuration
   */
  validateAIProviderConfig(): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // Validate provider strategy
    this.validateProviderStrategy();

    // Validate individual providers
    this.validateOpenAIConfig();
    this.validateMegaLLMConfig();
    this.validateAnthropicConfig();

    // Validate cache configuration
    this.validateCacheConfig();

    // Validate cost limits
    this.validateCostLimits();

    // Check if at least one provider is configured
    this.validateAtLeastOneProvider();

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * Validate provider strategy configuration
   */
  private validateProviderStrategy(): void {
    const strategy = process.env.AI_PROVIDER_STRATEGY;
    const validStrategies = ['primary-only', 'fallback-chain', 'parallel-comparison', 'cost-optimized'];

    if (!strategy) {
      this.warnings.push('AI_PROVIDER_STRATEGY not set, defaulting to "fallback-chain"');
      return;
    }

    if (!validStrategies.includes(strategy.toLowerCase())) {
      this.errors.push(
        `Invalid AI_PROVIDER_STRATEGY: "${strategy}". Must be one of: ${validStrategies.join(', ')}`
      );
    }
  }

  /**
   * Validate OpenAI provider configuration
   */
  private validateOpenAIConfig(): void {
    const apiKey = process.env.OPENAI_API_KEY;
    const enabled = process.env.OPENAI_ENABLED !== 'false';

    if (!apiKey) {
      this.warnings.push('OPENAI_API_KEY not configured - OpenAI provider will not be available');
      return;
    }

    if (!enabled) {
      this.warnings.push('OpenAI provider is disabled (OPENAI_ENABLED=false)');
      return;
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('sk-')) {
      this.warnings.push('OPENAI_API_KEY format appears invalid (should start with "sk-")');
    }

    // Validate numeric configurations
    this.validateNumericConfig('OPENAI_MAX_TOKENS', 100, 100000);
    this.validateNumericConfig('OPENAI_TEMPERATURE', 0, 2);
    this.validateNumericConfig('OPENAI_TIMEOUT', 1000, 120000);
    this.validateNumericConfig('OPENAI_PRIORITY', 1, 999);
  }

  /**
   * Validate MegaLLM provider configuration
   */
  private validateMegaLLMConfig(): void {
    const apiKey = process.env.MEGALLM_API_KEY;
    const endpoint = process.env.MEGALLM_ENDPOINT;
    const enabled = process.env.MEGALLM_ENABLED !== 'false';

    if (!apiKey || !endpoint) {
      this.warnings.push('MEGALLM_API_KEY or MEGALLM_ENDPOINT not configured - MegaLLM provider will not be available');
      return;
    }

    if (!enabled) {
      this.warnings.push('MegaLLM provider is disabled (MEGALLM_ENABLED=false)');
      return;
    }

    // Validate endpoint URL format
    if (!this.isValidUrl(endpoint)) {
      this.errors.push(`Invalid MEGALLM_ENDPOINT: "${endpoint}" - must be a valid URL`);
    }

    // Validate numeric configurations
    this.validateNumericConfig('MEGALLM_MAX_TOKENS', 100, 100000);
    this.validateNumericConfig('MEGALLM_TEMPERATURE', 0, 2);
    this.validateNumericConfig('MEGALLM_TIMEOUT', 1000, 120000);
    this.validateNumericConfig('MEGALLM_PRIORITY', 1, 999);
  }

  /**
   * Validate Anthropic provider configuration
   */
  private validateAnthropicConfig(): void {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const enabled = process.env.ANTHROPIC_ENABLED !== 'false';

    if (!apiKey) {
      this.warnings.push('ANTHROPIC_API_KEY not configured - Anthropic provider will not be available');
      return;
    }

    if (!enabled) {
      this.warnings.push('Anthropic provider is disabled (ANTHROPIC_ENABLED=false)');
      return;
    }

    // Validate API key format (basic check)
    if (!apiKey.startsWith('sk-ant-')) {
      this.warnings.push('ANTHROPIC_API_KEY format appears invalid (should start with "sk-ant-")');
    }

    // Validate numeric configurations
    this.validateNumericConfig('ANTHROPIC_MAX_TOKENS', 100, 100000);
    this.validateNumericConfig('ANTHROPIC_TEMPERATURE', 0, 2);
    this.validateNumericConfig('ANTHROPIC_TIMEOUT', 1000, 120000);
    this.validateNumericConfig('ANTHROPIC_PRIORITY', 1, 999);
  }

  /**
   * Validate cache configuration
   */
  private validateCacheConfig(): void {
    const ttl = process.env.AI_RESPONSE_CACHE_TTL;
    const enabled = process.env.AI_RESPONSE_CACHE_ENABLED;

    if (enabled && enabled.toLowerCase() === 'false') {
      this.warnings.push('AI response caching is disabled - this may increase costs and response times');
    }

    if (ttl) {
      const ttlNum = parseInt(ttl);
      if (isNaN(ttlNum) || ttlNum < 0) {
        this.errors.push(`Invalid AI_RESPONSE_CACHE_TTL: "${ttl}" - must be a positive number`);
      } else if (ttlNum < 60000) {
        this.warnings.push('AI_RESPONSE_CACHE_TTL is very low (< 1 minute) - cache may not be effective');
      } else if (ttlNum > 86400000) {
        this.warnings.push('AI_RESPONSE_CACHE_TTL is very high (> 24 hours) - cached data may become stale');
      }
    }
  }

  /**
   * Validate cost limit configuration
   */
  private validateCostLimits(): void {
    const dailyLimit = process.env.AI_DAILY_COST_LIMIT_USD;
    const alertThreshold = process.env.AI_COST_ALERT_THRESHOLD_USD;

    if (dailyLimit) {
      const limitNum = parseFloat(dailyLimit);
      if (isNaN(limitNum) || limitNum <= 0) {
        this.errors.push(`Invalid AI_DAILY_COST_LIMIT_USD: "${dailyLimit}" - must be a positive number`);
      }
    }

    if (alertThreshold) {
      const thresholdNum = parseFloat(alertThreshold);
      if (isNaN(thresholdNum) || thresholdNum <= 0) {
        this.errors.push(`Invalid AI_COST_ALERT_THRESHOLD_USD: "${alertThreshold}" - must be a positive number`);
      }

      if (dailyLimit) {
        const limitNum = parseFloat(dailyLimit);
        if (!isNaN(limitNum) && !isNaN(thresholdNum) && thresholdNum >= limitNum) {
          this.warnings.push(
            'AI_COST_ALERT_THRESHOLD_USD should be less than AI_DAILY_COST_LIMIT_USD for effective alerting'
          );
        }
      }
    }
  }

  /**
   * Validate that at least one provider is configured
   */
  private validateAtLeastOneProvider(): void {
    const hasOpenAI = !!process.env.OPENAI_API_KEY && process.env.OPENAI_ENABLED !== 'false';
    const hasMegaLLM =
      !!process.env.MEGALLM_API_KEY && !!process.env.MEGALLM_ENDPOINT && process.env.MEGALLM_ENABLED !== 'false';
    const hasAnthropic = !!process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_ENABLED !== 'false';

    if (!hasOpenAI && !hasMegaLLM && !hasAnthropic) {
      this.errors.push(
        'No AI providers configured - at least one provider (OpenAI, MegaLLM, or Anthropic) must be configured'
      );
    }
  }

  /**
   * Validate numeric configuration value
   */
  private validateNumericConfig(key: string, min: number, max: number): void {
    const value = process.env[key];
    if (!value) return;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      this.errors.push(`Invalid ${key}: "${value}" - must be a number`);
    } else if (numValue < min || numValue > max) {
      this.warnings.push(`${key} value ${numValue} is outside recommended range [${min}, ${max}]`);
    }
  }

  /**
   * Check if a string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get provider configuration summary
   */
  static getProviderConfigSummary(): Record<string, ProviderConfig> {
    return {
      openai: {
        name: 'OpenAI',
        apiKey: process.env.OPENAI_API_KEY ? '***configured***' : undefined,
        model: process.env.OPENAI_MODEL,
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.3'),
        timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
        enabled: process.env.OPENAI_ENABLED !== 'false',
        priority: parseInt(process.env.OPENAI_PRIORITY || '1'),
      },
      megallm: {
        name: 'MegaLLM',
        apiKey: process.env.MEGALLM_API_KEY ? '***configured***' : undefined,
        endpoint: process.env.MEGALLM_ENDPOINT,
        model: process.env.MEGALLM_MODEL,
        maxTokens: parseInt(process.env.MEGALLM_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.MEGALLM_TEMPERATURE || '0.3'),
        timeout: parseInt(process.env.MEGALLM_TIMEOUT || '30000'),
        enabled: process.env.MEGALLM_ENABLED !== 'false',
        priority: parseInt(process.env.MEGALLM_PRIORITY || '2'),
      },
      anthropic: {
        name: 'Anthropic',
        apiKey: process.env.ANTHROPIC_API_KEY ? '***configured***' : undefined,
        model: process.env.ANTHROPIC_MODEL,
        maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4000'),
        temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.3'),
        timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '30000'),
        enabled: process.env.ANTHROPIC_ENABLED !== 'false',
        priority: parseInt(process.env.ANTHROPIC_PRIORITY || '3'),
      },
    };
  }
}
