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

async function testFinalFiltering() {
  console.log('=== TESTING FINAL IMPROVED FILTERING ===\n');

  // Test 1: Check that dropped projects are excluded from incomplete list
  console.log('🧪 Test 1: Verify dropped projects are excluded from incomplete projects...');
  const incompleteProjects = await testMCPCall('list_projects', { 
    incompleteOnly: true 
  });
  
  if (incompleteProjects.result?.result?.content?.[0]?.text) {
    const text = incompleteProjects.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    const droppedCount = lines.filter(line => line.includes('dropped status')).length;
    const activeCount = lines.filter(line => line.includes('active status')).length;
    const totalCount = lines.length;
    
    console.log('✅ SUCCESS - Project status filtering:');
    console.log(`   Total projects returned: ${totalCount}`);
    console.log(`   Active projects: ${activeCount}`);
    console.log(`   Dropped projects: ${droppedCount} (should be 0)`);
    
    if (droppedCount === 0) {
      console.log('   ✅ PERFECT: No dropped projects in incomplete list!');
    } else {
      console.log('   ❌ ISSUE: Dropped projects still appearing in incomplete list');
    }
    
    console.log('\n   Sample projects with explicit locations:');
    lines.slice(0, 4).forEach(line => console.log(`   ${line}`));
    
  } else {
    console.log('❌ FAILED:', incompleteProjects);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 2: Compare with all projects to see the difference
  console.log('🧪 Test 2: Compare incomplete vs all projects...');
  const allProjects = await testMCPCall('list_projects', { 
    includeCompleted: true 
  });
  
  if (allProjects.result?.result?.content?.[0]?.text) {
    const text = allProjects.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    const droppedCount = lines.filter(line => line.includes('dropped status')).length;
    const activeCount = lines.filter(line => line.includes('active status')).length;
    const completedCount = lines.filter(line => line.includes('completed status')).length;
    
    console.log('✅ SUCCESS - All projects breakdown:');
    console.log(`   Total projects: ${lines.length}`);
    console.log(`   Active: ${activeCount}`);
    console.log(`   Completed: ${completedCount}`);
    console.log(`   Dropped: ${droppedCount}`);
    
    console.log('\n   Sample dropped projects (these should NOT appear in incomplete list):');
    lines.filter(line => line.includes('dropped status')).slice(0, 3).forEach(line => {
      console.log(`   ${line}`);
    });
    
  } else {
    console.log('❌ FAILED:', allProjects);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 3: Test empty projects filtering
  console.log('🧪 Test 3: Projects with no incomplete tasks...');
  const emptyProjects = await testMCPCall('list_projects', { 
    incompleteOnly: true,
    emptyProjectsOnly: true 
  });
  
  if (emptyProjects.result?.result?.content?.[0]?.text) {
    const text = emptyProjects.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log(`✅ SUCCESS - Found ${lines.length} active projects with no incomplete tasks`);
    console.log('\n   These projects are good candidates for completion/archival:');
    lines.slice(0, 5).forEach(line => console.log(`   ${line}`));
    
  } else {
    console.log('❌ FAILED:', emptyProjects);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test 4: Simple task listing (without complex location logic)
  console.log('🧪 Test 4: Simple task listing...');
  const tasks = await testMCPCall('list_tasks', { 
    includeCompleted: false 
  });
  
  if (tasks.result?.result?.content?.[0]?.text) {
    const text = tasks.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    console.log(`✅ SUCCESS - Found ${lines.length} incomplete tasks`);
    console.log('\n   Sample tasks:');
    lines.slice(0, 5).forEach(line => console.log(`   ${line}`));
    
  } else {
    console.log('❌ FAILED:', tasks);
  }

  console.log('\n' + '='.repeat(70) + '\n');
  console.log('🎯 Final filtering tests completed!');
}

testFinalFiltering().catch(console.error);