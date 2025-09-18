#!/usr/bin/env node

import { spawn } from 'child_process';

// Test the MCP server by sending a tools/list request
const server = spawn('node', ['dist/index.js']);

// Send tools/list request
const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/list",
  params: {}
};

server.stdin.write(JSON.stringify(request) + '\n');

let output = '';
server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  console.log('Server status:', data.toString());
});

setTimeout(() => {
  server.kill();
  
  try {
    const response = JSON.parse(output);
    console.log('✅ MCP Server Test Results:');
    console.log(`- Server responded: ${response.result ? 'Yes' : 'No'}`);
    console.log(`- Number of tools available: ${response.result?.tools?.length || 0}`);
    console.log('- Available tools:');
    response.result?.tools?.forEach(tool => {
      console.log(`  • ${tool.name}: ${tool.description}`);
    });
  } catch (error) {
    console.log('❌ Failed to parse server response:', error.message);
    console.log('Raw output:', output);
  }
}, 1000);