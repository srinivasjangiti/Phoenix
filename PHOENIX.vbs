' Phoenix Launcher — runs PHOENIX.bat in a visible console window (required for node-pty)
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & Replace(WScript.ScriptFullName, "PHOENIX.vbs", "PHOENIX.bat") & Chr(34), 1, False
