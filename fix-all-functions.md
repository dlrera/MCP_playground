# OmniFocus MCP Functions - Comprehensive Fix Plan

## Functions That Need Fixing (22 total)

### Critical Functions (Most Used)
1. **createTask** - No escaping for name, note, project, context, dates
2. **createProject** - No escaping for name, note, folder
3. **completeTask** - No escaping for taskName, project
4. **searchTasks** - No escaping for query
5. **archiveProject** - No escaping for projectName

### Project Management Functions
6. **editProject** - Missing escaping for projectName (has some for other fields)
7. **deleteProject** - No escaping for projectName
8. **setProjectFlag** - No escaping for projectName
9. **setProjectDates** - No escaping for projectName
10. **moveProject** - No escaping for projectName, toFolder
11. **getProjectNote** - No escaping for projectName
12. **getProjectLink** - No escaping for projectName

### Task Management Functions
13. **setTaskDates** - No escaping for taskName, project
14. **getTaskNote** - No escaping for taskName, project

### List/Query Functions
15. **listProjects** - Minimal escaping needed
16. **listTasks** - No escaping for project, context
17. **listFolders** - Minimal escaping needed
18. **listTagsHierarchy** - Minimal escaping needed
19. **listFolderHierarchy** - Minimal escaping needed

### Context/Tag Functions
20. **createContext** - No escaping for name, parent
21. **listContexts** - Minimal escaping needed

### Navigation Functions
22. **getPerspectiveContents** - No escaping for perspectiveName

## Functions Already Fixed (8 total)
✅ editTask
✅ moveTask
✅ deleteTask
✅ setTaskFlag
✅ setProjectStatus
✅ getTagDetails
✅ switchPerspective
✅ getFolderDetails (partial)

## Key Patterns to Fix

1. **Add escaping at function start:**
```typescript
const escapedName = this.escapeAppleScriptString(args.name);
const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';
```

2. **Replace all ${args.xxx} with ${escapedXxx}**

3. **Improve search logic for:**
- Finding projects in nested folders
- Finding tasks in inbox vs projects
- Handling special characters in names

## Priority Order
1. Fix createTask (most critical)
2. Fix completeTask
3. Fix createProject
4. Fix remaining task functions
5. Fix project functions
6. Fix list/query functions