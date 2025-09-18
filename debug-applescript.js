#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runAppleScript(script) {
  try {
    console.log('Running script:');
    console.log(script);
    console.log('---');
    const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "\\'")}'`);
    if (stderr) {
      console.error('STDERR:', stderr);
    }
    if (stdout) {
      console.log('STDOUT:', stdout.trim());
    }
    return stdout.trim();
  } catch (error) {
    console.error('ERROR:', error.message);
    throw error;
  }
}

async function test() {
  // Test 1: Basic connection
  console.log('=== Test 1: Basic connection ===');
  await runAppleScript('tell application "OmniFocus" to get name');

  // Test 2: Document access
  console.log('\n=== Test 2: Document access ===');
  await runAppleScript('tell application "OmniFocus" to tell front document to get name');

  // Test 3: Create simple task (what's failing)
  console.log('\n=== Test 3: Create task ===');
  const createScript = `tell application "OmniFocus"
    tell front document
      set newTask to make new inbox task with properties {name:"Debug Test"}
      return name of newTask
    end tell
  end tell`;
  
  await runAppleScript(createScript);

  console.log('\n=== All tests completed ===');
}

test().catch(console.error);