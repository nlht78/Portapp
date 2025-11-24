/**
 * AI Provider Interface
 * Defines the contract for all AI provider implementations
 */

/**
 * Provider strategy enum defining how multiple providers should be used
 */
export enum ProviderStrategy {
  PRIMARY_ONLY = 'primary-only',
  FALLBACK_CHAIN = 'fallback-chain',
  PARALLEL_COMPARISON = 'parallel-comparison',
  COST_OPTIMIZED = 'cost-optimized',
}

/**
 * Configuration for an AI provider
 */
export interface AIProviderConfig {
  name: string;
  apiKey: string;
  endpoint?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
  enabled: boolean;
  priority: number; // Lower number = higher priority
}

/**
 * Request structure for AI provider
 */
export interface AIProviderRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, any>;
}

/**
 * Response structure from AI provider
 */
export interface AIProviderResponse {
  content: string;
  provider: string;
  model: string;
  tokensUsed?: number;
  responseTime: number;
  cached: boolean;
  metadata?: Record<string, any>;
}

/**
 * Main interface that all AI providers must implement
 */
export interface IAIProvider {
  name: string;
  config: AIProviderConfig;
  
  /**
   * Check if the provider is available and properly configured
   */
  isAvailable(): boolean;
  
  /**
   * Generate a response from the AI provider
   */
  generateResponse(request: AIProviderRequest): Promise<AIProviderResponse>;
  
  /**
   * Validate that a response meets the expected format
   */
  validateResponse(response: any): boolean;
  
  /**
   * Estimate the cost of a request based on token usage
   */
  estimateCost(tokensUsed: number): number;
}
