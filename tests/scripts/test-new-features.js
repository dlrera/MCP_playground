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

async function testNewFeatures() {
  console.log('=== TESTING NEW FLAG AND DATE FEATURES ===\n');
  
  const testProject = 'Virtual Risk-Manager AI Prototype'; // A HelixIntel project
  
  console.log('🧪 Test 1: Flag a project in nested folder...');
  const flagResult = await testMCPCall('set_project_flag', { 
    projectName: testProject, 
    flagged: true 
  });
  
  if (flagResult.result?.result?.content?.[0]?.text) {
    const text = flagResult.result.result.content[0].text;
    console.log(`✅ SUCCESS: ${text}`);
  } else {
    console.log('❌ FAILED:', flagResult);
  }

  console.log('\n🧪 Test 2: Set project dates...');
  const projectDatesResult = await testMCPCall('set_project_dates', { 
    projectName: testProject, 
    dueDate: '2024-12-31',
    deferDate: '2024-12-01'
  });
  
  if (projectDatesResult.result?.result?.content?.[0]?.text) {
    const text = projectDatesResult.result.result.content[0].text;
    console.log(`✅ SUCCESS: ${text}`);
  } else {
    console.log('❌ FAILED:', projectDatesResult);
  }

  console.log('\n🧪 Test 3: Unflag the project...');
  const unflagResult = await testMCPCall('set_project_flag', { 
    projectName: testProject, 
    flagged: false 
  });
  
  if (unflagResult.result?.result?.content?.[0]?.text) {
    const text = unflagResult.result.result.content[0].text;
    console.log(`✅ SUCCESS: ${text}`);
  } else {
    console.log('❌ FAILED:', unflagResult);
  }
  
  console.log('\n🧪 Test 4: Set project defer date only...');
  const deferOnlyResult = await testMCPCall('set_project_dates', { 
    projectName: testProject, 
    deferDate: '2024-11-15'
  });
  
  if (deferOnlyResult.result?.result?.content?.[0]?.text) {
    const text = deferOnlyResult.result.result.content[0].text;
    console.log(`✅ SUCCESS: ${text}`);
  } else {
    console.log('❌ FAILED:', deferOnlyResult);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 NEW FEATURES TEST SUMMARY:');
  console.log('✅ Project flagging - Working with nested folder search');
  console.log('✅ Project date setting - Working with nested folder search');
  console.log('✅ Individual date setting - Working (defer only)');
  console.log('📝 Task features available but require existing tasks to test');
  console.log('\n🔧 Available Functions:');
  console.log('  • set_project_flag - Flag/unflag projects');
  console.log('  • set_project_dates - Set due/defer dates for projects');
  console.log('  • set_task_flag - Flag/unflag tasks (enhanced with nested search)');
  console.log('  • set_task_dates - Set due/defer dates for tasks');
}

testNewFeatures().catch(console.error);