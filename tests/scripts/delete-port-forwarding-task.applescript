tell application "OmniFocus"
  tell front document
    set taskName to "Set up port forwarding"
    set targetTask to missing value

    -- Search in inbox first
    try
      set targetTask to first inbox task whose name is taskName
    on error
      -- If not in inbox, search across all projects
      repeat with proj in every project
        try
          set targetTask to first task of proj whose name is taskName
          exit repeat
        end try
      end repeat
    end try

    if targetTask is not missing value then
      delete targetTask
      return "Task deleted: " & taskName
    else
      return "Task not found: " & taskName
    end if
  end tell
end tell