# Remote HTTP MCP Server Example

This example demonstrates how to create a **remote MCP server** that can be accessed via HTTP, enabling cloud deployments, multiple concurrent clients, and browser-based integrations.

## Features

✨ **Modern Streamable HTTP Transport** - Uses the latest MCP protocol  
🔐 **Session Management** - Maintains state across requests  
🌐 **CORS Enabled** - Accessible from web browsers  
📡 **Remote Access** - Connect from anywhere  
🔄 **Multiple Clients** - Support concurrent connections  
⚡ **Real-time Notifications** - SSE for server-to-client events  

## What's Included

### Tools
- `get_server_info` - Get server information and features
- `echo` - Echo messages with optional repetition (great for testing)
- `calculate` - Perform arithmetic operations (add, subtract, multiply, divide)
- `get_timestamp` - Get current server time in various formats

### Resources
- `status://server` - Real-time server status and metrics
- `docs://api` - API documentation

### Prompts
- `generate_greeting` - Generate greetings in different styles (formal, casual, friendly)

## Quick Start

### 1. Start the Server

```bash
# Make sure you've built the project first
npm run build

# Start the HTTP server
node examples/06-remote-http-server/index.ts
```

The server will start on `http://localhost:3000/mcp`

### 2. Test with the Client

Open a new terminal and run:

```bash
node examples/06-remote-http-server/test-client.js
```

This will connect to the server and run a comprehensive test suite.

### 3. Test with MCP Inspector

You can also use the official MCP Inspector tool:

```bash
npx @modelcontextprotocol/inspector http://localhost:3000/mcp
```

The Inspector provides a web UI for testing all server capabilities.

## API Endpoints

### POST /mcp
Main endpoint for MCP protocol messages. Handles:
- `initialize` - Establish connection and get capabilities
- `tools/list` - List available tools
- `tools/call` - Execute a tool
- `resources/list` - List available resources
- `resources/read` - Read a resource
- `prompts/list` - List available prompts
- `prompts/get` - Get a prompt

### GET /mcp
Server-Sent Events (SSE) endpoint for real-time notifications from server to client.

### DELETE /mcp
Terminate the session and cleanup resources.

## Example Usage

### Using curl

```bash
# Initialize connection
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "initialize",
    "params": {
      "protocolVersion": "2024-11-05",
      "capabilities": {},
      "clientInfo": {
        "name": "curl-client",
        "version": "1.0.0"
      }
    },
    "id": 1
  }'

# List tools (save session ID from initialize response)
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 2
  }'

# Call echo tool
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "mcp-session-id: YOUR_SESSION_ID" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "echo",
      "arguments": {
        "message": "Hello, MCP!",
        "repeat": 3
      }
    },
    "id": 3
  }'
```

### Using JavaScript/TypeScript Client

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

const client = new Client({
  name: 'my-client',
  version: '1.0.0'
});

const transport = new StreamableHTTPClientTransport(
  new URL('http://localhost:3000/mcp')
);

await client.connect(transport);

// List tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: 'echo',
  arguments: { message: 'Hello!', repeat: 2 }
});

// Read a resource
const status = await client.readResource({ uri: 'status://server' });

await client.close();
```

## Configuration Options

You can customize the server in `index.ts`:

```typescript
const server = createServer({
  name: 'remote-http-server',
  transport: 'http',
  debug: true, // Enable debug logging
  http: {
    port: 3000, // Change port
    enableCors: true, // Enable/disable CORS
    corsOrigin: '*', // Specify allowed origins
    sessionManagement: true, // Enable session management
  }
});
```

## Production Deployment

For production use, consider:

1. **Authentication**: Add authentication middleware
2. **CORS**: Restrict `corsOrigin` to specific domains
3. **HTTPS**: Use a reverse proxy (nginx, Caddy) with SSL
4. **Rate Limiting**: Add rate limiting to prevent abuse
5. **Monitoring**: Add logging and monitoring
6. **Environment Variables**: Use env vars for configuration

Example with authentication:

```typescript
import { createServer } from 'quickmcp-sdk';
import jwt from 'jsonwebtoken';

const server = createServer({
  name: 'secure-server',
  transport: 'http',
  http: {
    port: 3000,
    corsOrigin: ['https://myapp.com'],
    // Add middleware for authentication
  }
});

// Add your authentication logic before server.start()
```

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Try a different port in the config

### Client can't connect
- Ensure the server is running
- Check firewall settings
- Verify the URL is correct

### CORS errors in browser
- Make sure `enableCors` is `true`
- Check `corsOrigin` allows your domain

### Session errors
- Ensure `sessionManagement` is enabled
- Check that session ID is being passed correctly

## Learn More

- [MCP Documentation](https://modelcontextprotocol.io)
- [MCP Specification](https://spec.modelcontextprotocol.io)
- [QuickMCP SDK](https://github.com/RaheesAhmed/QuickMCP)

## License

MIT
