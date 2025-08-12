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

async function testFolderDetails() {
  console.log('=== TESTING ENHANCED FOLDER DETAILS ===\n');

  // Test 1: Top-level folder
  console.log('🧪 Test 1: Getting details for top-level folder "Lists"...');
  const topLevelFolder = await testMCPCall('get_folder_details', { 
    folderName: 'Lists' 
  });
  
  if (topLevelFolder.result?.result?.content?.[0]?.text) {
    console.log('✅ SUCCESS:');
    console.log(topLevelFolder.result.result.content[0].text);
  } else {
    console.log('❌ FAILED:', topLevelFolder);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: Subfolder (this was the original failing case)
  console.log('🧪 Test 2: Getting details for subfolder "Professional"...');
  const subFolder = await testMCPCall('get_folder_details', { 
    folderName: 'Professional' 
  });
  
  if (subFolder.result?.result?.content?.[0]?.text) {
    console.log('✅ SUCCESS:');
    console.log(subFolder.result.result.content[0].text);
  } else {
    console.log('❌ FAILED:', subFolder);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: Another subfolder
  console.log('🧪 Test 3: Getting details for subfolder "Personal"...');
  const personalFolder = await testMCPCall('get_folder_details', { 
    folderName: 'Personal' 
  });
  
  if (personalFolder.result?.result?.content?.[0]?.text) {
    console.log('✅ SUCCESS:');
    console.log(personalFolder.result.result.content[0].text);
  } else {
    console.log('❌ FAILED:', personalFolder);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Folder with subfolders
  console.log('🧪 Test 4: Getting details for folder with subfolders "Active Projects"...');
  const parentFolder = await testMCPCall('get_folder_details', { 
    folderName: 'Active Projects' 
  });
  
  if (parentFolder.result?.result?.content?.[0]?.text) {
    console.log('✅ SUCCESS:');
    console.log(parentFolder.result.result.content[0].text);
  } else {
    console.log('❌ FAILED:', parentFolder);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 5: Non-existent folder
  console.log('🧪 Test 5: Testing error handling for non-existent folder...');
  const badFolder = await testMCPCall('get_folder_details', { 
    folderName: 'Non Existent Folder' 
  });
  
  if (badFolder.result?.result?.content?.[0]?.text) {
    const text = badFolder.result.result.content[0].text;
    if (text.includes('not found')) {
      console.log('✅ SUCCESS - Properly handled error:', text);
    } else {
      console.log('❌ UNEXPECTED - Should have failed:', text);
    }
  } else {
    console.log('❌ FAILED:', badFolder);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🎯 All folder details tests completed!');
}

testFolderDetails().catch(console.error);