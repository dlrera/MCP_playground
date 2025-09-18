import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface CreateTaskArgs {
  name: string;
  note?: string;
  project?: string;
  context?: string;
  dueDate?: string;
  deferDate?: string;
  estimatedMinutes?: number;
}

export interface CreateProjectArgs {
  name: string;
  note?: string;
  folder?: string;
  type?: 'parallel' | 'sequential' | 'single';
}

export interface ListProjectsArgs {
  includeCompleted?: boolean;
  incompleteOnly?: boolean;
  emptyProjectsOnly?: boolean;
}

export interface ListTasksArgs {
  project?: string;
  context?: string;
  includeCompleted?: boolean;
  inboxOnly?: boolean;
}

export interface CompleteTaskArgs {
  taskName: string;
  project?: string;
}

export interface SearchTasksArgs {
  query: string;
}

export interface EditTaskArgs {
  taskName: string;
  project?: string;
  newName?: string;
  newNote?: string;
  newProject?: string;
  newContext?: string;
  newDueDate?: string;
  newDeferDate?: string;
  flagged?: boolean;
  estimatedMinutes?: number;
}

export interface MoveTaskArgs {
  taskName: string;
  fromProject?: string;
  toProject: string;
}

export interface EditProjectArgs {
  projectName: string;
  newName?: string;
  newNote?: string;
  newFolder?: string;
  newType?: 'parallel' | 'sequential' | 'single';
  newContext?: string;
}

export interface DeleteTaskArgs {
  taskName: string;
  project?: string;
}

export interface DeleteProjectArgs {
  projectName: string;
}

export interface CreateContextArgs {
  name: string;
  parent?: string;
}

export interface ListContextsArgs {
  includeInactive?: boolean;
}

export interface SetTaskFlagArgs {
  taskName: string;
  project?: string;
  flagged: boolean;
}

export interface ArchiveProjectArgs {
  projectName: string;
  status?: 'completed' | 'dropped';
}

export interface SetProjectStatusArgs {
  projectName: string;
  status: 'active' | 'on-hold' | 'completed' | 'dropped';
}

export interface SetProjectFlagArgs {
  projectName: string;
  flagged: boolean;
}

export interface SetTaskDatesArgs {
  taskName: string;
  project?: string;
  dueDate?: string;
  deferDate?: string;
  estimatedMinutes?: number;
}

export interface SetProjectDatesArgs {
  projectName: string;
  dueDate?: string;
  deferDate?: string;
}

export interface MoveProjectArgs {
  projectName: string;
  toFolder: string;
}

export interface ListFoldersArgs {
  includeProjectCounts?: boolean;
  includeEmptyFolders?: boolean;
}

export interface ListTagsArgs {
  includeInactive?: boolean;
  includeUsageStats?: boolean;
}

export interface GetFolderDetailsArgs {
  folderName: string;
}

export interface GetTagDetailsArgs {
  tagName: string;
}

export interface ListFolderHierarchyArgs {
  includeProjectCounts?: boolean;
  includeTaskCounts?: boolean;
  includeEmptyFolders?: boolean;
}

export interface GetProjectLinkArgs {
  projectName: string;
  format?: 'url' | 'markdown' | 'html';
}

export interface GetTaskNoteArgs {
  taskName: string;
  project?: string;
}

export interface GetProjectNoteArgs {
  projectName: string;
}

export interface SwitchPerspectiveArgs {
  perspectiveName: string;
}

export interface GetPerspectiveContentsArgs {
  perspectiveName?: string;
}

export class OmniFocusTools {
  private escapeAppleScriptString(str: string): string {
    // Escape backslashes first, then quotes
    return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  }

  private async runAppleScript(script: string): Promise<string> {
    try {
      // Use temporary file for complex scripts to avoid shell escaping issues
      const fs = await import('fs/promises');
      const os = await import('os');
      const path = await import('path');

      const tmpDir = os.tmpdir();
      const tmpFile = path.join(tmpDir, `omnifocus-${Date.now()}.applescript`);

      await fs.writeFile(tmpFile, script);

      try {
        const { stdout, stderr } = await execAsync(`osascript "${tmpFile}"`);
        if (stderr) {
          // Keep temp file for debugging on error
          console.error(`AppleScript failed. Debug file: ${tmpFile}`);
          throw new Error(`AppleScript error: ${stderr}`);
        }
        // Clean up temp file on success
        await fs.unlink(tmpFile).catch(() => {});
        return stdout.trim();
      } catch (err) {
        // Re-throw with file info
        throw err;
      }
    } catch (error) {
      throw new Error(`Failed to execute AppleScript: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toISOString();
  }

  async createTask(args: CreateTaskArgs) {
    const escapedName = this.escapeAppleScriptString(args.name);
    const escapedNote = args.note ? this.escapeAppleScriptString(args.note) : '';
    const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set newTask to make new inbox task with properties {name:"${escapedName}"`;
    
    if (args.note) {
      script += `, note:"${escapedNote}"`;
    }
    
    if (args.dueDate) {
      script += `, due date:date "${args.dueDate}"`;
    }
    
    if (args.deferDate) {
      script += `, defer date:date "${args.deferDate}"`;
    }
    
    script += `}
        
        set taskID to id of newTask`;

    if (args.project) {
      script += `
        set targetProject to missing value

        -- First try to find project at top level
        try
          set targetProject to first project whose name is "${escapedProject}"
        end try

        -- If not found, search in all folders (using flattened projects for comprehensive search)
        if targetProject is missing value then
          try
            set targetProject to first flattened project whose name is "${escapedProject}"
          end try
        end if

        if targetProject is not missing value then
          -- Use assign instead of move for better reliability
          set assigned container of newTask to targetProject
        else
          error "Project not found: ${escapedProject}"
        end if`;
    }

    if (args.context) {
      const escapedContext = this.escapeAppleScriptString(args.context);
      script += `
        set targetTag to missing value
        
        -- Search tags up to 5 levels deep
        -- Level 1: Top-level tags
        repeat with tag1 in every tag
          if name of tag1 is "${escapedContext}" then
            set targetTag to tag1
            exit repeat
          end if
          
          -- Level 2: Children of top-level tags
          repeat with tag2 in tags of tag1
            if name of tag2 is "${escapedContext}" then
              set targetTag to tag2
              exit repeat
            end if
            
            -- Level 3: Grandchildren
            repeat with tag3 in tags of tag2
              if name of tag3 is "${escapedContext}" then
                set targetTag to tag3
                exit repeat
              end if
              
              -- Level 4: Great-grandchildren
              repeat with tag4 in tags of tag3
                if name of tag4 is "${escapedContext}" then
                  set targetTag to tag4
                  exit repeat
                end if
                
                -- Level 5: Great-great-grandchildren
                repeat with tag5 in tags of tag4
                  if name of tag5 is "${escapedContext}" then
                    set targetTag to tag5
                    exit repeat
                  end if
                end repeat
                if targetTag is not missing value then exit repeat
              end repeat
              if targetTag is not missing value then exit repeat
            end repeat
            if targetTag is not missing value then exit repeat
          end repeat
          if targetTag is not missing value then exit repeat
        end repeat
        
        if targetTag is not missing value then
          set primary tag of newTask to targetTag
        else
          error "Tag not found: ${escapedContext}"
        end if`;
    }

    if (args.estimatedMinutes) {
      script += `
        set estimated minutes of newTask to ${args.estimatedMinutes}`;
    }

    script += `
        return name of newTask & " (ID: " & taskID & ")"
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully created task: ${result}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createProject(args: CreateProjectArgs) {
    const escapedName = this.escapeAppleScriptString(args.name);
    const escapedNote = args.note ? this.escapeAppleScriptString(args.note) : '';
    const escapedFolder = args.folder ? this.escapeAppleScriptString(args.folder) : '';

    let script = `tell application "OmniFocus"
      tell front document`;

    if (args.folder) {
      script += `
        set targetFolder to first flattened folder whose name is "${escapedFolder}"
        set newProject to make new project at end of projects of targetFolder with properties {name:"${escapedName}"`;
    } else {
      script += `
        set newProject to make new project with properties {name:"${escapedName}"`;
    }

    if (args.note) {
      script += `, note:"${escapedNote}"`;
    }

    if (args.type === 'sequential') {
      script += `, sequential:true`;
    } else if (args.type === 'single') {
      script += `, singleton action holder:true`;
    }

    script += `}
        set projectID to id of newProject
        return name of newProject & " (ID: " & projectID & ")"
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully created project: ${result}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listProjects(args: ListProjectsArgs = {}) {
    let script = `tell application "OmniFocus"
      tell front document
        set projectList to ""
        
        -- Collect projects from top level with location info
        set topLevelProjects to every project`;
    
    // Apply proper filtering for incomplete projects (exclude both completed AND dropped)
    if (args.incompleteOnly || !args.includeCompleted) {
      script += ` whose completed is false and status is not dropped status`;
    }
    
    script += `
        repeat with proj in topLevelProjects`;

    // Add status filtering in the loop as well for double safety
    if (args.incompleteOnly || !args.includeCompleted) {
      script += `
          if completed of proj is false and status of proj is not dropped status then`;
    }

    script += `
            set projectInfo to name of proj & " - " & (status of proj as string) & " [Location: Top Level]"`;

    // Add task count and filtering logic
    if (args.emptyProjectsOnly) {
      script += `
            set incompleteTaskCount to count of (tasks of proj whose completed is false)
            if incompleteTaskCount is 0 then
              set projectInfo to projectInfo & " [No incomplete tasks]"
              set projectList to projectList & projectInfo & "\\n"
            end if`;
    } else {
      script += `
            set incompleteTaskCount to count of (tasks of proj whose completed is false)
            if incompleteTaskCount > 0 then
              set projectInfo to projectInfo & " [" & incompleteTaskCount & " incomplete tasks]"
            else
              set projectInfo to projectInfo & " [No incomplete tasks]"
            end if
            set projectList to projectList & projectInfo & "\\n"`;
    }

    if (args.incompleteOnly || !args.includeCompleted) {
      script += `
          end if`;
    }

    script += `
        end repeat
        
        -- Collect projects from all folders and subfolders with explicit location
        repeat with fld in every folder
          set folderProjects to every project of fld`;
    
    if (args.incompleteOnly || !args.includeCompleted) {
      script += ` whose completed is false and status is not dropped status`;
    }
    
    script += `
          repeat with proj in folderProjects`;

    if (args.incompleteOnly || !args.includeCompleted) {
      script += `
            if completed of proj is false and status of proj is not dropped status then`;
    }

    script += `
              set projectInfo to name of proj & " - " & (status of proj as string) & " [Location: " & name of fld & "]"`;

    if (args.emptyProjectsOnly) {
      script += `
              set incompleteTaskCount to count of (tasks of proj whose completed is false)
              if incompleteTaskCount is 0 then
                set projectInfo to projectInfo & " [No incomplete tasks]"
                set projectList to projectList & projectInfo & "\\n"
              end if`;
    } else {
      script += `
              set incompleteTaskCount to count of (tasks of proj whose completed is false)
              if incompleteTaskCount > 0 then
                set projectInfo to projectInfo & " [" & incompleteTaskCount & " incomplete tasks]"
              else
                set projectInfo to projectInfo & " [No incomplete tasks]"
              end if
              set projectList to projectList & projectInfo & "\\n"`;
    }

    if (args.incompleteOnly || !args.includeCompleted) {
      script += `
            end if`;
    }

    script += `
          end repeat
          
          -- Check subfolders (level 2)
          repeat with subfld in folders of fld
            set subfolderProjects to every project of subfld`;
    
    if (args.incompleteOnly || !args.includeCompleted) {
      script += ` whose completed is false and status is not dropped status`;
    }
    
    script += `
            repeat with proj in subfolderProjects`;

    if (args.incompleteOnly || !args.includeCompleted) {
      script += `
              if completed of proj is false and status of proj is not dropped status then`;
    }

    script += `
                set projectInfo to name of proj & " - " & (status of proj as string) & " [Location: " & name of fld & " > " & name of subfld & "]"`;

    if (args.emptyProjectsOnly) {
      script += `
                set incompleteTaskCount to count of (tasks of proj whose completed is false)
                if incompleteTaskCount is 0 then
                  set projectInfo to projectInfo & " [No incomplete tasks]"
                  set projectList to projectList & projectInfo & "\\n"
                end if`;
    } else {
      script += `
                set incompleteTaskCount to count of (tasks of proj whose completed is false)
                if incompleteTaskCount > 0 then
                  set projectInfo to projectInfo & " [" & incompleteTaskCount & " incomplete tasks]"
                else
                  set projectInfo to projectInfo & " [No incomplete tasks]"
                end if
                set projectList to projectList & projectInfo & "\\n"`;
    }

    if (args.incompleteOnly || !args.includeCompleted) {
      script += `
              end if`;
    }

    script += `
            end repeat
            
            -- Check nested subfolders (level 3) - like HelixIntel
            repeat with nestedSubfld in folders of subfld
              set nestedSubfolderProjects to every project of nestedSubfld`;
    
    if (args.incompleteOnly || !args.includeCompleted) {
      script += ` whose completed is false and status is not dropped status`;
    }
    
    script += `
              repeat with proj in nestedSubfolderProjects`;

    if (args.incompleteOnly || !args.includeCompleted) {
      script += `
                if completed of proj is false and status of proj is not dropped status then`;
    }

    script += `
                  set projectInfo to name of proj & " - " & (status of proj as string) & " [Location: " & name of fld & " > " & name of subfld & " > " & name of nestedSubfld & "]"`;

    if (args.emptyProjectsOnly) {
      script += `
                  set incompleteTaskCount to count of (tasks of proj whose completed is false)
                  if incompleteTaskCount is 0 then
                    set projectInfo to projectInfo & " [No incomplete tasks]"
                    set projectList to projectList & projectInfo & "\\n"
                  end if`;
    } else {
      script += `
                  set incompleteTaskCount to count of (tasks of proj whose completed is false)
                  if incompleteTaskCount > 0 then
                    set projectInfo to projectInfo & " [" & incompleteTaskCount & " incomplete tasks]"
                  else
                    set projectInfo to projectInfo & " [No incomplete tasks]"
                  end if
                  set projectList to projectList & projectInfo & "\\n"`;
    }

    if (args.incompleteOnly || !args.includeCompleted) {
      script += `
                end if`;
    }

    script += `
              end repeat
            end repeat
          end repeat
        end repeat
        
        return projectList
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result || 'No projects found',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list projects: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listTasks(args: ListTasksArgs = {}) {
    // Default to excluding completed tasks unless explicitly requested
    const includeCompleted = args.includeCompleted === true;
    const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';
    const escapedContext = args.context ? this.escapeAppleScriptString(args.context) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set taskList to ""
        set allTasks to {}
        
        -- Get project tasks`;
    
    if (args.inboxOnly) {
      // Only get inbox tasks when explicitly requested
      script += `
        set inboxTasks to every inbox task`;
      if (!includeCompleted) {
        script += ` whose completed is false`;
      }
      if (args.context) {
        script += ` and primary tag's name is "${escapedContext}"`;
      }
      script += `
        set allTasks to inboxTasks`;
    } else if (args.project) {
      // Use nested search for specific project
      script += `
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProject}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProject}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProject}"
                exit repeat
              end try
              -- Check nested subfolders (3-level deep like HelixIntel)
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProject}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          set projectTasks to every task of targetProject`;
      if (!includeCompleted) {
        script += ` whose completed is false`;
      }
      if (args.context) {
        script += ` and primary tag's name is "${escapedContext}"`;
      }
      script += `
          set allTasks to projectTasks
        else
          return "ERROR: Project not found: ${escapedProject}"
        end if`;
    } else {
      script += `
        -- Get tasks from top-level projects
        repeat with proj in every project
          set projTasks to every task of proj`;
      if (!includeCompleted) {
        script += ` whose completed is false`;
      }
      if (args.context) {
        script += ` and primary tag's name is "${escapedContext}"`;
      }
      script += `
          set allTasks to allTasks & projTasks
        end repeat
        
        -- Get tasks from projects in folders (3-level deep search)
        repeat with fld in every folder
          -- Level 1: Direct projects in folder
          repeat with proj in every project of fld
            set projTasks to every task of proj`;
      if (!includeCompleted) {
        script += ` whose completed is false`;
      }
      if (args.context) {
        script += ` and primary tag's name is "${escapedContext}"`;
      }
      script += `
            set allTasks to allTasks & projTasks
          end repeat
          
          -- Level 2: Projects in subfolders
          repeat with subfld in folders of fld
            repeat with proj in every project of subfld
              set projTasks to every task of proj`;
      if (!includeCompleted) {
        script += ` whose completed is false`;
      }
      if (args.context) {
        script += ` and primary tag's name is "${escapedContext}"`;
      }
      script += `
              set allTasks to allTasks & projTasks
            end repeat
            
            -- Level 3: Projects in nested subfolders (like HelixIntel)
            repeat with nestedSubfld in folders of subfld
              repeat with proj in every project of nestedSubfld
                set projTasks to every task of proj`;
      if (!includeCompleted) {
        script += ` whose completed is false`;
      }
      if (args.context) {
        script += ` and primary tag's name is "${escapedContext}"`;
      }
      script += `
                set allTasks to allTasks & projTasks
              end repeat
            end repeat
          end repeat
        end repeat
        
        -- Get inbox tasks
        set inboxTasks to every inbox task`;
      if (!includeCompleted) {
        script += ` whose completed is false`;
      }
      if (args.context) {
        script += ` and primary tag's name is "${escapedContext}"`;
      }
      script += `
        set allTasks to allTasks & inboxTasks`;
    }

    script += `
        
        repeat with tsk in allTasks
          set taskInfo to name of tsk
          try
            if project of tsk is not missing value then
              set taskInfo to taskInfo & " [Project: " & name of project of tsk & "]"
            end if
          on error
            set taskInfo to taskInfo & " [Inbox]"
          end try
          try
            if primary tag of tsk is not missing value then
              set taskInfo to taskInfo & " [Context: " & name of primary tag of tsk & "]"
            end if
          end try
          set taskList to taskList & taskInfo & "\\n"
        end repeat
        return taskList
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result || 'No tasks found',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async completeTask(args: CompleteTaskArgs) {
    const escapedTaskName = this.escapeAppleScriptString(args.taskName);
    const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;

    if (args.project) {
      script += `
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProject}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProject}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProject}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProject}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          set targetTask to first task of targetProject whose name is "${escapedTaskName}"
        end if`;
    } else {
      script += `set targetTask to first task whose name is "${escapedTaskName}"`;
    }

    script += `
        if targetTask is not missing value then
          set completed of targetTask to true
          return "Task completed: " & name of targetTask
        else
          return "Task not found: ${escapedTaskName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to complete task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async searchTasks(args: SearchTasksArgs) {
    const escapedQuery = this.escapeAppleScriptString(args.query);

    const script = `tell application "OmniFocus"
      tell front document
        set searchResults to ""
        set allTasks to {}
        repeat with proj in every project
          set projTasks to every task of proj whose completed is false
          set allTasks to allTasks & projTasks
        end repeat
        
        -- Get tasks from projects in folders
        repeat with fld in every folder
          repeat with proj in every project of fld
            set projTasks to every task of proj whose completed is false
            set allTasks to allTasks & projTasks
          end repeat
        end repeat
        
        set inboxTasks to every inbox task whose completed is false
        set allTasks to allTasks & inboxTasks
        repeat with tsk in allTasks
          set taskName to name of tsk
          set taskNote to note of tsk
          if taskName contains "${escapedQuery}" or taskNote contains "${escapedQuery}" then
            set taskInfo to taskName
            try
              if project of tsk is not missing value then
                set taskInfo to taskInfo & " [Project: " & name of project of tsk & "]"
              end if
            on error
              set taskInfo to taskInfo & " [Inbox]"
            end try
            try
              if primary tag of tsk is not missing value then
                set taskInfo to taskInfo & " [Context: " & name of primary tag of tsk & "]"
              end if
            end try
            set searchResults to searchResults & taskInfo & "\\n"
          end if
        end repeat
        return searchResults
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result || `No tasks found matching: ${escapedQuery}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search tasks: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async editTask(args: EditTaskArgs) {
    const escapedTaskName = this.escapeAppleScriptString(args.taskName);
    const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;

    if (args.project) {
      script += `
        set targetProject to missing value

        -- Search for project in nested folders
        try
          set targetProject to first project whose name is "${escapedProject}"
        end try

        if targetProject is missing value then
          repeat with fld in every folder
            try
              set targetProject to first project of fld whose name is "${escapedProject}"
              exit repeat
            end try
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProject}"
                exit repeat
              end try
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if

        if targetProject is not missing value then
          set targetTask to first task of targetProject whose name is "${escapedTaskName}"
        end if`;
    } else {
      script += `
        -- First try to find in inbox
        try
          set targetTask to first inbox task whose name is "${escapedTaskName}"
        end try
        
        -- If not in inbox, search all projects
        if targetTask is missing value then
          try
            set targetTask to first task whose name is "${escapedTaskName}"
          end try
        end if`;
    }

    script += `
        if targetTask is not missing value then`;

    if (args.newName) {
      script += `
          set name of targetTask to "${args.newName}"`;
    }

    if (args.newNote) {
      script += `
          set note of targetTask to "${args.newNote}"`;
    }

    if (args.newDueDate) {
      script += `
          set due date of targetTask to date "${args.newDueDate}"`;
    }

    if (args.newDeferDate) {
      script += `
          set defer date of targetTask to date "${args.newDeferDate}"`;
    }

    if (args.flagged !== undefined) {
      script += `
          set flagged of targetTask to ${args.flagged}`;
    }

    if (args.estimatedMinutes !== undefined) {
      script += `
          set estimated minutes of targetTask to ${args.estimatedMinutes}`;
    }

    if (args.newProject) {
      script += `
          set targetProject to missing value
          
          -- Search top level first
          try
            set targetProject to first project whose name is "${args.newProject}"
          end try
          
          -- Search in all folders and subfolders if not found
          if targetProject is missing value then
            repeat with fld in every folder
              -- Check projects in folder
              try
                set targetProject to first project of fld whose name is "${args.newProject}"
                exit repeat
              end try
              -- Check subfolders
              repeat with subfld in folders of fld
                try
                  set targetProject to first project of subfld whose name is "${args.newProject}"
                  exit repeat
                end try
                -- Check nested subfolders
                repeat with nestedSubfld in folders of subfld
                  try
                    set targetProject to first project of nestedSubfld whose name is "${args.newProject}"
                    exit repeat
                  end try
                end repeat
                if targetProject is not missing value then exit repeat
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
          end if
          
          if targetProject is not missing value then
            move targetTask to end of tasks of targetProject
          end if`;
    }

    if (args.newContext) {
      const escapedNewContext = this.escapeAppleScriptString(args.newContext);
      script += `
          set targetTag to missing value
          
          -- Search tags up to 5 levels deep
          -- Level 1: Top-level tags
          repeat with tag1 in every tag
            if name of tag1 is "${escapedNewContext}" then
              set targetTag to tag1
              exit repeat
            end if
            
            -- Level 2: Children of top-level tags
            repeat with tag2 in tags of tag1
              if name of tag2 is "${escapedNewContext}" then
                set targetTag to tag2
                exit repeat
              end if
              
              -- Level 3: Grandchildren
              repeat with tag3 in tags of tag2
                if name of tag3 is "${escapedNewContext}" then
                  set targetTag to tag3
                  exit repeat
                end if
                
                -- Level 4: Great-grandchildren
                repeat with tag4 in tags of tag3
                  if name of tag4 is "${escapedNewContext}" then
                    set targetTag to tag4
                    exit repeat
                  end if
                  
                  -- Level 5: Great-great-grandchildren
                  repeat with tag5 in tags of tag4
                    if name of tag5 is "${escapedNewContext}" then
                      set targetTag to tag5
                      exit repeat
                    end if
                  end repeat
                  if targetTag is not missing value then exit repeat
                end repeat
                if targetTag is not missing value then exit repeat
              end repeat
              if targetTag is not missing value then exit repeat
            end repeat
            if targetTag is not missing value then exit repeat
          end repeat
          
          if targetTag is not missing value then
            set primary tag of targetTask to targetTag
          else
            error "Tag not found: ${escapedNewContext}"
          end if`;
    }

    script += `
          return "Task updated: " & name of targetTask
        else
          return "Task not found: ${escapedTaskName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to edit task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async moveTask(args: MoveTaskArgs) {
    const escapedTaskName = this.escapeAppleScriptString(args.taskName);
    const escapedToProject = this.escapeAppleScriptString(args.toProject);
    const escapedFromProject = args.fromProject ? this.escapeAppleScriptString(args.fromProject) : '';
    
    let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;

    if (args.fromProject) {
      script += `
        -- Search in specific project
        try
          set targetProject to first project whose name is "${escapedFromProject}"
          set targetTask to first task of targetProject whose name is "${escapedTaskName}"
        end try`;
    } else {
      script += `
        -- First try to find in inbox
        try
          set targetTask to first inbox task whose name is "${escapedTaskName}"
        end try
        
        -- If not in inbox, search all projects
        if targetTask is missing value then
          try
            set targetTask to first task whose name is "${escapedTaskName}"
          end try
        end if`;
    }

    script += `
        
        if targetTask is not missing value then
          set targetProject to missing value
          
          -- Search top level first
          try
            set targetProject to first project whose name is "${escapedToProject}"
          end try
          
          -- Search in all folders and subfolders if not found
          if targetProject is missing value then
            repeat with fld in every folder
              -- Check projects in folder
              try
                set targetProject to first project of fld whose name is "${escapedToProject}"
                exit repeat
              end try
              -- Check subfolders
              repeat with subfld in folders of fld
                try
                  set targetProject to first project of subfld whose name is "${escapedToProject}"
                  exit repeat
                end try
                -- Check nested subfolders
                repeat with nestedSubfld in folders of subfld
                  try
                    set targetProject to first project of nestedSubfld whose name is "${escapedToProject}"
                    exit repeat
                  end try
                end repeat
                if targetProject is not missing value then exit repeat
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
          end if
          
          if targetProject is not missing value then
            move targetTask to end of tasks of targetProject
            return "Task moved: " & name of targetTask & " to project " & name of targetProject
          else
            return "Destination project not found: ${escapedToProject}"
          end if
        else
          return "Task not found: ${escapedTaskName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to move task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async editProject(args: EditProjectArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);
    const escapedNewName = args.newName ? this.escapeAppleScriptString(args.newName) : '';
    const escapedNewNote = args.newNote ? this.escapeAppleScriptString(args.newNote) : '';
    const escapedNewFolder = args.newFolder ? this.escapeAppleScriptString(args.newFolder) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProjectName}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then`;

    if (args.newName) {
      script += `
          set name of targetProject to "${escapedNewName}"`;
    }

    if (args.newNote) {
      script += `
          set note of targetProject to "${escapedNewNote}"`;
    }

    if (args.newType === 'sequential') {
      script += `
          set sequential of targetProject to true`;
    } else if (args.newType === 'parallel') {
      script += `
          set sequential of targetProject to false`;
    } else if (args.newType === 'single') {
      script += `
          set singleton action holder of targetProject to true`;
    }

    if (args.newFolder) {
      script += `
          set targetFolder to first flattened folder whose name is "${escapedNewFolder}"
          move targetProject to end of projects of targetFolder`;
    }

    if (args.newContext) {
      const escapedNewContext = this.escapeAppleScriptString(args.newContext);
      script += `
          set targetTag to missing value

          -- Search tags up to 5 levels deep
          -- Level 1: Top-level tags
          repeat with tag1 in every tag
            if name of tag1 is "${escapedNewContext}" then
              set targetTag to tag1
              exit repeat
            end if

            -- Level 2: Children of top-level tags
            repeat with tag2 in tags of tag1
              if name of tag2 is "${escapedNewContext}" then
                set targetTag to tag2
                exit repeat
              end if

              -- Level 3: Grandchildren
              repeat with tag3 in tags of tag2
                if name of tag3 is "${escapedNewContext}" then
                  set targetTag to tag3
                  exit repeat
                end if

                -- Level 4: Great-grandchildren
                repeat with tag4 in tags of tag3
                  if name of tag4 is "${escapedNewContext}" then
                    set targetTag to tag4
                    exit repeat
                  end if

                  -- Level 5: Great-great-grandchildren
                  repeat with tag5 in tags of tag4
                    if name of tag5 is "${escapedNewContext}" then
                      set targetTag to tag5
                      exit repeat
                    end if
                  end repeat
                  if targetTag is not missing value then exit repeat
                end repeat
                if targetTag is not missing value then exit repeat
              end repeat
              if targetTag is not missing value then exit repeat
            end repeat
            if targetTag is not missing value then exit repeat
          end repeat

          if targetTag is not missing value then
            set primary tag of targetProject to targetTag
          else
            error "Tag not found: ${escapedNewContext}"
          end if`;
    }

    script += `
          return "Project updated: " & name of targetProject
        else
          return "Project not found: ${escapedProjectName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to edit project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteTask(args: DeleteTaskArgs) {
    const escapedTaskName = this.escapeAppleScriptString(args.taskName);
    const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;

    if (args.project) {
      script += `
        -- First find the project (searching in folders if needed)
        set targetProject to missing value

        -- Search top level
        try
          set targetProject to first project whose name is "${escapedProject}"
        end try

        -- Search in folders
        if targetProject is missing value then
          repeat with fld in every folder
            try
              set targetProject to first project of fld whose name is "${escapedProject}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProject}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProject}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if

        -- Find task in the project
        if targetProject is not missing value then
          try
            set targetTask to first task of targetProject whose name is "${escapedTaskName}"
          end try
        end if`;
    } else {
      script += `
        -- Search in inbox first
        try
          set targetTask to first inbox task whose name is "${escapedTaskName}"
        on error
          -- Then search across all projects
          repeat with proj in every project
            try
              set targetTask to first task of proj whose name is "${escapedTaskName}"
              exit repeat
            end try
          end repeat
        end try`;
    }

    script += `

        if targetTask is not missing value then
          set taskName to name of targetTask
          delete targetTask
          return "Task deleted: " & taskName
        else
          return "Task not found: ${escapedTaskName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteProject(args: DeleteProjectArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);

    const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProjectName}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          set projectName to name of targetProject
          delete targetProject
          return "Project deleted: " & projectName
        else
          return "Project not found: ${escapedProjectName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async createContext(args: CreateContextArgs) {
    const escapedName = this.escapeAppleScriptString(args.name);
    const escapedParent = args.parent ? this.escapeAppleScriptString(args.parent) : '';

    let script = `tell application "OmniFocus"
      tell front document`;

    if (args.parent) {
      script += `
        set parentContext to first tag whose name is "${escapedParent}"
        set newContext to make new tag at end of tags of parentContext with properties {name:"${escapedName}"}`;
    } else {
      script += `
        set newContext to make new tag with properties {name:"${escapedName}"}`;
    }

    script += `
        set contextID to id of newContext
        return name of newContext & " (ID: " & contextID & ")"
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: `Successfully created context: ${result}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create context: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listContexts(args: ListContextsArgs = {}) {
    let script = `tell application "OmniFocus"
      tell front document
        set contextList to ""
        set allContexts to `;

    if (args.includeInactive) {
      script += `every tag
        repeat with ctx in allContexts
          set contextInfo to name of ctx
          try
            set isActive to active of ctx
            if isActive is false then
              set contextInfo to contextInfo & " (inactive)"
            end if
          on error
            -- Skip if we can't access active property
          end try
          set contextList to contextList & contextInfo & "\\n"
        end repeat`;
    } else {
      script += `every tag whose active is true
        repeat with ctx in allContexts
          set contextInfo to name of ctx
          set contextList to contextList & contextInfo & "\\n"
        end repeat`;
    }

    script += `
        return contextList
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result || 'No contexts found',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list contexts: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setTaskFlag(args: SetTaskFlagArgs) {
    const escapedTaskName = this.escapeAppleScriptString(args.taskName);
    const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;

    // Enhanced task search with nested folder support
    if (args.project) {
      script += `
        set targetProject to missing value

        -- Search for project in nested folders
        try
          set targetProject to first project whose name is "${escapedProject}"
        end try

        if targetProject is missing value then
          repeat with fld in every folder
            try
              set targetProject to first project of fld whose name is "${escapedProject}"
              exit repeat
            end try
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProject}"
                exit repeat
              end try
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProject}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if

        if targetProject is not missing value then
          set targetTask to first task of targetProject whose name is "${escapedTaskName}"
        end if`;
    } else {
      script += `
        -- Search in inbox first
        try
          set targetTask to first inbox task whose name is "${escapedTaskName}"
        on error
          -- Then search across all projects
          repeat with proj in every project
            try
              set targetTask to first task of proj whose name is "${escapedTaskName}"
              exit repeat
            end try
          end repeat
        end try`;
    }

    script += `
        if targetTask is not missing value then
          set flagged of targetTask to ${args.flagged}
          return "Task flag updated: " & name of targetTask & " (flagged: ${args.flagged})"
        else
          return "Task not found: ${escapedTaskName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set task flag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async archiveProject(args: ArchiveProjectArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);

    const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProjectName}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          try
            set currentStatus to status of targetProject
            set statusText to "${args.status || 'completed'}"
            
            if statusText is "dropped" then
              mark dropped targetProject
              return "Project " & name of targetProject & " status changed to DROPPED"
            else
              -- Default to completed status  
              if statusText is "completed" then
                -- Complete all remaining tasks first
                set taskCount to 0
                set completedCount to 0
                repeat with aTask in every task of targetProject
                  set taskCount to taskCount + 1
                  try
                    if completed of aTask is false then
                      set completed of aTask to true
                      set completedCount to completedCount + 1
                    end if
                  on error
                    -- Skip tasks that cannot be completed
                  end try
                end repeat
                
                -- Project will complete automatically when all tasks are done
                return "Project " & name of targetProject & " - completed " & completedCount & " of " & taskCount & " tasks. Project will complete automatically."
              else
                return "Invalid status. Use completed or dropped"
              end if
            end if
          on error errMsg
            return "Project found but error changing status: " & errMsg
          end try
        else
          return "Project not found: ${escapedProjectName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to archive project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setProjectStatus(args: SetProjectStatusArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);
    const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value

        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProjectName}"
        end try

        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if

        if targetProject is missing value then
          return "ERROR: Project not found: ${escapedProjectName}"
        end if
        
        set currentStatus to (status of targetProject) as string
        set statusText to "${args.status}"
        
        try
          if statusText is "dropped" then
            set dropped of targetProject to true
            return "SUCCESS: Project " & name of targetProject & " status changed from " & currentStatus & " to DROPPED"
          else if statusText is "completed" then
            set completed of targetProject to true
            return "SUCCESS: Project " & name of targetProject & " status changed from " & currentStatus & " to COMPLETED"
          else if statusText is "active" then
            -- To make active: clear dropped/completed status and set to active
            set dropped of targetProject to false
            set completed of targetProject to false
            set status of targetProject to active status
            return "SUCCESS: Project " & name of targetProject & " status changed from " & currentStatus & " to ACTIVE"
          else if statusText is "on-hold" then
            set theStatus to on hold status
            set status of targetProject to theStatus
            return "SUCCESS: Project " & name of targetProject & " status changed from " & currentStatus & " to ON-HOLD"
          else
            return "ERROR: Invalid status. Use: active, on-hold, completed, or dropped"
          end if
        on error errMsg
          return "ERROR: Failed to change status - " & errMsg
        end try
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set project status: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setProjectFlag(args: SetProjectFlagArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);

    const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProjectName}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is missing value then
          return "ERROR: Project not found: ${escapedProjectName}"
        end if
        
        set flagged of targetProject to ${args.flagged}
        return "SUCCESS: Project " & name of targetProject & " flagged set to ${args.flagged}"
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set project flag: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setTaskDates(args: SetTaskDatesArgs) {
    const escapedTaskName = this.escapeAppleScriptString(args.taskName);
    const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;

    // Task search logic with nested folder support
    if (args.project) {
      script += `
        set targetProject to missing value
        
        -- Search for project in nested folders
        try
          set targetProject to first project whose name is "${escapedProject}"
        end try
        
        if targetProject is missing value then
          repeat with fld in every folder
            try
              set targetProject to first project of fld whose name is "${escapedProject}"
              exit repeat
            end try
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProject}"
                exit repeat
              end try
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProject}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          set targetTask to first task of targetProject whose name is "${escapedTaskName}"
        end if`;
    } else {
      script += `set targetTask to first task whose name is "${escapedTaskName}"`;
    }

    script += `
        if targetTask is missing value then
          return "ERROR: Task not found: ${escapedTaskName}"
        end if
        `;

    if (args.dueDate) {
      script += `
        set due date of targetTask to date "${args.dueDate}"`;
    }

    if (args.deferDate) {
      script += `
        set defer date of targetTask to date "${args.deferDate}"`;
    }

    if (args.estimatedMinutes !== undefined) {
      script += `
        set estimated minutes of targetTask to ${args.estimatedMinutes}`;
    }

    script += `
        return "SUCCESS: Task " & name of targetTask & " updated"
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set task dates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async setProjectDates(args: SetProjectDatesArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);

    const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProjectName}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is missing value then
          return "ERROR: Project not found: ${escapedProjectName}"
        end if
        
        ${args.dueDate ? `set due date of targetProject to date "${args.dueDate}"` : ''}
        ${args.deferDate ? `set defer date of targetProject to date "${args.deferDate}"` : ''}
        
        return "SUCCESS: Project " & name of targetProject & " dates updated"
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to set project dates: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async moveProject(args: MoveProjectArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);
    const escapedToFolder = this.escapeAppleScriptString(args.toFolder);

    const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        set targetFolder to missing value
        
        -- Search for project in nested folders
        try
          set targetProject to first project whose name is "${escapedProjectName}"
        end try
        
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is missing value then
          return "ERROR: Project not found: ${escapedProjectName}"
        end if
        
        -- Search for destination folder in nested structure
        try
          set targetFolder to first folder whose name is "${escapedToFolder}"
        end try
        
        if targetFolder is missing value then
          repeat with fld in every folder
            if name of fld is "${args.toFolder}" then
              set targetFolder to fld
              exit repeat
            end if
            -- Check subfolders
            repeat with subfld in folders of fld
              if name of subfld is "${args.toFolder}" then
                set targetFolder to subfld
                exit repeat
              end if
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                if name of nestedSubfld is "${args.toFolder}" then
                  set targetFolder to nestedSubfld
                  exit repeat
                end if
              end repeat
              if targetFolder is not missing value then exit repeat
            end repeat
            if targetFolder is not missing value then exit repeat
          end repeat
        end if
        
        if targetFolder is missing value then
          return "ERROR: Destination folder not found: ${args.toFolder}"
        end if
        
        -- Get current location for confirmation
        set currentLocation to "Top Level"
        if folder of targetProject is not missing value then
          set currentLocation to name of folder of targetProject
        end if
        
        -- Get full path for current location (simplified)
        set currentPath to currentLocation
        
        -- Get full path for destination (simplified)  
        set destinationPath to name of targetFolder
        
        return "MANUAL MOVE REQUIRED: Project " & name of targetProject & " found at [" & currentPath & "]. Target folder " & name of targetFolder & " confirmed at [" & destinationPath & "]. OmniFocus does not support automated project moving via AppleScript. Please manually drag the project in OmniFocus from " & currentPath & " to " & destinationPath & "."
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to move project: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listFolders(args: ListFoldersArgs = {}) {
    let script = `tell application "OmniFocus"
      tell front document
        set folderList to ""
        set allFolders to every folder`;

    script += `
        repeat with fld in allFolders
          set folderInfo to name of fld`;
    
    if (args.includeProjectCounts) {
      script += `
          set projectCount to count of projects of fld
          set folderInfo to folderInfo & " (" & projectCount & " projects)"`;
    }

    script += `
          set folderList to folderList & folderInfo & "\\n"
        end repeat
        return folderList
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result || 'No folders found',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list folders: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFolderDetails(args: GetFolderDetailsArgs) {
    const script = `tell application "OmniFocus"
      tell front document
        set targetFolder to missing value
        
        try
          set targetFolder to first folder whose name is "${args.folderName}"
        end try
        
        if targetFolder is missing value then
          repeat with fld in every folder
            try
              set targetFolder to first folder of fld whose name is "${args.folderName}"
              exit repeat
            end try
            repeat with subfld in folders of fld
              try
                set targetFolder to first folder of subfld whose name is "${args.folderName}"
                exit repeat
              end try
            end repeat
            if targetFolder is not missing value then exit repeat
          end repeat
        end if
        
        if targetFolder is not missing value then
          set folderInfo to "Folder: " & name of targetFolder & "\\n"
          
          repeat with parentFld in every folder
            repeat with subfld in folders of parentFld
              if id of subfld is equal to id of targetFolder then
                set folderInfo to folderInfo & "Parent folder: " & name of parentFld & "\\n"
                exit repeat
              end if
              repeat with nestedSubfld in folders of subfld
                if id of nestedSubfld is equal to id of targetFolder then
                  set folderInfo to folderInfo & "Parent folder: " & name of parentFld & " > " & name of subfld & "\\n"
                  exit repeat
                end if
              end repeat
            end repeat
          end repeat
          
          set projectCount to count of projects of targetFolder
          set folderInfo to folderInfo & "Total projects: " & projectCount & "\\n"
          set activeProjects to count of (projects of targetFolder whose completed is false)
          set folderInfo to folderInfo & "Active projects: " & activeProjects & "\\n"
          set completedProjects to count of (projects of targetFolder whose completed is true)
          set folderInfo to folderInfo & "Completed projects: " & completedProjects & "\\n"
          
          set subfolderCount to count of folders of targetFolder
          if subfolderCount > 0 then
            set folderInfo to folderInfo & "Subfolders: " & subfolderCount & "\\n"
          end if
          
          set folderInfo to folderInfo & "\\nProjects in this folder:\\n"
          repeat with proj in projects of targetFolder
            set projStatus to ""
            if completed of proj is true then
              set projStatus to " (completed)"
            else
              set taskCount to count of (tasks of proj whose completed is false)
              if taskCount > 0 then
                set projStatus to " [" & taskCount & " tasks]"
              else
                set projStatus to " [No tasks]"
              end if
            end if
            set folderInfo to folderInfo & "- " & name of proj & projStatus & "\\n"
          end repeat
          
          if subfolderCount > 0 then
            set folderInfo to folderInfo & "\\nSubfolders:\\n"
            repeat with subfld in folders of targetFolder
              set subProjectCount to count of projects of subfld
              set folderInfo to folderInfo & "- " & name of subfld & " (" & subProjectCount & " projects)\\n"
            end repeat
          end if
          
          return folderInfo
        else
          return "Folder not found: ${args.folderName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get folder details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listTagsHierarchy(args: ListTagsArgs = {}) {
    let script = `tell application "OmniFocus"
      tell front document
        set hierarchyList to ""
        
        -- Get all tags and build hierarchy
        set allTags to every tag`;
    
    if (!args.includeInactive) {
      script += ` whose hidden is false`;
    }
    
    script += `
        
        -- First pass: find root tags (tags without parent tags)
        set rootTags to {}
        repeat with aTag in allTags
          set isRoot to true
          try
            set parentContainer to container of aTag
            if class of parentContainer is tag then
              set isRoot to false
            end if
          end try
          
          if isRoot then
            set end of rootTags to aTag
          end if
        end repeat
        
        -- Process each root tag
        repeat with rootTag in rootTags
          set tagName to name of rootTag
          set hierarchyList to hierarchyList & tagName`;
    
    if (args.includeUsageStats) {
      script += `
          set taskCount to count of (every task whose primary tag is rootTag and completed is false)
          set hierarchyList to hierarchyList & " (" & taskCount & " tasks)"`;
    }
    
    if (args.includeInactive) {
      script += `
          if hidden of rootTag is true then
            set hierarchyList to hierarchyList & " [hidden]"
          end if`;
    }
    
    script += `
          set hierarchyList to hierarchyList & "\\n"
          
          -- Process child tags (level 1)
          set childTags to every tag of rootTag`;
    
    if (!args.includeInactive) {
      script += ` whose hidden is false`;
    }
    
    script += `
          repeat with childTag in childTags
            set childName to "  " & name of childTag
            set hierarchyList to hierarchyList & childName`;
    
    if (args.includeUsageStats) {
      script += `
            set childTaskCount to count of (every task whose primary tag is childTag and completed is false)
            set hierarchyList to hierarchyList & " (" & childTaskCount & " tasks)"`;
    }
    
    if (args.includeInactive) {
      script += `
            if hidden of childTag is true then
              set hierarchyList to hierarchyList & " [hidden]"
            end if`;
    }
    
    script += `
            set hierarchyList to hierarchyList & "\\n"
            
            -- Process grandchild tags (level 2)
            set grandchildTags to every tag of childTag`;
    
    if (!args.includeInactive) {
      script += ` whose hidden is false`;
    }
    
    script += `
            repeat with grandchildTag in grandchildTags
              set grandchildName to "    " & name of grandchildTag
              set hierarchyList to hierarchyList & grandchildName`;
    
    if (args.includeUsageStats) {
      script += `
              set grandchildTaskCount to count of (every task whose primary tag is grandchildTag and completed is false)
              set hierarchyList to hierarchyList & " (" & grandchildTaskCount & " tasks)"`;
    }
    
    if (args.includeInactive) {
      script += `
              if hidden of grandchildTag is true then
                set hierarchyList to hierarchyList & " [hidden]"
              end if`;
    }
    
    script += `
              set hierarchyList to hierarchyList & "\\n"
              
              -- Process great-grandchild tags (level 3)
              set greatGrandchildTags to every tag of grandchildTag`;
    
    if (!args.includeInactive) {
      script += ` whose hidden is false`;
    }
    
    script += `
              repeat with greatGrandchildTag in greatGrandchildTags
                set greatGrandchildName to "      " & name of greatGrandchildTag
                set hierarchyList to hierarchyList & greatGrandchildName`;
    
    if (args.includeUsageStats) {
      script += `
                set greatGrandchildTaskCount to count of (every task whose primary tag is greatGrandchildTag and completed is false)
                set hierarchyList to hierarchyList & " (" & greatGrandchildTaskCount & " tasks)"`;
    }
    
    if (args.includeInactive) {
      script += `
                if hidden of greatGrandchildTag is true then
                  set hierarchyList to hierarchyList & " [hidden]"
                end if`;
    }
    
    script += `
                set hierarchyList to hierarchyList & "\\n"
              end repeat
            end repeat
          end repeat
        end repeat
        
        if hierarchyList is "" then
          return "No tags found"
        else
          return hierarchyList
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result || 'No tags found',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tags hierarchy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTagDetails(args: GetTagDetailsArgs) {
    const escapedTagName = this.escapeAppleScriptString(args.tagName);
    const script = `tell application "OmniFocus"
      tell front document
        set targetTag to missing value
        
        -- Search tags up to 5 levels deep
        -- Level 1: Top-level tags
        repeat with tag1 in every tag
          if name of tag1 is "${escapedTagName}" then
            set targetTag to tag1
            exit repeat
          end if
          
          -- Level 2: Children of top-level tags
          repeat with tag2 in tags of tag1
            if name of tag2 is "${escapedTagName}" then
              set targetTag to tag2
              exit repeat
            end if
            
            -- Level 3: Grandchildren
            repeat with tag3 in tags of tag2
              if name of tag3 is "${escapedTagName}" then
                set targetTag to tag3
                exit repeat
              end if
              
              -- Level 4: Great-grandchildren
              repeat with tag4 in tags of tag3
                if name of tag4 is "${escapedTagName}" then
                  set targetTag to tag4
                  exit repeat
                end if
                
                -- Level 5: Great-great-grandchildren
                repeat with tag5 in tags of tag4
                  if name of tag5 is "${escapedTagName}" then
                    set targetTag to tag5
                    exit repeat
                  end if
                end repeat
                if targetTag is not missing value then exit repeat
              end repeat
              if targetTag is not missing value then exit repeat
            end repeat
            if targetTag is not missing value then exit repeat
          end repeat
          if targetTag is not missing value then exit repeat
        end repeat
        
        if targetTag is not missing value then
          set tagInfo to "Tag: " & name of targetTag & "\\n"
          set tagInfo to tagInfo & "Hidden: " & (hidden of targetTag as string) & "\\n"
          
          set activeTasks to count of (every task whose primary tag is targetTag and completed is false)
          set tagInfo to tagInfo & "Active tasks: " & activeTasks & "\\n"
          
          set completedTasks to count of (every task whose primary tag is targetTag and completed is true)
          set tagInfo to tagInfo & "Completed tasks: " & completedTasks & "\\n"
          
          set remainingTasks to remaining task count of targetTag
          set tagInfo to tagInfo & "Remaining tasks: " & remainingTasks & "\\n"
          
          set availableTasks to available task count of targetTag
          set tagInfo to tagInfo & "Available tasks: " & availableTasks & "\\n"
          
          return tagInfo
        else
          return "Tag not found: ${escapedTagName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get tag details: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listFolderHierarchy(args: ListFolderHierarchyArgs = {}) {
    let script = `tell application "OmniFocus"
      tell front document
        set hierarchyList to ""
        
        -- Process root folders
        set rootFolders to every folder
        repeat with rootFolder in rootFolders
          set hierarchyList to hierarchyList & "📁 " & name of rootFolder`;

    if (args.includeProjectCounts) {
      script += `
          set projectCount to count of projects of rootFolder
          set hierarchyList to hierarchyList & " (" & projectCount & " projects)"`;
    }

    script += `
          set hierarchyList to hierarchyList & "\\n"
          
          -- Add projects in root folder
          set projectList to projects of rootFolder
          repeat with proj in projectList
            set hierarchyList to hierarchyList & "  📋 " & name of proj
            if completed of proj then
              set hierarchyList to hierarchyList & " (completed)"
            end if`;
    
    if (args.includeTaskCounts) {
      script += `
            set activeTaskCount to count of (tasks of proj whose completed is false)
            if activeTaskCount > 0 then
              set hierarchyList to hierarchyList & " [" & activeTaskCount & " tasks]"
            end if`;
    }

    script += `
            set hierarchyList to hierarchyList & "\\n"
          end repeat
          
          -- Add subfolders with recursive nesting
          set subfolders to folders of rootFolder
          repeat with subfolder in subfolders
            set hierarchyList to hierarchyList & "  📁 " & name of subfolder`;
    
    if (args.includeProjectCounts) {
      script += `
            set subProjectCount to count of projects of subfolder
            set hierarchyList to hierarchyList & " (" & subProjectCount & " projects)"`;
    }

    script += `
            set hierarchyList to hierarchyList & "\\n"
            
            -- Add projects in subfolder
            set subProjectList to projects of subfolder
            repeat with subProj in subProjectList
              set hierarchyList to hierarchyList & "    📋 " & name of subProj
              if completed of subProj then
                set hierarchyList to hierarchyList & " (completed)"
              end if`;
    
    if (args.includeTaskCounts) {
      script += `
              set subActiveTaskCount to count of (tasks of subProj whose completed is false)
              if subActiveTaskCount > 0 then
                set hierarchyList to hierarchyList & " [" & subActiveTaskCount & " tasks]"
              end if`;
    }

    script += `
              set hierarchyList to hierarchyList & "\\n"
            end repeat
            
            -- Add nested subfolders (subfolders within subfolders)
            set nestedSubfolders to folders of subfolder
            repeat with nestedSubfolder in nestedSubfolders
              set hierarchyList to hierarchyList & "    📁 " & name of nestedSubfolder`;
    
    if (args.includeProjectCounts) {
      script += `
              set nestedProjectCount to count of projects of nestedSubfolder
              set hierarchyList to hierarchyList & " (" & nestedProjectCount & " projects)"`;
    }

    script += `
              set hierarchyList to hierarchyList & "\\n"
              
              -- Add projects in nested subfolder
              set nestedProjectList to projects of nestedSubfolder
              repeat with nestedProj in nestedProjectList
                set hierarchyList to hierarchyList & "      📋 " & name of nestedProj
                if completed of nestedProj then
                  set hierarchyList to hierarchyList & " (completed)"
                end if`;
    
    if (args.includeTaskCounts) {
      script += `
                set nestedActiveTaskCount to count of (tasks of nestedProj whose completed is false)
                if nestedActiveTaskCount > 0 then
                  set hierarchyList to hierarchyList & " [" & nestedActiveTaskCount & " tasks]"
                end if`;
    }

    script += `
                set hierarchyList to hierarchyList & "\\n"
              end repeat
            end repeat
          end repeat
          
          set hierarchyList to hierarchyList & "\\n"
        end repeat
        
        -- Show top-level projects (simplified approach)
        set allProjects to every project
        set projectsInFolders to {}
        
        -- Collect all projects that are in folders (including nested subfolders)
        repeat with fld in every folder
          repeat with proj in projects of fld
            set end of projectsInFolders to (id of proj)
          end repeat
          -- Check subfolders
          repeat with subfld in folders of fld
            repeat with subproj in projects of subfld
              set end of projectsInFolders to (id of subproj)
            end repeat
            -- Check nested subfolders (subfolders within subfolders)
            repeat with nestedSubfld in folders of subfld
              repeat with nestedProj in projects of nestedSubfld
                set end of projectsInFolders to (id of nestedProj)
              end repeat
            end repeat
          end repeat
        end repeat
        
        -- Find projects not in any folder
        set topLevelFound to false
        repeat with proj in allProjects
          set projID to id of proj
          set isInFolder to false
          repeat with folderProjID in projectsInFolders
            if projID is equal to folderProjID then
              set isInFolder to true
              exit repeat
            end if
          end repeat
          
          if not isInFolder then
            if not topLevelFound then
              set hierarchyList to hierarchyList & "📋 Top-level projects:\\n"
              set topLevelFound to true
            end if
            set hierarchyList to hierarchyList & "  📋 " & name of proj
            if completed of proj then
              set hierarchyList to hierarchyList & " (completed)"
            end if`;
    
    if (args.includeTaskCounts) {
      script += `
            set activeTaskCount to count of (tasks of proj whose completed is false)
            if activeTaskCount > 0 then
              set hierarchyList to hierarchyList & " [" & activeTaskCount & " tasks]"
            end if`;
    }

    script += `
            set hierarchyList to hierarchyList & "\\n"
          end if
        end repeat
        
        return hierarchyList
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result || 'No folder hierarchy found',
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list folder hierarchy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getTaskNote(args: GetTaskNoteArgs) {
    const escapedTaskName = this.escapeAppleScriptString(args.taskName);
    const escapedProject = args.project ? this.escapeAppleScriptString(args.project) : '';

    let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;

    if (args.project) {
      script += `
        set targetProject to missing value

        -- Search for project in nested folders
        try
          set targetProject to first project whose name is "${escapedProject}"
        end try

        if targetProject is missing value then
          repeat with fld in every folder
            try
              set targetProject to first project of fld whose name is "${escapedProject}"
              exit repeat
            end try
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProject}"
                exit repeat
              end try
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProject}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if

        if targetProject is not missing value then
          set targetTask to first task of targetProject whose name is "${escapedTaskName}" and completed is false
        else
          return "ERROR: Project not found: ${escapedProject}"
        end if`;
    } else {
      script += `
        -- Search in all projects and inbox
        set allTasks to {}

        -- Get tasks from top-level projects
        repeat with proj in every project
          try
            set matchingTask to first task of proj whose name is "${escapedTaskName}" and completed is false
            set targetTask to matchingTask
            exit repeat
          end try
        end repeat

        -- If not found, search in folder projects
        if targetTask is missing value then
          repeat with fld in every folder
            repeat with proj in every project of fld
              try
                set matchingTask to first task of proj whose name is "${escapedTaskName}" and completed is false
                set targetTask to matchingTask
                exit repeat
              end try
            end repeat
            if targetTask is not missing value then exit repeat

            -- Check subfolders
            repeat with subfld in folders of fld
              repeat with proj in every project of subfld
                try
                  set matchingTask to first task of proj whose name is "${escapedTaskName}" and completed is false
                  set targetTask to matchingTask
                  exit repeat
                end try
              end repeat
              if targetTask is not missing value then exit repeat

              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                repeat with proj in every project of nestedSubfld
                  try
                    set matchingTask to first task of proj whose name is "${escapedTaskName}" and completed is false
                    set targetTask to matchingTask
                    exit repeat
                  end try
                end repeat
                if targetTask is not missing value then exit repeat
              end repeat
              if targetTask is not missing value then exit repeat
            end repeat
            if targetTask is not missing value then exit repeat
          end repeat
        end if

        -- Check inbox if still not found
        if targetTask is missing value then
          try
            set targetTask to first inbox task whose name is "${escapedTaskName}" and completed is false
          end try
        end if`;
    }

    script += `

        if targetTask is not missing value then
          set taskNote to note of targetTask
          set taskInfo to "Task: " & name of targetTask & "\\n"

          -- Get project info if available
          try
            if project of targetTask is not missing value then
              set taskInfo to taskInfo & "Project: " & name of project of targetTask & "\\n"
            end if
          on error
            set taskInfo to taskInfo & "Location: Inbox\\n"
          end try

          -- Get context/tag info if available
          try
            if primary tag of targetTask is not missing value then
              set taskInfo to taskInfo & "Context: " & name of primary tag of targetTask & "\\n"
            end if
          end try

          -- Add note content
          set taskInfo to taskInfo & "\\n--- Note Content ---\\n"
          if taskNote is "" then
            set taskInfo to taskInfo & "(No note content)"
          else
            set taskInfo to taskInfo & taskNote
          end if

          return taskInfo
        else
          return "ERROR: Task not found: ${escapedTaskName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get task note: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getProjectNote(args: GetProjectNoteArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);

    const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value

        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProjectName}"
        end try

        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if

        if targetProject is not missing value then
          set projectNote to note of targetProject
          set projectInfo to "Project: " & name of targetProject & "\\n"

          -- Get status
          set projectInfo to projectInfo & "Status: " & (status of targetProject as string) & "\\n"

          -- Get location
          set projectLocation to "Top Level"
          if folder of targetProject is not missing value then
            set projectLocation to name of folder of targetProject
          end if
          set projectInfo to projectInfo & "Location: " & projectLocation & "\\n"

          -- Get project type
          if sequential of targetProject is true then
            set projectInfo to projectInfo & "Type: Sequential\\n"
          else if singleton action holder of targetProject is true then
            set projectInfo to projectInfo & "Type: Single Action\\n"
          else
            set projectInfo to projectInfo & "Type: Parallel\\n"
          end if

          -- Get task counts
          set totalTasks to count of tasks of targetProject
          set incompleteTasks to count of (tasks of targetProject whose completed is false)
          set projectInfo to projectInfo & "Tasks: " & incompleteTasks & " incomplete / " & totalTasks & " total\\n"

          -- Add note content
          set projectInfo to projectInfo & "\\n--- Note Content ---\\n"
          if projectNote is "" then
            set projectInfo to projectInfo & "(No note content)"
          else
            set projectInfo to projectInfo & projectNote
          end if

          return projectInfo
        else
          return "ERROR: Project not found: ${escapedProjectName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get project note: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getProjectLink(args: GetProjectLinkArgs) {
    const escapedProjectName = this.escapeAppleScriptString(args.projectName);
    const format = args.format || 'markdown';

    const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        set projectLocation to ""
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${escapedProjectName}"
          set projectLocation to "Top Level"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${escapedProjectName}"
              set projectLocation to name of fld
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${escapedProjectName}"
                set projectLocation to name of fld & " > " & name of subfld
                exit repeat
              end try
              -- Check nested subfolders (3-level deep like HelixIntel)
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${escapedProjectName}"
                  set projectLocation to name of fld & " > " & name of subfld & " > " & name of nestedSubfld
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          -- Get project ID for more reliable linking
          set projectID to id of targetProject
          set projectName to name of targetProject
          
          -- Return project info for link generation
          return projectName & "|" & projectID & "|" & projectLocation
        else
          return "ERROR: Project not found: ${escapedProjectName}"
        end if
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      
      if (result.startsWith('ERROR:')) {
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
          ],
        };
      }
      
      const [projectName, projectID, location] = result.split('|');
      
      // URL encode the project name for the URL scheme
      const encodedName = encodeURIComponent(projectName);
      const omniFocusURL = `omnifocus:///task/${projectID}`;
      
      let formattedLink: string;
      switch (format) {
        case 'url':
          formattedLink = omniFocusURL;
          break;
        case 'html':
          formattedLink = `<a href="${omniFocusURL}">${projectName}</a>`;
          break;
        case 'markdown':
        default:
          formattedLink = `[${projectName}](${omniFocusURL})`;
          break;
      }
      
      return {
        content: [
          {
            type: 'text',
            text: `Project Link Generated:
Name: ${projectName}
Location: ${location}
URL: ${omniFocusURL}

${format.toUpperCase()} Format:
${formattedLink}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get project link: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listPerspectives() {
    const script = `tell application "OmniFocus"
      tell front document
        set perspectiveList to ""
        set allPerspectives to perspective names
        
        repeat with perspName in allPerspectives
          set perspectiveList to perspectiveList & perspName & "\\n"
        end repeat
        
        return perspectiveList
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      const perspectives = result.split('\n').filter(p => p.trim());
      
      // Categorize perspectives
      const builtIn = ['Inbox', 'Projects', 'Tags', 'Flagged', 'Review', 'Forecast', 'Completed', 'Changed', 'Nearby'];
      const custom = perspectives.filter(p => !builtIn.includes(p));
      const builtInFound = perspectives.filter(p => builtIn.includes(p));
      
      return {
        content: [
          {
            type: 'text',
            text: `Built-in Perspectives:\n${builtInFound.join('\n')}\n\nCustom Perspectives:\n${custom.join('\n')}\n\nTotal: ${perspectives.length} perspectives`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list perspectives: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getCurrentPerspective() {
    const script = `tell application "OmniFocus"
      tell front window
        try
          set currentPersp to perspective name
          return currentPersp
        on error
          return "No perspective selected (possibly in a custom view)"
        end try
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: `Current perspective: ${result}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get current perspective: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async switchPerspective(args: SwitchPerspectiveArgs) {
    const escapedName = this.escapeAppleScriptString(args.perspectiveName);
    const script = `tell application "OmniFocus"
      tell front window
        try
          set perspective name to "${escapedName}"
          return "Successfully switched to perspective: ${escapedName}"
        on error errMsg
          return "ERROR: " & errMsg
        end try
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script);
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to switch perspective: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getPerspectiveContents(args: GetPerspectiveContentsArgs = {}) {
    // If no perspective specified, use the current one
    let perspectiveName = args.perspectiveName;
    
    if (!perspectiveName) {
      const currentScript = `tell application "OmniFocus"
        tell front window
          try
            return perspective name
          on error
            return "ERROR: No perspective selected"
          end try
        end tell
      end tell`;
      
      perspectiveName = await this.runAppleScript(currentScript);
      if (perspectiveName.startsWith("ERROR:")) {
        return {
          content: [
            {
              type: 'text',
              text: perspectiveName,
            },
          ],
        };
      }
    } else {
      // Switch to the specified perspective first
      const escapedName = this.escapeAppleScriptString(perspectiveName);
      const switchScript = `tell application "OmniFocus"
        tell front window
          try
            set perspective name to "${escapedName}"
          on error errMsg
            return "ERROR: " & errMsg
          end try
        end tell
      end tell`;
      
      const switchResult = await this.runAppleScript(switchScript);
      if (switchResult && switchResult.startsWith("ERROR:")) {
        return {
          content: [
            {
              type: 'text',
              text: switchResult,
            },
          ],
        };
      }
    }
    
    // Get visible content from the current perspective
    const script = `tell application "OmniFocus"
      tell content of front window
        set itemList to ""
        set itemCount to 0
        
        -- Get all visible tree items
        try
          set visibleItems to every tree
          repeat with treeItem in visibleItems
            try
              set itemValue to value of treeItem
              set itemName to name of itemValue
              set itemClass to class of itemValue as string
              
              -- Determine item type
              if itemClass contains "project" then
                set itemType to "[Project]"
              else if itemClass contains "task" then
                set itemType to "[Task]"
                -- Check if task is in inbox
                try
                  set taskProject to project of itemValue
                  if taskProject is missing value then
                    set itemType to "[Inbox Task]"
                  end if
                end try
              else if itemClass contains "folder" then
                set itemType to "[Folder]"
              else if itemClass contains "tag" then
                set itemType to "[Tag]"
              else
                set itemType to "[" & itemClass & "]"
              end if
              
              -- Add task details if available
              set itemInfo to itemName & " " & itemType
              
              try
                if itemClass contains "task" then
                  -- Add context/tag if present
                  if primary tag of itemValue is not missing value then
                    set itemInfo to itemInfo & " @" & name of primary tag of itemValue
                  end if
                  
                  -- Add due date if present
                  if due date of itemValue is not missing value then
                    set dueDate to due date of itemValue
                    set itemInfo to itemInfo & " (Due: " & (dueDate as string) & ")"
                  end if
                  
                  -- Add flagged status
                  if flagged of itemValue is true then
                    set itemInfo to itemInfo & " 🚩"
                  end if
                end if
              end try
              
              set itemList to itemList & itemInfo & "\\n"
              set itemCount to itemCount + 1
              
              -- Limit to prevent overwhelming output
              if itemCount ≥ 100 then
                set itemList to itemList & "\\n... (showing first 100 items)"
                exit repeat
              end if
            end try
          end repeat
          
          if itemCount is 0 then
            return "No items visible in perspective: ${perspectiveName}"
          else
            return "Perspective: ${perspectiveName}\\nItems: " & itemCount & "\\n\\n" & itemList
          end if
        on error errMsg
          return "ERROR getting perspective contents: " & errMsg
        end try
      end tell
    end tell`;

    try {
      const result = await this.runAppleScript(script.replace(/\${perspectiveName}/g, perspectiveName));
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get perspective contents: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}