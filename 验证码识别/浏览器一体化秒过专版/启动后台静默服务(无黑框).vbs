' 本地验证码助手 - 后台静默启动器 (无黑框、无弹窗、不占任务栏)
Set ws = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
curDir = fso.GetParentFolderName(WScript.ScriptFullName)
ws.CurrentDirectory = curDir

psCmd = "powershell -WindowStyle Hidden -ExecutionPolicy Bypass -File """ & curDir & "\service_daemon.ps1"" -Action start"
ws.Run psCmd, 0, True