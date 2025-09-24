/**
 * QuickMCP - Simplified TypeScript SDK for MCP development
 * Main entry point
 */

// Core exports
export { QuickMCPServer, createServer } from './core/server.js';
export { logger, createLogger } from './utils/logger.js';
export { Response } from './utils/response.js';

// Decorator exports
export { 
  tool, 
  resource, 
  prompt, 
  schema,
  getRegisteredTools, 
  getRegisteredResources,
  getRegisteredPrompts,
  clearAllRegistries,
  autoRegister
} from './decorators/tool.js';

// Utility exports
export { 
  Schema, 
  Responses, 
  Resources, 
  Prompts, 
  Validate, 
  Async, 
  Http 
} from './utils/helpers.js';

// Type exports
export type {
  ServerConfig,
  HttpServerConfig,
  ToolConfig,
  ResourceConfig,
  PromptConfig,
  SimpleSchema,
  Content,
  TextContent,
  ResourceLinkContent,
  ToolResponse,
  ResourceResponse,
  PromptResponse,
  ToolHandler,
  ResourceHandler,
  PromptHandler
} from './types/index.js';

export type { LogLevel, LoggerConfig } from './utils/logger.js';

/**
 * Quick server creation utility
 */
export async function quick(name: string) {
  const { createServer } = await import('./core/server.js');
  return createServer({ name });
}

/**
 * Create server with HTTP transport
 */
export function createHttpServer(name: string, port = 3000) {
  const { createServer } = require('./core/server.js');
  return createServer({ 
    name, 
    transport: 'http',
    http: { port }
  });
}

/**
 * Create server with STDIO transport (default)
 */
export function createStdioServer(name: string) {
  const { createServer } = require('./core/server.js');
  return createServer({ name, transport: 'stdio' });
}