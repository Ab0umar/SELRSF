@echo off
REM SELRS API Server Startup Script
REM This script starts the Python API server

echo.
echo ============================================
echo Starting SELRS API Server
echo ============================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if server.py exists
if not exist "server.py" (
    echo ERROR: server.py not found in current directory
    echo Current directory: %cd%
    pause
    exit /b 1
)

REM Start the server
echo Starting Python server...
echo.
python server.py

REM If the script reaches here, the server stopped
echo.
echo ============================================
echo Server stopped. Press any key to close...
echo ============================================
pause
