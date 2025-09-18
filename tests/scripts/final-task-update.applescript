tell application "OmniFocus"
  tell front document
    -- Get the Father folder
    set fatherFolder to folder "Father" of folder "Personal" of folder "Active Projects"

    -- Get the project (with brackets in the name)
    set targetProject to project "[Misc Father Items]" of fatherFolder

    -- Find the task
    set taskName to "Bring books to car for John"
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
        -- Create Home tag if it doesn't exist
        set homeTag to make new tag with properties {name:"Home"}
        set primary tag of targetTask to homeTag
        return "SUCCESS: Task '" & taskName & "' has been flagged and tagged with newly created Home tag"
      end if
    else
      return "Task not found: " & taskName
    end if
  end tell
end tell