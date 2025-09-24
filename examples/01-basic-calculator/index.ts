/**
 * Basic Calculator Example - Simple QuickMCP Server
 * Demonstrates: Basic tools, simple schema, response handling
 */

import { createServer, Responses, Schema } from '../../dist/src/index.js';

// Create server with minimal config
const server = createServer({ 
  name: 'basic-calculator',
  debug: true 
});

// Simple addition tool
server.tool('add', async (args: Record<string, any>) => {
  const { a, b } = args as { a: number; b: number };
  const result = a + b;
  return Responses.success({ result }, `${a} + ${b} = ${result}`);
}, {
  description: 'Add two numbers together',
  schema: Schema.build({ 
    a: 'number', 
    b: 'number' 
  })
});

// Multiplication tool
server.tool('multiply', async (args: Record<string, any>) => {
  const { a, b } = args as { a: number; b: number };
  return { result: a * b, operation: 'multiply' };
}, {
  description: 'Multiply two numbers',
  schema: { a: 'number', b: 'number' }
});

// Division with error handling
server.tool('divide', async (args: Record<string, any>) => {
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

// Start the server
console.log('🧮 Starting Basic Calculator MCP Server...');
await server.start();
