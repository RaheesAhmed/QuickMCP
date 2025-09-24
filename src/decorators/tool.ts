/**
 * Decorators for QuickMCP - Modern decorator-based API
 */

import type { ToolConfig, ToolHandler, ResourceConfig, ResourceHandler, PromptConfig, PromptHandler, SimpleSchema } from '../types/index.js';
import { Response } from '../utils/response.js';

// Global registries for decorated functions
const toolRegistry = new Map<string, { config: ToolConfig; handler: ToolHandler }>();
const resourceRegistry = new Map<string, { config: ResourceConfig; handler: ResourceHandler }>();
const promptRegistry = new Map<string, { config: PromptConfig; handler: PromptHandler }>();

/**
 * Tool decorator - marks a method as an MCP tool
 */
export function tool(config: ToolConfig | string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const toolName = propertyKey;
    
    // Handle string shorthand
    const toolConfig: ToolConfig = typeof config === 'string' 
      ? { description: config }
      : config;
    
    // Wrap the original method to ensure proper return format
    const wrappedHandler: ToolHandler = async (args) => {
      const result = await originalMethod.apply(target, [args]);
      return Response.normalize(result);
    };
    
    // Register the tool
    toolRegistry.set(toolName, {
      config: {
        ...toolConfig,
        title: toolConfig.title || toolName
      },
      handler: wrappedHandler
    });
    
    return descriptor;
  };
}

/**
 * Resource decorator - marks a method as an MCP resource
 */
export function resource(config: ResourceConfig | string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const resourceName = propertyKey;
    
    // Handle string shorthand
    const resourceConfig: ResourceConfig = typeof config === 'string'
      ? { uri: `resource://${resourceName}`, description: config }
      : config;
    
    // Wrap the original method
    const wrappedHandler: ResourceHandler = async (args) => {
      return await originalMethod.apply(target, [args]);
    };
    
    // Register the resource
    resourceRegistry.set(resourceName, {
      config: {
        ...resourceConfig,
        title: resourceConfig.title || resourceName
      },
      handler: wrappedHandler
    });
    
    return descriptor;
  };
}

/**
 * Prompt decorator - marks a method as an MCP prompt
 */
export function prompt(config: PromptConfig | string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    const promptName = propertyKey;
    
    // Handle string shorthand
    const promptConfig: PromptConfig = typeof config === 'string'
      ? { description: config }
      : config;
    
    // Wrap the original method
    const wrappedHandler: PromptHandler = async (args) => {
      return await originalMethod.apply(target, [args]);
    };
    
    // Register the prompt
    promptRegistry.set(promptName, {
      config: {
        ...promptConfig,
        title: promptConfig.title || promptName
      },
      handler: wrappedHandler
    });
    
    return descriptor;
  };
}

/**
 * Schema helper for creating simple schemas
 */
export function schema(definition: SimpleSchema): SimpleSchema {
  return definition;
}

/**
 * Get all registered tools
 */
export function getRegisteredTools(): Map<string, { config: ToolConfig; handler: ToolHandler }> {
  return toolRegistry;
}

/**
 * Get all registered resources
 */
export function getRegisteredResources(): Map<string, { config: ResourceConfig; handler: ResourceHandler }> {
  return resourceRegistry;
}

/**
 * Get all registered prompts
 */
export function getRegisteredPrompts(): Map<string, { config: PromptConfig; handler: PromptHandler }> {
  return promptRegistry;
}

/**
 * Clear all registries (for testing)
 */
export function clearAllRegistries(): void {
  toolRegistry.clear();
  resourceRegistry.clear();
  promptRegistry.clear();
}

/**
 * Auto-register all decorated methods with a server
 */
export function autoRegister(server: any, instance: any): void {
  // Register tools
  for (const [name, registration] of toolRegistry) {
    server.tool(name, registration.handler, registration.config);
  }
  
  // Register resources
  for (const [name, registration] of resourceRegistry) {
    server.resource(name, registration.handler, registration.config);
  }
  
  // Register prompts
  for (const [name, registration] of promptRegistry) {
    server.prompt(name, registration.handler, registration.config);
  }
}