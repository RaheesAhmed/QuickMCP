/**
 * Core QuickMCP Server - Simplified MCP server implementation
 */

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import express, { Request, Response as ExpressResponse } from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";

import type { 
  ServerConfig, 
  ToolRegistration, 
  ResourceRegistration, 
  PromptRegistration,
  ToolHandler,
  ResourceHandler,
  PromptHandler,
  SimpleSchema,
  HttpServerConfig
} from '../types/index.js';
import { logger } from '../utils/logger.js';
import { Response } from '../utils/response.js';

/**
 * Registry for storing all registered handlers
 */
class HandlerRegistry {
  private tools = new Map<string, ToolRegistration>();
  private resources = new Map<string, ResourceRegistration>();
  private prompts = new Map<string, PromptRegistration>();

  registerTool(name: string, registration: ToolRegistration): void {
    this.tools.set(name, registration);
    logger.debug(`Registered tool: ${name}`);
  }

  registerResource(name: string, registration: ResourceRegistration): void {
    this.resources.set(name, registration);
    logger.debug(`Registered resource: ${name}`);
  }

  registerPrompt(name: string, registration: PromptRegistration): void {
    this.prompts.set(name, registration);
    logger.debug(`Registered prompt: ${name}`);
  }

  getTools(): ToolRegistration[] {
    return Array.from(this.tools.values());
  }

  getResources(): ResourceRegistration[] {
    return Array.from(this.resources.values());
  }

  getPrompts(): PromptRegistration[] {
    return Array.from(this.prompts.values());
  }

  getTool(name: string): ToolRegistration | undefined {
    return this.tools.get(name);
  }

  getResource(name: string): ResourceRegistration | undefined {
    return this.resources.get(name);
  }

  getPrompt(name: string): PromptRegistration | undefined {
    return this.prompts.get(name);
  }
}

/**
 * Schema converter - converts SimpleSchema to Zod RawShape
 */
class SchemaConverter {
  static toZodShape(schema: SimpleSchema): Record<string, z.ZodType<any>> {
    const zodProps: Record<string, z.ZodType<any>> = {};
    
    for (const [key, value] of Object.entries(schema)) {
      if (typeof value === 'string') {
        switch (value) {
          case 'string':
            zodProps[key] = z.string();
            break;
          case 'number':
            zodProps[key] = z.number();
            break;
          case 'boolean':
            zodProps[key] = z.boolean();
            break;
          case 'array':
            zodProps[key] = z.array(z.any());
            break;
          case 'object':
            zodProps[key] = z.record(z.any());
            break;
          default:
            zodProps[key] = z.any();
        }
      } else if (value && typeof value === 'object' && value.type === 'object') {
        zodProps[key] = z.object(this.toZodShape(value.properties));
      } else {
        zodProps[key] = z.any();
      }
    }
    
    return zodProps;
  }
}

/**
 * Main QuickMCP Server class
 */
export class QuickMCPServer {
  private config: ServerConfig;
  private registry = new HandlerRegistry();
  private mcpServer: McpServer;
  private isStarted = false;
  private httpApp?: express.Application;
  private httpTransports = new Map<string, StreamableHTTPServerTransport>();

  constructor(config: ServerConfig) {
    this.config = {
      version: '1.0.0',
      transport: 'stdio',
      autoStart: false,
      debug: false,
      ...config
    };

    // Configure logger
    logger.configure({
      level: this.config.debug ? 'debug' : 'info',
      enabled: true,
      useStderr: this.config.transport === 'stdio' // Only use stderr for stdio transport
    });

    // Create MCP server instance
    this.mcpServer = new McpServer({
      name: this.config.name,
      version: this.config.version!
    });

    logger.info(`QuickMCP Server created: ${this.config.name}`);
  }

  /**
   * Register a tool with automatic schema conversion
   */
  tool(name: string, handler: ToolHandler, config?: Partial<ToolRegistration['config']>): this {
    const toolConfig = {
      description: config?.description || `Tool: ${name}`,
      title: config?.title || name,
      ...(config?.schema && { schema: config.schema })
    };

    const registration: ToolRegistration = {
      name,
      config: toolConfig as ToolRegistration['config'],
      handler: this.wrapToolHandler(handler, name)
    };

    this.registry.registerTool(name, registration);
    this.registerToolWithMCP(registration);
    return this;
  }

  /**
   * Wrap tool handler with error handling and response normalization
   */
  private wrapToolHandler(handler: ToolHandler, name: string): ToolHandler {
    return async (args: any) => {
      try {
        const result = await handler(args);
        return Response.normalize(result);
      } catch (error) {
        logger.error(`Tool execution failed: ${name}`, error);
        return Response.response([Response.error(`Tool execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)]);
      }
    };
  }

  /**
   * Register a resource (static or template)
   */
  resource(name: string, handler: ResourceHandler, config?: Partial<ResourceRegistration['config']>): this {
    const resourceConfig = {
      uri: config?.uri || `resource://${name}`,
      description: config?.description || `Resource: ${name}`,
      mimeType: config?.mimeType || 'text/plain',
      title: config?.title || name,
      isTemplate: config?.isTemplate || false
    };

    const registration: ResourceRegistration = {
      name,
      config: resourceConfig,
      handler: this.wrapResourceHandler(handler, name)
    };

    this.registry.registerResource(name, registration);
    this.registerResourceWithMCP(registration);
    return this;
  }

  /**
   * Wrap resource handler with error handling
   */
  private wrapResourceHandler(handler: ResourceHandler, name: string): ResourceHandler {
    return async (args: any) => {
      try {
        return await handler(args);
      } catch (error) {
        logger.error(`Resource read failed: ${name}`, error);
        throw new Error(`Resource read failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
  }

  /**
   * Register a prompt
   */
  prompt(name: string, handler: PromptHandler, config?: Partial<PromptRegistration['config']>): this {
    const promptConfig = {
      description: config?.description || `Prompt: ${name}`,
      title: config?.title || name,
      ...(config?.schema && { schema: config.schema })
    };

    const registration: PromptRegistration = {
      name,
      config: promptConfig as PromptRegistration['config'],
      handler: this.wrapPromptHandler(handler, name)
    };

    this.registry.registerPrompt(name, registration);
    this.registerPromptWithMCP(registration);
    return this;
  }

  /**
   * Wrap prompt handler with error handling
   */
  private wrapPromptHandler(handler: PromptHandler, name: string): PromptHandler {
    return async (args: any) => {
      try {
        return await handler(args);
      } catch (error) {
        logger.error(`Prompt execution failed: ${name}`, error);
        throw new Error(`Prompt execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
  }

  /**
   * Register individual tool with MCP server
   */
  private registerToolWithMCP(tool: ToolRegistration): void {
    const inputSchema = tool.config.schema ? SchemaConverter.toZodShape(tool.config.schema) : {};
    
    const toolConfig = {
      description: tool.config.description,
      inputSchema,
      ...(tool.config.title && { title: tool.config.title })
    };
    
    this.mcpServer.registerTool(tool.name, toolConfig, tool.handler);
  }

  /**
   * Register individual resource with MCP server
   */
  private registerResourceWithMCP(resource: ResourceRegistration): void {
    const resourceConfig = {
      description: resource.config.description,
      mimeType: resource.config.mimeType,
      ...(resource.config.title && { title: resource.config.title })
    };
    
    if (resource.config.isTemplate) {
      // Handle resource templates
      const template = new ResourceTemplate(resource.config.uri, { list: undefined });
      this.mcpServer.registerResource(
        resource.name,
        template,
        resourceConfig,
        async (uri: any, params: any) => {
          const result = await resource.handler({ uri: uri.href, params });
          return result;
        }
      );
    } else {
      // Handle static resources
      this.mcpServer.registerResource(
        resource.name,
        resource.config.uri,
        resourceConfig,
        async (uri: any) => {
          const result = await resource.handler({ uri: uri.href });
          return result;
        }
      );
    }
  }

  /**
   * Register individual prompt with MCP server
   */
  private registerPromptWithMCP(prompt: PromptRegistration): void {
    const argsSchema = prompt.config.schema ? SchemaConverter.toZodShape(prompt.config.schema) : {};
    
    const promptConfig = {
      description: prompt.config.description,
      argsSchema,
      ...(prompt.config.title && { title: prompt.config.title })
    };
    
    // Cast the handler to match the expected type
    this.mcpServer.registerPrompt(prompt.name, promptConfig, prompt.handler as any);
  }

  /**
   * Start the server
   */
  async start(): Promise<void> {
    if (this.isStarted) {
      logger.warn('Server is already started');
      return;
    }

    try {
      if (this.config.transport === 'stdio') {
        await this.startStdioServer();
      } else if (this.config.transport === 'http') {
        await this.startHttpServer();
      } else {
        throw new Error(`Unsupported transport: ${this.config.transport}`);
      }

      this.isStarted = true;
      logger.info(`QuickMCP Server "${this.config.name}" is running`);
    } catch (error) {
      logger.error('Failed to start server', error);
      throw error;
    }
  }

  /**
   * Start STDIO server
   */
  private async startStdioServer(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    logger.info('Server started with STDIO transport');
  }

  /**
   * Start HTTP server
   */
  private async startHttpServer(): Promise<void> {
    const httpConfig = this.config.http || {};
    const port = httpConfig.port || 3000;
    const enableCors = httpConfig.enableCors !== false;
    const sessionManagement = httpConfig.sessionManagement !== false;

    this.httpApp = express();
    this.httpApp.use(express.json());

    if (enableCors) {
      this.httpApp.use(cors({
        origin: httpConfig.corsOrigin || '*',
        exposedHeaders: ['Mcp-Session-Id'],
        allowedHeaders: ['Content-Type', 'mcp-session-id'],
      }));
    }

    if (sessionManagement) {
      await this.setupSessionManagement();
    } else {
      await this.setupStatelessHttp();
    }

    this.httpApp.listen(port, () => {
      logger.info(`HTTP server started on port ${port}`);
    });
  }

  /**
   * Setup session-based HTTP handling
   */
  private async setupSessionManagement(): Promise<void> {
    this.httpApp!.post('/mcp', async (req: Request, res: ExpressResponse) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.httpTransports.has(sessionId)) {
        transport = this.httpTransports.get(sessionId)!;
      } else if (!sessionId && this.isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId) => {
            this.httpTransports.set(sessionId, transport);
          }
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            this.httpTransports.delete(transport.sessionId);
          }
        };

        await this.mcpServer.connect(transport);
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    });

    // Handle SSE for notifications
    this.httpApp!.get('/mcp', async (req: Request, res: ExpressResponse) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !this.httpTransports.has(sessionId)) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }
      
      const transport = this.httpTransports.get(sessionId)!;
      await transport.handleRequest(req, res);
    });

    // Handle session termination
    this.httpApp!.delete('/mcp', async (req: Request, res: ExpressResponse) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !this.httpTransports.has(sessionId)) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }
      
      const transport = this.httpTransports.get(sessionId)!;
      await transport.handleRequest(req, res);
    });
  }

  /**
   * Setup stateless HTTP handling
   */
  private async setupStatelessHttp(): Promise<void> {
    this.httpApp!.post('/mcp', async (req: Request, res: ExpressResponse) => {
      try {
        const server = new McpServer({ name: this.config.name, version: this.config.version! });
        
        // Re-register all handlers with the new server instance
        this.registry.getTools().forEach(tool => {
          const inputSchema = tool.config.schema ? SchemaConverter.toZodShape(tool.config.schema) : {};
          const toolConfig = { 
            description: tool.config.description, 
            inputSchema,
            ...(tool.config.title && { title: tool.config.title })
          };
          server.registerTool(tool.name, toolConfig, tool.handler);
        });
        
        this.registry.getResources().forEach(resource => {
          const resourceConfig = { 
            description: resource.config.description, 
            mimeType: resource.config.mimeType,
            ...(resource.config.title && { title: resource.config.title })
          };
          if (resource.config.isTemplate) {
            const template = new ResourceTemplate(resource.config.uri, { list: undefined });
            server.registerResource(resource.name, template, resourceConfig, resource.handler);
          } else {
            server.registerResource(resource.name, resource.config.uri, resourceConfig, resource.handler);
          }
        });
        
        this.registry.getPrompts().forEach(prompt => {
          const argsSchema = prompt.config.schema ? SchemaConverter.toZodShape(prompt.config.schema) : {};
          const promptConfig = { 
            description: prompt.config.description, 
            argsSchema,
            ...(prompt.config.title && { title: prompt.config.title })
          };
          server.registerPrompt(prompt.name, promptConfig, prompt.handler as any);
        });

        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        
        res.on('close', () => {
          transport.close();
          server.close();
        });
        
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.error('Error handling MCP request:', error);
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: { code: -32603, message: 'Internal server error' },
            id: null,
          });
        }
      }
    });

    // Stateless mode doesn't support SSE or session termination
    this.httpApp!.get('/mcp', (req: Request, res: ExpressResponse) => {
      res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null
      });
    });

    this.httpApp!.delete('/mcp', (req: Request, res: ExpressResponse) => {
      res.status(405).json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null
      });
    });
  }

  /**
   * Check if request is an initialize request
   */
  private isInitializeRequest(body: any): boolean {
    return body && body.method === 'initialize';
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    try {
      // Close all HTTP transports
      for (const transport of this.httpTransports.values()) {
        transport.close();
      }
      this.httpTransports.clear();

      // Close MCP server
      this.mcpServer.close();

      this.isStarted = false;
      logger.info('Server stopped');
    } catch (error) {
      logger.error('Error stopping server', error);
      throw error;
    }
  }

  /**
   * Get server statistics
   */
  getStats() {
    return {
      name: this.config.name,
      version: this.config.version,
      transport: this.config.transport,
      isStarted: this.isStarted,
      tools: this.registry.getTools().length,
      resources: this.registry.getResources().length,
      prompts: this.registry.getPrompts().length,
      httpSessions: this.httpTransports.size
    };
  }
}

/**
 * Factory function to create a QuickMCP server
 */
export const createServer = (config: ServerConfig): QuickMCPServer => {
  return new QuickMCPServer(config);
};