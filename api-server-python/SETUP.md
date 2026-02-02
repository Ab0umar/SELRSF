# SELRS Python API Server - Setup Guide

## ✅ Prerequisites

1. **Python 3.9+** installed on your Windows computer
   - Download from: https://www.python.org/downloads/
   - Make sure to check "Add Python to PATH" during installation

2. **MS Access Database Engine** (for pyodbc)
   - Download from: https://www.microsoft.com/en-us/download/details.aspx?id=13255
   - Choose the correct version (32-bit or 64-bit to match your Python installation)

## 🚀 Installation Steps

### 1. Copy Files to Your Computer

Copy the entire `api-server-python` folder to your work computer:
```
C:\SELRS\api-server-python\
```

### 2. Create .env File

Create a file named `.env` in the `api-server-python` folder with this content:

```env
PORT=3000
DB_PATH=C:\Users\selrs\OneDrive\Documents\SELRS\الخزنه.accdb
JWT_SECRET=selrs-secret-key-2024
ADMIN_USERNAME=admin
ADMIN_PASSWORD=selrs2024
```

**Important:** Update `DB_PATH` if your database is in a different location.

### 3. Install Python Dependencies

Open Command Prompt and run:

```bash
cd C:\SELRS\api-server-python
pip install -r requirements.txt
```

### 4. Run the Server

```bash
python server.py
```

You should see:

```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           SELRS API Server Started Successfully           ║
║                                                           ║
║  Port: 3000                                               ║
║  Database: C:\Users\selrs\OneDrive\Documents\SELRS\...   ║
║                                                           ║
║  Access URLs:                                            ║
║  - Local: http://localhost:3000                          ║
║  - Network: http://192.168.x.x:3000                      ║
║                                                           ║
║  Health Check: http://localhost:3000/api/health          ║
║                                                           ║
║  CORS: Enabled for all origins                           ║
║  Database: MS Access (pyodbc)                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

## 🔗 Testing the API

### Health Check (No Auth Required)

```bash
curl http://localhost:3000/api/health
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"selrs2024\"}"
```

### Get Khazina Data

```bash
curl http://localhost:3000/api/khazina ^
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📱 Mobile App Configuration

1. Open SELRS app on your phone
2. Go to **Settings** (الإعدادات)
3. Enter Server URL: `http://192.168.x.x:3000`
   - Replace `192.168.x.x` with your computer's IP
4. Click **Save** (حفظ)
5. Click **Test Connection** (اختبار الاتصال)
6. Login with: `admin` / `selrs2024`
7. Enable **API Mode** (وضع API)

## 🔧 Troubleshooting

### Error: "No module named 'flask'"

Run the installation again:
```bash
pip install -r requirements.txt
```

### Error: "Cannot connect to database"

1. Check that the database path in `.env` is correct
2. Make sure the `.accdb` file is not open in MS Access
3. Verify that MS Access Database Engine is installed

### Error: "Port 3000 already in use"

Either:
1. Stop the other process using port 3000
2. Or change PORT in `.env` to a different number (e.g., 3001)

### Error: "Provider cannot be found"

This means MS Access Database Engine is not installed. Download and install it from:
https://www.microsoft.com/en-us/download/details.aspx?id=13255

## 🔄 Running as Windows Service (Optional)

To run the API server automatically on Windows startup:

### Using NSSM (Non-Sucking Service Manager)

1. Download NSSM from: https://nssm.cc/download
2. Extract to `C:\nssm`
3. Open Command Prompt as Administrator
4. Run:

```bash
cd C:\nssm\win64
nssm install SELRS-API-Server "C:\Python311\python.exe" "C:\SELRS\api-server-python\server.py"
nssm start SELRS-API-Server
```

To check service status:
```bash
nssm status SELRS-API-Server
```

To remove service:
```bash
nssm remove SELRS-API-Server confirm
```

## 📊 API Endpoints

All endpoints require `Authorization: Bearer TOKEN` header (except `/api/health`)

### Khazina (Treasury)
- `GET /api/khazina` - Get all records (optional: `?year=2024`)
- `GET /api/khazina/:id` - Get single record
- `POST /api/khazina` - Create new record
- `PUT /api/khazina/:id` - Update record
- `DELETE /api/khazina/:id` - Delete record

### Sulf (Advances)
- `GET /api/sulf` - Get all records
- `GET /api/sulf/:id` - Get single record
- `POST /api/sulf` - Create new record
- `PUT /api/sulf/:id` - Update record
- `DELETE /api/sulf/:id` - Delete record

### Qard (Loans)
- `GET /api/qard` - Get all records
- `GET /api/qard/:id` - Get single record
- `POST /api/qard` - Create new record
- `PUT /api/qard/:id` - Update record
- `DELETE /api/qard/:id` - Delete record

### Health Check
- `GET /api/health` - Check if server is running (no auth required)

## 💡 Advantages of Python Version

✅ No OLEDB provider issues
✅ Better error handling
✅ Easier to debug
✅ Works with all Windows versions
✅ Simpler setup process
✅ Better logging

## 🎯 Next Steps

1. ✅ Install Python 3.9+
2. ✅ Install MS Access Database Engine
3. ✅ Copy api-server-python folder
4. ✅ Create .env file
5. ✅ Run `pip install -r requirements.txt`
6. ✅ Run `python server.py`
7. ✅ Configure mobile app with server URL
8. ✅ Test connection from mobile app

Good luck! 🚀
