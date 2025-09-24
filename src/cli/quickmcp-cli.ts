#!/usr/bin/env node
/**
 * QuickMCP CLI - Development tools for MCP servers
 */

import { program } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

const templates = {
  basic: {
    'src/index.ts': `import { createServer, tool, Responses, Schema } from 'quickmcp';

const server = createServer({ name: 'my-mcp-server' });

server.tool('hello', async ({ name }: { name: string }) => {
  return Responses.success({ greeting: \`Hello, \${name}!\` });
}, {
  description: 'Greet someone by name',
  schema: Schema.build({ name: 'string' })
});

await server.start();`,
    'package.json': (name: string) => `{
  "name": "${name}",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "quickmcp": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}`,
    'tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmitOnError": true,
    "declaration": true,
    "outDir": "dist",
    "rootDir": "src",
    "removeComments": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}`,
    'README.md': (name: string) => `# ${name}

A QuickMCP server built with TypeScript.

## Development

\`\`\`bash
npm install
npm run dev    # Development with hot reload
npm run build  # Build for production
npm start      # Run built server
\`\`\`

## Usage

This server provides the following tools:

- \`hello\`: Greets someone by name
`
  },
  
  enterprise: {
    'src/index.ts': `import { 
  createServer, 
  tool, 
  autoRegister, 
  Responses, 
  Schema 
} from 'quickmcp';
import { AuthMiddleware, RateLimitMiddleware, MetricsMiddleware } from 'quickmcp/middleware';

class ApiService {
  @tool({
    description: 'Get user information',
    schema: Schema.build({ userId: 'string' })
  })
  async getUser({ userId }: { userId: string }) {
    // Simulate database call
    return Responses.success({ 
      id: userId, 
      name: 'John Doe', 
      email: 'john@example.com' 
    });
  }

  @tool({
    description: 'Process data with validation',
    schema: Schema.build({ 
      data: 'string',
      format: 'string' 
    })
  })
  async processData({ data, format }: { data: string; format: string }) {
    return Responses.success({ 
      processed: data.toUpperCase(),
      format,
      timestamp: new Date().toISOString()
    });
  }
}

const server = createServer({
  name: 'enterprise-mcp-server',
  transport: 'http',
  http: {
    port: 3000,
    enableCors: true,
    sessionManagement: true
  }
});

// Enterprise middleware
const auth = new AuthMiddleware({
  type: 'bearer',
  secret: process.env.JWT_SECRET || 'your-secret-key'
});

const rateLimit = new RateLimitMiddleware({
  points: 100, // 100 requests
  duration: 60  // per minute
});

const metrics = new MetricsMiddleware();

// Apply middleware
server.use(auth.middleware);
server.use(rateLimit.middleware);
server.use(metrics.middleware);

// Register tools
autoRegister(server, new ApiService());

// Health check endpoint
server.health('/health', async () => ({
  status: 'healthy',
  ...metrics.getMetrics()
}));

await server.start();`,
    'package.json': (name: string) => `{
  "name": "${name}",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "test": "jest"
  },
  "dependencies": {
    "quickmcp": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/jest": "^29.0.0",
    "jest": "^29.0.0",
    "tsx": "^4.0.0",
    "typescript": "^5.0.0"
  }
}`,
    '.env.example': `JWT_SECRET=your-jwt-secret-key
PORT=3000
NODE_ENV=development`,
    'docker-compose.yml': (name: string) => `version: '3.8'
services:
  ${name}:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=\${JWT_SECRET}
    restart: unless-stopped`
  }
};

program
  .name('quickmcp')
  .description('QuickMCP CLI - Build MCP servers faster')
  .version('1.0.0');

program
  .command('create')
  .argument('<name>', 'Project name')
  .option('-t, --template <template>', 'Template to use', 'basic')
  .description('Create a new QuickMCP server project')
  .action(async (name: string, options: { template: string }) => {
    console.log(`🚀 Creating QuickMCP server: ${name}`);
    
    const template = templates[options.template as keyof typeof templates];
    if (!template) {
      console.error(`❌ Unknown template: ${options.template}`);
      console.log('Available templates:', Object.keys(templates).join(', '));
      process.exit(1);
    }

    try {
      // Create directory
      await fs.mkdir(name, { recursive: true });
      
      // Create files from template
      for (const [filePath, content] of Object.entries(template)) {
        const fullPath = path.join(name, filePath);
        const dir = path.dirname(fullPath);
        
        await fs.mkdir(dir, { recursive: true });
        
        const fileContent = typeof content === 'function' 
          ? content(name) 
          : content;
          
        await fs.writeFile(fullPath, fileContent);
      }

      console.log(`✅ Created ${name} successfully!`);
      console.log(`\n📦 Next steps:`);
      console.log(`   cd ${name}`);
      console.log(`   npm install`);
      console.log(`   npm run dev\n`);
    } catch (error) {
      console.error('❌ Error creating project:', error);
      process.exit(1);
    }
  });

program
  .command('dev')
  .option('-p, --port <port>', 'Port to run on', '3000')
  .option('-w, --watch', 'Watch for changes', true)
  .description('Start development server')
  .action(async (options: { port: string; watch: boolean }) => {
    console.log(`🔄 Starting QuickMCP dev server on port ${options.port}`);
    
    try {
      const cmd = options.watch 
        ? `tsx watch src/index.ts` 
        : `tsx src/index.ts`;
      
      execSync(cmd, { 
        stdio: 'inherit',
        env: { ...process.env, PORT: options.port }
      });
    } catch (error) {
      console.error('❌ Dev server failed:', error);
      process.exit(1);
    }
  });

program
  .command('build')
  .option('-o, --output <dir>', 'Output directory', 'dist')
  .description('Build the server for production')
  .action(async (options: { output: string }) => {
    console.log('🔨 Building QuickMCP server...');
    
    try {
      execSync('tsc', { stdio: 'inherit' });
      console.log('✅ Build completed successfully!');
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  });

program
  .command('test')
  .option('--coverage', 'Run with coverage', false)
  .description('Run tests')
  .action(async (options: { coverage: boolean }) => {
    console.log('🧪 Running tests...');
    
    try {
      const cmd = options.coverage ? 'jest --coverage' : 'jest';
      execSync(cmd, { stdio: 'inherit' });
      console.log('✅ All tests passed!');
    } catch (error) {
      console.error('❌ Tests failed:', error);
      process.exit(1);
    }
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { program };
