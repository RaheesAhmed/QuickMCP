/**
 * Utility helpers for QuickMCP
 * Common patterns and shortcuts for MCP development
 */

import type { SimpleSchema, ToolResponse, ResourceResponse, PromptResponse } from '../types/index.js';
import { Response } from './response.js';

/**
 * Schema builders for common patterns
 */
export const Schema = {
  /**
   * String field
   */
  string(description?: string): 'string' {
    return 'string';
  },

  /**
   * Number field
   */
  number(description?: string): 'number' {
    return 'number';
  },

  /**
   * Boolean field
   */
  boolean(description?: string): 'boolean' {
    return 'boolean';
  },

  /**
   * Array field
   */
  array(description?: string): 'array' {
    return 'array';
  },

  /**
   * Object field with properties
   */
  object(properties: SimpleSchema, required?: string[]): { type: 'object'; properties: SimpleSchema; required?: string[] } {
    return {
      type: 'object',
      properties,
      ...(required && { required })
    };
  },

  /**
   * Quick schema builder
   */
  build(definition: SimpleSchema): SimpleSchema {
    return definition;
  }
};

/**
 * Common response builders
 */
export const Responses = {
  /**
   * Success response with data
   */
  success(data: any, message?: string): ToolResponse {
    const content = [Response.json(data)];
    if (message) {
      content.unshift(Response.text(message));
    }
    return Response.response(content);
  },

  /**
   * Error response
   */
  error(message: string, details?: any): ToolResponse {
    const content = [Response.error(message)];
    if (details) {
      content.push(Response.json(details));
    }
    return Response.response(content);
  },

  /**
   * List response
   */
  list(items: any[], message?: string): ToolResponse {
    const content = [];
    if (message) {
      content.push(Response.text(message));
    }
    content.push(Response.json({ items, count: items.length }));
    return Response.response(content);
  },

  /**
   * File/resource links response
   */
  links(links: Array<{ uri: string; name?: string; description?: string; mimeType?: string }>): ToolResponse {
    const content = links.map(link => Response.link(link.uri, link.name, link.mimeType, link.description));
    return Response.response(content);
  }
};

/**
 * Resource helpers
 */
export const Resources = {
  /**
   * Create a simple text resource
   */
  text(uri: string, content: string, mimeType = 'text/plain'): ResourceResponse {
    return {
      contents: [{
        uri,
        text: content,
        mimeType
      }]
    };
  },

  /**
   * Create a JSON resource
   */
  json(uri: string, data: any): ResourceResponse {
    return {
      contents: [{
        uri,
        text: JSON.stringify(data, null, 2),
        mimeType: 'application/json'
      }]
    };
  },

  /**
   * Create a file resource
   */
  file(uri: string, content: string, mimeType?: string): ResourceResponse {
    return {
      contents: [{
        uri,
        text: content,
        ...(mimeType && { mimeType })
      }]
    };
  }
};

/**
 * Prompt helpers
 */
export const Prompts = {
  /**
   * Create a simple user prompt
   */
  user(text: string): PromptResponse {
    return {
      messages: [{
        role: 'user',
        content: { type: 'text', text }
      }]
    };
  },

  /**
   * Create an assistant prompt
   */
  assistant(text: string): PromptResponse {
    return {
      messages: [{
        role: 'assistant',
        content: { type: 'text', text }
      }]
    };
  },

  /**
   * Create a conversation prompt
   */
  conversation(messages: Array<{ role: 'user' | 'assistant'; text: string }>): PromptResponse {
    return {
      messages: messages.map(msg => ({
        role: msg.role,
        content: { type: 'text', text: msg.text }
      }))
    };
  }
};

/**
 * Validation helpers
 */
export const Validate = {
  /**
   * Validate required fields
   */
  required(obj: any, fields: string[]): void {
    for (const field of fields) {
      if (!(field in obj) || obj[field] === undefined || obj[field] === null) {
        throw new Error(`Missing required field: ${field}`);
      }
    }
  },

  /**
   * Validate email format
   */
  email(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate URL format
   */
  url(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
};

/**
 * Async helpers
 */
export const Async = {
  /**
   * Retry a function with exponential backoff
   */
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    baseDelay = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i === maxRetries) break;
        
        const delay = baseDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  },

  /**
   * Timeout wrapper
   */
  async timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${ms}ms`)), ms);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }
};

/**
 * HTTP helpers for making external API calls
 */
export const Http = {
  /**
   * Simple GET request
   */
  async get(url: string, headers?: Record<string, string>): Promise<any> {
    const response = await fetch(url, headers ? { headers } : {});
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  },

  /**
   * Simple POST request
   */
  async post(url: string, data: any, headers?: Record<string, string>): Promise<any> {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }
};