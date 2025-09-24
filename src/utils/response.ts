/**
 * Response utilities for QuickMCP
 * Simple helpers to create MCP responses
 */

import type { Content, TextContent, ResourceLinkContent, ToolResponse } from '../types/index.js';

/**
 * Create a text response
 */
export const text = (content: string): TextContent => ({
  type: 'text',
  text: content
});

/**
 * Create a JSON response (serialized as text)
 */
export const json = (data: any): TextContent => ({
  type: 'text',
  text: JSON.stringify(data, null, 2)
});

/**
 * Create an error response
 */
export const error = (message: string): TextContent => ({
  type: 'text',
  text: `Error: ${message}`
});

/**
 * Create a resource link response
 */
export const link = (uri: string, name?: string, mimeType?: string, description?: string): ResourceLinkContent => {
  const result: ResourceLinkContent = {
    type: 'resource_link',
    uri
  };
  
  if (name !== undefined) result.name = name;
  if (mimeType !== undefined) result.mimeType = mimeType;
  if (description !== undefined) result.description = description;
  
  return result;
};

/**
 * Create a tool response with content
 */
export const response = (content: Content[]): ToolResponse => ({
  content
});

/**
 * Helper to normalize any return value to proper ToolResponse format
 */
export const normalizeResponse = (value: any): ToolResponse => {
  // If already a proper response, return as-is
  if (value && typeof value === 'object' && Array.isArray(value.content)) {
    return value as ToolResponse;
  }

  // If it's a primitive, wrap in text content
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return response([text(String(value))]);
  }

  // If it's an object, serialize as JSON
  if (typeof value === 'object' && value !== null) {
    return response([json(value)]);
  }

  // Fallback
  return response([text('No response')]);
};

/**
 * Convenient exports
 */
export const Response = {
  text,
  json,
  error,
  link,
  response,
  normalize: normalizeResponse
};