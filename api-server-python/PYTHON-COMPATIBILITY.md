# SELRS API Server - Python Version Compatibility

## ⚠️ Gunicorn Not Compatible with Python 3.14 on Windows

Gunicorn requires the `fcntl` module which is only available on Unix-like systems (Linux, macOS), not on Windows.

---

## ✅ Solution: Use Flask Development Server

For Windows users, the Flask development server is sufficient for local use.

### Start the Server

```bash
cd C:\SELRS\api-server-python
python server.py
```

You should see:
```
╔═══════════════════════════════════════════════════════════╗
║           SELRS API Server Started Successfully           ║
║  Port: 3000                                               ║
║  Database: C:\Users\selrs\OneDrive\Documents\SELRS\...   ║
║  Access URLs:                                            ║
║  - Local: http://localhost:3000                          ║
║  - Network: http://192.168.0.170:3000                    ║
╚═══════════════════════════════════════════════════════════╝
```

---

## 🔄 Alternative: Use Waitress (Windows-Compatible)

If you want a production-like server on Windows, use **Waitress** instead of Gunicorn:

### Step 1: Install Waitress

```bash
pip install waitress==3.0.0
```

### Step 2: Create start-production-waitress.bat

```batch
@echo off
cd /d C:\SELRS\api-server-python
python -m waitress --host 0.0.0.0 --port 3000 server:app
pause
```

### Step 3: Run It

Double-click the batch file or run:
```bash
python -m waitress --host 0.0.0.0 --port 3000 server:app
```

---

## 📊 Server Comparison

| Server | Platform | Performance | Setup | Production Ready |
|--------|----------|-------------|-------|------------------|
| Flask Dev | All | Low | Easy | ❌ No |
| Gunicorn | Linux/macOS | High | Medium | ✅ Yes |
| Waitress | All (Windows) | Medium | Easy | ✅ Yes |

---

## 🎯 Recommendations

### For Local Development:
```bash
python server.py
```
- Simple to use
- Good for testing
- Sufficient for local mobile app testing

### For Production on Windows:
```bash
python -m waitress --host 0.0.0.0 --port 3000 server:app
```
- Better performance than Flask dev server
- Windows-compatible
- Production-ready

### For Production on Linux/macOS:
```bash
gunicorn --bind 0.0.0.0:3000 --workers 4 server:app
```
- Best performance
- Multiple workers
- Industry standard

---

## 🚀 Quick Start

### Option 1: Flask Development Server (Easiest)

```bash
cd C:\SELRS\api-server-python
python server.py
```

### Option 2: Waitress Production Server (Recommended for Windows)

```bash
pip install waitress==3.0.0
python -m waitress --host 0.0.0.0 --port 3000 server:app
```

### Option 3: Downgrade Python to 3.11 or 3.12

If you want to use Gunicorn, downgrade Python:
1. Uninstall Python 3.14
2. Install Python 3.11 or 3.12 from https://www.python.org/downloads/
3. Reinstall dependencies
4. Use Gunicorn

---

## ✅ Verify Server is Running

### Test Local Connection

```bash
curl http://localhost:3000/api/health
```

### Test Network Connection

```bash
curl http://192.168.0.170:3000/api/health
```

---

## 📋 Troubleshooting

### "ModuleNotFoundError: No module named 'fcntl'"

This means you're using Gunicorn on Windows. Use Flask or Waitress instead.

### "Address already in use"

Port 3000 is already in use. Either:
1. Kill the existing process
2. Use a different port: `--port 3001`

### "Connection refused"

1. Make sure the server is running
2. Check firewall settings
3. Verify the correct IP address

---

## 🎯 Next Steps

1. ✅ Run Flask development server: `python server.py`
2. ✅ Test local: `http://localhost:3000/api/health`
3. ✅ Test network: `http://192.168.0.170:3000/api/health`
4. ✅ Configure mobile app
5. ✅ (Optional) Install Waitress for production

Good luck! 🚀
