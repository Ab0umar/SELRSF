@echo off
REM SELRS API Server - Let's Encrypt HTTPS Startup Script
REM This script starts the Flask server with Let's Encrypt SSL certificate

setlocal enabledelayedexpansion

echo.
echo ============================================================
echo SELRS API Server - Let's Encrypt HTTPS
echo ============================================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.9+ from https://www.python.org
    pause
    exit /b 1
)

echo [OK] Python is installed

REM Check if required packages are installed
python -c "import flask" >nul 2>&1
if errorlevel 1 (
    echo.
    echo [INFO] Installing required packages...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install packages
        pause
        exit /b 1
    )
)

echo [OK] Required packages are installed

REM Check if Let's Encrypt certificate exists
set CERT_FILE=C:\Certbot\live\selrs.cc\fullchain.pem
set KEY_FILE=C:\Certbot\live\selrs.cc\privkey.pem

if not exist "%CERT_FILE%" (
    echo.
    echo ERROR: Let's Encrypt certificate not found!
    echo Expected location: %CERT_FILE%
    echo.
    echo To fix this:
    echo 1. Install Certbot: pip install certbot
    echo 2. Run: certbot certonly --standalone -d selrs.cc
    echo 3. Try again
    echo.
    pause
    exit /b 1
)

if not exist "%KEY_FILE%" (
    echo.
    echo ERROR: Let's Encrypt private key not found!
    echo Expected location: %KEY_FILE%
    echo.
    pause
    exit /b 1
)

echo [OK] Let's Encrypt certificate found
echo     Cert: %CERT_FILE%
echo     Key:  %KEY_FILE%

REM Start the server
echo.
echo ============================================================
echo Starting SELRS API Server with HTTPS...
echo ============================================================
echo.
echo Server will be available at:
echo   Local:   https://0.0.0.0:3000
echo   Domain:  https://selrs.cc:3000
echo.
echo Use this URL in your mobile app settings:
echo   https://selrs.cc:3000
echo.
echo Press Ctrl+C to stop the server
echo.

python server-lets-encrypt.py

if errorlevel 1 (
    echo.
    echo ERROR: Server failed to start
    echo.
    pause
    exit /b 1
)

pause
