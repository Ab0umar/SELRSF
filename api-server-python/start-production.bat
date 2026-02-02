@echo off
REM SELRS API Server - Production Start Script
REM Uses Gunicorn WSGI server instead of Flask development server

cd /d C:\SELRS\api-server-python

REM Check if Gunicorn is installed
python -c "import gunicorn" >nul 2>&1
if errorlevel 1 (
    echo.
    echo ============================================
    echo Installing Gunicorn...
    echo ============================================
    echo.
    pip install gunicorn==21.2.0
)

REM Start the server with Gunicorn
echo.
echo ============================================
echo Starting SELRS API Server (Production)
echo ============================================
echo.
echo Server will run on:
echo - Local: http://localhost:3000
echo - Network: http://192.168.x.x:3000
echo.
echo Press Ctrl+C to stop the server
echo.

REM Run Gunicorn with 4 workers
python -m gunicorn --bind 0.0.0.0:3000 --workers 4 --timeout 120 --access-logfile - --error-logfile - server:app

pause
