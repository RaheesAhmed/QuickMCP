/**
 * Remote HTTP MCP Server Example
 * Demonstrates: HTTP transport, remote access, session management
 * 
 * This server can be accessed remotely via HTTP, making it perfect for:
 * - Cloud deployments
 * - Multiple client connections
 * - Web-based MCP clients
 * - Browser integrations
 */

import { createServer, Responses, Resources, Schema } from '../../dist/src/index.js';

// Create HTTP server with session management
const server = createServer({
  name: 'remote-http-server',
  transport: 'http',
  debug: true,
  http: {
    port: 3000,
    enableCors: true,
    corsOrigin: '*', // In production, specify allowed origins
    sessionManagement: true, // Enable session-based connections
  }
});

// Tool: Get server info
server.tool('get_server_info', async () => {
  return Responses.success({
    name: 'Remote HTTP MCP Server',
    version: '1.0.0',
    transport: 'HTTP (Streamable)',
    features: [
      'Session Management',
      'CORS Enabled',
      'Remote Access',
      'Multiple Clients'
    ]
  }, 'Server information retrieved');
}, {
  description: 'Get information about this MCP server'
});

// Tool: Echo service (useful for testing)
server.tool('echo', async (args) => {
  const { message, repeat = 1 } = args as { message: string; repeat?: number };
  
  const echoed = Array(repeat).fill(message).join(' ');
  
  return Responses.success({
    original: message,
    repeated: repeat,
    result: echoed
  }, `Echoed: ${echoed}`);
}, {
  description: 'Echo a message, optionally repeating it',
  schema: Schema.build({
    message: 'string',
    repeat: 'number'
  })
});

// Tool: Calculate (demonstrating computation)
server.tool('calculate', async (args) => {
  const { operation, a, b } = args as { 
    operation: 'add' | 'subtract' | 'multiply' | 'divide';
    a: number;
    b: number;
  };
  
  let result: number;
  let operator: string;
  
  switch (operation) {
    case 'add':
      result = a + b;
      operator = '+';
      break;
    case 'subtract':
      result = a - b;
      operator = '-';
      break;
    case 'multiply':
      result = a * b;
      operator = '*';
      break;
    case 'divide':
      if (b === 0) {
        return Responses.error('Cannot divide by zero');
      }
      result = a / b;
      operator = '/';
      break;
    default:
      return Responses.error(`Unknown operation: ${operation}`);
  }
  
  return Responses.success({
    operation,
    a,
    b,
    result,
    expression: `${a} ${operator} ${b} = ${result}`
  });
}, {
  description: 'Perform basic arithmetic operations',
  schema: Schema.build({
    operation: 'string',
    a: 'number',
    b: 'number'
  })
});

// Tool: Get current timestamp
server.tool('get_timestamp', async (args) => {
  const { format = 'iso' } = args as { format?: 'iso' | 'unix' | 'locale' };
  
  const now = new Date();
  let timestamp: string | number;
  
  switch (format) {
    case 'iso':
      timestamp = now.toISOString();
      break;
    case 'unix':
      timestamp = Math.floor(now.getTime() / 1000);
      break;
    case 'locale':
      timestamp = now.toLocaleString();
      break;
    default:
      timestamp = now.toISOString();
  }
  
  return Responses.success({
    timestamp,
    format,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  });
}, {
  description: 'Get current server timestamp in various formats',
  schema: Schema.build({
    format: 'string'
  })
});

// Resource: Server status
server.resource('server_status', async ({ uri }) => {
  const stats = server.getStats();
  const uptime = process.uptime();
  const memory = process.memoryUsage();
  
  const statusText = `
Server Status Report
===================

Name: ${stats.name}
Version: ${stats.version}
Transport: ${stats.transport}
Running: ${stats.isStarted ? 'Yes' : 'No'}

Capabilities:
- Tools: ${stats.tools}
- Resources: ${stats.resources}
- Prompts: ${stats.prompts}

Active Sessions: ${stats.httpSessions}

Performance:
- Uptime: ${Math.floor(uptime)} seconds
- Memory (RSS): ${(memory.rss / 1024 / 1024).toFixed(2)} MB
- Memory (Heap): ${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB
`;
  
  return Resources.text(uri, statusText, 'text/plain');
}, {
  uri: 'status://server',
  description: 'Get detailed server status and metrics'
});

// Resource: API documentation
server.resource('api_docs', async ({ uri }) => {
  const docs = `
Remote HTTP MCP Server API
==========================

Base URL: http://localhost:3000/mcp

Authentication: None (add auth in production!)

Available Tools:
1. get_server_info - Get server information
2. echo - Echo messages with optional repetition
3. calculate - Perform arithmetic operations
4. get_timestamp - Get current server timestamp

Available Resources:
1. status://server - Server status and metrics
2. docs://api - This documentation

Connection:
- Use MCP client libraries to connect
- Support for session management via Streamable HTTP
- CORS enabled for browser clients

Example Usage:
POST /mcp
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {
      "message": "Hello, MCP!",
      "repeat": 3
    }
  },
  "id": 1
}
`;
  
  return Resources.text(uri, docs, 'text/plain');
}, {
  uri: 'docs://api',
  description: 'API documentation for this MCP server'
});

// Prompt: Generate greeting
server.prompt('generate_greeting', async (args) => {
  const { name = 'User', style = 'formal' } = args as { 
    name?: string; 
    style?: 'formal' | 'casual' | 'friendly';
  };
  
  let greeting: string;
  
  switch (style) {
    case 'formal':
      greeting = `Good day, ${name}. It is a pleasure to assist you.`;
      break;
    case 'casual':
      greeting = `Hey ${name}, what's up?`;
      break;
    case 'friendly':
      greeting = `Hello ${name}! Great to see you! 😊`;
      break;
    default:
      greeting = `Hello, ${name}!`;
  }
  
  return {
    messages: [{
      role: 'assistant',
      content: {
        type: 'text',
        text: greeting
      }
    }]
  };
}, {
  description: 'Generate a greeting message in different styles',
  schema: Schema.build({
    name: 'string',
    style: 'string'
  })
});

// Start the HTTP server
console.log('🌐 Starting Remote HTTP MCP Server...');
console.log('📡 Server will be accessible at: http://localhost:3000/mcp');
console.log('📚 API docs available at: status://server resource');
console.log('\n🔗 Connection endpoints:');
console.log('   POST   /mcp - Main endpoint for MCP messages');
console.log('   GET    /mcp - Server-Sent Events for notifications');
console.log('   DELETE /mcp - Terminate session');
console.log('\n⚡ Features enabled:');
console.log('   ✓ Session Management');
console.log('   ✓ CORS (all origins)');
console.log('   ✓ Multiple concurrent clients');
console.log('\n🚀 Server starting...\n');

await server.start();

console.log('✅ Server is running and accepting connections!');
console.log('\n💡 Tips:');
console.log('   - Use MCP Inspector to test: npx @modelcontextprotocol/inspector http://localhost:3000/mcp');
console.log('   - Check server status with the status://server resource');
console.log('   - Press Ctrl+C to stop the server');
