# QuickMCP 🚀

**The easiest way to build MCP servers in TypeScript**

QuickMCP is a simplified TypeScript SDK for MCP (Model Context Protocol) development that removes complexity while providing powerful features. Build MCP servers in minutes, not hours.

## ✨ Features

- **🎯 Simple API**: Intuitive, fluent API that just works
- **🎨 Modern Decorators**: Use decorators for clean, declarative code
- **🌐 HTTP & STDIO**: Support for both HTTP and STDIO transports
- **📝 Smart Schemas**: Simple schema definition without complex validation libraries
- **🔧 Auto-registration**: Automatic tool/resource/prompt registration
- **🛡️ Error Handling**: Built-in error handling and response normalization
- **📊 Utilities**: Helpful utilities for common patterns
- **🔍 TypeScript**: Full TypeScript support with excellent IntelliSense

## 🚀 Quick Start

```bash
npm install quickmcp
```

### Basic Server (30 seconds)

```typescript
import { createServer, Responses, Schema } from 'quickmcp';

const server = createServer({ name: 'my-server' });

server.tool('greet', async ({ name }: { name: string }) => {
  return Responses.success({ greeting: `Hello, ${name}!` });
}, {
  description: 'Greet someone',
  schema: Schema.build({ name: 'string' })
});

await server.start();
```

### Using Decorators (Even Cleaner!)

```typescript
import { createServer, tool, autoRegister, Responses, schema } from 'quickmcp';

class MyService {
  @tool({
    description: 'Add two numbers',
    schema: schema({ a: 'number', b: 'number' })
  })
  async add({ a, b }: { a: number; b: number }) {
    return Responses.success({ result: a + b });
  }

  @tool('Greet someone by name')
  async greet({ name }: { name: string }) {
    return `Hello, ${name}!`;
  }
}

const server = createServer({ name: 'calculator' });
autoRegister(server, new MyService());
await server.start();
```

## 🌟 Why QuickMCP vs Official SDK?

| Feature | QuickMCP | Official SDK |
|---------|----------|--------------|
| **Setup** | `createServer({ name: 'app' })` | Complex server + transport setup |
| **Schemas** | `{ name: 'string', age: 'number' }` | `z.object({ name: z.string(), age: z.number() })` |
| **Decorators** | `@tool('description')` | Not supported |
| **HTTP Server** | Built-in with session management | Manual Express setup required |
| **Error Handling** | Automatic normalization | Manual error handling |
| **Response Helpers** | `Responses.success(data)` | Manual response construction |

## 📚 Core Concepts

### 1. Multiple Ways to Define Tools

```typescript
// Method 1: Fluent API
server.tool('add', async ({ a, b }) => a + b, {
  description: 'Add numbers',
  schema: { a: 'number', b: 'number' }
});

// Method 2: Decorators
class Calculator {
  @tool('Add two numbers')
  async add({ a, b }: { a: number; b: number }) {
    return a + b;
  }
}

// Method 3: With full config
@tool({
  description: 'Advanced calculator',
  title: 'Calculator Pro',
  schema: schema({ a: 'number', b: 'number' })
})
async advancedAdd({ a, b }) {
  return Responses.success({ result: a + b }, `${a} + ${b} = ${a + b}`);
}
```

### 2. Smart Response Handling

```typescript
// All of these work automatically:
return "Hello World";                    // → text response
return { result: 42 };                   // → JSON response  
return Responses.success(data);          // → structured success
return Responses.error("Failed");        // → error response
return [Response.text("Hi"), Response.json(data)]; // → multiple content
```

### 3. HTTP Server with Sessions

```typescript
const server = createServer({
  name: 'api-server',
  transport: 'http',
  http: {
    port: 3000,
    enableCors: true,
    sessionManagement: true  // Handles MCP sessions automatically
  }
});
```

### 4. Resource Templates

```typescript
server.resource('user_profile', async ({ uri, params }) => {
  const userId = params.userId;
  return Resources.json(uri, await getUserData(userId));
}, {
  uri: 'users://{userId}/profile',
  description: 'User profile data',
  isTemplate: true
});
```

### 5. Built-in Utilities

```typescript
import { Http, Async, Validate, Schema } from 'quickmcp';

// HTTP requests with retry
const data = await Async.retry(() => Http.get('https://api.example.com'), 3);

// Validation helpers
Validate.required(args, ['name', 'email']);
Validate.email(args.email);

// Schema builders
const userSchema = Schema.object({
  name: Schema.string(),
  age: Schema.number(),
  active: Schema.boolean()
});
```

## 📖 Complete Examples

### Weather Service with All Features

```typescript
import { 
  createServer, 
  tool, 
  resource, 
  prompt,
  autoRegister,
  Responses,
  Resources,
  Prompts,
  Schema,
  Http
} from 'quickmcp';

class WeatherService {
  @tool({
    description: 'Get current weather for a city',
    schema: Schema.build({ city: 'string' })
  })
  async getCurrentWeather({ city }: { city: string }) {
    const data = await Http.get(`https://api.weather.com/${city}`);
    return Responses.success(data, `Weather for ${city}`);
  }

  @resource({
    uri: 'weather://{city}',
    description: 'Weather data resource',
    isTemplate: true
  })
  async weatherResource({ uri, params }) {
    const weather = await this.getCurrentWeather({ city: params.city });
    return Resources.json(uri, weather);
  }

  @prompt({
    description: 'Generate weather report',
    schema: Schema.build({ city: 'string' })
  })
  async weatherPrompt({ city }) {
    return Prompts.user(`Give me a detailed weather report for ${city}`);
  }
}

// HTTP server with full features
const server = createServer({
  name: 'weather-api',
  transport: 'http',
  http: { port: 3000, enableCors: true }
});

autoRegister(server, new WeatherService());
await server.start();
```

### File System Server

```typescript
import fs from 'fs/promises';

class FileSystemService {
  @tool('Read a file from the filesystem')
  async readFile({ path }: { path: string }) {
    try {
      const content = await fs.readFile(path, 'utf-8');
      return Responses.success({ content, path });
    } catch (error) {
      return Responses.error(`Failed to read ${path}`, { error });
    }
  }

  @tool({
    description: 'List files in a directory',
    schema: Schema.build({ 
      path: 'string',
      includeHidden: 'boolean'
    })
  })
  async listFiles({ path, includeHidden = false }) {
    const files = await fs.readdir(path);
    const filtered = includeHidden ? files : files.filter(f => !f.startsWith('.'));
    return Responses.list(filtered, `Found ${filtered.length} files in ${path}`);
  }
}
```

## 🔧 API Reference

### Server Creation

```typescript
// STDIO server (default)
const server = createServer({ name: 'my-server' });

// HTTP server
const server = createServer({
  name: 'api-server',
  transport: 'http',
  http: {
    port: 3000,
    enableCors: true,
    sessionManagement: true
  }
});

// Quick helpers
const stdioServer = createStdioServer('my-server');
const httpServer = createHttpServer('api-server', 3000);
```

### Tools

```typescript
// Fluent API
server.tool(name, handler, config);

// Decorator
@tool(config)
async myTool(args) { ... }

// String shorthand
@tool('Tool description')
async myTool(args) { ... }
```

### Resources

```typescript
// Static resource
server.resource('config', handler, {
  uri: 'config://app',
  description: 'App configuration'
});

// Template resource
server.resource('user', handler, {
  uri: 'users://{userId}',
  isTemplate: true
});
```

### Prompts

```typescript
server.prompt('help', async ({ task }) => {
  return Prompts.user(`Help me with: ${task}`);
}, {
  schema: Schema.build({ task: 'string' })
});
```

### Response Helpers

```typescript
// Simple responses
return "Hello";                          // Text
return { data: "value" };                // JSON
return Responses.success(data, message); // Success
return Responses.error(message, details); // Error
return Responses.list(items, message);   // List

// Multiple content
return Response.response([
  Response.text("Status: OK"),
  Response.json({ timestamp: Date.now() }),
  Response.link("file:///logs/app.log", "Log File")
]);
```

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details.

## 📄 License

MIT License - see LICENSE file for details.

---

**QuickMCP**: Making MCP development simple and enjoyable! 🚀