/**
 * Test Script for File System MCP Server
 * Shows how to interact with the server using quickmcp-sdk
 */

// Test data and examples for the filesystem MCP server
console.log('📂 File System MCP Server Test Examples');
console.log('=====================================\n');

console.log('🔧 Available Tools:');
console.log('1. readFile - Read file contents');
console.log('   Example: { "filePath": "package.json" }');

console.log('2. writeFile - Write content to file');
console.log('   Example: { "filePath": "test.txt", "content": "Hello World!", "createDirs": true }');

console.log('3. listDirectory - List directory contents');
console.log('   Example: { "dirPath": ".", "showHidden": false, "detailed": true }');

console.log('4. deleteItem - Delete file or directory');  
console.log('   Example: { "itemPath": "temp.txt", "recursive": false }');

console.log('5. copyItem - Copy file or directory');
console.log('   Example: { "sourcePath": "source.txt", "destinationPath": "backup.txt" }');

console.log('6. searchFiles - Search for files by pattern');
console.log('   Example: { "searchPath": ".", "pattern": "*.json", "caseSensitive": false }');

console.log('\n📄 Available Resources:');
console.log('1. file://{filePath} - Access file content');
console.log('   Example: file://package.json');

console.log('2. directory://{dirPath} - Get directory listing');
console.log('   Example: directory://src');

console.log('\n🎯 Sample MCP Requests:');

const sampleRequests = {
  "initialize": {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-06-18",
      "capabilities": {},
      "clientInfo": { "name": "test-client", "version": "1.0.0" }
    }
  },
  
  "list_tools": {
    "jsonrpc": "2.0", 
    "id": 2,
    "method": "tools/list"
  },
  
  "read_package_json": {
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "readFile",
      "arguments": { "filePath": "package.json" }
    }
  },
  
  "list_current_directory": {
    "jsonrpc": "2.0",
    "id": 4, 
    "method": "tools/call",
    "params": {
      "name": "listDirectory",
      "arguments": { "dirPath": ".", "detailed": true }
    }
  },
  
  "create_test_file": {
    "jsonrpc": "2.0",
    "id": 5,
    "method": "tools/call", 
    "params": {
      "name": "writeFile",
      "arguments": {
        "filePath": "test-output.txt",
        "content": "This file was created by the File System MCP Server!\nBuilt with quickmcp-sdk\nTimestamp: " + new Date().toISOString(),
        "createDirs": false
      }
    }
  },
  
  "search_typescript_files": {
    "jsonrpc": "2.0",
    "id": 6,
    "method": "tools/call",
    "params": {
      "name": "searchFiles", 
      "arguments": {
        "searchPath": ".",
        "pattern": ".*\\.ts$",
        "caseSensitive": false
      }
    }
  }
};

console.log('\n📋 Copy these JSON requests to test:');
console.log(JSON.stringify(sampleRequests, null, 2));

console.log('\n🚀 How to use:');
console.log('1. Start the server: node filesystem-mcp-server/index.ts'); 
console.log('2. Server runs on: http://localhost:3003/mcp');
console.log('3. Add the config JSON to your MCP client');
console.log('4. Use the sample requests above to test functionality');

console.log('\n✅ File System MCP Server ready for testing!');
