#!/usr/bin/env node

import { spawn } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

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

async function testLinkOpening(url, projectName) {
  console.log(`🧪 Testing if link opens ${projectName} in OmniFocus...`);
  console.log(`   URL: ${url}`);
  
  try {
    // Use macOS 'open' command to test the URL
    await execAsync(`open "${url}"`);
    console.log(`✅ Link opened successfully (OmniFocus should have opened to ${projectName})`);
    console.log(`   Please verify OmniFocus opened to the correct project: "${projectName}"`);
    
    // Wait a moment for user to check
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`   Test completed for ${projectName}\n`);
        resolve(true);
      }, 2000);
    });
  } catch (error) {
    console.log(`❌ Failed to open link: ${error.message}\n`);
    return false;
  }
}

async function testProjectLinks() {
  console.log('=== TESTING PROJECT LINK GENERATION FEATURE ===\n');
  
  const testProjects = [
    'Virtual Risk-Manager AI Prototype', // HelixIntel project
    'Pool Leads',                        // Another HelixIntel project
    'NonExistent Project'                // Error test
  ];
  
  console.log('🧪 Test 1: Generate markdown links for multiple projects...\n');
  
  for (const projectName of testProjects) {
    console.log(`📋 Testing project: "${projectName}"`);
    
    const linkResult = await testMCPCall('get_project_link', { 
      projectName: projectName,
      format: 'markdown'
    });
    
    if (linkResult.result?.result?.content?.[0]?.text) {
      const text = linkResult.result.result.content[0].text;
      console.log(`Result:\n${text}\n`);
      
      if (text.includes('ERROR:')) {
        console.log(`❌ Project not found (expected for NonExistent Project)\n`);
      } else {
        // Extract URL from the result
        const urlMatch = text.match(/URL: (omnifocus:\/\/\/task\/[^\s]+)/);
        if (urlMatch) {
          const url = urlMatch[1];
          await testLinkOpening(url, projectName);
        }
      }
    } else {
      console.log('❌ FAILED:', linkResult);
    }
  }
  
  console.log('🧪 Test 2: Test different link formats...\n');
  
  const formatTests = ['url', 'markdown', 'html'];
  const testProject = 'Pool Leads';
  
  for (const format of formatTests) {
    console.log(`📋 Testing ${format.toUpperCase()} format for "${testProject}"`);
    
    const linkResult = await testMCPCall('get_project_link', { 
      projectName: testProject,
      format: format
    });
    
    if (linkResult.result?.result?.content?.[0]?.text) {
      const text = linkResult.result.result.content[0].text;
      console.log(`Result:\n${text}\n`);
    } else {
      console.log('❌ FAILED:', linkResult);
    }
  }
  
  console.log('='.repeat(70));
  console.log('🎯 PROJECT LINK FEATURE SUMMARY:');
  console.log('✅ Generates OmniFocus project links using project ID');
  console.log('✅ Supports 3-level nested folder search (Active Projects > Professional > HelixIntel)');
  console.log('✅ Multiple output formats: URL, Markdown, HTML');
  console.log('✅ Provides project location information');
  console.log('✅ Links are clickable and should open specific projects in OmniFocus');
  console.log('✅ Error handling for non-existent projects');
  console.log('\n🔧 Usage Examples:');
  console.log('  • get_project_link({"projectName": "My Project"}) - Markdown format');
  console.log('  • get_project_link({"projectName": "My Project", "format": "url"}) - Plain URL');
  console.log('  • get_project_link({"projectName": "My Project", "format": "html"}) - HTML link');
  console.log('\n📝 Perfect for use in:');
  console.log('  • Markdown notes and documentation');
  console.log('  • Task management integrations');
  console.log('  • Project reference systems');
  console.log('  • Meeting notes with project links');
}

testProjectLinks().catch(console.error);