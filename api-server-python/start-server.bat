@echo off
REM SELRS API Server - Auto Start Script
REM This script starts the Python API Server

cd /d C:\SELRS\api-server-python

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ============================================
    echo ERROR: Python is not installed or not in PATH
    echo ============================================
    echo.
    echo Please install Python 3.9+ from:
    echo https://www.python.org/downloads/
    echo.
    echo Make sure to check "Add Python to PATH"
    echo.
    pause
    exit /b 1
)

REM Install/Update dependencies
echo.
echo Installing dependencies...
pip install -r requirements.txt

REM Start the server
echo.
echo Starting SELRS API Server...
python server.py

pause
