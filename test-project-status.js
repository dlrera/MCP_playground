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

async function testProjectStatus() {
  console.log('=== TESTING PROJECT STATUS CHANGES ===\n');
  
  const testProject = 'End-insured Scorecard Reports';

  // First, let's check current project status using list_projects to see what it currently is
  console.log(`🧪 Step 1: Check current status of "${testProject}"...`);
  const listResult = await testMCPCall('list_projects', { incompleteOnly: true });
  
  if (listResult.result?.result?.content?.[0]?.text) {
    const text = listResult.result.result.content[0].text;
    const projectLine = text.split('\n').find(line => line.includes(testProject));
    
    if (projectLine) {
      console.log(`📊 Current project line: ${projectLine.trim()}`);
      
      // Extract status info
      if (projectLine.includes('active status')) {
        console.log('✅ Current status appears to be: ACTIVE');
      } else if (projectLine.includes('on hold status')) {
        console.log('⏸️  Current status appears to be: ON HOLD');
      } else {
        console.log('📋 Status unclear from project listing');
      }
    } else {
      console.log('❌ Project not found in incomplete project list');
    }
  } else {
    console.log('❌ Failed to get project list');
  }

  console.log('\n' + '='.repeat(70) + '\n');
  
  // Test the set_project_status function with dropped
  console.log(`🧪 Step 2: Try to set "${testProject}" status to DROPPED...`);
  const setStatusResult = await testMCPCall('set_project_status', { 
    projectName: testProject,
    status: 'dropped' 
  });
  
  if (setStatusResult.result?.result?.content?.[0]?.text) {
    const text = setStatusResult.result.result.content[0].text;
    console.log(`📋 Result: ${text}`);
    
    if (text.includes('SUCCESS')) {
      console.log('✅ Status change command succeeded');
      
      // Now verify by checking if project is still in incomplete list
      console.log('\n🔍 Step 3: Verify status change by checking incomplete projects...');
      const verifyResult = await testMCPCall('list_projects', { incompleteOnly: true });
      
      if (verifyResult.result?.result?.content?.[0]?.text) {
        const verifyText = verifyResult.result.result.content[0].text;
        const stillInList = verifyText.includes(testProject);
        
        if (!stillInList) {
          console.log('✅ SUCCESS - Project no longer appears in incomplete list (likely dropped)');
        } else {
          console.log('❌ FAILED - Project still appears in incomplete list');
          const projectLine = verifyText.split('\n').find(line => line.includes(testProject));
          console.log(`📋 Current line: ${projectLine?.trim()}`);
        }
      } else {
        console.log('❌ Failed to verify status change');
      }
    } else {
      console.log('❌ Status change command failed');
    }
  } else {
    console.log('❌ Failed to call set_project_status:', setStatusResult);
  }
  
  console.log('\n' + '='.repeat(70));
  console.log('🎯 Project status testing completed!');
}

testProjectStatus().catch(console.error);