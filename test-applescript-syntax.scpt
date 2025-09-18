tell application "OmniFocus"
  tell front document
    -- Test creating a project and setting its status
    set testProject to make new project with properties {name:"Syntax Test Project"}

    -- Test on hold status syntax variations
    try
      set status of testProject to on hold status
      log "Success: on hold status"
    on error
      try
        set status of testProject to (on hold status)
        log "Success: (on hold status)"
      on error
        try
          -- Alternative: set the project to on hold using defer date
          set defer date of testProject to (current date) + (1 * days)
          log "Success: using defer date"
        on error errMsg
          log "Failed: " & errMsg
        end try
      end try
    end try

    -- Clean up
    delete testProject
  end tell
end tell