/**
 * MegaLLM Provider Implementation
 * Provides AI capabilities through the MegaLLM API platform
 */

import { BaseAIProvider } from './base.provider';
import {
  AIProviderConfig,
  AIProviderRequest,
  AIProviderResponse,
} from '../../interfaces/ai-provider.interface';
import {
  AIProviderError,
  AIProviderAuthError,
  AIProviderRateLimitError,
  AIProviderValidationError,
} from '../../core/errors/ai-provider.errors';

/**
 * MegaLLM API request format (OpenAI-compatible)
 */
interface MegaLLMRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

/**
 * MegaLLM API response format (OpenAI-compatible)
 */
interface MegaLLMResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * MegaLLM Provider Class
 * Implements IAIProvider interface for MegaLLM platform
 */
export class MegaLLMProvider extends BaseAIProvider {
  private readonly DEFAULT_MODEL = 'default';
  private readonly DEFAULT_MAX_TOKENS = 4000;
  private readonly DEFAULT_TEMPERATURE = 0.3;
  
  // MegaLLM pricing (example rates - adjust based on actual pricing)
  private readonly COST_PER_1K_PROMPT_TOKENS = 0.0015; // $0.0015 per 1K prompt tokens
  private readonly COST_PER_1K_COMPLETION_TOKENS = 0.002; // $0.002 per 1K completion tokens

  constructor(config: AIProviderConfig) {
    super(config);
  }

  /**
   * Validate MegaLLM-specific configuration
   */
  protected validateConfig(): void {
    super.validateConfig();
    
    if (!this.config.endpoint) {
      throw new Error(`[${this.name}] MegaLLM endpoint URL is required`);
    }
    
    // Validate endpoint URL format
    try {
      new URL(this.config.endpoint);
    } catch (error) {
      throw new Error(`[${this.name}] Invalid MegaLLM endpoint URL: ${this.config.endpoint}`);
    }
  }

  /**
   * Generate a response from MegaLLM
   * Implements the main AI generation logic
   */
  public async generateResponse(
    request: AIProviderRequest
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    
    this.logRequest(request);

    try {
      // Execute request with timeout and retry logic
      const response = await this.executeWithTimeout(
        this.executeWithRetry(() => this.makeApiRequest(request))
      );

      // Extract content from OpenAI-compatible response
      const content = response.choices[0]?.message?.content || '';

      const aiResponse: AIProviderResponse = {
        content,
        provider: this.name,
        model: response.model || this.config.model || this.DEFAULT_MODEL,
        tokensUsed: response.usage?.total_tokens,
        responseTime: Date.now() - startTime,
        cached: false,
        metadata: {
          id: response.id,
          finish_reason: response.choices[0]?.finish_reason,
        },
      };

      this.logResponse(aiResponse, startTime);

      return aiResponse;
    } catch (error) {
      this.logError(error as Error, request, Date.now() - startTime);
      throw error;
    }
  }

  /**
   * Make the actual API request to MegaLLM (OpenAI-compatible)
   */
  private async makeApiRequest(
    request: AIProviderRequest
  ): Promise<MegaLLMResponse> {
    // Build messages array in OpenAI format
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    
    // Add system message if provided
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }
    
    // Add user message
    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const requestBody: MegaLLMRequest = {
      model: this.config.model || this.DEFAULT_MODEL,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens || this.DEFAULT_MAX_TOKENS,
      temperature: request.temperature ?? this.config.temperature ?? this.DEFAULT_TEMPERATURE,
      stream: false,
    };

    const response = await fetch(`${this.config.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      await this.handleHttpError(response);
    }

    const data = await response.json();
    
    // Validate response structure
    if (!this.validateMegaLLMResponse(data)) {
      throw new AIProviderValidationError(
        this.name,
        'Response does not match expected MegaLLM format'
      );
    }

    return data as MegaLLMResponse;
  }

  /**
   * Validate MegaLLM-specific response structure (OpenAI-compatible)
   */
  private validateMegaLLMResponse(response: any): boolean {
    if (!response || typeof response !== 'object') {
      return false;
    }

    // Check required fields for OpenAI-compatible format
    // Note: MegaLLM may return empty string for id, which is acceptable
    if (typeof response.id !== 'string') {
      return false;
    }

    if (!response.model || typeof response.model !== 'string') {
      return false;
    }

    // Validate choices array
    if (!Array.isArray(response.choices) || response.choices.length === 0) {
      return false;
    }

    const firstChoice = response.choices[0];
    if (!firstChoice.message || typeof firstChoice.message.content !== 'string') {
      return false;
    }

    // Validate usage object (optional but recommended)
    if (response.usage) {
      if (typeof response.usage !== 'object') {
        // Don't fail validation, just continue
      } else {
        const usage = response.usage;
        if (
          typeof usage.prompt_tokens !== 'number' ||
          typeof usage.completion_tokens !== 'number' ||
          typeof usage.total_tokens !== 'number'
        ) {
          // Don't fail validation, just continue
        }
      }
    }

    return true;
  }

  /**
   * Validate that a response meets the expected format
   * Overrides base class method with MegaLLM-specific validation
   */
  public validateResponse(response: any): boolean {
    // First check base validation
    if (!super.validateResponse(response)) {
      return false;
    }

    // Additional MegaLLM-specific validation
    if (!response.provider || response.provider !== this.name) {
      return false;
    }

    if (!response.model) {
      return false;
    }

    return true;
  }

  /**
   * Estimate the cost of a request based on token usage
   * Uses MegaLLM pricing model
   */
  public estimateCost(tokensUsed: number): number {
    if (!tokensUsed || tokensUsed <= 0) {
      return 0;
    }

    // Estimate: assume 75% prompt tokens, 25% completion tokens
    const estimatedPromptTokens = Math.floor(tokensUsed * 0.75);
    const estimatedCompletionTokens = Math.floor(tokensUsed * 0.25);

    const promptCost = (estimatedPromptTokens / 1000) * this.COST_PER_1K_PROMPT_TOKENS;
    const completionCost = (estimatedCompletionTokens / 1000) * this.COST_PER_1K_COMPLETION_TOKENS;

    return promptCost + completionCost;
  }

  /**
   * Handle HTTP error responses with MegaLLM-specific error mapping
   */
  protected async handleHttpError(response: Response): Promise<never> {
    const errorMessage = await this.parseErrorResponse(response);

    // MegaLLM-specific error handling
    if (response.status === 401 || response.status === 403) {
      throw new AIProviderAuthError(this.name, errorMessage);
    }

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after');
      const retryAfterMs = retryAfter ? parseInt(retryAfter) * 1000 : undefined;
      throw new AIProviderRateLimitError(this.name, retryAfterMs);
    }

    if (response.status === 400) {
      throw new AIProviderValidationError(this.name, errorMessage);
    }

    if (response.status >= 500) {
      throw new AIProviderError(
        `MegaLLM server error: ${errorMessage}`,
        this.name,
        `HTTP_${response.status}`,
        true // Retryable
      );
    }

    throw new AIProviderError(
      `MegaLLM error: ${errorMessage}`,
      this.name,
      `HTTP_${response.status}`,
      false
    );
  }
}
