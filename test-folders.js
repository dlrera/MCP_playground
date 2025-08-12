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

async function testOrganizationalTools() {
  console.log('=== TESTING ORGANIZATIONAL TOOLS ===\n');

  // Test 1: List folders
  console.log('1. List folders:');
  const folders = await testMCPCall('list_folders');
  if (folders.result?.result?.content?.[0]?.text) {
    console.log(folders.result.result.content[0].text);
  } else {
    console.log('   ERROR:', folders);
  }

  // Test 2: List folders with project counts  
  console.log('\n2. List folders with project counts:');
  const foldersWithCounts = await testMCPCall('list_folders', { includeProjectCounts: true });
  if (foldersWithCounts.result?.result?.content?.[0]?.text) {
    console.log(foldersWithCounts.result.result.content[0].text);
  } else {
    console.log('   ERROR:', foldersWithCounts);
  }

  // Test 3: Get details for "Lists" folder
  console.log('\n3. Folder details for "Lists":');
  const folderDetails = await testMCPCall('get_folder_details', { folderName: 'Lists' });
  if (folderDetails.result?.result?.content?.[0]?.text) {
    console.log(folderDetails.result.result.content[0].text);
  } else {
    console.log('   ERROR:', folderDetails);
  }

  // Test 4: List tags hierarchy
  console.log('\n4. List tags hierarchy:');
  const tagsHierarchy = await testMCPCall('list_tags_hierarchy');
  if (tagsHierarchy.result?.result?.content?.[0]?.text) {
    console.log(tagsHierarchy.result.result.content[0].text);
  } else {
    console.log('   ERROR:', tagsHierarchy);
  }

  // Test 5: List tags with usage stats
  console.log('\n5. List tags with usage statistics:');
  const tagsWithStats = await testMCPCall('list_tags_hierarchy', { includeUsageStats: true });
  if (tagsWithStats.result?.result?.content?.[0]?.text) {
    console.log(tagsWithStats.result.result.content[0].text);
  } else {
    console.log('   ERROR:', tagsWithStats);
  }
}

testOrganizationalTools().catch(console.error);