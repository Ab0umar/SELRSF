# SELRS API Server - Let's Encrypt Installation Script
# Run as Administrator: powershell -ExecutionPolicy Bypass -File install-lets-encrypt.ps1

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "SELRS API Server - Let's Encrypt Installation" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as Administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator" -ForegroundColor Red
    Write-Host "Please right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "[OK] Running as Administrator" -ForegroundColor Green
Write-Host ""

# Step 1: Check Python
Write-Host "Step 1: Checking Python installation..." -ForegroundColor Yellow
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.9+ from https://www.python.org" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Python is installed: $pythonVersion" -ForegroundColor Green
Write-Host ""

# Step 2: Install Certbot
Write-Host "Step 2: Installing Certbot..." -ForegroundColor Yellow
pip install certbot certbot-dns-cloudflare | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install Certbot" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Certbot installed successfully" -ForegroundColor Green
Write-Host ""

# Step 3: Generate Let's Encrypt Certificate
Write-Host "Step 3: Generating Let's Encrypt certificate..." -ForegroundColor Yellow
Write-Host ""
Write-Host "You will be asked to:" -ForegroundColor Cyan
Write-Host "1. Enter your email address"
Write-Host "2. Agree to the Let's Encrypt terms"
Write-Host "3. Choose how to verify your domain (select 'Standalone')"
Write-Host ""
Write-Host "Make sure ports 80 and 443 are open on your router!" -ForegroundColor Red
Write-Host ""

Read-Host "Press Enter to continue..."

certbot certonly --standalone -d selrs.cc

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "ERROR: Certificate generation failed" -ForegroundColor Red
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure ports 80 and 443 are open on your router"
    Write-Host "2. Make sure no other service is using ports 80 or 443"
    Write-Host "3. Check your internet connection"
    Write-Host "4. Try again in a few minutes"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[OK] Certificate generated successfully!" -ForegroundColor Green
Write-Host ""

# Step 4: Verify certificate
Write-Host "Step 4: Verifying certificate..." -ForegroundColor Yellow
$certPath = "C:\Certbot\live\selrs.cc\fullchain.pem"
$keyPath = "C:\Certbot\live\selrs.cc\privkey.pem"

if ((Test-Path $certPath) -and (Test-Path $keyPath)) {
    Write-Host "[OK] Certificate files found:" -ForegroundColor Green
    Write-Host "     Cert: $certPath" -ForegroundColor Green
    Write-Host "     Key:  $keyPath" -ForegroundColor Green
} else {
    Write-Host "ERROR: Certificate files not found" -ForegroundColor Red
    Write-Host "Expected:" -ForegroundColor Yellow
    Write-Host "  $certPath"
    Write-Host "  $keyPath"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Step 5: Install Python dependencies
Write-Host "Step 5: Installing Python dependencies..." -ForegroundColor Yellow
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

pip install -r requirements.txt | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "[OK] Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

# Step 6: Summary
Write-Host "============================================================" -ForegroundColor Green
Write-Host "Installation Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Start the server:" -ForegroundColor Yellow
Write-Host "   Double-click: start-lets-encrypt.bat" -ForegroundColor White
Write-Host ""
Write-Host "2. Update mobile app settings:" -ForegroundColor Yellow
Write-Host "   URL: https://selrs.cc:3000" -ForegroundColor White
Write-Host ""
Write-Host "3. Test the connection:" -ForegroundColor Yellow
Write-Host "   curl -k https://selrs.cc:3000/api/health" -ForegroundColor White
Write-Host ""
Write-Host "Important:" -ForegroundColor Red
Write-Host "- Certificate expires in 90 days"
Write-Host "- Set up auto-renewal (see LETS-ENCRYPT-WINDOWS.md)"
Write-Host "- Keep ports 80 and 443 open for renewal"
Write-Host ""

Read-Host "Press Enter to exit"
