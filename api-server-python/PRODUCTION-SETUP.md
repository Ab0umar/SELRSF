# SELRS API Server - Production Setup Guide

## 🚀 Upgrade from Development to Production

The Flask development server is not suitable for production. This guide shows how to use **Gunicorn** (a production WSGI server).

---

## ✅ Step 1: Install Gunicorn

```bash
cd C:\SELRS\api-server-python
pip install gunicorn==21.2.0
```

Or update requirements.txt:
```bash
pip install -r requirements.txt
```

---

## ✅ Step 2: Start with Gunicorn

### Option A: Using the Batch Script (Easiest)

Double-click: `start-production.bat`

This will:
- Install Gunicorn if needed
- Start the server with 4 worker processes
- Enable access logging
- Bind to all network interfaces (0.0.0.0:3000)

### Option B: Manual Command

```bash
cd C:\SELRS\api-server-python
gunicorn --bind 0.0.0.0:3000 --workers 4 --timeout 120 server:app
```

### Option C: With More Logging

```bash
gunicorn --bind 0.0.0.0:3000 --workers 4 --timeout 120 --access-logfile - --error-logfile - server:app
```

---

## 📊 Production Configuration Explained

| Parameter | Value | Meaning |
|-----------|-------|---------|
| `--bind` | `0.0.0.0:3000` | Listen on all network interfaces, port 3000 |
| `--workers` | `4` | Run 4 worker processes (adjust based on CPU cores) |
| `--timeout` | `120` | Kill worker if no response for 120 seconds |
| `--access-logfile` | `-` | Log all requests to console |
| `--error-logfile` | `-` | Log errors to console |

---

## 🔧 Tuning for Your Hardware

### For Low-End Machines (1-2 CPU cores):
```bash
gunicorn --bind 0.0.0.0:3000 --workers 2 --timeout 120 server:app
```

### For Medium Machines (4 CPU cores):
```bash
gunicorn --bind 0.0.0.0:3000 --workers 4 --timeout 120 server:app
```

### For High-End Machines (8+ CPU cores):
```bash
gunicorn --bind 0.0.0.0:3000 --workers 8 --timeout 120 server:app
```

**Rule of thumb:** `workers = (2 × CPU_cores) + 1`

---

## ✅ Verify Production Server is Running

### Test Local Connection

```bash
curl http://localhost:3000/api/health
```

### Test Network Connection

From another computer:
```bash
curl http://192.168.0.170:3000/api/health
```

---

## 📈 Performance Improvements

| Aspect | Development | Production |
|--------|-------------|-----------|
| Server | Flask dev server | Gunicorn (4+ workers) |
| Concurrency | 1 request at a time | Multiple concurrent requests |
| Performance | ~10-50 req/sec | ~100-500 req/sec |
| Stability | Crashes on errors | Recovers automatically |
| Logging | Limited | Full request/error logging |

---

## 🔄 Auto-Start with Windows Service

To run Gunicorn as a Windows Service, update the service installation:

### Using PowerShell:

```powershell
$pythonPath = "C:\Python311\python.exe"
$serverScript = "C:\SELRS\api-server-python\server.py"
$nssmPath = "C:\nssm\win64\nssm.exe"

# Install service with Gunicorn
& $nssmPath install SELRS-API-Server "$pythonPath" "-m gunicorn --bind 0.0.0.0:3000 --workers 4 server:app"
& $nssmPath start SELRS-API-Server
```

Or manually:
```bash
C:\nssm\win64\nssm.exe install SELRS-API-Server "C:\Python311\python.exe" "-m gunicorn --bind 0.0.0.0:3000 --workers 4 server:app"
C:\nssm\win64\nssm.exe start SELRS-API-Server
```

---

## 🐛 Troubleshooting

### "gunicorn: command not found"

Install Gunicorn:
```bash
pip install gunicorn==21.2.0
```

### "Address already in use"

Port 3000 is already in use. Either:
1. Kill the existing process
2. Use a different port: `--bind 0.0.0.0:3001`

### "Too many open files"

Increase the limit:
```bash
# Windows doesn't have this limit, but check if firewall is blocking
netsh advfirewall firewall show rule name="SELRS API Server"
```

### "Workers keep crashing"

Increase timeout:
```bash
gunicorn --bind 0.0.0.0:3000 --workers 4 --timeout 300 server:app
```

---

## 📋 Deployment Checklist

- [ ] Gunicorn installed: `pip install gunicorn==21.2.0`
- [ ] Firewall rule added for port 3000
- [ ] Database file is accessible
- [ ] `.env` file configured correctly
- [ ] Tested local connection: `http://localhost:3000/api/health`
- [ ] Tested network connection: `http://192.168.0.170:3000/api/health`
- [ ] Mobile app configured with correct URL
- [ ] Started with Gunicorn (not Flask dev server)

---

## 🚀 Next Steps

1. ✅ Install Gunicorn: `pip install gunicorn==21.2.0`
2. ✅ Stop the current Flask server (Ctrl+C)
3. ✅ Start with Gunicorn: `start-production.bat` or manual command
4. ✅ Verify it's working: `http://localhost:3000/api/health`
5. ✅ Test from mobile app
6. ✅ (Optional) Set up as Windows Service for auto-start

---

## 💡 Tips

- **Monitor Performance:** Use `--access-logfile` to see all requests
- **Adjust Workers:** Start with 4, adjust based on load
- **Keep Logs:** Redirect output to a file for debugging
- **Test Before Production:** Always test with Gunicorn before going live
- **Backup Config:** Keep a backup of `.env` file

---

## 📊 Expected Output

When running with Gunicorn, you should see:

```
[2026-01-27 19:30:00 +0000] [1234] [INFO] Starting gunicorn 21.2.0
[2026-01-27 19:30:00 +0000] [1234] [INFO] Listening at: http://0.0.0.0:3000 (1234)
[2026-01-27 19:30:00 +0000] [1234] [INFO] Using worker: sync
[2026-01-27 19:30:00 +0000] [1235] [INFO] Booting worker with pid: 1235
[2026-01-27 19:30:00 +0000] [1236] [INFO] Booting worker with pid: 1236
[2026-01-27 19:30:00 +0000] [1237] [INFO] Booting worker with pid: 1237
[2026-01-27 19:30:00 +0000] [1238] [INFO] Booting worker with pid: 1238
```

Good luck! 🎉
