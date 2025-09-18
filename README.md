# OmniFocus MCP Server

A Model Context Protocol (MCP) server that enables automation and interaction with OmniFocus 3 through AppleScript integration.

## Features

- **Task Management**: Create, edit, move, delete, and complete tasks
- **Project Management**: Create, edit, archive, and delete projects  
- **Context/Tag Management**: Create and list contexts with hierarchical support
- **Advanced Search**: Find tasks by name or note content
- **Task Organization**: Move tasks between projects and assign contexts
- **Task Status**: Flag/unflag tasks and set completion status
- **Comprehensive Listing**: View projects, tasks, and contexts with filtering options

## Requirements

- macOS with OmniFocus 3 installed
- Node.js 18 or higher
- AppleScript support enabled

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the server
   ```bash
   npm run build
   ```

3. Configure the MCP server in Claude Code by adding this to your MCP settings:
   ```json
   {
     "mcpServers": {
       "omnifocus": {
         "command": "node",
         "args": ["dist/index.js"],
         "cwd": "/path/to/your/omnifocus-mcp-server"
       }
     }
   }
   ```

## Available Tools

### Task Management

#### create_task
Create a new task in OmniFocus
- `name` (required): Task name
- `note` (optional): Task note
- `project` (optional): Project name to add the task to
- `context` (optional): Context/tag for the task
- `dueDate` (optional): Due date in YYYY-MM-DD format
- `deferDate` (optional): Defer date in YYYY-MM-DD format

#### edit_task
Edit an existing task in OmniFocus
- `taskName` (required): Current name of the task to edit
- `project` (optional): Project name to narrow the search
- `newName` (optional): New name for the task
- `newNote` (optional): New note for the task
- `newProject` (optional): Move task to this project
- `newContext` (optional): Set new context/tag for the task
- `newDueDate` (optional): New due date in YYYY-MM-DD format
- `newDeferDate` (optional): New defer date in YYYY-MM-DD format
- `flagged` (optional): Set flagged status (true/false)

#### move_task
Move a task from one project to another
- `taskName` (required): Name of the task to move
- `fromProject` (optional): Source project name
- `toProject` (required): Destination project name

#### delete_task
Delete a task from OmniFocus
- `taskName` (required): Name of the task to delete
- `project` (optional): Project name to narrow the search

#### complete_task
Mark a task as completed
- `taskName` (required): Name of the task to complete
- `project` (optional): Project name to narrow search

#### set_task_flag
Set or unset the flagged status of a task
- `taskName` (required): Name of the task to flag/unflag
- `project` (optional): Project name to narrow the search
- `flagged` (required): Whether to flag (true) or unflag (false) the task

#### list_tasks
List tasks with optional filtering
- `project` (optional): Filter by project name
- `context` (optional): Filter by context/tag
- `includeCompleted` (optional): Include completed tasks

#### search_tasks
Search for tasks by name or note content
- `query` (required): Search query

### Project Management

#### create_project
Create a new project in OmniFocus
- `name` (required): Project name
- `note` (optional): Project note
- `folder` (optional): Folder to place the project in
- `type` (optional): Project type (parallel, sequential, single)

#### edit_project
Edit an existing project in OmniFocus
- `projectName` (required): Current name of the project to edit
- `newName` (optional): New name for the project
- `newNote` (optional): New note for the project
- `newFolder` (optional): Move project to this folder
- `newType` (optional): Change project type (parallel, sequential, single)

#### delete_project
Delete a project from OmniFocus
- `projectName` (required): Name of the project to delete

#### archive_project
Archive (complete) a project in OmniFocus
- `projectName` (required): Name of the project to archive

#### list_projects
List all projects
- `includeCompleted` (optional): Include completed projects

### Context/Tag Management

#### create_context
Create a new context/tag in OmniFocus
- `name` (required): Name of the context to create
- `parent` (optional): Parent context name for hierarchical organization

#### list_contexts
List all contexts/tags in OmniFocus
- `includeInactive` (optional): Include inactive contexts in the list

## Development

- `npm run dev`: Watch mode for development
- `npm run build`: Build the TypeScript code
- `npm start`: Run the compiled server

## License

MIT