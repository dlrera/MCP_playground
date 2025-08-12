#!/usr/bin/env node

import { spawn } from 'child_process';

const server = spawn('node', ['dist/index.js']);

const request = {
  jsonrpc: "2.0",
  id: 1,
  method: "tools/call",
  params: {
    name: "list_tasks",
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
  
  console.log('=== ACTIVE TASKS TEST ===');
  console.log('STDERR:', errorOutput);
  
  try {
    const lines = output.split('\n').filter(line => line.trim());
    lines.forEach((line, index) => {
      try {
        const parsed = JSON.parse(line);
        if (parsed.result && parsed.result.content && parsed.result.content[0]) {
          const tasks = parsed.result.content[0].text;
          const taskCount = tasks.split('\n').filter(t => t.trim()).length;
          console.log(`Found ${taskCount} active tasks`);
          console.log('First 10 tasks:');
          tasks.split('\n').slice(0, 10).forEach((task, i) => {
            if (task.trim()) console.log(`  ${i+1}. ${task}`);
          });
        }
      } catch (e) {
        console.log('Raw line:', line);
      }
    });
  } catch (error) {
    console.log('Raw output:', output);
  }
}, 3000);