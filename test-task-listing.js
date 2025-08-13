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

async function testTaskListing() {
  console.log('=== TESTING FIXED TASK LISTING FUNCTIONALITY ===\n');
  
  console.log('🧪 Test 1: List all tasks (should exclude completed by default)...');
  const allTasks = await testMCPCall('list_tasks');
  
  if (allTasks.result?.result?.content?.[0]?.text) {
    const text = allTasks.result.result.content[0].text;
    console.log(`📋 Result (first 500 chars): ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}\n`);
    
    if (text.includes('ERROR')) {
      console.log('❌ ERROR found in all tasks result\n');
    } else if (text === 'No tasks found') {
      console.log('❗ No tasks found - might indicate an issue\n');
    } else {
      console.log('✅ Tasks found successfully\n');
    }
  } else {
    console.log('❌ FAILED:', allTasks);
  }

  console.log('🧪 Test 2: List tasks for specific HelixIntel project...');
  const projectTasks = await testMCPCall('list_tasks', { 
    project: 'Virtual Risk-Manager AI Prototype' 
  });
  
  if (projectTasks.result?.result?.content?.[0]?.text) {
    const text = projectTasks.result.result.content[0].text;
    console.log(`📋 Project tasks: ${text}\n`);
    
    if (text.includes('ERROR: Project not found')) {
      console.log('❌ Project not found - nested search may not be working\n');
    } else if (text === 'No tasks found') {
      console.log('📝 Project found but no tasks (or all completed)\n');
    } else {
      console.log('✅ Project tasks found successfully\n');
    }
  } else {
    console.log('❌ FAILED:', projectTasks);
  }

  console.log('🧪 Test 3: List tasks for another HelixIntel project...');
  const poolTasks = await testMCPCall('list_tasks', { 
    project: 'Pool Leads' 
  });
  
  if (poolTasks.result?.result?.content?.[0]?.text) {
    const text = poolTasks.result.result.content[0].text;
    console.log(`📋 Pool Leads tasks: ${text}\n`);
  } else {
    console.log('❌ FAILED:', poolTasks);
  }

  console.log('🧪 Test 4: List tasks including completed ones...');
  const completedTasks = await testMCPCall('list_tasks', { 
    project: 'Virtual Risk-Manager AI Prototype',
    includeCompleted: true 
  });
  
  if (completedTasks.result?.result?.content?.[0]?.text) {
    const text = completedTasks.result.result.content[0].text;
    console.log(`📋 Including completed: ${text}\n`);
  } else {
    console.log('❌ FAILED:', completedTasks);
  }
  
  console.log('='.repeat(70));
  console.log('🎯 TASK LISTING FIXES SUMMARY:');
  console.log('✅ Added 3-level nested folder search (Active Projects > Professional > HelixIntel)');
  console.log('✅ Fixed project-specific search to use nested pattern');
  console.log('✅ Made excluding completed tasks the default behavior');
  console.log('✅ Added proper error handling for project not found');
  console.log('\n🔧 Usage:');
  console.log('  • list_tasks - All incomplete tasks from all projects and inbox');
  console.log('  • list_tasks({"project": "Name"}) - Tasks from specific project');
  console.log('  • list_tasks({"includeCompleted": true}) - Include completed tasks');
  console.log('  • list_tasks({"context": "TagName"}) - Filter by context/tag');
}

testTaskListing().catch(console.error);