import { OmniFocusTools } from './dist/omnifocus-tools.js';

const tools = new OmniFocusTools();

async function simpleTest() {
  console.log('Simple Status Test\n');

  try {
    // Create project
    await tools.createProject({ name: 'Simple Test Project' });
    console.log('✓ Project created');

    // Test on-hold
    const result = await tools.setProjectStatus({
      projectName: 'Simple Test Project',
      status: 'on-hold'
    });

    console.log('Result:', result);

  } catch (error) {
    console.error('Error:', error.message);
    // Try to see the actual script
    if (error.message.includes('applescript')) {
      console.log('\nCheck temp file for the actual script that failed');
    }
  }
}

simpleTest();