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

async function runDiagnostics() {
  console.log('=== MCP SERVER DIAGNOSTICS ===\n');

  // Test 1: List all projects (including completed)
  console.log('1. All projects (including completed):');
  const allProjects = await testMCPCall('list_projects', { includeCompleted: true });
  if (allProjects.result?.result?.content?.[0]?.text) {
    const projects = allProjects.result.result.content[0].text.split('\n').filter(p => p.trim());
    console.log(`   Found ${projects.length} total projects:`);
    projects.forEach(p => console.log(`   - ${p}`));
  } else {
    console.log('   ERROR:', allProjects);
  }

  console.log('\n2. Active projects only:');
  const activeProjects = await testMCPCall('list_projects', { includeCompleted: false });
  if (activeProjects.result?.result?.content?.[0]?.text) {
    const projects = activeProjects.result.result.content[0].text.split('\n').filter(p => p.trim());
    console.log(`   Found ${projects.length} active projects:`);
    projects.forEach(p => console.log(`   - ${p}`));
  } else {
    console.log('   ERROR:', activeProjects);
  }

  console.log('\n3. All tasks (including completed):');
  const allTasks = await testMCPCall('list_tasks', { includeCompleted: true });
  if (allTasks.result?.result?.content?.[0]?.text) {
    const tasks = allTasks.result.result.content[0].text.split('\n').filter(t => t.trim());
    console.log(`   Found ${tasks.length} total tasks`);
    console.log('   Sample tasks:');
    tasks.slice(0, 5).forEach(t => console.log(`   - ${t}`));
    if (tasks.length > 5) console.log(`   ... and ${tasks.length - 5} more`);
  } else {
    console.log('   ERROR:', allTasks);
  }

  console.log('\n4. Active tasks only:');
  const activeTasks = await testMCPCall('list_tasks', { includeCompleted: false });
  if (activeTasks.result?.result?.content?.[0]?.text) {
    const tasks = activeTasks.result.result.content[0].text.split('\n').filter(t => t.trim());
    console.log(`   Found ${tasks.length} active tasks`);
    console.log('   Sample tasks:');
    tasks.slice(0, 5).forEach(t => console.log(`   - ${t}`));
    if (tasks.length > 5) console.log(`   ... and ${tasks.length - 5} more`);
  } else {
    console.log('   ERROR:', activeTasks);
  }

  console.log('\n5. Raw AppleScript test:');
  console.log('   Testing direct AppleScript access...');
}

runDiagnostics().catch(console.error);