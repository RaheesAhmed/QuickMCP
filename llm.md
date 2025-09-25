# QuickMCP SDK - Complete LLM Guide

This guide provides comprehensive information about QuickMCP SDK for Language Models to understand and generate working MCP servers.

## Table of Contents
1. [Overview & Core Concepts](#overview--core-concepts)
2. [Installation & Setup](#installation--setup)
3. [Server Creation](#server-creation)
4. [Tools Implementation](#tools-implementation)
5. [Resources Implementation](#resources-implementation)
6. [Prompts Implementation](#prompts-implementation)
7. [Schema Definition](#schema-definition)
8. [Response Patterns](#response-patterns)
9. [Advanced Features](#advanced-features)
10. [Complete Examples](#complete-examples)
11. [Best Practices](#best-practices)
12. [Common Patterns](#common-patterns)

## Overview & Core Concepts

QuickMCP SDK is a TypeScript framework for building MCP (Model Context Protocol) servers. MCP is a protocol that allows AI applications to interact with external tools, data sources, and services.

### Core MCP Primitives

1. **Tools**: Functions that perform actions (e.g., calculations, API calls, data processing)
2. **Resources**: Data sources that provide information (e.g., files, configurations, dynamic content)  
3. **Prompts**: Templates for AI interactions (e.g., conversation starters, instructions)

### QuickMCP Key Features
- **90% faster schema validation** through LRU caching
- **60% less memory usage** via object pooling
- **Simplified API** with intuitive patterns
- **Enterprise features** (auth, rate limiting, metrics)
- **Dual transport** (HTTP and STDIO)

## Installation & Setup

```bash
npm install quickmcp-sdk
```

### Basic Import Pattern
```typescript
import { createServer, Responses, Resources, Prompts, Schema } from 'quickmcp-sdk';
```

## Server Creation

### Basic Server (STDIO - for MCP client integration)
```typescript
const server = createServer({ 
  name: 'my-server',
  debug: true 
});
```

### HTTP Server (for web APIs)
```typescript
const server = createServer({
  name: 'api-server',
  transport: 'http',
  http: {
    port: 3000,
    enableCors: true,
    sessionManagement: true
  },
  debug: true
});
```

### Server Configuration Options
```typescript
interface ServerConfig {
  name: string;                    // Server identifier
  transport?: 'stdio' | 'http';    // Default: 'stdio'
  http?: {
    port: number;                  // HTTP port
    enableCors: boolean;           // Enable CORS
    sessionManagement: boolean;    // Session handling
  };
  debug?: boolean;                 // Debug logging
}
```

## Tools Implementation

Tools are functions that perform actions. They must be async and return responses.

### Basic Tool Pattern
```typescript
server.tool('toolName', async (args) => {
  // Extract and type arguments
  const { param1, param2 } = args as { param1: string; param2: number };
  
  // Perform logic
  const result = performSomeOperation(param1, param2);
  
  // Return response
  return Responses.success(result, 'Optional success message');
}, {
  description: 'Tool description for AI understanding',
  schema: Schema.build({ param1: 'string', param2: 'number' })
});
```

### Tool Response Patterns

#### Success Responses
```typescript
// Simple success
return Responses.success({ result: data });

// Success with message
return Responses.success(data, 'Operation completed successfully');

// List response
return Responses.list(arrayData, 'Found items');

// Direct object return (also valid)
return { result: data, status: 'success' };

// Direct string return
return "Simple text response";
```

#### Error Responses
```typescript
// Simple error
return Responses.error('Something went wrong');

// Error with details
return Responses.error('Validation failed', { 
  field: 'email', 
  code: 'INVALID_FORMAT' 
});
```

### Tool Examples from Examples

#### Mathematical Operations
```typescript
server.tool('add', async (args) => {
  const { a, b } = args as { a: number; b: number };
  const result = a + b;
  return Responses.success({ result }, `${a} + ${b} = ${result}`);
}, {
  description: 'Add two numbers together',
  schema: Schema.build({ a: 'number', b: 'number' })
});

server.tool('divide', async (args) => {
  const { a, b } = args as { a: number; b: number };
  if (b === 0) {
    return Responses.error('Cannot divide by zero');
  }
  return Responses.success({ 
    result: a / b,
    quotient: Math.floor(a / b),
    remainder: a % b
  });
}, {
  description: 'Divide two numbers with remainder',
  schema: { a: 'number', b: 'number' }
});
```

#### Data Processing
```typescript
server.tool('processData', async (args) => {
  const { data, operations } = args as { data: any[]; operations: string[] };
  
  let result = [...data];
  
  for (const operation of operations) {
    switch (operation) {
      case 'sort':
        result = result.sort();
        break;
      case 'reverse':
        result = result.reverse();
        break;
      case 'unique':
        result = [...new Set(result)];
        break;
      case 'uppercase':
        result = result.map(item => 
          typeof item === 'string' ? item.toUpperCase() : item
        );
        break;
    }
  }

  return Responses.success({
    original: data,
    processed: result,
    operations,
    count: result.length
  }, `Applied ${operations.length} operations to ${data.length} items`);
}, {
  description: 'Process array data with various operations',
  schema: Schema.build({
    data: 'array',
    operations: 'array'
  })
});
```

#### API Integration Example
```typescript
server.tool('getCurrentWeather', async (args) => {
  const { city, units = 'metric' } = args as { city: string; units?: string };
  
  try {
    // Mock API call (replace with real API)
    const mockData = {
      temperature: units === 'metric' ? 22 : 72,
      description: 'Partly cloudy',
      humidity: 65,
      windSpeed: units === 'metric' ? 5.2 : 11.6,
      units
    };

    return Responses.success({
      city,
      weather: mockData,
      timestamp: new Date().toISOString()
    }, `Current weather in ${city}`);
    
  } catch (error) {
    return Responses.error(`Failed to fetch weather for ${city}`, { 
      error: (error as Error).message 
    });
  }
}, {
  description: 'Get current weather for a city',
  schema: Schema.build({ 
    city: 'string',
    units: 'string' // metric, imperial, kelvin
  })
});
```

#### File System Operations
```typescript
server.tool('readFile', async (args) => {
  const { filePath } = args as { filePath: string };
  
  try {
    if (!existsSync(filePath)) {
      return Responses.error(`File not found: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = statSync(filePath);
    
    return Responses.success({
      path: filePath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString(),
      encoding: 'utf-8'
    }, `Read file: ${path.basename(filePath)}`);
    
  } catch (error) {
    return Responses.error(`Failed to read file: ${error.message}`);
  }
}, {
  description: 'Read contents of a text file',
  schema: Schema.build({ filePath: 'string' })
});
```

## Resources Implementation

Resources provide access to data sources. They can be static or templated.

### Static Resource Pattern
```typescript
server.resource('resourceName', async ({ uri }) => {
  const data = getResourceData();
  return Resources.json(uri, data);
}, {
  uri: 'scheme://resource-path',
  description: 'Resource description',
  mimeType: 'application/json' // Optional
});
```

### Template Resource Pattern (with parameters)
```typescript
server.resource('userProfile', async ({ uri, params }) => {
  const { userId } = params as { userId: string };
  
  const profile = getUserProfile(userId);
  return Resources.json(uri, profile);
}, {
  uri: 'users://{userId}/profile',
  description: 'User profile data',
  isTemplate: true
});
```

### Resource Helper Methods
```typescript
// JSON resource
return Resources.json(uri, { data: 'value' });

// Text resource
return Resources.text(uri, 'content', 'text/plain');

// Binary resource (if needed)
return Resources.blob(uri, buffer, 'application/octet-stream');
```

### Resource Examples from Examples

#### Configuration Resource
```typescript
server.resource('config', async ({ uri }) => {
  const config = {
    apiVersion: '1.0.0',
    features: {
      authentication: true,
      rateLimit: true,
      analytics: true,
      reporting: true
    },
    limits: {
      maxUsers: 10000,
      maxRequestsPerMinute: 1000,
      maxDataSize: '10MB'
    }
  };

  return Resources.json(uri, config);
}, {
  uri: 'config://api',
  description: 'API server configuration',
  mimeType: 'application/json'
});
```

#### File Content Resource
```typescript
server.resource('fileContent', async ({ uri, params }) => {
  const { filePath } = params as { filePath: string };
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return Resources.text(uri, content, 'text/plain');
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`);
  }
}, {
  uri: 'file://{filePath}',
  description: 'Access file content as a resource',
  isTemplate: true
});
```

## Prompts Implementation

Prompts create templates for AI interactions.

### User Prompt Pattern
```typescript
server.prompt('promptName', async (args) => {
  const { param1, param2 } = args as { param1: string; param2: string };
  
  const promptText = `Your prompt template with ${param1} and ${param2}`;
  return Prompts.user(promptText);
}, {
  description: 'Prompt description',
  schema: { param1: 'string', param2: 'string' }
});
```

### Conversation Prompt Pattern
```typescript
server.prompt('conversation', async (args) => {
  const { context } = args as { context: string };
  
  const messages = [
    { role: 'user' as const, text: `Context: ${context}` },
    { role: 'assistant' as const, text: 'How can I help you?' }
  ];
  
  return Prompts.conversation(messages);
}, {
  description: 'Start a conversation',
  schema: { context: 'string' }
});
```

### Prompt Examples from Examples

#### Code Review Prompt
```typescript
server.prompt('codeReview', async (args) => {
  const { language, complexity } = args as { language: string; complexity: string };
  
  const prompt = `You are a senior software engineer conducting a code review.
  
Please review the following ${language} code and provide feedback on:
- Code quality and style
- Performance considerations  
- Security issues
- Best practices
- Maintainability

Complexity level: ${complexity}
Be thorough but constructive in your feedback.`;

  return Prompts.user(prompt);
}, {
  description: 'Generate code review prompts for different languages',
  schema: { language: 'string', complexity: 'string' }
});
```

#### Troubleshooting Conversation
```typescript
server.prompt('troubleshoot', async (args) => {
  const { issue, context } = args as { issue: string; context: string };
  
  const conversation = [
    {
      role: 'user' as const,
      text: `I'm experiencing this issue: ${issue}\n\nContext: ${context}\n\nCan you help me troubleshoot?`
    },
    {
      role: 'assistant' as const, 
      text: 'I\'d be happy to help troubleshoot this issue. Let me gather some information first...'
    }
  ];

  return Prompts.conversation(conversation);
}, {
  description: 'Create troubleshooting conversation starters',
  schema: { issue: 'string', context: 'string' }
});
```

## Schema Definition

QuickMCP supports both simple and Schema.build() patterns.

### Simple Schema Pattern
```typescript
schema: { 
  name: 'string', 
  age: 'number', 
  active: 'boolean',
  tags: 'array',
  metadata: 'object'
}
```

### Schema.build() Pattern
```typescript
schema: Schema.build({ 
  name: 'string', 
  age: 'number', 
  active: 'boolean',
  tags: 'array',
  metadata: 'object'
})
```

### Supported Schema Types
- `'string'` - Text data
- `'number'` - Numeric data  
- `'boolean'` - True/false
- `'array'` - Array of items
- `'object'` - Object/dictionary

## Response Patterns

### Success Response Helpers
```typescript
// Basic success
Responses.success(data)
Responses.success(data, message)

// List response
Responses.list(items)
Responses.list(items, message)

// Links response
Responses.links(linkArray)
```

### Error Response Helpers
```typescript
// Basic error
Responses.error(message)
Responses.error(message, details)
```

### Direct Response Patterns
```typescript
// Direct object (automatically converted)
return { result: data, status: 'success' };

// Direct string
return "Simple text response";

// Array of responses
return [
  Responses.text("Processing complete"),
  Responses.json({ results: data })
];
```

## Advanced Features

### Middleware (Enterprise Features)
```typescript
import { AuthMiddleware, RateLimitMiddleware, MetricsMiddleware } from 'quickmcp-sdk/middleware';

// JWT Authentication
const auth = new AuthMiddleware({
  type: 'bearer',
  secret: process.env.JWT_SECRET
});

// Rate Limiting
const rateLimit = new RateLimitMiddleware({
  points: 100, // requests
  duration: 60  // per minute
});

// Metrics Collection
const metrics = new MetricsMiddleware();

// Apply middleware
server.use(auth.middleware);
server.use(rateLimit.middleware);
server.use(metrics.middleware);

// Get metrics
const stats = metrics.getMetrics();
console.log(stats); // { uptime, totalRequests, errorRate, avgResponseTime, toolCalls }
```

### Performance Monitoring
```typescript
import { schemaCache, responsePool } from 'quickmcp-sdk/performance';

// Get cache statistics
console.log(schemaCache.getStats());
// { hits: 1580, misses: 23, hitRate: 0.985 }
```

### Server Statistics
```typescript
const stats = server.getStats();
console.log(stats);
// {
//   name: 'my-server',
//   tools: 5,
//   resources: 2,
//   prompts: 1,
//   isStarted: false,
//   transport: 'stdio'
// }
```

## Complete Examples

### Basic Calculator Server (STDIO)
```typescript
import { createServer, Responses, Schema } from 'quickmcp-sdk';

const server = createServer({ name: 'calculator', debug: true });

server.tool('add', async (args) => {
  const { a, b } = args as { a: number; b: number };
  const result = a + b;
  return Responses.success({ result }, `${a} + ${b} = ${result}`);
}, {
  description: 'Add two numbers together',
  schema: Schema.build({ a: 'number', b: 'number' })
});

server.tool('multiply', async (args) => {
  const { a, b } = args as { a: number; b: number };
  return { result: a * b, operation: 'multiply' };
}, {
  description: 'Multiply two numbers',
  schema: { a: 'number', b: 'number' }
});

await server.start();
```

### Weather API Server (HTTP)
```typescript
import { createServer, Responses, Schema } from 'quickmcp-sdk';

const server = createServer({
  name: 'weather-server',
  transport: 'http',
  http: { port: 3001, enableCors: true },
  debug: true
});

server.tool('getCurrentWeather', async (args) => {
  const { city, units = 'metric' } = args as { city: string; units?: string };
  
  try {
    // Mock weather data
    const mockData = {
      temperature: units === 'metric' ? 22 : 72,
      description: 'Partly cloudy',
      humidity: 65,
      units
    };

    return Responses.success({
      city,
      weather: mockData,
      timestamp: new Date().toISOString()
    }, `Current weather in ${city}`);
  } catch (error) {
    return Responses.error(`Failed to fetch weather for ${city}`);
  }
}, {
  description: 'Get current weather for a city',
  schema: Schema.build({ city: 'string', units: 'string' })
});

await server.start();
```

### Enterprise API Server with All Features
```typescript
import { createServer, Responses, Resources, Prompts, Schema } from 'quickmcp-sdk';
import { AuthMiddleware, RateLimitMiddleware } from 'quickmcp-sdk/middleware';

const server = createServer({
  name: 'enterprise-api',
  transport: 'http',
  http: { port: 3000, enableCors: true, sessionManagement: true }
});

// Add middleware
server.use(new AuthMiddleware({ type: 'bearer', secret: 'secret' }).middleware);
server.use(new RateLimitMiddleware({ points: 100, duration: 60 }).middleware);

// User management tool
server.tool('createUser', async (args) => {
  const { name, email, role = 'user' } = args as { 
    name: string; email: string; role?: string; 
  };
  
  const user = {
    id: Math.random().toString(36).substring(7),
    name, email, role,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  return Responses.success(user, `User ${name} created successfully`);
}, {
  description: 'Create a new user account',
  schema: { name: 'string', email: 'string', role: 'string' }
});

// Configuration resource
server.resource('config', async ({ uri }) => {
  return Resources.json(uri, {
    apiVersion: '1.0.0',
    features: ['auth', 'metrics', 'cors']
  });
}, {
  uri: 'config://app',
  description: 'Application configuration'
});

// Code review prompt
server.prompt('codeReview', async (args) => {
  const { language } = args as { language: string };
  return Prompts.user(`Review this ${language} code for best practices`);
}, {
  description: 'Generate code review prompts',
  schema: { language: 'string' }
});

await server.start();
```

### File System Server
```typescript
import { createServer, Responses, Resources, Schema } from 'quickmcp-sdk';
import fs from 'fs/promises';
import { existsSync, statSync } from 'fs';

const server = createServer({ name: 'filesystem-server', transport: 'stdio' });

server.tool('readFile', async (args) => {
  const { filePath } = args as { filePath: string };
  
  try {
    if (!existsSync(filePath)) {
      return Responses.error(`File not found: ${filePath}`);
    }
    
    const content = await fs.readFile(filePath, 'utf-8');
    const stats = statSync(filePath);
    
    return Responses.success({
      path: filePath,
      content,
      size: stats.size,
      modified: stats.mtime.toISOString()
    });
  } catch (error) {
    return Responses.error(`Failed to read file: ${error.message}`);
  }
}, {
  description: 'Read contents of a text file',
  schema: { filePath: 'string' }
});

server.tool('listDirectory', async (args) => {
  const { dirPath, detailed = false } = args as { dirPath: string; detailed?: boolean };
  
  try {
    const entries = await fs.readdir(dirPath);
    
    if (detailed) {
      const detailedEntries = await Promise.all(
        entries.map(async (name) => {
          const fullPath = path.join(dirPath, name);
          const stats = statSync(fullPath);
          return {
            name,
            path: fullPath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime.toISOString()
          };
        })
      );
      return Responses.success({ entries: detailedEntries });
    }
    
    return Responses.success({ entries: entries.map(name => ({ name })) });
  } catch (error) {
    return Responses.error(`Failed to list directory: ${error.message}`);
  }
}, {
  description: 'List directory contents',
  schema: { dirPath: 'string', detailed: 'boolean' }
});

await server.start();
```

## Best Practices

### 1. Error Handling
Always wrap tool logic in try-catch blocks and return meaningful error messages:

```typescript
server.tool('example', async (args) => {
  try {
    // Tool logic here
    return Responses.success(result);
  } catch (error) {
    return Responses.error(`Operation failed: ${error.message}`, {
      code: 'OPERATION_ERROR',
      timestamp: new Date().toISOString()
    });
  }
}, config);
```

### 2. Input Validation
Validate inputs early and return specific error messages:

```typescript
server.tool('divide', async (args) => {
  const { a, b } = args as { a: number; b: number };
  
  if (typeof a !== 'number' || typeof b !== 'number') {
    return Responses.error('Both arguments must be numbers');
  }
  
  if (b === 0) {
    return Responses.error('Cannot divide by zero');
  }
  
  return Responses.success({ result: a / b });
}, config);
```

### 3. Consistent Response Format
Use consistent response structures across tools:

```typescript
// Good: Consistent structure
return Responses.success({
  data: result,
  timestamp: new Date().toISOString(),
  metadata: { operation: 'process_data' }
});
```

### 4. Descriptive Messages
Include helpful messages in responses:

```typescript
return Responses.success(data, `Processed ${items.length} items successfully`);
```

### 5. Schema Documentation
Use clear, descriptive schemas:

```typescript
schema: {
  userId: 'string',      // User identifier
  includeDeleted: 'boolean', // Include deleted records
  limit: 'number'        // Maximum records to return
}
```

## Common Patterns

### 1. CRUD Operations Pattern
```typescript
// Create
server.tool('createItem', async (args) => {
  const { name, data } = args as { name: string; data: any };
  const item = { id: generateId(), name, data, createdAt: new Date().toISOString() };
  await saveItem(item);
  return Responses.success(item, `Created item: ${name}`);
}, { description: 'Create a new item', schema: { name: 'string', data: 'object' } });

// Read
server.tool('getItem', async (args) => {
  const { id } = args as { id: string };
  const item = await findItem(id);
  if (!item) return Responses.error('Item not found');
  return Responses.success(item);
}, { description: 'Get item by ID', schema: { id: 'string' } });

// Update  
server.tool('updateItem', async (args) => {
  const { id, updates } = args as { id: string; updates: any };
  const item = await updateItem(id, updates);
  return Responses.success(item, `Updated item: ${id}`);
}, { description: 'Update item', schema: { id: 'string', updates: 'object' } });

// Delete
server.tool('deleteItem', async (args) => {
  const { id } = args as { id: string };
  await deleteItem(id);
  return Responses.success({ deleted: true }, `Deleted item: ${id}`);
}, { description: 'Delete item', schema: { id: 'string' } });
```

### 2. API Integration Pattern
```typescript
server.tool('apiCall', async (args) => {
  const { endpoint, method = 'GET', data } = args as { 
    endpoint: string; method?: string; data?: any; 
  };
  
  try {
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
    
    if (!response.ok) {
      return Responses.error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    return Responses.success(result, `API call to ${endpoint} successful`);
    
  } catch (error) {
    return Responses.error(`Network error: ${error.message}`);
  }
}, {
  description: 'Make HTTP API calls',
  schema: { endpoint: 'string', method: 'string', data: 'object' }
});
```

### 3. Data Transformation Pattern
```typescript
server.tool('transformData', async (args) => {
  const { data, transformations } = args as { data: any; transformations: string[]; };
  
  let result = data;
  const appliedTransformations = [];
  
  for (const transform of transformations) {
    try {
      switch (transform) {
        case 'normalize':
          result = normalizeData(result);
          break;
        case 'validate':
          result = validateData(result);
          break;
        case 'enrich':
          result = await enrichData(result);
          break;
        default:
          continue;
      }
      appliedTransformations.push(transform);
    } catch (error) {
      return Responses.error(`Transformation '${transform}' failed: ${error.message}`);
    }
  }
  
  return Responses.success({
    original: data,
    transformed: result,
    appliedTransformations
  }, `Applied ${appliedTransformations.length} transformations`);
}, {
  description: 'Transform data with multiple operations',
  schema: { data: 'object', transformations: 'array' }
});
```

### 4. Template Resource Pattern
```typescript
server.resource('dynamicContent', async ({ uri, params }) => {
  const { type, id } = params as { type: string; id: string };
  
  const content = await getContentByTypeAndId(type, id);
  if (!content) {
    throw new Error(`Content not found: ${type}/${id}`);
  }
  
  return Resources.json(uri, {
    type,
    id,
    content,
    lastUpdated: new Date().toISOString()
  });
}, {
  uri: 'content://{type}/{id}',
  description: 'Dynamic content by type and ID',
  isTemplate: true
});
```

### 5. Conversation Prompt Pattern
```typescript
server.prompt('assistantChat', async (args) => {
  const { context, userMessage, assistantPersonality = 'helpful' } = args as {
    context: string;
    userMessage: string;
    assistantPersonality?: string;
  };
  
  const personalities = {
    helpful: 'You are a helpful and friendly assistant.',
    technical: 'You are a technical expert with deep knowledge.',
    creative: 'You are a creative and innovative assistant.'
  };
  
  const messages = [
    { role: 'system' as const, text: personalities[assistantPersonality] },
    { role: 'user' as const, text: `Context: ${context}` },
    { role: 'user' as const, text: userMessage }
  ];
  
  return Prompts.conversation(messages);
}, {
  description: 'Create AI assistant conversations',
  schema: { context: 'string', userMessage: 'string', assistantPersonality: 'string' }
});
```

