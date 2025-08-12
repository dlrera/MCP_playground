export interface CreateTaskArgs {
    name: string;
    note?: string;
    project?: string;
    context?: string;
    dueDate?: string;
    deferDate?: string;
}
export interface CreateProjectArgs {
    name: string;
    note?: string;
    folder?: string;
    type?: 'parallel' | 'sequential' | 'single';
}
export interface ListProjectsArgs {
    includeCompleted?: boolean;
}
export interface ListTasksArgs {
    project?: string;
    context?: string;
    includeCompleted?: boolean;
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
export declare class OmniFocusTools {
    private runAppleScript;
    private formatDate;
    createTask(args: CreateTaskArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    createProject(args: CreateProjectArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    listProjects(args?: ListProjectsArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    listTasks(args?: ListTasksArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    completeTask(args: CompleteTaskArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    searchTasks(args: SearchTasksArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    editTask(args: EditTaskArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    moveTask(args: MoveTaskArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    editProject(args: EditProjectArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    deleteTask(args: DeleteTaskArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    deleteProject(args: DeleteProjectArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    createContext(args: CreateContextArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    listContexts(args?: ListContextsArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    setTaskFlag(args: SetTaskFlagArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    archiveProject(args: ArchiveProjectArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    listFolders(args?: ListFoldersArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    getFolderDetails(args: GetFolderDetailsArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    listTagsHierarchy(args?: ListTagsArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    getTagDetails(args: GetTagDetailsArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
    listFolderHierarchy(args?: ListFolderHierarchyArgs): Promise<{
        content: {
            type: string;
            text: string;
        }[];
    }>;
}
//# sourceMappingURL=omnifocus-tools.d.ts.map