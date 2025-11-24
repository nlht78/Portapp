/**
 * OpenAI Provider Implementation
 * Implements IAIProvider interface for OpenAI API
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
 * OpenAI API provider implementation
 * Supports GPT-4 and other OpenAI models
 */
export class OpenAIProvider extends BaseAIProvider {
  private readonly OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  private readonly DEFAULT_MODEL = 'gpt-4';
  
  // OpenAI pricing per 1K tokens (approximate)
  private readonly COST_PER_1K_INPUT_TOKENS = 0.03;
  private readonly COST_PER_1K_OUTPUT_TOKENS = 0.06;

  constructor(config: AIProviderConfig) {
    super(config);
  }

  /**
   * Generate a response from OpenAI API
   */
  public async generateResponse(
    request: AIProviderRequest
  ): Promise<AIProviderResponse> {
    const startTime = Date.now();
    this.logRequest(request);

    try {
      const response = await this.executeWithTimeout(
        this.callOpenAIAPI(request)
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
   * Call OpenAI API
   */
  private async callOpenAIAPI(request: AIProviderRequest): Promise<{
    content: string;
    model: string;
    tokensUsed?: number;
    metadata?: Record<string, any>;
  }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt if provided
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt,
      });
    }

    // Add user prompt
    messages.push({
      role: 'user',
      content: request.prompt,
    });

    const requestBody = {
      model: this.config.model || this.DEFAULT_MODEL,
      messages,
      max_tokens: request.maxTokens || this.config.maxTokens || 4000,
      temperature: request.temperature ?? this.config.temperature ?? 0.3,
    };

    const response = await fetch(this.OPENAI_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      await this.handleHttpError(response);
    }

    const data = await response.json();

    // Validate response structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new AIProviderValidationError(
        this.name,
        'Invalid response structure from OpenAI API'
      );
    }

    const content = data.choices[0].message.content;
    const tokensUsed = data.usage?.total_tokens;

    return {
      content,
      model: data.model,
      tokensUsed,
      metadata: {
        finishReason: data.choices[0].finish_reason,
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      },
    };
  }

  /**
   * Validate OpenAI response
   */
  public validateResponse(response: any): boolean {
    if (!super.validateResponse(response)) {
      return false;
    }

    // Additional OpenAI-specific validation
    if (!response.model || !response.model.includes('gpt')) {
      return false;
    }

    return true;
  }

  /**
   * Estimate cost based on token usage
   * OpenAI charges different rates for input and output tokens
   */
  public estimateCost(tokensUsed: number): number {
    // Rough estimate: assume 60% input, 40% output
    const inputTokens = tokensUsed * 0.6;
    const outputTokens = tokensUsed * 0.4;

    const inputCost = (inputTokens / 1000) * this.COST_PER_1K_INPUT_TOKENS;
    const outputCost = (outputTokens / 1000) * this.COST_PER_1K_OUTPUT_TOKENS;

    return inputCost + outputCost;
  }
}
