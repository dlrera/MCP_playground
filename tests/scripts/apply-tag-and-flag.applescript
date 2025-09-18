tell application "OmniFocus"
  tell front document
    -- Find the task
    set taskName to "Bring books to car for John"
    set targetTask to missing value

    -- Search across all projects
    repeat with proj in every project
      try
        set targetTask to first task of proj whose name is taskName
        exit repeat
      end try
    end repeat

    if targetTask is not missing value then
      -- Flag the task
      set flagged of targetTask to true

      -- Find and apply the Home tag
      set homeTag to missing value
      repeat with t in every tag
        if name of t is "Home" then
          set homeTag to t
          exit repeat
        end if
      end repeat

      if homeTag is not missing value then
        set primary tag of targetTask to homeTag
        return "Task updated: " & name of targetTask & " (flagged and tagged with Home)"
      else
        return "Task flagged but Home tag not found"
      end if
    else
      return "Task not found: " & taskName
    end if
  end tell
end tell