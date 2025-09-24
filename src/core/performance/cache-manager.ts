/**
 * High-Performance Cache Manager for QuickMCP
 * Optimizes schema validation and response handling
 */

import { LRUCache } from 'lru-cache';
import type { SimpleSchema } from '../../types/index.js';
import { z } from 'zod';

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

/**
 * Schema validation cache for performance optimization
 */
export class SchemaCache {
  private zodCache = new LRUCache<string, z.ZodType<any>>({
    max: 1000,
    ttl: 1000 * 60 * 60 // 1 hour
  });

  private stats = {
    hits: 0,
    misses: 0
  };

  /**
   * Get cached or create Zod schema
   */
  getZodSchema(key: string, factory: () => z.ZodType<any>): z.ZodType<any> {
    const cached = this.zodCache.get(key);
    if (cached) {
      this.stats.hits++;
      return cached;
    }

    this.stats.misses++;
    const schema = factory();
    this.zodCache.set(key, schema);
    return schema;
  }

  /**
   * Generate cache key for schema
   */
  static generateKey(schema: SimpleSchema): string {
    return JSON.stringify(schema, Object.keys(schema).sort());
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      size: this.zodCache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  /**
   * Clear cache
   */
  clear(): void {
    this.zodCache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }
}

/**
 * Response object pool for memory optimization
 */
export class ResponsePool {
  private textPool: any[] = [];
  private jsonPool: any[] = [];
  private readonly maxPoolSize = 100;

  /**
   * Get pooled text response object
   */
  getTextResponse(): any {
    return this.textPool.pop() || { type: 'text', text: '' };
  }

  /**
   * Return text response to pool
   */
  releaseTextResponse(obj: any): void {
    if (this.textPool.length < this.maxPoolSize) {
      obj.text = '';
      this.textPool.push(obj);
    }
  }

  /**
   * Get pooled JSON response object
   */
  getJsonResponse(): any {
    return this.jsonPool.pop() || { type: 'text', text: '' };
  }

  /**
   * Return JSON response to pool
   */
  releaseJsonResponse(obj: any): void {
    if (this.jsonPool.length < this.maxPoolSize) {
      obj.text = '';
      this.jsonPool.push(obj);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      textPool: this.textPool.length,
      jsonPool: this.jsonPool.length,
      maxSize: this.maxPoolSize
    };
  }
}

/**
 * Global cache instances
 */
export const schemaCache = new SchemaCache();
export const responsePool = new ResponsePool();
