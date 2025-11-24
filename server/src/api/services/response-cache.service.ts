/**
 * Response Cache Service
 * Provides caching functionality for AI provider responses with TTL support
 */

import crypto from 'crypto';
import {
  AIProviderRequest,
  AIProviderResponse,
} from '../interfaces/ai-provider.interface';

/**
 * Cache entry structure
 */
interface CacheEntry {
  response: AIProviderResponse;
  timestamp: number;
}

/**
 * Cache metrics for tracking performance
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  totalRequests: number;
}

/**
 * Response Cache Service
 * Implements in-memory caching with TTL support and automatic cleanup
 */
export class ResponseCache {
  private cache: Map<string, CacheEntry>;
  private ttl: number;
  private cleanupInterval: NodeJS.Timeout | null;
  private metrics: {
    hits: number;
    misses: number;
  };

  /**
   * Initialize the cache with TTL from environment or default to 1 hour
   */
  constructor() {
    this.cache = new Map<string, CacheEntry>();
    
    // Get TTL from environment variable or default to 1 hour (3600000ms)
    const envTtl = process.env.AI_RESPONSE_CACHE_TTL;
    this.ttl = envTtl ? parseInt(envTtl, 10) : 3600000;
    
    // Validate TTL
    if (isNaN(this.ttl) || this.ttl < 0) {
      console.warn('[ResponseCache] Invalid TTL value, using default 1 hour');
      this.ttl = 3600000;
    }

    this.cleanupInterval = null;
    this.metrics = {
      hits: 0,
      misses: 0,
    };

    // Start automatic cleanup
    this.startAutomaticCleanup();
  }

  /**
   * Get a cached response if available and not expired
   * @param request The AI provider request
   * @returns Cached response or null if not found or expired
   */
  public async get(
    request: AIProviderRequest
  ): Promise<AIProviderResponse | null> {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > this.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    // Return cached response with cached flag set to true
    this.metrics.hits++;
    return {
      ...entry.response,
      cached: true,
    };
  }

  /**
   * Store a response in the cache
   * @param request The AI provider request
   * @param response The AI provider response to cache
   */
  public async set(
    request: AIProviderRequest,
    response: AIProviderResponse
  ): Promise<void> {
    const key = this.generateKey(request);
    
    this.cache.set(key, {
      response: {
        ...response,
        cached: false, // Store original cached state
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Generate a unique cache key from request parameters
   * Uses SHA-256 hash of request content for consistency
   * @param request The AI provider request
   * @returns Cache key string
   */
  public generateKey(request: AIProviderRequest): string {
    // Create a normalized object with all relevant request parameters
    const keyData = {
      prompt: request.prompt,
      systemPrompt: request.systemPrompt || '',
      maxTokens: request.maxTokens || 0,
      temperature: request.temperature || 0,
      // Include metadata if it affects the response
      metadata: request.metadata || {},
    };

    // Convert to JSON string with sorted keys for consistency
    const jsonString = JSON.stringify(keyData, Object.keys(keyData).sort());

    // Generate SHA-256 hash
    return crypto.createHash('sha256').update(jsonString).digest('hex');
  }

  /**
   * Invalidate a specific cache entry
   * @param request The AI provider request to invalidate
   * @returns True if entry was found and deleted, false otherwise
   */
  public invalidate(request: AIProviderRequest): boolean {
    const key = this.generateKey(request);
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  public clear(): void {
    this.cache.clear();
    this.metrics.hits = 0;
    this.metrics.misses = 0;
  }

  /**
   * Get current cache metrics
   * @returns Cache metrics including hit rate
   */
  public getMetrics(): CacheMetrics {
    const totalRequests = this.metrics.hits + this.metrics.misses;
    const hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      hitRate: parseFloat(hitRate.toFixed(4)),
      size: this.cache.size,
      totalRequests,
    };
  }

  /**
   * Start automatic cleanup of expired entries
   * Runs every 5 minutes by default
   */
  private startAutomaticCleanup(): void {
    // Run cleanup every 5 minutes
    const cleanupIntervalMs = 5 * 60 * 1000;

    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, cleanupIntervalMs);

    // Ensure cleanup stops when process exits
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up expired cache entries
   * Removes entries older than TTL
   */
  private cleanupExpiredEntries(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      const age = now - entry.timestamp;
      if (age > this.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // Cleanup completed silently
  }

  /**
   * Stop automatic cleanup
   * Should be called when shutting down the service
   */
  public stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Log cache statistics
   * Useful for monitoring and debugging
   */
  public logStatistics(): void {
    const metrics = this.getMetrics();
    const timestamp = new Date().toISOString();

    console.log(`[${timestamp}] [ResponseCache] Statistics:`, {
      hits: metrics.hits,
      misses: metrics.misses,
      hitRate: `${(metrics.hitRate * 100).toFixed(2)}%`,
      size: metrics.size,
      totalRequests: metrics.totalRequests,
      ttl: `${this.ttl}ms`,
    });
  }
}
