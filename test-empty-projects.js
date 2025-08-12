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
    }, 5000); // Increased timeout for complex search
  });
}

async function testEmptyProjects() {
  console.log('=== TESTING EMPTY PROJECTS WITH NESTED SEARCH ===\n');

  // Test empty projects search with the fixed nested logic
  console.log('🧪 Test: Empty projects with nested subfolder search...');
  const emptyProjectsResult = await testMCPCall('list_projects', { 
    incompleteOnly: true,
    emptyProjectsOnly: true 
  });
  
  if (emptyProjectsResult.result?.result?.content?.[0]?.text) {
    const text = emptyProjectsResult.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    // Look for HelixIntel projects specifically
    const helixIntelProjects = lines.filter(line => 
      line.includes('HelixIntel') || line.includes('Active Projects > Professional > HelixIntel')
    );
    
    console.log(`✅ SUCCESS - Found ${lines.length} total empty projects`);
    
    if (helixIntelProjects.length > 0) {
      console.log(`\n🎯 FOUND ${helixIntelProjects.length} HelixIntel empty projects:`);
      helixIntelProjects.forEach(line => console.log(`   ${line}`));
    } else {
      console.log('\n❌ NO HelixIntel projects found in empty list - the search may still not be deep enough');
    }
    
    // Show distribution by location
    const locationCounts = {};
    lines.forEach(line => {
      const locationMatch = line.match(/\[Location: ([^\]]+)\]/);
      if (locationMatch) {
        const location = locationMatch[1];
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      }
    });
    
    console.log('\n📊 Empty projects by location:');
    Object.entries(locationCounts).forEach(([location, count]) => {
      console.log(`   ${location}: ${count} projects`);
    });
    
  } else {
    console.log('❌ FAILED:', emptyProjectsResult);
  }
  
  console.log('\n' + '='.repeat(70) + '\n');

  // Test regular incomplete projects to see if HelixIntel shows up there
  console.log('🧪 Test: All incomplete projects to verify HelixIntel visibility...');
  const allIncompleteResult = await testMCPCall('list_projects', { 
    incompleteOnly: true 
  });
  
  if (allIncompleteResult.result?.result?.content?.[0]?.text) {
    const text = allIncompleteResult.result.result.content[0].text;
    const lines = text.split('\n').filter(line => line.trim());
    
    const helixIntelProjects = lines.filter(line => 
      line.includes('HelixIntel') || line.includes('Active Projects > Professional > HelixIntel')
    );
    
    console.log(`📈 Total incomplete projects: ${lines.length}`);
    
    if (helixIntelProjects.length > 0) {
      console.log(`\n✅ Found ${helixIntelProjects.length} HelixIntel projects in incomplete list:`);
      helixIntelProjects.slice(0, 5).forEach(line => console.log(`   ${line}`));
      if (helixIntelProjects.length > 5) {
        console.log(`   ... and ${helixIntelProjects.length - 5} more`);
      }
      
      // Count how many have no tasks
      const emptyHelixProjects = helixIntelProjects.filter(line => 
        line.includes('[No incomplete tasks]')
      );
      console.log(`\n🎯 Of these, ${emptyHelixProjects.length} HelixIntel projects have no incomplete tasks`);
      
    } else {
      console.log('\n❌ Still NO HelixIntel projects found in incomplete list');
      console.log('This suggests the nested search is still not working correctly');
    }
    
  } else {
    console.log('❌ FAILED:', allIncompleteResult);
  }

  console.log('\n' + '='.repeat(70) + '\n');
  console.log('🎯 Empty projects testing completed!');
}

testEmptyProjects().catch(console.error);