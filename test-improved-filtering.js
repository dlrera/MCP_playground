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
    }, 4000); // Increased timeout for location processing
  });
}

async function testImprovedFiltering() {
  console.log('=== TESTING IMPROVED FILTERING AND LOCATION DISPLAY ===\n');

  // Test 1: Incomplete projects only (should exclude dropped projects)
  console.log('🧪 Test 1: Listing incomplete projects only (excluding dropped)...');
  const incompleteProjects = await testMCPCall('list_projects', { 
    incompleteOnly: true 
  });
  
  if (incompleteProjects.result?.result?.content?.[0]?.text) {
    const text = incompleteProjects.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    // Check for dropped projects in the results
    const droppedProjects = lines.filter(line => line.includes('dropped status'));
    const activeProjects = lines.filter(line => line.includes('active status'));
    
    console.log('✅ SUCCESS - Project filtering results:');
    console.log(`   Active projects found: ${activeProjects.length}`);
    console.log(`   Dropped projects found: ${droppedProjects.length} (should be 0)`);
    
    // Show first few examples with locations
    console.log('\n   Sample active projects with locations:');
    activeProjects.slice(0, 5).forEach(line => console.log(`   ${line}`));
    
    if (droppedProjects.length > 0) {
      console.log('\n   ❌ WARNING: Found dropped projects (these should be filtered out):');
      droppedProjects.slice(0, 3).forEach(line => console.log(`   ${line}`));
    }
  } else {
    console.log('❌ FAILED:', incompleteProjects);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 2: Tasks with explicit location information
  console.log('🧪 Test 2: Listing tasks with explicit location information...');
  const tasksWithLocation = await testMCPCall('list_tasks', { 
    includeCompleted: false 
  });
  
  if (tasksWithLocation.result?.result?.content?.[0]?.text) {
    const text = tasksWithLocation.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    // Find tasks with different location types
    const topLevelTasks = lines.filter(line => line.includes('[Location: Top Level]'));
    const folderTasks = lines.filter(line => line.includes('[Location:') && !line.includes('Top Level') && !line.includes(' > '));
    const subfolderTasks = lines.filter(line => line.includes(' > '));
    const inboxTasks = lines.filter(line => line.includes('[Inbox]'));
    
    console.log('✅ SUCCESS - Task location distribution:');
    console.log(`   Top Level tasks: ${topLevelTasks.length}`);
    console.log(`   Folder tasks: ${folderTasks.length}`);
    console.log(`   Subfolder tasks: ${subfolderTasks.length}`);
    console.log(`   Inbox tasks: ${inboxTasks.length}`);
    
    console.log('\n   Sample tasks with locations:');
    [
      ...topLevelTasks.slice(0, 1),
      ...folderTasks.slice(0, 1), 
      ...subfolderTasks.slice(0, 2),
      ...inboxTasks.slice(0, 1)
    ].forEach(task => console.log(`   ${task}`));
    
  } else {
    console.log('❌ FAILED:', tasksWithLocation);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 3: Search tasks with location information
  console.log('🧪 Test 3: Searching tasks with location information...');
  const searchResults = await testMCPCall('search_tasks', { 
    query: 'task' 
  });
  
  if (searchResults.result?.result?.content?.[0]?.text) {
    const text = searchResults.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log(`✅ SUCCESS - Found ${lines.length} tasks containing 'task':`);
    console.log('\n   Sample search results with locations:');
    lines.slice(0, 5).forEach(task => console.log(`   ${task}`));
    
  } else {
    console.log('❌ FAILED:', searchResults);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 4: Projects with no incomplete tasks
  console.log('🧪 Test 4: Finding projects with no incomplete tasks...');
  const emptyProjects = await testMCPCall('list_projects', { 
    incompleteOnly: true,
    emptyProjectsOnly: true 
  });
  
  if (emptyProjects.result?.result?.content?.[0]?.text) {
    const text = emptyProjects.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log(`✅ SUCCESS - Found ${lines.length} active projects with no incomplete tasks:`);
    console.log('\n   Sample empty projects with locations:');
    lines.slice(0, 5).forEach(project => console.log(`   ${project}`));
    
  } else {
    console.log('❌ FAILED:', emptyProjects);
  }

  console.log('\n' + '='.repeat(70) + '\n');
  console.log('🎯 All improved filtering and location tests completed!');
}

testImprovedFiltering().catch(console.error);