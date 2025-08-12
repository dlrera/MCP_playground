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

async function testSimpleFolder() {
  console.log('=== TESTING SIMPLE FOLDER ACCESS ===\n');

  // Test top-level folder first
  console.log('🧪 Test: Top-level folder "Lists"...');
  const listsResult = await testMCPCall('get_folder_details', { 
    folderName: 'Lists' 
  });
  
  if (listsResult.result?.result?.content?.[0]?.text) {
    const text = listsResult.result.result.content[0].text;
    console.log('✅ SUCCESS - Lists folder:');
    console.log(text.substring(0, 200) + '...');
  } else {
    console.log('❌ FAILED:', listsResult);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test known subfolder
  console.log('🧪 Test: Known subfolder "Professional"...');
  const profResult = await testMCPCall('get_folder_details', { 
    folderName: 'Professional' 
  });
  
  if (profResult.result?.result?.content?.[0]?.text) {
    const text = profResult.result.result.content[0].text;
    if (text.includes('Folder not found')) {
      console.log('❌ STILL FAILED: Professional subfolder not found');
      console.log('Raw output:', text);
    } else {
      console.log('✅ SUCCESS - Professional folder found!');
      console.log(text.substring(0, 300) + '...');
    }
  } else {
    console.log('❌ FAILED:', profResult);
  }
}

testSimpleFolder().catch(console.error);