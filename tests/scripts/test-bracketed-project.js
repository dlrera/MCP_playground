import { OmniFocusTools } from './dist/omnifocus-tools.js';

const tools = new OmniFocusTools();

async function testBracketedProject() {
  console.log('Testing task operations with bracketed project name\n');

  const projectName = '[Misc Father Items]';
  const taskName = 'Bring books to car for John';

  try {
    console.log('1. Testing setTaskFlag without project...');
    const flagResult = await tools.setTaskFlag({
      taskName: taskName,
      flagged: true
    });
    console.log('   Result:', flagResult.content[0].text);

  } catch (error) {
    console.error('   Error:', error.message);
  }

  try {
    console.log('\n2. Testing setTaskFlag with bracketed project...');
    const flagWithProjectResult = await tools.setTaskFlag({
      taskName: taskName,
      project: projectName,
      flagged: true
    });
    console.log('   Result:', flagWithProjectResult.content[0].text);

  } catch (error) {
    console.error('   Error:', error.message);
  }

  try {
    console.log('\n3. Testing editTask to add Home tag...');
    const editResult = await tools.editTask({
      taskName: taskName,
      project: projectName,
      newContext: 'Home',
      flagged: true
    });
    console.log('   Result:', editResult.content[0].text);

  } catch (error) {
    console.error('   Error:', error.message);
  }

  console.log('\n================================');
  console.log('Test complete. Check OmniFocus to verify the task updates.');
}

testBracketedProject().catch(console.error);