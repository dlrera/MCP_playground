#!/usr/bin/env node

import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js']);

const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "list_projects",
    arguments: {
      includeCompleted: false
    }
  }
};

let output = '';
let errorOutput = '';

server.stdout.on('data', (data) => {
  output += data.toString();
});

server.stderr.on('data', (data) => {
  errorOutput += data.toString();
});

server.stdin.write(JSON.stringify(request) + '\n');

setTimeout(() => {
  server.kill();
  
  console.log('=== ACTIVE PROJECTS TEST ===');
  console.log('STDERR:', errorOutput);
  
  try {
    const lines = output.split('\n').filter(line => line.trim());
    lines.forEach(line => {
      try {
        const parsed = JSON.parse(line);
        console.log(JSON.stringify(parsed, null, 2));
      } catch (e) {
        console.log('Raw line:', line);
      }
    });
  } catch (error) {
    console.log('Raw output:', output);
  }
}, 2000);