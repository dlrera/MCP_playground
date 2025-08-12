#!/usr/bin/env node

import { spawn } from 'child_process';

async function testMCPCall(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    const server = spawn('node', ['dist/index.js']);
    
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
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
      
      try {
        const lines = output.split('\n').filter(line => line.trim());
        const result = lines.map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return { raw: line };
          }
        })[0];
        
        resolve({ result, errorOutput });
      } catch (error) {
        resolve({ error: error.message, output, errorOutput });
      }
    }, 2000);
  });
}

async function testWaitingTag() {
  console.log('=== TESTING WAITING TAG DETAILS ===\n');

  const tagDetails = await testMCPCall('get_tag_details', { tagName: 'Waiting' });
  if (tagDetails.result?.result?.content?.[0]?.text) {
    console.log(tagDetails.result.result.content[0].text);
  } else {
    console.log('ERROR:', tagDetails);
  }
}

testWaitingTag().catch(console.error);