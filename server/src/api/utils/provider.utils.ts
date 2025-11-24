/**
 * Provider Utility Functions
 * Helper functions for AI provider operations
 */

import { AIProviderRequest, AIProviderResponse } from '../interfaces/ai-provider.interface';
import crypto from 'crypto';

/**
 * Estimate token count for a given text
 * Uses a simple approximation: ~4 characters per token for English text
 * This is a rough estimate and may vary by model and language
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  
  // Average of 4 characters per token (rough approximation)
  const charCount = text.length;
  const tokenCount = Math.ceil(charCount / 4);
  
  return tokenCount;
}

/**
 * Estimate token count for a request
 * Includes prompt, system prompt, and overhead
 */
export function estimateRequestTokens(request: AIProviderRequest): number {
  let totalTokens = 0;
  
  // Count prompt tokens
  if (request.prompt) {
    totalTokens += estimateTokenCount(request.prompt);
  }
  
  // Count system prompt tokens
  if (request.systemPrompt) {
    totalTokens += estimateTokenCount(request.systemPrompt);
  }
  
  // Add overhead for message formatting (approximately 10 tokens)
  totalTokens += 10;
  
  return totalTokens;
}

/**
 * Estimate total tokens including response
 */
export function estimateTotalTokens(
  request: AIProviderRequest,
  responseLength?: number
): number {
  const requestTokens = estimateRequestTokens(request);
  const responseTokens = responseLength
    ? estimateTokenCount(responseLength.toString())
    : (request.maxTokens || 1000);
  
  return requestTokens + responseTokens;
}

/**
 * Calculate cost based on token usage and pricing
 * Prices are per 1000 tokens
 */
export function calculateCost(
  inputTokens: number,
  outputTokens: number,
  inputPricePer1k: number,
  outputPricePer1k: number
): number {
  const inputCost = (inputTokens / 1000) * inputPricePer1k;
  const outputCost = (outputTokens / 1000) * outputPricePer1k;
  return inputCost + outputCost;
}

/**
 * Validate that a response contains required fields
 */
export function validateResponseStructure(response: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!response) {
    errors.push('Response is null or undefined');
    return { valid: false, errors };
  }
  
  if (typeof response.content !== 'string') {
    errors.push('Response content must be a string');
  } else if (!response.content.trim()) {
    errors.push('Response content is empty');
  }
  
  if (typeof response.provider !== 'string') {
    errors.push('Response provider must be a string');
  }
  
  if (typeof response.model !== 'string') {
    errors.push('Response model must be a string');
  }
  
  if (typeof response.responseTime !== 'number') {
    errors.push('Response responseTime must be a number');
  }
  
  if (typeof response.cached !== 'boolean') {
    errors.push('Response cached must be a boolean');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format a prompt with system instructions
 * Combines system prompt and user prompt in a standardized way
 */
export function formatPrompt(
  userPrompt: string,
  systemPrompt?: string
): string {
  if (!systemPrompt) {
    return userPrompt;
  }
  
  return `${systemPrompt}\n\n${userPrompt}`;
}

/**
 * Truncate text to a maximum token count
 * Useful for staying within token limits
 */
export function truncateToTokenLimit(
  text: string,
  maxTokens: number
): string {
  const estimatedTokens = estimateTokenCount(text);
  
  if (estimatedTokens <= maxTokens) {
    return text;
  }
  
  // Calculate approximate character limit
  const maxChars = maxTokens * 4;
  const truncated = text.substring(0, maxChars);
  
  // Try to truncate at a sentence boundary
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  const cutPoint = Math.max(lastPeriod, lastNewline);
  
  if (cutPoint > maxChars * 0.8) {
    // If we can cut at a sentence boundary without losing too much, do it
    return truncated.substring(0, cutPoint + 1);
  }
  
  return truncated + '...';
}

/**
 * Generate a cache key for a request
 * Creates a deterministic hash based on request parameters
 */
export function generateCacheKey(request: AIProviderRequest): string {
  const keyData = {
    prompt: request.prompt,
    systemPrompt: request.systemPrompt || '',
    maxTokens: request.maxTokens || 0,
    temperature: request.temperature || 0,
  };
  
  const keyString = JSON.stringify(keyData);
  return crypto.createHash('sha256').update(keyString).digest('hex');
}

/**
 * Parse JSON from AI response content
 * Handles cases where JSON is wrapped in markdown code blocks
 */
export function parseJSONFromResponse(content: string): any {
  try {
    // Try direct JSON parse first
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch {
        // Fall through to next attempt
      }
    }
    
    // Try to find any JSON object in the content
    const objectMatch = content.match(/\{[\s\S]*\}/);
    if (objectMatch) {
      try {
        return JSON.parse(objectMatch[0]);
      } catch {
        // Fall through
      }
    }
    
    throw new Error('Could not parse JSON from response content');
  }
}

/**
 * Sanitize response content
 * Removes potentially harmful content or formatting issues
 */
export function sanitizeResponseContent(content: string): string {
  if (!content) return '';
  
  // Trim whitespace
  let sanitized = content.trim();
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Normalize line endings
  sanitized = sanitized.replace(/\r\n/g, '\n');
  
  // Remove excessive newlines (more than 3 consecutive)
  sanitized = sanitized.replace(/\n{4,}/g, '\n\n\n');
  
  return sanitized;
}

/**
 * Calculate response quality score
 * Returns a score between 0 and 1 based on various factors
 */
export function calculateResponseQuality(response: AIProviderResponse): number {
  let score = 0;
  
  // Content length (0-0.3 points)
  const contentLength = response.content.length;
  if (contentLength > 100) score += 0.1;
  if (contentLength > 500) score += 0.1;
  if (contentLength > 1000) score += 0.1;
  
  // Response time (0-0.2 points)
  if (response.responseTime < 5000) score += 0.2;
  else if (response.responseTime < 10000) score += 0.1;
  
  // Token efficiency (0-0.2 points)
  if (response.tokensUsed) {
    const efficiency = contentLength / response.tokensUsed;
    if (efficiency > 3) score += 0.2;
    else if (efficiency > 2) score += 0.1;
  } else {
    score += 0.1; // Default if no token info
  }
  
  // Content quality indicators (0-0.3 points)
  const hasStructure = /\n\n/.test(response.content); // Has paragraphs
  const hasDetails = contentLength > 200;
  const notTooShort = contentLength > 50;
  
  if (hasStructure) score += 0.1;
  if (hasDetails) score += 0.1;
  if (notTooShort) score += 0.1;
  
  return Math.min(score, 1.0);
}

/**
 * Merge multiple AI responses
 * Combines responses from multiple providers into a single response
 */
export function mergeResponses(
  responses: AIProviderResponse[]
): AIProviderResponse {
  if (responses.length === 0) {
    throw new Error('No responses to merge');
  }
  
  if (responses.length === 1) {
    return responses[0];
  }
  
  // Calculate quality scores
  const scoredResponses = responses.map((response) => ({
    response,
    quality: calculateResponseQuality(response),
  }));
  
  // Sort by quality (highest first)
  scoredResponses.sort((a, b) => b.quality - a.quality);
  
  // Return the highest quality response
  return scoredResponses[0].response;
}

/**
 * Format error message for logging
 */
export function formatErrorMessage(error: any): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  // Check if error has retryable property
  if (typeof error.retryable === 'boolean') {
    return error.retryable;
  }
  
  // Check for common retryable error patterns
  const errorMessage = formatErrorMessage(error).toLowerCase();
  
  const retryablePatterns = [
    'timeout',
    'rate limit',
    'too many requests',
    'service unavailable',
    'internal server error',
    'bad gateway',
    'gateway timeout',
    'econnreset',
    'enotfound',
    'etimedout',
  ];
  
  return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
}
