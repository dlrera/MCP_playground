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

async function testFolderHierarchy() {
  console.log('=== TESTING COMPLETE FOLDER HIERARCHY ===\n');

  // Test basic hierarchy
  console.log('📁 Basic folder hierarchy:');
  const basicHierarchy = await testMCPCall('list_folder_hierarchy');
  if (basicHierarchy.result?.result?.content?.[0]?.text) {
    console.log(basicHierarchy.result.result.content[0].text);
  } else {
    console.log('ERROR:', basicHierarchy);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test with project counts
  console.log('📊 Folder hierarchy with project counts:');
  const withProjectCounts = await testMCPCall('list_folder_hierarchy', { 
    includeProjectCounts: true 
  });
  if (withProjectCounts.result?.result?.content?.[0]?.text) {
    console.log(withProjectCounts.result.result.content[0].text);
  } else {
    console.log('ERROR:', withProjectCounts);
  }

  console.log('\n' + '='.repeat(60) + '\n');

  // Test with all details
  console.log('📈 Full hierarchy with project and task counts:');
  const fullDetails = await testMCPCall('list_folder_hierarchy', { 
    includeProjectCounts: true,
    includeTaskCounts: true
  });
  if (fullDetails.result?.result?.content?.[0]?.text) {
    console.log(fullDetails.result.result.content[0].text);
  } else {
    console.log('ERROR:', fullDetails);
  }
}

testFolderHierarchy().catch(console.error);