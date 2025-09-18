#!/bin/bash

echo "=== OmniFocus MCP Functions Audit ==="
echo ""

functions=(
  "createTask"
  "createProject"
  "listProjects"
  "listTasks"
  "completeTask"
  "searchTasks"
  "editTask"
  "moveTask"
  "editProject"
  "deleteTask"
  "deleteProject"
  "createContext"
  "listContexts"
  "setTaskFlag"
  "archiveProject"
  "setProjectStatus"
  "setProjectFlag"
  "setTaskDates"
  "setProjectDates"
  "moveProject"
  "listFolders"
  "getFolderDetails"
  "listTagsHierarchy"
  "getTagDetails"
  "listFolderHierarchy"
  "getTaskNote"
  "getProjectNote"
  "getProjectLink"
  "switchPerspective"
  "getPerspectiveContents"
)

echo "Functions using escapeAppleScriptString:"
echo "-----------------------------------------"
for func in "${functions[@]}"; do
  # Check if function uses escapeAppleScriptString
  if grep -A 20 "async $func" src/omnifocus-tools.ts | grep -q "escapeAppleScriptString"; then
    echo "✅ $func"
  else
    echo "❌ $func - NEEDS FIX"
  fi
done

echo ""
echo "Functions with user input in AppleScript strings:"
echo "-------------------------------------------------"
for func in "${functions[@]}"; do
  # Check if function has ${args. in AppleScript strings (unescaped)
  if grep -A 50 "async $func" src/omnifocus-tools.ts | grep -q '\"\${args\.'; then
    echo "⚠️  $func - Has unescaped args"
  fi
done