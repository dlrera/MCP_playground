#!/usr/bin/env node

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testAppleScript() {
  const script = `tell application "OmniFocus"
    tell front document
      set newTask to make new inbox task with properties {name:"Test Task from MCP"}
      return name of newTask
    end tell
  end tell`;

  try {
    console.log('Testing AppleScript...');
    const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "\\'")}'`);
    if (stderr) {
      console.error('AppleScript error:', stderr);
    } else {
      console.log('Success:', stdout.trim());
    }
  } catch (error) {
    console.error('Execution error:', error.message);
  }
}

testAppleScript();