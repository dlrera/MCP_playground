tell application "OmniFocus"
  tell front document
    -- The project name without brackets
    set projectName to "Misc Father Items"
    set taskName to "Bring books to car for John"

    -- Find the project
    set targetProject to missing value
    try
      set targetProject to first project whose name is projectName
    end try

    if targetProject is missing value then
      -- Try searching in folders
      repeat with fld in every folder
        try
          set targetProject to first project of fld whose name is projectName
          exit repeat
        end try
      end repeat
    end if

    if targetProject is not missing value then
      -- Find the task in the project
      set targetTask to missing value
      try
        set targetTask to first task of targetProject whose name is taskName
      end try

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
          return "SUCCESS: Task '" & taskName & "' has been flagged and tagged with Home"
        else
          return "Task flagged but Home tag not found"
        end if
      else
        return "Task not found in project: " & taskName
      end if
    else
      return "Project not found: " & projectName
    end if
  end tell
end tell