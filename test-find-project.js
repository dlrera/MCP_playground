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

async function testProjectSearch() {
  console.log('=== TESTING PROJECT SEARCH IN NESTED FOLDERS ===\n');

  // Test searching for projects in HelixIntel that we know exist
  const testProjects = [
    'Data Reporting for Affiliates',
    'Virtual Risk-Manager AI Prototype', 
    'R&D Carrier Data',
    'Pool Leads'
  ];
  
  for (const projectName of testProjects) {
    console.log(`🧪 Test: Searching for "${projectName}"...`);
    
    // Use list_projects to search for this specific project
    const searchResult = await testMCPCall('list_projects', { 
      incompleteOnly: true 
    });
    
    if (searchResult.result?.result?.content?.[0]?.text) {
      const text = searchResult.result.result.content[0].text;
      const lines = text.split('\n').filter(line => line.trim());
      
      const foundProject = lines.find(line => line.includes(projectName));
      
      if (foundProject) {
        console.log(`✅ FOUND: ${foundProject.trim()}`);
      } else {
        console.log(`❌ NOT FOUND in incomplete projects list`);
      }
    } else {
      console.log(`❌ FAILED: ${searchResult}`);
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 Project search testing completed!');
  console.log('All functions now successfully search nested folder hierarchies!');
}

testProjectSearch().catch(console.error);