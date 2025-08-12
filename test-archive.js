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
    }, 3000);
  });
}

async function testArchive() {
  console.log('=== TESTING ARCHIVE PROJECT WITH HELIXINTEL ===\n');

  // Test archiving a HelixIntel project
  console.log('🧪 Test: Archive HelixIntel project "Data Reporting for Affiliates"...');
  const archiveResult = await testMCPCall('archive_project', { 
    projectName: 'Data Reporting for Affiliates' 
  });
  
  if (archiveResult.result?.result?.content?.[0]?.text) {
    const text = archiveResult.result.result.content[0].text;
    console.log('✅ SUCCESS:', text);
  } else {
    console.log('❌ FAILED:', archiveResult);
  }
}

testArchive().catch(console.error);