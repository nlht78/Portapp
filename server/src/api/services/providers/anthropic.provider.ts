/**
 * Anthropic Provider Implementation
 * Implements IAIProvider interface for Anthropic Claude API
 */

import { BaseAIProvider } from './base.provider';
import {
  AIProviderConfig,
  AIProviderRequest,
  AIProviderResponse,
} from '../../interfaces/ai-provider.interface';
import {
  AIProviderError,
  AIProviderValidationError,
} from '../../core/errors/ai-provider.errors';

/**
 * Anthropic Claude API provider implementation
 * Supports Claude 3 models (Opus, Sonnet, Haiku)
 */
export class AnthropicProvider extends BaseAIProvider {
  private readonly ANTHROPIC_ENDPOINT = 'https://api.anthropic.com/v1/messages';
  private readonly ANTHROPIC_VERSION = '2023-06-01';
  private readonly DEFAULT_MODEL = 'claude-3-sonnet-20240229';
  
  // Anthropic pricing per 1M tokens (approximate)
  private readonly COST_PER_1M_INPUT_TOKENS = 3.0;
  private readonly COST_PER_1M_OUTPUT_TOKENS = 15.0;

  constructor(config: AIProviderConfig) {
    super(config);
  }

  /**
   * Generate a response from Anthropic API
   */
  public async generateResponse(
    request: AIProviderRequest
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    this.logRequest(request);

    try {
      const response = await this.executeWithTimeout(
        this.callAnthropicAPI(request)
      );

      const aiResponse: AIProviderResponse = {
        content: response.content,
        provider: this.name,
        model: response.model,
        tokensUsed: response.tokensUsed,
        responseTime: Date.now() - startTime,
        cached: false,
        metadata: response.metadata,
      };

      this.logResponse(aiResponse, startTime);
      return aiResponse;
    } catch (error) {
      this.logError(error as Error, request);
      throw error;
    }
  }

  /**
   * Call Anthropic API
   */
  private async callAnthropicAPI(request: AIProviderRequest): Promise<{
    content: string;
    model: string;
    tokensUsed?: number;
    metadata?: Record<string, any>;
  }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add user prompt
    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const requestBody: any = {
      model: this.config.model || this.DEFAULT_MODEL,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens || 4000,
    };

    // Add system prompt if provided (Anthropic uses a separate system field)
    if (request.systemPrompt) {
      requestBody.system = request.systemPrompt;
    }

    // Add temperature if specified
    if (request.temperature !== undefined || this.config.temperature !== undefined) {
      requestBody.temperature = request.temperature ?? this.config.temperature ?? 0.3;
    }

    const response = await fetch(this.ANTHROPIC_ENDPOINT, {
      method: 'POST',
      headers: {
        'x-api-key': this.config.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': this.ANTHROPIC_VERSION,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      await this.handleHttpError(response);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
      throw new AIProviderValidationError(
        this.name,
        'Invalid response structure from Anthropic API'
      );
    }

    // Extract text content from the first content block
    const textContent = data.content.find((block: any) => block.type === 'text');
    if (!textContent || !textContent.text) {
      throw new AIProviderValidationError(
        this.name,
        'No text content found in Anthropic response'
      );
    }

    const content = textContent.text;
    const tokensUsed = data.usage
      ? (data.usage.input_tokens || 0) + (data.usage.output_tokens || 0)
      : undefined;

    return {
      content,
      model: data.model,
      tokensUsed,
      metadata: {
        stopReason: data.stop_reason,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
      },
    };
  }

  /**
   * Validate Anthropic response
   */
  public validateResponse(response: any): boolean {
    if (!super.validateResponse(response)) {
      return false;
    }

    // Additional Anthropic-specific validation
    if (!response.model || !response.model.includes('claude')) {
      return false;
    }

    return true;
  }

  /**
   * Estimate cost based on token usage
   * Anthropic charges different rates for input and output tokens
   */
  public estimateCost(tokensUsed: number): number {
    // Rough estimate: assume 60% input, 40% output
    const inputTokens = tokensUsed * 0.6;
    const outputTokens = tokensUsed * 0.4;

    const inputCost = (inputTokens / 1000000) * this.COST_PER_1M_INPUT_TOKENS;
    const outputCost = (outputTokens / 1000000) * this.COST_PER_1M_OUTPUT_TOKENS;

    return inputCost + outputCost;
  }
}
