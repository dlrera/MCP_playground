import { OmniFocusTools } from './dist/omnifocus-tools.js';

const tools = new OmniFocusTools();

async function testProjectStatus() {
  console.log('Testing Project Status Function\n');
  console.log('================================\n');

  // Test project name
  const testProjectName = 'Test Status Project';

  try {
    // First, create a test project
    console.log('1. Creating test project...');
    await tools.createProject({
      name: testProjectName,
      note: 'Testing project status changes'
    });
    console.log(`   ✓ Project "${testProjectName}" created\n`);

    // Test setting to ON-HOLD
    console.log('2. Testing ON-HOLD status...');
    try {
      const onHoldResult = await tools.setProjectStatus({
        projectName: testProjectName,
        status: 'on-hold'
      });
      console.log('   ✓ Set to on-hold:', onHoldResult.content[0].text);
    } catch (error) {
      console.log('   ✗ Failed to set on-hold:', error.message);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test setting to ACTIVE
    console.log('\n3. Testing ACTIVE status...');
    try {
      const activeResult = await tools.setProjectStatus({
        projectName: testProjectName,
        status: 'active'
      });
      console.log('   ✓ Set to active:', activeResult.content[0].text);
    } catch (error) {
      console.log('   ✗ Failed to set active:', error.message);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test setting to DROPPED
    console.log('\n4. Testing DROPPED status...');
    try {
      const droppedResult = await tools.setProjectStatus({
        projectName: testProjectName,
        status: 'dropped'
      });
      console.log('   ✓ Set to dropped:', droppedResult.content[0].text);
    } catch (error) {
      console.log('   ✗ Failed to set dropped:', error.message);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test setting back to ACTIVE (to test recovery from dropped)
    console.log('\n5. Testing recovery to ACTIVE from dropped...');
    try {
      const activeAgainResult = await tools.setProjectStatus({
        projectName: testProjectName,
        status: 'active'
      });
      console.log('   ✓ Set back to active:', activeAgainResult.content[0].text);
    } catch (error) {
      console.log('   ✗ Failed to set back to active:', error.message);
    }

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Test setting to COMPLETED
    console.log('\n6. Testing COMPLETED status...');
    try {
      const completedResult = await tools.setProjectStatus({
        projectName: testProjectName,
        status: 'completed'
      });
      console.log('   ✓ Set to completed:', completedResult.content[0].text);
    } catch (error) {
      console.log('   ✗ Failed to set completed:', error.message);
    }

    console.log('\n================================');
    console.log('Test Summary:');
    console.log('All status changes were attempted.');
    console.log('Check OmniFocus to verify the project status changes worked correctly.');
    console.log('\nNote: The "on-hold" status is particularly important to verify in OmniFocus.');

  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testProjectStatus().catch(console.error);