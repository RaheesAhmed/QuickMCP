/**
 * Core types for QuickMCP - Simplified MCP SDK
 */

export interface HttpServerConfig {
  port?: number;
  enableCors?: boolean;
  corsOrigin?: string | string[];
  sessionManagement?: boolean;
  enableDnsRebindingProtection?: boolean;
  allowedHosts?: string[];
}

export interface ServerConfig {
  name: string;
  version?: string;
  transport?: 'stdio' | 'sse';
  autoStart?: boolean;
  debug?: boolean;
  http?: HttpServerConfig;
}

export interface ToolConfig {
  description: string;
  schema?: SimpleSchema;
  title?: string;
}

export interface ResourceConfig {
  uri: string;
  description: string;
  mimeType?: string;
  title?: string;
  isTemplate?: boolean;
}

export interface PromptConfig {
  description: string;
  schema?: SimpleSchema;
  title?: string;
}

/**
 * Simplified schema definition - much easier than Zod!
 */
export type SimpleSchema = {
  [key: string]: 'string' | 'number' | 'boolean' | 'object' | 'array' | SchemaObject;
};

export interface SchemaObject {
  type: 'object';
  properties: SimpleSchema;
  required?: string[];
}

/**
 * Response content types
 */
export interface TextContent {
  type: 'text';
  text: string;
}

export interface ResourceLinkContent {
  type: 'resource_link';
  uri: string;
  name?: string;
  mimeType?: string;
  description?: string;
}

export type Content = TextContent | ResourceLinkContent;

export interface ToolResponse {
  content: Content[];
}

export interface ResourceResponse {
  contents: Array<{
    uri: string;
    text?: string;
    mimeType?: string;
  }>;
}

export interface PromptResponse {
  messages: Array<{
    role: 'user' | 'assistant';
    content: {
      type: 'text';
      text: string;
    };
  }>;
  description?: string;
  [key: string]: unknown;
}

/**
 * Handler function types
 */
export type ToolHandler = (args: Record<string, any>) => Promise<ToolResponse | any>;
export type ResourceHandler = (args: Record<string, any>) => Promise<ResourceResponse | any>;
export type PromptHandler = (args: Record<string, any>) => Promise<PromptResponse>;

/**
 * Registry types for storing registered handlers
 */
export interface ToolRegistration {
  name: string;
  config: ToolConfig;
  handler: ToolHandler;
}

export interface ResourceRegistration {
  name: string;
  config: ResourceConfig;
  handler: ResourceHandler;
}

export interface PromptRegistration {
  name: string;
  config: PromptConfig;
  handler: PromptHandler;
}
