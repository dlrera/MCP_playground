tell application "OmniFocus"
  tell front document
    -- Find the task in inbox
    set taskName to "Bring books to car for John"
    set targetTask to missing value

    try
      set targetTask to last inbox task whose name is taskName
    end try

    if targetTask is not missing value then
      -- Get the Father folder and project
      set fatherFolder to folder "Father" of folder "Personal" of folder "Active Projects"
      set targetProject to project "[Misc Father Items]" of fatherFolder

      -- Move task to the project
      move targetTask to end of tasks of targetProject

      -- Flag the task
      set flagged of targetTask to true

      -- Find or create Home tag
      set homeTag to missing value
      repeat with t in every tag
        if name of t is "Home" then
          set homeTag to t
          exit repeat
        end if
      end repeat

      if homeTag is missing value then
        set homeTag to make new tag with properties {name:"Home"}
      end if

      -- Apply the tag
      set primary tag of targetTask to homeTag

      return "SUCCESS: Task '" & taskName & "' has been moved to [Misc Father Items], flagged, and tagged with Home"
    else
      return "Task not found in inbox: " & taskName
    end if
  end tell
end tell