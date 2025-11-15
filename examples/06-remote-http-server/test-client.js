/**
 * Test Client for Remote HTTP MCP Server
 * 
 * This demonstrates how to connect to a remote MCP server via HTTP
 * using the official MCP SDK client.
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

console.log('🔌 Connecting to Remote HTTP MCP Server...\n');

// Create MCP client
const client = new Client({
  name: 'test-client',
  version: '1.0.0'
});

try {
  // Create HTTP transport pointing to the server
  const transport = new StreamableHTTPClientTransport(
    new URL('http://localhost:3000/mcp')
  );

  // Connect to the server
  await client.connect(transport);
  console.log('✅ Connected to server!\n');

  // Test 1: List available tools
  console.log('📋 Listing available tools...');
  const tools = await client.listTools();
  console.log(`Found ${tools.tools.length} tools:`);
  tools.tools.forEach(tool => {
    console.log(`  - ${tool.name}: ${tool.description}`);
  });
  console.log();

  // Test 2: Call echo tool
  console.log('🔊 Testing echo tool...');
  const echoResult = await client.callTool({
    name: 'echo',
    arguments: {
      message: 'Hello from client!',
      repeat: 3
    }
  });
  console.log('Echo result:', JSON.stringify(echoResult, null, 2));
  console.log();

  // Test 3: Call calculate tool
  console.log('🧮 Testing calculate tool...');
  const calcResult = await client.callTool({
    name: 'calculate',
    arguments: {
      operation: 'multiply',
      a: 7,
      b: 6
    }
  });
  console.log('Calculate result:', JSON.stringify(calcResult, null, 2));
  console.log();

  // Test 4: Get server info
  console.log('ℹ️  Getting server info...');
  const infoResult = await client.callTool({
    name: 'get_server_info',
    arguments: {}
  });
  console.log('Server info:', JSON.stringify(infoResult, null, 2));
  console.log();

  // Test 5: List available resources
  console.log('📦 Listing available resources...');
  const resources = await client.listResources();
  console.log(`Found ${resources.resources.length} resources:`);
  resources.resources.forEach(resource => {
    console.log(`  - ${resource.uri}: ${resource.description}`);
  });
  console.log();

  // Test 6: Read server status resource
  console.log('📊 Reading server status...');
  const statusResource = await client.readResource({
    uri: 'status://server'
  });
  console.log('Server status:');
  console.log(statusResource.contents[0].text);
  console.log();

  // Test 7: List prompts
  console.log('💬 Listing available prompts...');
  const prompts = await client.listPrompts();
  console.log(`Found ${prompts.prompts.length} prompts:`);
  prompts.prompts.forEach(prompt => {
    console.log(`  - ${prompt.name}: ${prompt.description}`);
  });
  console.log();

  // Test 8: Get a prompt
  console.log('✨ Testing generate_greeting prompt...');
  const greetingPrompt = await client.getPrompt({
    name: 'generate_greeting',
    arguments: {
      name: 'Alice',
      style: 'friendly'
    }
  });
  console.log('Greeting prompt:', JSON.stringify(greetingPrompt, null, 2));
  console.log();

  console.log('✅ All tests passed!\n');
  console.log('🎉 Remote HTTP MCP Server is working correctly!');

  // Close the connection
  await client.close();
  console.log('\n👋 Connection closed.');

} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('\nMake sure the server is running:');
  console.error('  node examples/06-remote-http-server/index.ts');
  process.exit(1);
}
