/**
 * Enterprise Authentication Middleware for QuickMCP
 * Supports multiple authentication methods for enterprise use
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';

export interface AuthConfig {
  type: 'bearer' | 'api-key' | 'oauth2' | 'custom';
  secret?: string;
  apiKeys?: string[];
  verify?: (token: string) => Promise<boolean>;
  extractUser?: (token: string) => Promise<any>;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
  authType?: string;
}

/**
 * Authentication middleware factory
 */
export class AuthMiddleware {
  private config: AuthConfig;

  constructor(config: AuthConfig) {
    this.config = config;
  }

  /**
   * Express middleware function
   */
  middleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const token = this.extractToken(req);
      
      if (!token) {
        return this.unauthorized(res, 'No authentication token provided');
      }

      const isValid = await this.validateToken(token);
      if (!isValid) {
        return this.unauthorized(res, 'Invalid authentication token');
      }

      // Extract user information if configured
      if (this.config.extractUser) {
        req.user = await this.config.extractUser(token);
      }

      req.authType = this.config.type;
      next();
    } catch (error) {
      logger.error('Authentication error:', error);
      return this.unauthorized(res, 'Authentication failed');
    }
  };

  /**
   * Extract token from request
   */
  private extractToken(req: Request): string | null {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return req.headers['x-api-key'] as string || null;
    }

    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    if (authHeader.startsWith('ApiKey ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  /**
   * Validate token based on configuration
   */
  private async validateToken(token: string): Promise<boolean> {
    switch (this.config.type) {
      case 'bearer':
        return this.validateJWT(token);
      case 'api-key':
        return this.validateApiKey(token);
      case 'custom':
        return this.config.verify ? this.config.verify(token) : false;
      default:
        return false;
    }
  }

  /**
   * Validate JWT token
   */
  private validateJWT(token: string): boolean {
    try {
      if (!this.config.secret) {
        throw new Error('JWT secret not configured');
      }
      jwt.verify(token, this.config.secret);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate API key
   */
  private validateApiKey(token: string): boolean {
    if (!this.config.apiKeys || this.config.apiKeys.length === 0) {
      return false;
    }

    return this.config.apiKeys.some(key => bcrypt.compareSync(token, key));
  }

  /**
   * Send unauthorized response
   */
  private unauthorized(res: Response, message: string): void {
    res.status(401).json({
      jsonrpc: '2.0',
      error: {
        code: -32001,
        message: 'Unauthorized',
        data: { details: message }
      },
      id: null
    });
  }
}

/**
 * Rate limiting middleware
 */
export class RateLimitMiddleware {
  private limiter: any;

  constructor(options: { points: number; duration: number }) {
    const { RateLimiterMemory } = require('rate-limiter-flexible');
    this.limiter = new RateLimiterMemory({
      keyGenerator: (req: Request) => req.ip || 'anonymous',
      points: options.points,
      duration: options.duration,
    });
  }

  middleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.limiter.consume(req.ip || 'anonymous');
      next();
    } catch (rejRes: any) {
      const remainingPoints = rejRes?.remainingPoints || 0;
      const msBeforeNext = rejRes?.msBeforeNext || 1000;

      res.set('Retry-After', String(Math.round(msBeforeNext / 1000)) || '1');
      res.status(429).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Too Many Requests',
          data: {
            remainingPoints,
            msBeforeNext,
            retryAfter: Math.round(msBeforeNext / 1000)
          }
        },
        id: null
      });
    }
  };
}

/**
 * Metrics collection middleware
 */
export class MetricsMiddleware {
  private metrics = {
    totalRequests: 0,
    totalErrors: 0,
    responseTimes: [] as number[],
    toolCalls: new Map<string, number>(),
    lastReset: Date.now()
  };

  middleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    // Track tool calls
    if (req.body?.method === 'tools/call' && req.body?.params?.name) {
      const toolName = req.body.params.name;
      this.metrics.toolCalls.set(toolName, (this.metrics.toolCalls.get(toolName) || 0) + 1);
    }

    const metricsRef = this.metrics;
    const originalJson = res.json;
    res.json = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      // Track response time (keep last 1000 requests)
      if (metricsRef.responseTimes.length > 1000) {
        metricsRef.responseTimes.shift();
      }
      metricsRef.responseTimes.push(responseTime);

      // Track errors
      if (body?.error) {
        metricsRef.totalErrors++;
      }

      return originalJson.call(this, body);
    };

    next();
  };

  /**
   * Get metrics summary
   */
  getMetrics() {
    const now = Date.now();
    const uptime = now - this.metrics.lastReset;
    const avgResponseTime = this.metrics.responseTimes.length > 0
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length
      : 0;

    return {
      uptime,
      totalRequests: this.metrics.totalRequests,
      totalErrors: this.metrics.totalErrors,
      errorRate: this.metrics.totalRequests > 0 ? this.metrics.totalErrors / this.metrics.totalRequests : 0,
      avgResponseTime,
      requestsPerSecond: this.metrics.totalRequests / (uptime / 1000),
      toolCalls: Object.fromEntries(this.metrics.toolCalls)
    };
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      totalRequests: 0,
      totalErrors: 0,
      responseTimes: [],
      toolCalls: new Map(),
      lastReset: Date.now()
    };
  }
}
