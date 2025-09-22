#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { OmniFocusTools } from './omnifocus-tools.js';

const server = new Server(
  {
    name: 'omnifocus-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const omniFocusTools = new OmniFocusTools();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'create_task',
        description: 'Create a new task in OmniFocus (searches for project in all folders)',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the task',
            },
            note: {
              type: 'string',
              description: 'Optional note for the task',
            },
            project: {
              type: 'string',
              description: 'Optional project name to add the task to (searches all folders and subfolders)',
            },
            project_id: {
              type: 'string',
              description: 'Optional OmniFocus project ID to add the task to (use either project or project_id, not both)',
            },
            context: {
              type: 'string',
              description: 'Optional context/tag for the task',
            },
            dueDate: {
              type: 'string',
              description: 'Optional due date (YYYY-MM-DD format)',
            },
            deferDate: {
              type: 'string',
              description: 'Optional defer date (YYYY-MM-DD format)',
            },
            estimatedMinutes: {
              type: 'number',
              description: 'Optional estimated duration in minutes',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'create_project',
        description: 'Create a new project in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'The name of the project',
            },
            note: {
              type: 'string',
              description: 'Optional note for the project',
            },
            folder: {
              type: 'string',
              description: 'Optional folder to place the project in',
            },
            type: {
              type: 'string',
              enum: ['parallel', 'sequential', 'single'],
              description: 'Project type (parallel, sequential, or single)',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_projects',
        description: 'List projects in OmniFocus with advanced filtering options',
        inputSchema: {
          type: 'object',
          properties: {
            includeCompleted: {
              type: 'boolean',
              description: 'Include completed projects in the list',
            },
            incompleteOnly: {
              type: 'boolean',
              description: 'Show only incomplete projects (same as includeCompleted: false)',
            },
            emptyProjectsOnly: {
              type: 'boolean',
              description: 'Show only projects that have no incomplete tasks',
            },
          },
        },
      },
      {
        name: 'list_tasks',
        description: 'List tasks in OmniFocus with optional filtering',
        inputSchema: {
          type: 'object',
          properties: {
            project: {
              type: 'string',
              description: 'Filter tasks by project name',
            },
            context: {
              type: 'string',
              description: 'Filter tasks by context/tag',
            },
            includeCompleted: {
              type: 'boolean',
              description: 'Include completed tasks in the list',
            },
            inboxOnly: {
              type: 'boolean',
              description: 'Only list tasks from the inbox (excludes project tasks)',
            },
          },
        },
      },
      {
        name: 'complete_task',
        description: 'Mark a task as completed in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            taskName: {
              type: 'string',
              description: 'The name of the task to complete',
            },
            project: {
              type: 'string',
              description: 'Optional project name to narrow the search',
            },
          },
          required: ['taskName'],
        },
      },
      {
        name: 'search_tasks',
        description: 'Search for tasks in OmniFocus by name or note content',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query to match against task names and notes',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'edit_task',
        description: 'Edit an existing task in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            taskName: {
              type: 'string',
              description: 'Current name of the task to edit',
            },
            project: {
              type: 'string',
              description: 'Optional project name to narrow the search',
            },
            newName: {
              type: 'string',
              description: 'New name for the task',
            },
            newNote: {
              type: 'string',
              description: 'New note for the task',
            },
            newProject: {
              type: 'string',
              description: 'Move task to this project',
            },
            newContext: {
              type: 'string',
              description: 'Set new context/tag for the task',
            },
            newDueDate: {
              type: 'string',
              description: 'New due date (YYYY-MM-DD format)',
            },
            newDeferDate: {
              type: 'string',
              description: 'New defer date (YYYY-MM-DD format)',
            },
            flagged: {
              type: 'boolean',
              description: 'Set flagged status',
            },
            estimatedMinutes: {
              type: 'number',
              description: 'Set estimated duration in minutes',
            },
          },
          required: ['taskName'],
        },
      },
      {
        name: 'move_task',
        description: 'Move a task from one project to another',
        inputSchema: {
          type: 'object',
          properties: {
            taskName: {
              type: 'string',
              description: 'Name of the task to move',
            },
            fromProject: {
              type: 'string',
              description: 'Optional source project name',
            },
            toProject: {
              type: 'string',
              description: 'Destination project name',
            },
          },
          required: ['taskName', 'toProject'],
        },
      },
      {
        name: 'edit_project',
        description: 'Edit an existing project in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Current name of the project to edit',
            },
            newName: {
              type: 'string',
              description: 'New name for the project',
            },
            newNote: {
              type: 'string',
              description: 'New note for the project',
            },
            newFolder: {
              type: 'string',
              description: 'Move project to this folder',
            },
            newType: {
              type: 'string',
              enum: ['parallel', 'sequential', 'single'],
              description: 'Change project type',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'delete_task',
        description: 'Delete a task from OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            taskName: {
              type: 'string',
              description: 'Name of the task to delete',
            },
            project: {
              type: 'string',
              description: 'Optional project name to narrow the search',
            },
          },
          required: ['taskName'],
        },
      },
      {
        name: 'delete_project',
        description: 'Delete a project from OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to delete',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'create_context',
        description: 'Create a new context/tag in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name of the context to create',
            },
            parent: {
              type: 'string',
              description: 'Optional parent context name',
            },
          },
          required: ['name'],
        },
      },
      {
        name: 'list_contexts',
        description: 'List all contexts/tags in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            includeInactive: {
              type: 'boolean',
              description: 'Include inactive contexts in the list',
            },
          },
        },
      },
      {
        name: 'set_task_flag',
        description: 'Set or unset the flagged status of a task',
        inputSchema: {
          type: 'object',
          properties: {
            taskName: {
              type: 'string',
              description: 'Name of the task to flag/unflag',
            },
            project: {
              type: 'string',
              description: 'Optional project name to narrow the search',
            },
            flagged: {
              type: 'boolean',
              description: 'Whether to flag (true) or unflag (false) the task',
            },
          },
          required: ['taskName', 'flagged'],
        },
      },
      {
        name: 'archive_project',
        description: 'Archive a project by setting its status to completed or dropped',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to archive',
            },
            status: {
              type: 'string',
              enum: ['completed', 'dropped'],
              description: 'Status to set for the project (completed or dropped). Defaults to completed.',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'set_project_status',
        description: 'Set the status of a project to active, on-hold, completed, or dropped',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to change status for',
            },
            status: {
              type: 'string',
              enum: ['active', 'on-hold', 'completed', 'dropped'],
              description: 'Status to set for the project',
            },
          },
          required: ['projectName', 'status'],
        },
      },
      {
        name: 'set_project_flag',
        description: 'Set the flagged status of a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to flag/unflag',
            },
            flagged: {
              type: 'boolean',
              description: 'Whether to flag (true) or unflag (false) the project',
            },
          },
          required: ['projectName', 'flagged'],
        },
      },
      {
        name: 'set_task_dates',
        description: 'Set due date, defer date, and/or duration for a task',
        inputSchema: {
          type: 'object',
          properties: {
            taskName: {
              type: 'string',
              description: 'Name of the task to update',
            },
            project: {
              type: 'string',
              description: 'Optional project name to narrow the search',
            },
            dueDate: {
              type: 'string',
              description: 'Due date in YYYY-MM-DD format (optional)',
            },
            deferDate: {
              type: 'string',
              description: 'Defer date in YYYY-MM-DD format (optional)',
            },
            estimatedMinutes: {
              type: 'number',
              description: 'Estimated duration in minutes (optional)',
            },
          },
          required: ['taskName'],
        },
      },
      {
        name: 'set_project_dates',
        description: 'Set due date and/or defer date for a project',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to update',
            },
            dueDate: {
              type: 'string',
              description: 'Due date in YYYY-MM-DD format (optional)',
            },
            deferDate: {
              type: 'string',
              description: 'Defer date in YYYY-MM-DD format (optional)',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'move_project',
        description: 'Get guidance for manually moving a project to a different folder (OmniFocus does not support automated project moving)',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to move',
            },
            toFolder: {
              type: 'string',
              description: 'Name of the destination folder',
            },
          },
          required: ['projectName', 'toFolder'],
        },
      },
      {
        name: 'list_folders',
        description: 'List all folders in OmniFocus with optional project counts',
        inputSchema: {
          type: 'object',
          properties: {
            includeProjectCounts: {
              type: 'boolean',
              description: 'Include project counts for each folder',
            },
            includeEmptyFolders: {
              type: 'boolean',
              description: 'Include folders with no projects',
            },
          },
        },
      },
      {
        name: 'get_folder_details',
        description: 'Get detailed information about a specific folder',
        inputSchema: {
          type: 'object',
          properties: {
            folderName: {
              type: 'string',
              description: 'Name of the folder to get details for',
            },
          },
          required: ['folderName'],
        },
      },
      {
        name: 'list_tags_hierarchy',
        description: 'List tags in hierarchical format with optional usage statistics',
        inputSchema: {
          type: 'object',
          properties: {
            includeInactive: {
              type: 'boolean',
              description: 'Include inactive tags in the hierarchy',
            },
            includeUsageStats: {
              type: 'boolean',
              description: 'Include task count statistics for each tag',
            },
          },
        },
      },
      {
        name: 'get_tag_details',
        description: 'Get detailed information about a specific tag',
        inputSchema: {
          type: 'object',
          properties: {
            tagName: {
              type: 'string',
              description: 'Name of the tag to get details for',
            },
          },
          required: ['tagName'],
        },
      },
      {
        name: 'list_folder_hierarchy',
        description: 'List complete folder hierarchy with subfolders and their contents',
        inputSchema: {
          type: 'object',
          properties: {
            includeProjectCounts: {
              type: 'boolean',
              description: 'Include project counts for each folder',
            },
            includeTaskCounts: {
              type: 'boolean',
              description: 'Include active task counts for each project',
            },
            includeEmptyFolders: {
              type: 'boolean',
              description: 'Include folders even if they have no projects',
            },
          },
        },
      },
      {
        name: 'get_project_link',
        description: 'Get a hyperlink to a specific project for use in markdown notes or other documents',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to get link for',
            },
            format: {
              type: 'string',
              enum: ['url', 'markdown', 'html'],
              description: 'Format for the link (url, markdown, or html). Defaults to markdown.',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'get_task_note',
        description: 'Get the note content of a specific task along with task details',
        inputSchema: {
          type: 'object',
          properties: {
            taskName: {
              type: 'string',
              description: 'Name of the task to get note for',
            },
            project: {
              type: 'string',
              description: 'Optional project name to narrow the search',
            },
          },
          required: ['taskName'],
        },
      },
      {
        name: 'get_project_note',
        description: 'Get the note content of a specific project along with project details',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to get note for',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'list_perspectives',
        description: 'List all available perspectives in OmniFocus (built-in and custom)',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_current_perspective',
        description: 'Get the currently active perspective in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'switch_perspective',
        description: 'Switch to a different perspective in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            perspectiveName: {
              type: 'string',
              description: 'Name of the perspective to switch to',
            },
          },
          required: ['perspectiveName'],
        },
      },
      {
        name: 'get_perspective_contents',
        description: 'Get the visible items in a perspective (tasks, projects, folders)',
        inputSchema: {
          type: 'object',
          properties: {
            perspectiveName: {
              type: 'string',
              description: 'Name of the perspective to view (uses current if not specified)',
            },
          },
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'create_task':
        return await omniFocusTools.createTask(args as any);
      case 'create_project':
        return await omniFocusTools.createProject(args as any);
      case 'list_projects':
        return await omniFocusTools.listProjects(args as any);
      case 'list_tasks':
        return await omniFocusTools.listTasks(args as any);
      case 'complete_task':
        return await omniFocusTools.completeTask(args as any);
      case 'search_tasks':
        return await omniFocusTools.searchTasks(args as any);
      case 'edit_task':
        return await omniFocusTools.editTask(args as any);
      case 'move_task':
        return await omniFocusTools.moveTask(args as any);
      case 'edit_project':
        return await omniFocusTools.editProject(args as any);
      case 'delete_task':
        return await omniFocusTools.deleteTask(args as any);
      case 'delete_project':
        return await omniFocusTools.deleteProject(args as any);
      case 'create_context':
        return await omniFocusTools.createContext(args as any);
      case 'list_contexts':
        return await omniFocusTools.listContexts(args as any);
      case 'set_task_flag':
        return await omniFocusTools.setTaskFlag(args as any);
      case 'archive_project':
        return await omniFocusTools.archiveProject(args as any);
      case 'set_project_status':
        return await omniFocusTools.setProjectStatus(args as any);
      case 'set_project_flag':
        return await omniFocusTools.setProjectFlag(args as any);
      case 'set_task_dates':
        return await omniFocusTools.setTaskDates(args as any);
      case 'set_project_dates':
        return await omniFocusTools.setProjectDates(args as any);
      case 'move_project':
        return await omniFocusTools.moveProject(args as any);
      case 'list_folders':
        return await omniFocusTools.listFolders(args as any);
      case 'get_folder_details':
        return await omniFocusTools.getFolderDetails(args as any);
      case 'list_tags_hierarchy':
        return await omniFocusTools.listTagsHierarchy(args as any);
      case 'get_tag_details':
        return await omniFocusTools.getTagDetails(args as any);
      case 'list_folder_hierarchy':
        return await omniFocusTools.listFolderHierarchy(args as any);
      case 'get_project_link':
        return await omniFocusTools.getProjectLink(args as any);
      case 'get_task_note':
        return await omniFocusTools.getTaskNote(args as any);
      case 'get_project_note':
        return await omniFocusTools.getProjectNote(args as any);
      case 'list_perspectives':
        return await omniFocusTools.listPerspectives();
      case 'get_current_perspective':
        return await omniFocusTools.getCurrentPerspective();
      case 'switch_perspective':
        return await omniFocusTools.switchPerspective(args as any);
      case 'get_perspective_contents':
        return await omniFocusTools.getPerspectiveContents(args as any);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('OmniFocus MCP Server running on stdio');
}

main().catch(console.error);