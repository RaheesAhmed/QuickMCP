/**
 * Enterprise API Example - Production-Ready MCP Server
 * Demonstrates: Authentication, rate limiting, metrics, resources, prompts
 */

import { createServer, Responses, Resources, Prompts, Schema } from '../../dist/src/index.js';

// Create enterprise HTTP server
const server = createServer({
  name: 'enterprise-api-server',
  transport: 'http',
  http: {
    port: 3002,
    enableCors: true,
    sessionManagement: true
  },
  debug: true
});

// User Management Tools
server.tool('createUser', async (args: Record<string, any>) => {
  const { name, email, role = 'user' } = args as { name: string; email: string; role?: string };
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return Responses.error('Invalid email format');
  }

  // Simulate user creation
  const userId = Math.random().toString(36).substring(7);
  const user = {
    id: userId,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  return Responses.success(user, `User ${name} created successfully`);
}, {
  description: 'Create a new user account',
  schema: Schema.build({
    name: 'string',
    email: 'string',
    role: 'string'
  })
});

server.tool('getUserById', async (args: Record<string, any>) => {
  const { userId } = args as { userId: string };
  
  // Simulate database lookup
  const mockUsers = {
    'user123': { id: 'user123', name: 'John Doe', email: 'john@example.com', role: 'admin' },
    'user456': { id: 'user456', name: 'Jane Smith', email: 'jane@example.com', role: 'user' }
  };

  const user = mockUsers[userId as keyof typeof mockUsers];
  if (!user) {
    return Responses.error(`User with ID ${userId} not found`);
  }

  return Responses.success(user, `Found user: ${user.name}`);
}, {
  description: 'Get user details by ID',
  schema: { userId: 'string' }
});

// Data Processing Tools
server.tool('processData', async (args: Record<string, any>) => {
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
        result = result.map(item => typeof item === 'string' ? item.toUpperCase() : item);
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

// Analytics Tool
server.tool('generateReport', async (args: Record<string, any>) => {
  const { type, dateRange, filters = {} } = args as { 
    type: string; 
    dateRange: { start: string; end: string }; 
    filters?: Record<string, any> 
  };

  // Simulate report generation
  const report = {
    type,
    dateRange,
    filters,
    generatedAt: new Date().toISOString(),
    data: {
      totalUsers: Math.floor(Math.random() * 1000) + 100,
      activeUsers: Math.floor(Math.random() * 800) + 50,
      revenue: Math.floor(Math.random() * 100000) + 10000,
      conversionRate: (Math.random() * 0.1 + 0.02).toFixed(3)
    },
    charts: [
      { type: 'line', title: 'User Growth', dataPoints: 30 },
      { type: 'pie', title: 'User Distribution', segments: 5 }
    ]
  };

  return Responses.success(report, `Generated ${type} report`);
}, {
  description: 'Generate analytics reports with filters',
  schema: Schema.build({
    type: 'string',
    dateRange: 'object',
    filters: 'object'
  })
});

// Resources - Configuration and Documentation
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
    },
    endpoints: [
      '/api/users',
      '/api/data',
      '/api/reports',
      '/api/analytics'
    ]
  };

  return Resources.json(uri, config);
}, {
  uri: 'config://api',
  description: 'API server configuration',
  mimeType: 'application/json'
});

server.resource('userProfile', async ({ uri, params }) => {
  const { userId } = params as { userId: string };
  
  const profile = {
    id: userId,
    name: `User ${userId}`,
    email: `user${userId}@example.com`,
    preferences: {
      theme: 'dark',
      language: 'en',
      notifications: true
    },
    statistics: {
      loginCount: Math.floor(Math.random() * 100),
      lastLogin: new Date().toISOString(),
      accountAge: Math.floor(Math.random() * 365) + 30
    }
  };

  return Resources.json(uri, profile);
}, {
  uri: 'users://{userId}/profile',
  description: 'User profile data',
  isTemplate: true
});

// Prompts - AI Assistant Templates
server.prompt('codeReview', async ({ language, complexity }) => {
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
  schema: {
    language: 'string',
    complexity: 'string'
  }
});

server.prompt('troubleshoot', async ({ issue, context }) => {
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
  schema: {
    issue: 'string',
    context: 'string'
  }
});

// Start the server
console.log('🏢 Starting Enterprise MCP API Server...');
await server.start();

console.log('✅ Enterprise API Server running on http://localhost:3002/mcp');
console.log('📊 Server Stats:', server.getStats());
console.log('\n🔧 Available Tools:');
console.log('  - createUser: Create new user accounts');
console.log('  - getUserById: Retrieve user information');
console.log('  - processData: Transform and analyze data');
console.log('  - generateReport: Create analytics reports');
console.log('\n📄 Available Resources:');
console.log('  - config://api: Server configuration');  
console.log('  - users://{userId}/profile: User profiles');
console.log('\n💬 Available Prompts:');
console.log('  - codeReview: Code review templates');
console.log('  - troubleshoot: Problem-solving conversations');
