' SELRS API Server - Windows Service Installation Script
' This script installs the Python API Server as a Windows Service
' Run as Administrator

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory where this script is located
scriptPath = objFSO.GetParentFolderName(WScript.ScriptFullName)
pythonPath = "C:\Python311\python.exe"
serverScript = scriptPath & "\server.py"

' Check if Python exists
If Not objFSO.FileExists(pythonPath) Then
    ' Try to find Python in common locations
    commonPaths = Array( _
        "C:\Python312\python.exe", _
        "C:\Python310\python.exe", _
        "C:\Python39\python.exe", _
        "C:\Program Files\Python311\python.exe", _
        "C:\Program Files\Python312\python.exe" _
    )
    
    pythonFound = False
    For Each path In commonPaths
        If objFSO.FileExists(path) Then
            pythonPath = path
            pythonFound = True
            Exit For
        End If
    Next
    
    If Not pythonFound Then
        MsgBox "Python not found. Please install Python 3.9+ first.", vbCritical, "Error"
        WScript.Quit 1
    End If
End If

' Check if NSSM is installed
nssmPath = "C:\nssm\win64\nssm.exe"
If Not objFSO.FileExists(nssmPath) Then
    MsgBox "NSSM not found at C:\nssm\win64\nssm.exe" & vbCrLf & vbCrLf & _
           "Please download NSSM from: https://nssm.cc/download" & vbCrLf & _
           "Extract to C:\nssm\", vbCritical, "Error"
    WScript.Quit 1
End If

' Create the service
MsgBox "Installing SELRS API Server as Windows Service..." & vbCrLf & vbCrLf & _
       "Python: " & pythonPath & vbCrLf & _
       "Server: " & serverScript, vbInformation, "Installation"

' Run NSSM install command
cmdLine = nssmPath & " install SELRS-API-Server """ & pythonPath & """ """ & serverScript & """"
objShell.Run cmdLine, 0, True

' Start the service
cmdLine = nssmPath & " start SELRS-API-Server"
objShell.Run cmdLine, 0, True

MsgBox "Service installed successfully!" & vbCrLf & vbCrLf & _
       "The SELRS API Server will now start automatically with Windows.", vbInformation, "Success"
