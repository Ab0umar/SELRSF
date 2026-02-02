# SELRS API Server - Windows Service Setup Guide

## 🎯 Goal
Run the SELRS API Server automatically when Windows starts, without needing to manually start it each time.

---

## 📋 Prerequisites

1. **Python 3.9+** - Already installed
2. **NSSM (Non-Sucking Service Manager)** - Download from: https://nssm.cc/download
3. **Administrator Access** - Required to install Windows Services

---

## 🚀 Step-by-Step Installation

### Step 1: Download and Install NSSM

1. Go to: https://nssm.cc/download
2. Download the latest version (e.g., `nssm-2.24-101-g897c7ad.zip`)
3. Extract the ZIP file to: `C:\nssm\`
   - You should have: `C:\nssm\win64\nssm.exe`

### Step 2: Install Dependencies (One Time)

Open Command Prompt and run:

```bash
cd C:\SELRS\api-server-python
pip install -r requirements.txt
```

### Step 3: Install as Windows Service

**Option A: Using PowerShell (Recommended)**

1. Right-click on `install-service.ps1`
2. Select "Run with PowerShell"
3. Click "Run" if prompted about execution policy
4. Wait for the installation to complete

**Option B: Manual Installation**

Open Command Prompt as Administrator and run:

```bash
cd C:\nssm\win64
nssm install SELRS-API-Server "C:\Python311\python.exe" "C:\SELRS\api-server-python\server.py"
nssm start SELRS-API-Server
```

(Replace `C:\Python311\python.exe` with your actual Python path if different)

---

## ✅ Verify Installation

### Check Service Status

Open Command Prompt and run:

```bash
C:\nssm\win64\nssm.exe status SELRS-API-Server
```

You should see: `SERVICE_RUNNING`

### Test the API

Open your browser and go to:

```
http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "SELRS API Server is running",
  "timestamp": "2026-01-27T..."
}
```

---

## 🔧 Service Management

### Start the Service

```bash
C:\nssm\win64\nssm.exe start SELRS-API-Server
```

### Stop the Service

```bash
C:\nssm\win64\nssm.exe stop SELRS-API-Server
```

### Restart the Service

```bash
C:\nssm\win64\nssm.exe restart SELRS-API-Server
```

### Remove the Service

```bash
C:\nssm\win64\nssm.exe remove SELRS-API-Server confirm
```

### View Service Logs

```bash
C:\nssm\win64\nssm.exe get SELRS-API-Server AppDirectory
```

Logs are usually stored in: `C:\SELRS\api-server-python\logs\`

---

## 🐛 Troubleshooting

### Service Won't Start

**Check 1: Is Python installed?**
```bash
python --version
```

**Check 2: Are dependencies installed?**
```bash
cd C:\SELRS\api-server-python
pip install -r requirements.txt
```

**Check 3: Is the database accessible?**
- Make sure `.accdb` file is not open in MS Access
- Verify the path in `.env` is correct

**Check 4: Check service logs**
```bash
C:\nssm\win64\nssm.exe get SELRS-API-Server AppStdout
C:\nssm\win64\nssm.exe get SELRS-API-Server AppStderr
```

### Port 3000 Already in Use

If port 3000 is already in use:

1. Find what's using it:
   ```bash
   netstat -ano | findstr :3000
   ```

2. Either:
   - Kill the process: `taskkill /PID <PID> /F`
   - Or change the port in `.env`: `PORT=3001`

### Service Crashes on Startup

1. Check the error logs
2. Make sure all dependencies are installed
3. Verify Python path is correct
4. Check database connectivity

---

## 🔄 Auto-Start After Reboot

Once installed as a Windows Service, the SELRS API Server will automatically start when:
- Windows boots up
- The computer restarts
- The service is manually started

**To verify auto-start is enabled:**

1. Open Services (Win+R, type `services.msc`)
2. Find "SELRS-API-Server"
3. Right-click → Properties
4. Startup type should be "Automatic"

---

## 📊 Quick Reference

| Task | Command |
|------|---------|
| Install Service | `install-service.ps1` (right-click, Run with PowerShell) |
| Check Status | `C:\nssm\win64\nssm.exe status SELRS-API-Server` |
| Start Service | `C:\nssm\win64\nssm.exe start SELRS-API-Server` |
| Stop Service | `C:\nssm\win64\nssm.exe stop SELRS-API-Server` |
| Restart Service | `C:\nssm\win64\nssm.exe restart SELRS-API-Server` |
| Remove Service | `C:\nssm\win64\nssm.exe remove SELRS-API-Server confirm` |
| Test API | `http://localhost:3000/api/health` |

---

## 🎯 Next Steps

1. ✅ Download and extract NSSM to `C:\nssm\`
2. ✅ Run `install-service.ps1` as Administrator
3. ✅ Verify service is running: `nssm status SELRS-API-Server`
4. ✅ Test API: Open browser to `http://localhost:3000/api/health`
5. ✅ Restart Windows and verify service starts automatically

---

## 💡 Tips

- **Keep NSSM folder**: Don't delete `C:\nssm\` after installation
- **Monitor Service**: Use Windows Event Viewer to monitor service events
- **Backup Config**: Keep a backup of `.env` file
- **Update Python**: If you update Python, update the service path in NSSM

---

## 🆘 Still Having Issues?

1. Check the logs in Command Prompt
2. Verify all prerequisites are installed
3. Make sure you're running as Administrator
4. Check that the database file is accessible
5. Verify port 3000 is not blocked by firewall

Good luck! 🚀
