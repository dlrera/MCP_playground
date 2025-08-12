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

async function testHelixIntel() {
  console.log('=== TESTING HELIXINTEL SUBFOLDER ACCESS ===\n');

  // Test HelixIntel access
  console.log('🧪 Test: HelixIntel nested subfolder...');
  const helixResult = await testMCPCall('get_folder_details', { 
    folderName: 'HelixIntel' 
  });
  
  if (helixResult.result?.result?.content?.[0]?.text) {
    const text = helixResult.result.result.content[0].text;
    
    if (text.includes('Folder not found')) {
      console.log('❌ HelixIntel still not found');
      console.log('This suggests there may be multiple HelixIntel folders or they\'re nested deeper');
    } else {
      console.log('✅ SUCCESS - HelixIntel folder found!');
      console.log(text);
    }
  } else {
    console.log('❌ FAILED:', helixResult);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test folder hierarchy to see nested structure
  console.log('🧪 Test: Check folder hierarchy for HelixIntel...');
  const hierarchyResult = await testMCPCall('list_folder_hierarchy', { 
    includeProjectCounts: true 
  });
  
  if (hierarchyResult.result?.result?.content?.[0]?.text) {
    const text = hierarchyResult.result.result.content[0].text;
    
    // Extract just the HelixIntel related lines
    const lines = text.split('\n');
    const helixLines = lines.filter(line => line.includes('HelixIntel'));
    
    console.log('✅ SUCCESS - HelixIntel in hierarchy:');
    helixLines.forEach(line => console.log(`   ${line.trim()}`));
    
    // Check the Professional section specifically
    console.log('\n   Professional section with subfolders:');
    let inProfessional = false;
    let professionalSection = [];
    
    for (const line of lines) {
      if (line.includes('📁 Professional')) {
        inProfessional = true;
        professionalSection.push(line);
      } else if (inProfessional && line.trim().startsWith('📁') && !line.includes('    📁')) {
        // We've reached another top-level or main folder
        break;
      } else if (inProfessional) {
        professionalSection.push(line);
      }
    }
    
    professionalSection.slice(0, 15).forEach(line => console.log(`   ${line.trim()}`));
    
  } else {
    console.log('❌ FAILED:', hierarchyResult);
  }
}

testHelixIntel().catch(console.error);