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

async function testEnhancements() {
  console.log('=== TESTING ENHANCED PROJECT AND TASK FEATURES ===\n');

  // Test 1: Create task in a project within a subfolder
  console.log('🧪 Test 1: Creating task in a project within Professional subfolder...');
  const taskInSubfolder = await testMCPCall('create_task', { 
    name: 'Test Task in Subfolder Project',
    project: 'Resign from Immunaeon',
    note: 'Testing enhanced project search'
  });
  
  if (taskInSubfolder.result?.result?.content?.[0]?.text) {
    console.log('✅ SUCCESS:', taskInSubfolder.result.result.content[0].text);
  } else {
    console.log('❌ FAILED:', taskInSubfolder);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 2: List incomplete projects only
  console.log('🧪 Test 2: Listing incomplete projects only...');
  const incompleteProjects = await testMCPCall('list_projects', { 
    incompleteOnly: true 
  });
  
  if (incompleteProjects.result?.result?.content?.[0]?.text) {
    const text = incompleteProjects.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim()).slice(0, 5); // Show first 5
    console.log('✅ SUCCESS - First 5 incomplete projects:');
    lines.forEach(line => console.log('  ' + line));
    console.log(`  ... (showing 5 of ${text.split('\n').filter(line => line.trim()).length} total)`);
  } else {
    console.log('❌ FAILED:', incompleteProjects);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 3: List projects with no incomplete tasks
  console.log('🧪 Test 3: Listing projects with no incomplete tasks...');
  const emptyProjects = await testMCPCall('list_projects', { 
    emptyProjectsOnly: true 
  });
  
  if (emptyProjects.result?.result?.content?.[0]?.text) {
    const text = emptyProjects.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    console.log('✅ SUCCESS - Projects with no incomplete tasks:');
    lines.slice(0, 10).forEach(line => console.log('  ' + line)); // Show first 10
    if (lines.length > 10) {
      console.log(`  ... (showing 10 of ${lines.length} total)`);
    }
  } else {
    console.log('❌ FAILED:', emptyProjects);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 4: Regular project list with task counts
  console.log('🧪 Test 4: Regular project list with task count information...');
  const regularProjects = await testMCPCall('list_projects', { 
    incompleteOnly: true 
  });
  
  if (regularProjects.result?.result?.content?.[0]?.text) {
    const text = regularProjects.result.result.content[0].text;
    const linesWithTasks = text.split('\n').filter(line => 
      line.includes('[') && line.includes('incomplete tasks')
    ).slice(0, 5);
    
    console.log('✅ SUCCESS - Projects with active tasks (first 5):');
    linesWithTasks.forEach(line => console.log('  ' + line));
  } else {
    console.log('❌ FAILED:', regularProjects);
  }
  
  console.log('\n' + '='.repeat(60) + '\n');

  // Test 5: Test task creation error handling
  console.log('🧪 Test 5: Testing error handling for non-existent project...');
  const badProject = await testMCPCall('create_task', { 
    name: 'Test Task for Non-Existent Project',
    project: 'This Project Does Not Exist'
  });
  
  if (badProject.result?.result?.content?.[0]?.text) {
    const text = badProject.result.result.content[0].text;
    if (text.includes('Error') || text.includes('not found')) {
      console.log('✅ SUCCESS - Properly handled error:', text);
    } else {
      console.log('❌ UNEXPECTED - Task created despite bad project name:', text);
    }
  } else {
    console.log('❌ FAILED:', badProject);
  }

  console.log('\n' + '='.repeat(60) + '\n');
  console.log('🎯 All enhancement tests completed!');
}

testEnhancements().catch(console.error);