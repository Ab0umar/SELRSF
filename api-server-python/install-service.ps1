# SELRS API Server - Windows Service Installation Script
# Run as Administrator

# Get the directory where this script is located
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$pythonExe = "C:\Python311\python.exe"
$serverScript = Join-Path $scriptPath "server.py"
$nssmPath = "C:\nssm\win64\nssm.exe"

Write-Host "╔═══════════════════════════════════════════════════════════╗"
Write-Host "║                                                           ║"
Write-Host "║   SELRS API Server - Windows Service Installation        ║"
Write-Host "║                                                           ║"
Write-Host "╚═══════════════════════════════════════════════════════════╝"
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please right-click on this file and select 'Run as Administrator'"
    Read-Host "Press Enter to exit"
    exit 1
}

# Find Python
Write-Host "Looking for Python installation..." -ForegroundColor Yellow
$pythonFound = $false

$pythonPaths = @(
    "C:\Python311\python.exe",
    "C:\Python312\python.exe",
    "C:\Python310\python.exe",
    "C:\Python39\python.exe",
    "C:\Program Files\Python311\python.exe",
    "C:\Program Files\Python312\python.exe"
)

foreach ($path in $pythonPaths) {
    if (Test-Path $path) {
        $pythonExe = $path
        $pythonFound = $true
        Write-Host "✓ Found Python at: $pythonExe" -ForegroundColor Green
        break
    }
}

if (-not $pythonFound) {
    Write-Host "✗ Python not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Python 3.9+ from: https://www.python.org/downloads/"
    Write-Host "Make sure to check 'Add Python to PATH' during installation"
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if NSSM exists
Write-Host "Looking for NSSM..." -ForegroundColor Yellow
if (-not (Test-Path $nssmPath)) {
    Write-Host "✗ NSSM not found at: $nssmPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please download NSSM from: https://nssm.cc/download"
    Write-Host "Extract to: C:\nssm\"
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Found NSSM" -ForegroundColor Green

# Check if server.py exists
Write-Host "Checking server.py..." -ForegroundColor Yellow
if (-not (Test-Path $serverScript)) {
    Write-Host "✗ server.py not found at: $serverScript" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "✓ Found server.py" -ForegroundColor Green

# Install the service
Write-Host ""
Write-Host "Installing SELRS API Server as Windows Service..." -ForegroundColor Yellow
Write-Host "Python: $pythonExe"
Write-Host "Server: $serverScript"
Write-Host ""

$installCmd = "& `"$nssmPath`" install SELRS-API-Server `"$pythonExe`" `"$serverScript`""
Invoke-Expression $installCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Service installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install service" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start the service
Write-Host ""
Write-Host "Starting SELRS API Server..." -ForegroundColor Yellow
$startCmd = "& `"$nssmPath`" start SELRS-API-Server"
Invoke-Expression $startCmd

if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Service started successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to start service" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════════════╗"
Write-Host "║                                                           ║"
Write-Host "║              Installation Complete!                      ║"
Write-Host "║                                                           ║"
Write-Host "║  The SELRS API Server will now start automatically       ║"
Write-Host "║  when Windows boots up.                                  ║"
Write-Host "║                                                           ║"
Write-Host "║  To check service status, run:                           ║"
Write-Host "║  C:\nssm\win64\nssm.exe status SELRS-API-Server          ║"
Write-Host "║                                                           ║"
Write-Host "║  To stop the service, run:                               ║"
Write-Host "║  C:\nssm\win64\nssm.exe stop SELRS-API-Server            ║"
Write-Host "║                                                           ║"
Write-Host "║  To remove the service, run:                             ║"
Write-Host "║  C:\nssm\win64\nssm.exe remove SELRS-API-Server confirm  ║"
Write-Host "║                                                           ║"
Write-Host "╚═══════════════════════════════════════════════════════════╝"
Write-Host ""

Read-Host "Press Enter to exit"
