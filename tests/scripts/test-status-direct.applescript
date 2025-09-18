tell application "OmniFocus"
  tell front document
    set targetProject to first project whose name is "Test Status Project"
    set status of targetProject to on hold status
    return "SUCCESS: Project set to on-hold"
  end tell
end tell