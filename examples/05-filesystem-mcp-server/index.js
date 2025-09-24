/**
 * File System MCP Server - JavaScript Version
 * Built with quickmcp-sdk - can run directly with node
 */

import { createServer, Responses, Resources, Schema } from 'quickmcp-sdk';
import fs from 'fs/promises';
import path from 'path';
import { existsSync, statSync } from 'fs';

// Create STDIO server (better for MCP integration)
const server = createServer({
  name: 'filesystem-mcp-server',
  transport: 'stdio',
  debug: false
});

// Tool: Read file contents
server.tool('readFile', async (args) => {
  const { filePath } = args;
  
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

// Tool: Write file contents
server.tool('writeFile', async (args) => {
  const { filePath, content, createDirs = false } = args;
  
  try {
    if (createDirs) {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
    }
    
    await fs.writeFile(filePath, content, 'utf-8');
    const stats = statSync(filePath);
    
    return Responses.success({
      path: filePath,
      bytesWritten: stats.size,
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString()
    }, `Written to: ${path.basename(filePath)}`);
    
  } catch (error) {
    return Responses.error(`Failed to write file: ${error.message}`);
  }
}, {
  description: 'Write content to a file',
  schema: Schema.build({ 
    filePath: 'string', 
    content: 'string',
    createDirs: 'boolean'
  })
});

// Tool: List directory contents
server.tool('listDirectory', async (args) => {
  const { dirPath, showHidden = false, detailed = false } = args;
  
  try {
    if (!existsSync(dirPath)) {
      return Responses.error(`Directory not found: ${dirPath}`);
    }
    
    const entries = await fs.readdir(dirPath);
    const filtered = showHidden ? entries : entries.filter(name => !name.startsWith('.'));
    
    if (detailed) {
      const detailedEntries = await Promise.all(
        filtered.map(async (name) => {
          const fullPath = path.join(dirPath, name);
          const stats = statSync(fullPath);
          
          return {
            name,
            path: fullPath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.size,
            modified: stats.mtime.toISOString(),
            permissions: stats.mode.toString(8)
          };
        })
      );
      
      return Responses.success({
        directory: dirPath,
        entries: detailedEntries,
        count: detailedEntries.length
      }, `Listed ${detailedEntries.length} items in ${path.basename(dirPath)}`);
    } else {
      return Responses.success({
        directory: dirPath,
        entries: filtered.map(name => ({
          name,
          path: path.join(dirPath, name)
        })),
        count: filtered.length
      }, `Found ${filtered.length} items in ${path.basename(dirPath)}`);
    }
    
  } catch (error) {
    return Responses.error(`Failed to list directory: ${error.message}`);
  }
}, {
  description: 'List contents of a directory',
  schema: Schema.build({ 
    dirPath: 'string',
    showHidden: 'boolean',
    detailed: 'boolean'
  })
});

// Tool: Search for files
server.tool('searchFiles', async (args) => {
  const { searchPath, pattern, caseSensitive = false } = args;
  
  try {
    if (!existsSync(searchPath)) {
      return Responses.error(`Search path not found: ${searchPath}`);
    }
    
    const searchRegex = new RegExp(pattern, caseSensitive ? 'g' : 'gi');
    const results = [];
    
    async function searchRecursive(dirPath) {
      const entries = await fs.readdir(dirPath);
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry);
        const stats = statSync(fullPath);
        
        if (searchRegex.test(entry)) {
          results.push({
            name: entry,
            path: fullPath,
            type: stats.isDirectory() ? 'directory' : 'file',
            size: stats.isFile() ? stats.size : undefined,
            modified: stats.mtime.toISOString()
          });
        }
        
        if (stats.isDirectory()) {
          await searchRecursive(fullPath);
        }
      }
    }
    
    await searchRecursive(searchPath);
    
    return Responses.success({
      searchPath,
      pattern,
      caseSensitive,
      results,
      count: results.length
    }, `Found ${results.length} matches for "${pattern}"`);
    
  } catch (error) {
    return Responses.error(`Search failed: ${error.message}`);
  }
}, {
  description: 'Search for files and directories by name pattern',
  schema: Schema.build({ 
    searchPath: 'string',
    pattern: 'string',
    caseSensitive: 'boolean'
  })
});

// Resource: File content (template for any file)
server.resource('fileContent', async ({ uri, params }) => {
  const { filePath } = params;
  
  try {
    if (!existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    
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

// Start the server
await server.start();
