import { OmniFocusTools } from '../../dist/omnifocus-tools.js';

const tools = new OmniFocusTools();

// Test names with special characters
const testCases = {
  brackets: '[Test] Task with Brackets',
  quotes: '"Important" Task with Quotes',
  apostrophe: "John's Task with Apostrophe",
  backslash: 'Task\\with\\backslash',
  ampersand: 'Task & Project Test'
};

const testProjectName = '[Test] Special "Characters" & More';

async function testGroup1Functions() {
  console.log('🧪 Testing Group 1: Core Task Functions');
  console.log('========================================\n');

  const results = [];

  // Test 1: Create tasks with special characters
  console.log('1️⃣ Testing createTask with special characters...');
  for (const [type, name] of Object.entries(testCases)) {
    try {
      const result = await tools.createTask({
        name: name,
        note: `Note for ${type} test`
      });
      console.log(`   ✅ Created: ${name}`);
      results.push({ type: 'task', name: name, status: 'created' });
    } catch (error) {
      console.log(`   ❌ Failed to create "${name}": ${error.message}`);
      results.push({ type: 'task', name: name, status: 'failed', error: error.message });
    }
  }

  // Test 2: Search for tasks
  console.log('\n2️⃣ Testing searchTasks...');
  try {
    const searchResult = await tools.searchTasks({ query: 'Test' });
    console.log(`   ✅ Search found tasks with "Test"`);
  } catch (error) {
    console.log(`   ❌ Search failed: ${error.message}`);
  }

  // Test 3: Set dates on a task
  console.log('\n3️⃣ Testing setTaskDates...');
  try {
    await tools.setTaskDates({
      taskName: testCases.brackets,
      dueDate: '2025-01-01',
      estimatedMinutes: 30
    });
    console.log(`   ✅ Set dates for: ${testCases.brackets}`);
  } catch (error) {
    console.log(`   ❌ Failed to set dates: ${error.message}`);
  }

  // Test 4: Get task note
  console.log('\n4️⃣ Testing getTaskNote...');
  try {
    const noteResult = await tools.getTaskNote({
      taskName: testCases.quotes
    });
    console.log(`   ✅ Retrieved note for: ${testCases.quotes}`);
  } catch (error) {
    console.log(`   ❌ Failed to get note: ${error.message}`);
  }

  // Test 5: Complete a task
  console.log('\n5️⃣ Testing completeTask...');
  try {
    await tools.completeTask({
      taskName: testCases.apostrophe
    });
    console.log(`   ✅ Completed: ${testCases.apostrophe}`);
    results.push({ type: 'task', name: testCases.apostrophe, status: 'completed' });
  } catch (error) {
    console.log(`   ❌ Failed to complete: ${error.message}`);
  }

  console.log('\n========================================');
  console.log('📊 Test Summary:');
  console.log(`   Created ${results.filter(r => r.status === 'created').length} tasks`);
  console.log(`   Completed ${results.filter(r => r.status === 'completed').length} tasks`);
  console.log(`   Failed ${results.filter(r => r.status === 'failed').length} operations`);

  return results;
}

async function cleanupTestData(results) {
  console.log('\n🧹 Cleaning up test data...');

  for (const item of results) {
    if (item.type === 'task' && (item.status === 'created' || item.status === 'completed')) {
      try {
        await tools.deleteTask({ taskName: item.name });
        console.log(`   ✅ Deleted: ${item.name}`);
      } catch (error) {
        console.log(`   ⚠️  Could not delete "${item.name}": ${error.message}`);
      }
    }
  }

  console.log('   Cleanup complete!\n');
}

// Run tests
(async () => {
  try {
    const results = await testGroup1Functions();
    await cleanupTestData(results);
  } catch (error) {
    console.error('Test suite failed:', error);
  }
})();