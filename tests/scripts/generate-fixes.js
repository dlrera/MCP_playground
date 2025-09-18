// Script to generate comprehensive fixes for all OmniFocus functions

const fs = require('fs');
const path = require('path');

// Read the current file
const filePath = path.join(__dirname, 'src/omnifocus-tools.ts');
let fileContent = fs.readFileSync(filePath, 'utf8');

// List of functions that need fixing with their parameters
const functionsToFix = {
  createTask: ['name', 'note', 'project', 'context', 'dueDate', 'deferDate'],
  createProject: ['name', 'note', 'folder'],
  completeTask: ['taskName', 'project'],
  searchTasks: ['query'],
  archiveProject: ['projectName'],
  deleteProject: ['projectName'],
  setProjectFlag: ['projectName'],
  setTaskDates: ['taskName', 'project'],
  setProjectDates: ['projectName'],
  moveProject: ['projectName', 'toFolder'],
  getTaskNote: ['taskName', 'project'],
  getProjectNote: ['projectName'],
  getProjectLink: ['projectName'],
  listTasks: ['project', 'context'],
  createContext: ['name', 'parent'],
  getPerspectiveContents: ['perspectiveName']
};

// Generate the escaping code for each function
Object.entries(functionsToFix).forEach(([funcName, params]) => {
  console.log(`\n// Fix for ${funcName}`);
  console.log(`// Add after: async ${funcName}(args: ...`);

  params.forEach(param => {
    const escapedName = 'escaped' + param.charAt(0).toUpperCase() + param.slice(1);
    if (param.includes('project') || param.includes('folder') || param.includes('context')) {
      console.log(`    const ${escapedName} = args.${param} ? this.escapeAppleScriptString(args.${param}) : '';`);
    } else {
      console.log(`    const ${escapedName} = this.escapeAppleScriptString(args.${param});`);
    }
  });

  console.log(`// Then replace all \${args.${params[0]}} with \${escaped${params[0].charAt(0).toUpperCase() + params[0].slice(1)}}`);
});

console.log('\n=== Summary ===');
console.log('Total functions to fix:', Object.keys(functionsToFix).length);
console.log('\nRecommendation: Due to the extensive changes needed,');
console.log('consider creating a new version of the file with all fixes applied.');
console.log('This would be safer than attempting 22+ individual edits.');