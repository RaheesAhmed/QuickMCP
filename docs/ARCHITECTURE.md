# QuickMCP - Simplified TypeScript SDK Architecture

## Vision
QuickMCP is a simplified TypeScript SDK for MCP development that eliminates complexity while maintaining full MCP functionality. It follows Google's coding patterns with optimized, concise code.

## Core Principles

### 1. Simplicity First
- Declarative syntax over imperative
- Sensible defaults for everything
- Zero-config for basic use cases
- Progressive complexity for advanced features

### 2. Developer Experience
- TypeScript-first with full type safety
- Decorator-based tool/resource/prompt definitions
- Auto-discovery and registration
- Built-in error handling and logging

### 3. Performance & Optimization
- Tree-shakeable architecture
- Minimal bundle size
- Efficient memory usage
- Lazy loading of components

## Simplified API Design

### Current SDK Complexity
```typescript
// Current MCP SDK - Too Complex!
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "example-server",
  version: "1.0.0",
  capabilities: {
    resources: {},
    tools: {},
  },
});

server.registerTool("calculate",
  {
    title: "Calculator",
    description: "Add two numbers",
    inputSchema: { a: z.number(), b: z.number() }
  },
  async ({ a, b }) => ({
    content: [{ type: "text", text: String(a + b) }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

### QuickMCP Simplified API
```typescript
// QuickMCP - Simple & Elegant!
import { createServer, tool, resource, prompt } from 'quickmcp';

const server = createServer({
  name: 'example-server',
  version: '1.0.0'
});

// Define tools with decorators
@tool({
  description: 'Add two numbers',
  schema: { a: 'number', b: 'number' }
})
async function calculate({ a, b }: { a: number; b: number }) {
  return a + b;
}

// Auto-start server
server.start(); // Automatically detects transport and starts
```

## Architecture Components

### 1. Core Server (`src/core/server.ts`)
```typescript
interface ServerConfig {
  name: string;
  version?: string;
  transport?: 'stdio' | 'http';
  port?: number;
  autoStart?: boolean;
}

class QuickMCPServer {
  static create(config: ServerConfig): QuickMCPServer;
  tool(handler: Function): this;
  resource(handler: Function): this;
  prompt(handler: Function): this;
  start(): Promise<void>;
  stop(): Promise<void>;
}
```

### 2. Decorators (`src/decorators/`)
```typescript
// Tool decorator
function tool(config: ToolConfig) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Auto-register with server
  };
}

// Resource decorator
function resource(config: ResourceConfig) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Auto-register with server
  };
}

// Prompt decorator  
function prompt(config: PromptConfig) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Auto-register with server
  };
}
```

### 3. Schema System (`src/schema/`)
```typescript
// Simplified schema definition
type SimpleSchema = {
  [key: string]: 'string' | 'number' | 'boolean' | 'object' | 'array' | SchemaObject;
};

interface SchemaObject {
  type: 'object';
  properties: SimpleSchema;
  required?: string[];
}
```

### 4. Transport Layer (`src/transport/`)
```typescript
// Auto-detecting transport
class TransportManager {
  static autoDetect(): Transport;
  static create(type: 'stdio' | 'http', config?: any): Transport;
}
```

### 5. Utils (`src/utils/`)
```typescript
// Response helpers
export const response = {
  text: (content: string) => ({ type: 'text', text: content }),
  json: (data: any) => ({ type: 'text', text: JSON.stringify(data) }),
  error: (message: string) => ({ type: 'text', text: `Error: ${message}` }),
  link: (uri: string, name?: string) => ({ type: 'resource_link', uri, name })
};
```

## Example Usage Patterns

### 1. Basic Server
```typescript
import { createServer, tool } from 'quickmcp';

const server = createServer({ name: 'math-server' });

@tool({ 
  description: 'Add numbers',
  schema: { a: 'number', b: 'number' }
})
function add({ a, b }) {
  return a + b;
}

server.start();
```

### 2. Advanced Server with Resources
```typescript
import { createServer, tool, resource } from 'quickmcp';

const server = createServer({ 
  name: 'file-server',
  transport: 'http',
  port: 3000
});

@resource({
  uri: 'file://{{path}}',
  description: 'Read file contents'
})
async function readFile({ path }) {
  return await fs.readFile(path, 'utf8');
}

@tool({
  description: 'List directory contents',
  schema: { dir: 'string' }
})
async function listDir({ dir }) {
  const files = await fs.readdir(dir);
  return files.map(f => response.link(`file://${path.join(dir, f)}`, f));
}

server.start();
```

### 3. Class-based Organization
```typescript
import { createServer, tool, resource, Server } from 'quickmcp';

@Server({ name: 'weather-server' })
class WeatherServer {
  
  @tool({
    description: 'Get weather forecast',
    schema: { city: 'string', days: 'number' }
  })
  async getForecast({ city, days }) {
    // Implementation
    return `Weather for ${city} for ${days} days`;
  }
  
  @resource({
    uri: 'weather://{{city}}/current',
    description: 'Current weather data'
  })
  async getCurrentWeather({ city }) {
    // Implementation
    return { city, temp: 22, conditions: 'sunny' };
  }
}

// Auto-starts server
new WeatherServer();
```

## Key Improvements Over Current SDK

1. **90% Less Boilerplate**: Decorators eliminate manual registration
2. **Auto-Transport Detection**: No manual transport setup needed
3. **Simplified Schema**: Plain object schema instead of Zod complexity
4. **Better TypeScript**: Full inference and type safety
5. **Built-in Helpers**: Response utilities and common patterns
6. **Class Support**: Object-oriented server organization
7. **Zero Config**: Works out of the box with sensible defaults
8. **Progressive Enhancement**: Add complexity only when needed

## Project Structure
```
quickmcp/
├── src/
│   ├── core/
│   │   ├── server.ts
│   │   └── transport.ts
│   ├── decorators/
│   │   ├── tool.ts
│   │   ├── resource.ts
│   │   ├── prompt.ts
│   │   └── server.ts
│   ├── schema/
│   │   ├── validator.ts
│   │   └── types.ts
│   ├── transport/
│   │   ├── stdio.ts
│   │   ├── http.ts
│   │   └── manager.ts
│   ├── utils/
│   │   ├── response.ts
│   │   ├── logger.ts
│   │   └── helpers.ts
│   └── index.ts
├── examples/
│   ├── basic-server.ts
│   ├── weather-server.ts
│   ├── file-server.ts
│   └── class-based-server.ts
├── tests/
└── docs/
```

## Implementation Phases

### Phase 1: Core Foundation
- Basic server creation
- Simple tool registration
- STDIO transport
- Basic schema validation

### Phase 2: Decorators & DX
- Tool/Resource/Prompt decorators
- Class-based servers
- Response helpers
- Auto-discovery

### Phase 3: Advanced Features
- HTTP transport
- Resource templates
- Prompt system
- Advanced validation

### Phase 4: Optimization & Polish
- Performance optimizations
- Better error messages
- Comprehensive documentation
- Real-world examples