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
        description: 'Create a new task in OmniFocus',
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
              description: 'Optional project name to add the task to',
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
        description: 'List all active projects in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            includeCompleted: {
              type: 'boolean',
              description: 'Include completed projects in the list',
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
        description: 'Archive (complete) a project in OmniFocus',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project to archive',
            },
          },
          required: ['projectName'],
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