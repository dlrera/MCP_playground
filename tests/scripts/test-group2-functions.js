import { OmniFocusTools } from '../../dist/omnifocus-tools.js';

const tools = new OmniFocusTools();

// Test project names with special characters
const testProject = {
  name: '[Test] Project "Special" & Characters',
  note: 'Test note for project with special characters'
};

const testFolder = 'Someday/Maybe'; // Using existing folder

async function testGroup2Functions() {
  console.log('🧪 Testing Group 2: Project Management Functions');
  console.log('================================================\n');

  let projectCreated = false;

  try {
    // Test 1: Create project with special characters
    console.log('1️⃣ Testing createProject...');
    const createResult = await tools.createProject({
      name: testProject.name,
      note: testProject.note,
      type: 'sequential'
    });
    console.log(`   ✅ Created project: ${testProject.name}`);
    projectCreated = true;

    // Test 2: Edit project
    console.log('\n2️⃣ Testing editProject...');
    await tools.editProject({
      projectName: testProject.name,
      newNote: 'Updated note with "quotes" and [brackets]'
    });
    console.log(`   ✅ Updated project note`);

    // Test 3: Set project flag
    console.log('\n3️⃣ Testing setProjectFlag...');
    await tools.setProjectFlag({
      projectName: testProject.name,
      flagged: true
    });
    console.log(`   ✅ Flagged project`);

    // Test 4: Set project dates
    console.log('\n4️⃣ Testing setProjectDates...');
    await tools.setProjectDates({
      projectName: testProject.name,
      dueDate: '2025-12-31'
    });
    console.log(`   ✅ Set project due date`);

    // Test 5: Get project note
    console.log('\n5️⃣ Testing getProjectNote...');
    const noteResult = await tools.getProjectNote({
      projectName: testProject.name
    });
    console.log(`   ✅ Retrieved project note`);

    // Test 6: Get project link
    console.log('\n6️⃣ Testing getProjectLink...');
    const linkResult = await tools.getProjectLink({
      projectName: testProject.name,
      format: 'url'
    });
    console.log(`   ✅ Got project link`);

    // Test 7: Move project (skip if no folders available)
    console.log('\n7️⃣ Testing moveProject...');
    try {
      await tools.moveProject({
        projectName: testProject.name,
        toFolder: testFolder
      });
      console.log(`   ✅ Moved project to ${testFolder}`);
    } catch (error) {
      console.log(`   ⚠️  Move skipped: ${error.message}`);
    }

    // Test 8: Archive project (set to completed)
    console.log('\n8️⃣ Testing archiveProject...');
    try {
      await tools.archiveProject({
        projectName: testProject.name,
        status: 'completed'
      });
      console.log(`   ✅ Archived project as completed`);
    } catch (error) {
      console.log(`   ⚠️  Archive issue: ${error.message}`);
    }

  } catch (error) {
    console.error(`Test failed: ${error.message}`);
  }

  console.log('\n================================================');
  console.log('📊 Group 2 Test Complete');

  return projectCreated ? testProject.name : null;
}

async function cleanupGroup2(projectName) {
  if (!projectName) return;

  console.log('\n🧹 Cleaning up Group 2 test data...');
  try {
    // Delete the test project
    await tools.deleteProject({
      projectName: projectName
    });
    console.log(`   ✅ Deleted project: ${projectName}`);
  } catch (error) {
    console.log(`   ⚠️  Could not delete project: ${error.message}`);
  }
}

// Run tests
(async () => {
  try {
    const createdProject = await testGroup2Functions();
    await cleanupGroup2(createdProject);
  } catch (error) {
    console.error('Test suite failed:', error);
  }
})();