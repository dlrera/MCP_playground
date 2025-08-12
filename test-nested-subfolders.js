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
    }, 4000);
  });
}

async function testNestedSubfolders() {
  console.log('=== TESTING NESTED SUBFOLDER FUNCTIONALITY ===\n');

  // Test 1: Check if folder hierarchy shows nested subfolders
  console.log('🧪 Test 1: Check if folder hierarchy shows nested subfolders...');
  const hierarchy = await testMCPCall('list_folder_hierarchy', { 
    includeProjectCounts: true 
  });
  
  if (hierarchy.result?.result?.content?.[0]?.text) {
    const text = hierarchy.result.result.content[0].text;
    
    // Look for nested folder patterns (four spaces indentation = nested subfolder)
    const nestedSubfolders = text.split('\n').filter(line => 
      line.trim().startsWith('📁') && line.indexOf('📁') >= 4
    );
    
    console.log('✅ SUCCESS - Folder hierarchy analysis:');
    console.log(`   Found ${nestedSubfolders.length} nested subfolders`);
    
    if (nestedSubfolders.length > 0) {
      console.log('\n   Nested subfolders found:');
      nestedSubfolders.forEach(line => console.log(`   ${line.trim()}`));
    }
    
    // Check if HelixIntel appears in the hierarchy
    const helixIntelLines = text.split('\n').filter(line => line.includes('HelixIntel'));
    if (helixIntelLines.length > 0) {
      console.log('\n   HelixIntel folders found in hierarchy:');
      helixIntelLines.forEach(line => console.log(`   ${line.trim()}`));
    } else {
      console.log('\n   ❓ HelixIntel not found in hierarchy - might be nested deeper');
    }
    
  } else {
    console.log('❌ FAILED:', hierarchy);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 2: Try to get details for HelixIntel subfolder
  console.log('🧪 Test 2: Get details for HelixIntel nested subfolder...');
  const helixDetails = await testMCPCall('get_folder_details', { 
    folderName: 'HelixIntel' 
  });
  
  if (helixDetails.result?.result?.content?.[0]?.text) {
    const text = helixDetails.result.result.content[0].text;
    
    if (text.includes('Folder not found')) {
      console.log('❌ STILL NOT FOUND: HelixIntel subfolder not accessible');
      console.log('   This suggests we need to search even deeper or the folder name is different');
    } else {
      console.log('✅ SUCCESS - HelixIntel folder found:');
      console.log(text);
    }
    
  } else {
    console.log('❌ FAILED:', helixDetails);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 3: Try other known subfolders
  console.log('🧪 Test 3: Test other known subfolders for comparison...');
  
  const testFolders = ['Professional', 'Personal', 'Maybe'];
  
  for (const folderName of testFolders) {
    console.log(`   Testing: ${folderName}`);
    const folderTest = await testMCPCall('get_folder_details', { 
      folderName: folderName 
    });
    
    if (folderTest.result?.result?.content?.[0]?.text) {
      const text = folderTest.result.result.content[0].text;
      if (text.includes('Folder not found')) {
        console.log(`   ❌ ${folderName}: Not found`);
      } else {
        const lines = text.split('\n');
        const folderLine = lines.find(line => line.startsWith('Folder:')) || 'Found';
        const parentLine = lines.find(line => line.startsWith('Parent folder:')) || 'No parent shown';
        console.log(`   ✅ ${folderName}: ${folderLine.replace('Folder: ', '')} (${parentLine})`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 4: Show specific part of Professional subfolder to see HelixIntel
  console.log('🧪 Test 4: Examine Professional folder structure...');
  const profDetails = await testMCPCall('get_folder_details', { 
    folderName: 'Professional' 
  });
  
  if (profDetails.result?.result?.content?.[0]?.text) {
    const text = profDetails.result.result.content[0].text;
    
    if (text.includes('Subfolders:')) {
      const subfolderSection = text.split('Subfolders:')[1];
      console.log('✅ SUCCESS - Professional subfolders:');
      console.log(subfolderSection.trim());
      
      if (subfolderSection.includes('HelixIntel')) {
        console.log('\n   ✅ HelixIntel IS listed as a subfolder of Professional!');
        console.log('   This confirms the folder exists but our nested search isn\'t working yet.');
      }
    } else {
      console.log('❓ No subfolder section found in Professional details');
    }
    
  } else {
    console.log('❌ FAILED:', profDetails);
  }

  console.log('\n' + '='.repeat(70) + '\n');
  console.log('🎯 Nested subfolder tests completed!');
}

testNestedSubfolders().catch(console.error);