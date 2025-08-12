import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
export class OmniFocusTools {
    async runAppleScript(script) {
        try {
            const { stdout, stderr } = await execAsync(`osascript -e '${script.replace(/'/g, "\\'")}'`);
            if (stderr) {
                throw new Error(`AppleScript error: ${stderr}`);
            }
            return stdout.trim();
        }
        catch (error) {
            throw new Error(`Failed to execute AppleScript: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toISOString();
    }
    async createTask(args) {
        let script = `tell application "OmniFocus"
      tell front document
        set newTask to make new inbox task with properties {name:"${args.name}"`;
        if (args.note) {
            script += `, note:"${args.note}"`;
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
          set targetProject to first project whose name is "${args.project}"
        end try
        
        -- If not found, search in all folders
        if targetProject is missing value then
          repeat with fld in every folder
            try
              set targetProject to first project of fld whose name is "${args.project}"
              exit repeat
            end try
            -- Also check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${args.project}"
                exit repeat
              end try
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          move newTask to end of tasks of targetProject
        else
          error "Project not found: ${args.project}"
        end if`;
        }
        if (args.context) {
            script += `
        set targetTag to first tag whose name is "${args.context}"
        set primary tag of newTask to targetTag`;
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
        }
        catch (error) {
            throw new Error(`Failed to create task: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async createProject(args) {
        let script = `tell application "OmniFocus"
      tell front document`;
        if (args.folder) {
            script += `
        set targetFolder to first flattened folder whose name is "${args.folder}"
        set newProject to make new project at end of projects of targetFolder with properties {name:"${args.name}"`;
        }
        else {
            script += `
        set newProject to make new project with properties {name:"${args.name}"`;
        }
        if (args.note) {
            script += `, note:"${args.note}"`;
        }
        if (args.type === 'sequential') {
            script += `, sequential:true`;
        }
        else if (args.type === 'single') {
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
        }
        catch (error) {
            throw new Error(`Failed to create project: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async listProjects(args = {}) {
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
        }
        else {
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
        }
        else {
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
        }
        else {
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
        }
        else {
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
        }
        catch (error) {
            throw new Error(`Failed to list projects: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async listTasks(args = {}) {
        let script = `tell application "OmniFocus"
      tell front document
        set taskList to ""
        set allTasks to {}
        
        -- Get project tasks`;
        if (args.project) {
            script += `
        set projectTasks to every task of project "${args.project}"`;
            if (!args.includeCompleted) {
                script += ` whose completed is false`;
            }
            if (args.context) {
                script += ` and primary tag's name is "${args.context}"`;
            }
            script += `
        set allTasks to projectTasks`;
        }
        else {
            script += `
        repeat with proj in every project
          set projTasks to every task of proj`;
            if (!args.includeCompleted) {
                script += ` whose completed is false`;
            }
            if (args.context) {
                script += ` and primary tag's name is "${args.context}"`;
            }
            script += `
          set allTasks to allTasks & projTasks
        end repeat
        
        -- Get tasks from projects in folders
        repeat with fld in every folder
          repeat with proj in every project of fld
            set projTasks to every task of proj`;
            if (!args.includeCompleted) {
                script += ` whose completed is false`;
            }
            if (args.context) {
                script += ` and primary tag's name is "${args.context}"`;
            }
            script += `
            set allTasks to allTasks & projTasks
          end repeat
        end repeat
        
        -- Get inbox tasks
        set inboxTasks to every inbox task`;
            if (!args.includeCompleted) {
                script += ` whose completed is false`;
            }
            if (args.context) {
                script += ` and primary tag's name is "${args.context}"`;
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
        }
        catch (error) {
            throw new Error(`Failed to list tasks: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async completeTask(args) {
        let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;
        if (args.project) {
            script += `
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${args.project}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${args.project}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${args.project}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${args.project}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          set targetTask to first task of targetProject whose name is "${args.taskName}"
        end if`;
        }
        else {
            script += `set targetTask to first task whose name is "${args.taskName}"`;
        }
        script += `
        if targetTask is not missing value then
          set completed of targetTask to true
          return "Task completed: " & name of targetTask
        else
          return "Task not found: ${args.taskName}"
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
        }
        catch (error) {
            throw new Error(`Failed to complete task: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async searchTasks(args) {
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
          if taskName contains "${args.query}" or taskNote contains "${args.query}" then
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
                        text: result || `No tasks found matching: ${args.query}`,
                    },
                ],
            };
        }
        catch (error) {
            throw new Error(`Failed to search tasks: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async editTask(args) {
        let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;
        if (args.project) {
            script += `set targetTask to first task of project "${args.project}" whose name is "${args.taskName}"`;
        }
        else {
            script += `set targetTask to first task whose name is "${args.taskName}"`;
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
            script += `
          set targetTag to first tag whose name is "${args.newContext}"
          set primary tag of targetTask to targetTag`;
        }
        script += `
          return "Task updated: " & name of targetTask
        else
          return "Task not found: ${args.taskName}"
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
        }
        catch (error) {
            throw new Error(`Failed to edit task: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async moveTask(args) {
        let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;
        if (args.fromProject) {
            script += `set targetTask to first task of project "${args.fromProject}" whose name is "${args.taskName}"`;
        }
        else {
            script += `set targetTask to first task whose name is "${args.taskName}"`;
        }
        script += `
        if targetTask is not missing value then
          set targetProject to missing value
          
          -- Search top level first
          try
            set targetProject to first project whose name is "${args.toProject}"
          end try
          
          -- Search in all folders and subfolders if not found
          if targetProject is missing value then
            repeat with fld in every folder
              -- Check projects in folder
              try
                set targetProject to first project of fld whose name is "${args.toProject}"
                exit repeat
              end try
              -- Check subfolders
              repeat with subfld in folders of fld
                try
                  set targetProject to first project of subfld whose name is "${args.toProject}"
                  exit repeat
                end try
                -- Check nested subfolders
                repeat with nestedSubfld in folders of subfld
                  try
                    set targetProject to first project of nestedSubfld whose name is "${args.toProject}"
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
            return "Destination project not found: ${args.toProject}"
          end if
        else
          return "Task not found: ${args.taskName}"
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
        }
        catch (error) {
            throw new Error(`Failed to move task: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async editProject(args) {
        let script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${args.projectName}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${args.projectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${args.projectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${args.projectName}"
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
          set name of targetProject to "${args.newName}"`;
        }
        if (args.newNote) {
            script += `
          set note of targetProject to "${args.newNote}"`;
        }
        if (args.newType === 'sequential') {
            script += `
          set sequential of targetProject to true`;
        }
        else if (args.newType === 'parallel') {
            script += `
          set sequential of targetProject to false`;
        }
        else if (args.newType === 'single') {
            script += `
          set singleton action holder of targetProject to true`;
        }
        if (args.newFolder) {
            script += `
          set targetFolder to first flattened folder whose name is "${args.newFolder}"
          move targetProject to end of projects of targetFolder`;
        }
        script += `
          return "Project updated: " & name of targetProject
        else
          return "Project not found: ${args.projectName}"
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
        }
        catch (error) {
            throw new Error(`Failed to edit project: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async deleteTask(args) {
        let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;
        if (args.project) {
            script += `set targetTask to first task of project "${args.project}" whose name is "${args.taskName}"`;
        }
        else {
            script += `set targetTask to first task whose name is "${args.taskName}"`;
        }
        script += `
        if targetTask is not missing value then
          set taskName to name of targetTask
          delete targetTask
          return "Task deleted: " & taskName
        else
          return "Task not found: ${args.taskName}"
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
        }
        catch (error) {
            throw new Error(`Failed to delete task: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async deleteProject(args) {
        const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${args.projectName}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${args.projectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${args.projectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${args.projectName}"
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
          return "Project not found: ${args.projectName}"
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
        }
        catch (error) {
            throw new Error(`Failed to delete project: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async createContext(args) {
        let script = `tell application "OmniFocus"
      tell front document`;
        if (args.parent) {
            script += `
        set parentContext to first tag whose name is "${args.parent}"
        set newContext to make new tag at end of tags of parentContext with properties {name:"${args.name}"}`;
        }
        else {
            script += `
        set newContext to make new tag with properties {name:"${args.name}"}`;
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
        }
        catch (error) {
            throw new Error(`Failed to create context: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async listContexts(args = {}) {
        let script = `tell application "OmniFocus"
      tell front document
        set contextList to ""
        set allContexts to `;
        if (args.includeInactive) {
            script += `every tag`;
        }
        else {
            script += `every tag whose active is true`;
        }
        script += `
        repeat with ctx in allContexts
          set contextInfo to name of ctx
          if active of ctx is false then
            set contextInfo to contextInfo & " (inactive)"
          end if
          set contextList to contextList & contextInfo & "\\n"
        end repeat
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
        }
        catch (error) {
            throw new Error(`Failed to list contexts: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async setTaskFlag(args) {
        let script = `tell application "OmniFocus"
      tell front document
        set targetTask to missing value
        `;
        if (args.project) {
            script += `set targetTask to first task of project "${args.project}" whose name is "${args.taskName}"`;
        }
        else {
            script += `set targetTask to first task whose name is "${args.taskName}"`;
        }
        script += `
        if targetTask is not missing value then
          set flagged of targetTask to ${args.flagged}
          return "Task flag updated: " & name of targetTask & " (flagged: ${args.flagged})"
        else
          return "Task not found: ${args.taskName}"
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
        }
        catch (error) {
            throw new Error(`Failed to set task flag: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async archiveProject(args) {
        const script = `tell application "OmniFocus"
      tell front document
        set targetProject to missing value
        
        -- Search top level first
        try
          set targetProject to first project whose name is "${args.projectName}"
        end try
        
        -- Search in all folders and subfolders if not found
        if targetProject is missing value then
          repeat with fld in every folder
            -- Check projects in folder
            try
              set targetProject to first project of fld whose name is "${args.projectName}"
              exit repeat
            end try
            -- Check subfolders
            repeat with subfld in folders of fld
              try
                set targetProject to first project of subfld whose name is "${args.projectName}"
                exit repeat
              end try
              -- Check nested subfolders
              repeat with nestedSubfld in folders of subfld
                try
                  set targetProject to first project of nestedSubfld whose name is "${args.projectName}"
                  exit repeat
                end try
              end repeat
              if targetProject is not missing value then exit repeat
            end repeat
            if targetProject is not missing value then exit repeat
          end repeat
        end if
        
        if targetProject is not missing value then
          repeat with aTask in every task of targetProject
            set completed of aTask to true
          end repeat
          return "Project archived (all tasks completed): " & name of targetProject
        else
          return "Project not found: ${args.projectName}"
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
        }
        catch (error) {
            throw new Error(`Failed to archive project: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async listFolders(args = {}) {
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
        }
        catch (error) {
            throw new Error(`Failed to list folders: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getFolderDetails(args) {
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
        }
        catch (error) {
            throw new Error(`Failed to get folder details: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async listTagsHierarchy(args = {}) {
        let script = `tell application "OmniFocus"
      tell front document
        set tagList to ""
        set allTags to every tag`;
        if (!args.includeInactive) {
            script += ` whose hidden is false`;
        }
        script += `
        
        repeat with tagItem in allTags
          set tagList to tagList & name of tagItem`;
        if (args.includeUsageStats) {
            script += `
          set taskCount to count of (every task whose primary tag is tagItem and completed is false)
          set tagList to tagList & " (" & taskCount & " tasks)"`;
        }
        if (args.includeInactive) {
            script += `
          if hidden of tagItem is true then
            set tagList to tagList & " (hidden)"
          end if`;
        }
        script += `
          set tagList to tagList & "\\n"
        end repeat
        
        return tagList
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
        }
        catch (error) {
            throw new Error(`Failed to list tags: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async getTagDetails(args) {
        const script = `tell application "OmniFocus"
      tell front document
        set targetTag to first tag whose name is "${args.tagName}"
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
          return "Tag not found: ${args.tagName}"
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
        }
        catch (error) {
            throw new Error(`Failed to get tag details: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    async listFolderHierarchy(args = {}) {
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
        }
        catch (error) {
            throw new Error(`Failed to list folder hierarchy: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
}
//# sourceMappingURL=omnifocus-tools.js.map