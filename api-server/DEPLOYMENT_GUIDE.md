# SELRS API Server - Deployment Guide for Windows 11

This guide will help you deploy the SELRS API server on your Windows 11 work computer to connect the mobile app to your MS Access database.

---

## 📋 Prerequisites

- Windows 11 computer with administrator access
- MS Access database file: `C:\Users\selrs\OneDrive\Documents\SELRS\الخزنه.accdb`
- Static IP: `41.199.252.107` (already configured)
- Port 3000 available (for API server)

---

## 🚀 Installation Steps

### Step 1: Install Node.js

1. Download Node.js from: https://nodejs.org/
2. Choose **LTS version** (Long Term Support)
3. Run the installer (`node-v20.x.x-x64.msi`)
4. During installation:
   - ✅ Check "Automatically install necessary tools"
   - ✅ Keep default installation path
5. Click "Install" and wait for completion
6. Restart your computer after installation

**Verify Installation:**
```cmd
node --version
npm --version
```
You should see version numbers (e.g., v20.10.0 and 10.2.3)

---

### Step 2: Install Microsoft Access Database Engine

The API server needs this to connect to `.accdb` files.

1. Download **Microsoft Access Database Engine 2016 Redistributable**:
   - 64-bit: https://www.microsoft.com/en-us/download/details.aspx?id=54920
   - Choose `AccessDatabaseEngine_X64.exe`

2. Run the installer
3. Follow the installation wizard
4. Restart your computer

---

### Step 3: Copy API Server Files

1. Create a folder: `C:\SELRS\api-server`
2. Copy these files to that folder:
   - `package.json`
   - `server.js`
   - `.env.example`

---

### Step 4: Configure Environment Variables

1. In `C:\SELRS\api-server`, rename `.env.example` to `.env`
2. Open `.env` with Notepad
3. Update the settings:

```env
# API Server Configuration
PORT=3000

# MS Access Database Path (use your actual path)
DB_PATH=C:\\Users\\selrs\\OneDrive\\Documents\\SELRS\\الخزنه.accdb

# JWT Secret (change this to a random string)
JWT_SECRET=your-random-secret-key-here-change-this

# Admin Credentials (change these!)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=selrs2024
```

**Important:** 
- Use double backslashes (`\\`) in the database path
- Change the JWT_SECRET to something unique
- Change the admin password to something secure

---

### Step 5: Install Dependencies

1. Open **Command Prompt** as Administrator:
   - Press `Win + X`
   - Click "Terminal (Admin)" or "Command Prompt (Admin)"

2. Navigate to the API server folder:
```cmd
cd C:\SELRS\api-server
```

3. Install required packages:
```cmd
npm install
```

Wait for all packages to download and install (this may take a few minutes).

---

### Step 6: Test the Server

1. Start the server:
```cmd
npm start
```

2. You should see:
```
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           SELRS API Server Started Successfully           ║
║                                                           ║
║  Port: 3000                                               ║
║  Database: C:\Users\selrs\OneDrive\Documents\SELRS\...   ║
║  Access: http://0.0.0.0:3000                              ║
║                                                           ║
║  Health Check: http://localhost:3000/api/health           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

3. Test the health check:
   - Open a web browser
   - Go to: `http://localhost:3000/api/health`
   - You should see: `{"status":"ok","message":"SELRS API Server is running",...}`

4. Press `Ctrl + C` to stop the server

---

### Step 7: Configure Windows Firewall

Allow incoming connections on port 3000:

1. Open **Windows Defender Firewall**:
   - Press `Win + R`
   - Type: `wf.msc`
   - Press Enter

2. Click **"Inbound Rules"** in the left panel

3. Click **"New Rule..."** in the right panel

4. Choose **"Port"** → Click "Next"

5. Select **"TCP"** and enter port: `3000` → Click "Next"

6. Select **"Allow the connection"** → Click "Next"

7. Check all profiles (Domain, Private, Public) → Click "Next"

8. Name: `SELRS API Server` → Click "Finish"

---

### Step 8: Configure Port Forwarding on Router

You need to forward port 3000 to your computer's local IP.

1. Find your local IP address:
```cmd
ipconfig
```
Look for "IPv4 Address" (e.g., `192.168.1.100`)

2. Access your router admin panel:
   - Open browser
   - Go to: `http://192.168.1.1` (or your router's IP)
   - Login with admin credentials

3. Find **Port Forwarding** section (may be under Advanced Settings)

4. Add new port forwarding rule:
   - **Service Name:** SELRS API
   - **External Port:** 3000
   - **Internal IP:** Your local IP (e.g., 192.168.1.100)
   - **Internal Port:** 3000
   - **Protocol:** TCP
   - **Status:** Enabled

5. Save the settings

---

### Step 9: Run Server as Windows Service (Auto-start)

To make the server start automatically when Windows boots:

1. Install `node-windows` globally:
```cmd
npm install -g node-windows
```

2. Create a file `install-service.js` in `C:\SELRS\api-server`:

```javascript
var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name: 'SELRS API Server',
  description: 'API server for SELRS Accounting mobile app',
  script: 'C:\\SELRS\\api-server\\server.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event
svc.on('install', function(){
  svc.start();
  console.log('Service installed and started!');
});

// Install the service
svc.install();
```

3. Run the installation script:
```cmd
node install-service.js
```

4. The service will now start automatically on boot!

**Managing the Service:**
- Open **Services** app (`Win + R` → `services.msc`)
- Find "SELRS API Server"
- Right-click to Start/Stop/Restart

---

## 🧪 Testing the API

### Test from Local Computer

1. Start the server:
```cmd
cd C:\SELRS\api-server
npm start
```

2. Test health endpoint:
```cmd
curl http://localhost:3000/api/health
```

3. Test login:
```cmd
curl -X POST http://localhost:3000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"username\":\"admin\",\"password\":\"selrs2024\"}"
```

You should get a token in response.

### Test from Mobile Device

1. Make sure your mobile device is connected to the same network or has internet access

2. In the SELRS mobile app:
   - Open the app
   - Login screen will appear
   - Enter username and password
   - If successful, you'll see the main screens

3. Try creating a new transaction to verify database connection

---

## 🔧 Troubleshooting

### Problem: Server won't start

**Error:** `Cannot find module 'express'`
- **Solution:** Run `npm install` in the api-server folder

**Error:** `Port 3000 is already in use`
- **Solution:** Change PORT in `.env` file to another port (e.g., 3001)

**Error:** `EADDRINUSE: address already in use`
- **Solution:** Another program is using port 3000. Kill it:
  ```cmd
  netstat -ano | findstr :3000
  taskkill /PID <PID_NUMBER> /F
  ```

### Problem: Cannot connect to database

**Error:** `Provider cannot be found`
- **Solution:** Install Microsoft Access Database Engine (Step 2)

**Error:** `Could not find file`
- **Solution:** Check the DB_PATH in `.env` file is correct

### Problem: Mobile app can't connect

1. **Check firewall:** Make sure port 3000 is allowed (Step 7)

2. **Check port forwarding:** Verify router settings (Step 8)

3. **Test from external network:**
   ```cmd
   curl http://41.199.252.107:3000/api/health
   ```

4. **Check server is running:**
   ```cmd
   netstat -ano | findstr :3000
   ```

5. **Check static IP:** Verify your static IP hasn't changed

### Problem: Authentication fails

- Check username/password in `.env` file
- Make sure JWT_SECRET is set
- Try generating a new token

---

## 📱 Mobile App Configuration

The mobile app is already configured to connect to:
```
http://41.199.252.107:3000
```

If you need to change this:
1. Open `lib/api-client.ts` in the mobile app
2. Update `API_BASE_URL` constant
3. Rebuild the app

---

## 🔐 Security Recommendations

1. **Change default credentials:**
   - Update ADMIN_USERNAME and ADMIN_PASSWORD in `.env`

2. **Use strong JWT secret:**
   - Generate a random string for JWT_SECRET

3. **Enable HTTPS (optional but recommended):**
   - Use a reverse proxy like nginx with SSL certificate
   - Or use Cloudflare Tunnel for secure access

4. **Restrict access:**
   - Only allow connections from known IP addresses
   - Use VPN for remote access

5. **Regular backups:**
   - Backup your Access database regularly
   - Keep copies of the API server code

---

## 📊 Monitoring

### Check Server Status

```cmd
curl http://localhost:3000/api/health
```

### View Server Logs

If running as a service, logs are in:
```
C:\ProgramData\SELRS API Server\daemon\
```

### Check Database Connection

Try querying data:
```cmd
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" ^
  http://localhost:3000/api/khazina
```

---

## 🆘 Support

If you encounter issues:

1. Check the server logs for error messages
2. Verify all installation steps were completed
3. Test each component individually (Node.js, database, network)
4. Make sure Windows Firewall and antivirus aren't blocking connections

---

## 📝 Summary

After completing all steps:

✅ Node.js installed
✅ Access Database Engine installed
✅ API server files copied
✅ Environment variables configured
✅ Dependencies installed
✅ Server tested locally
✅ Firewall configured
✅ Port forwarding configured
✅ Server running as Windows service
✅ Mobile app can connect

Your SELRS accounting system is now fully operational! 🎉

---

## 🔄 Updating the Server

If you need to update the server code:

1. Stop the service:
   ```cmd
   net stop "SELRS API Server"
   ```

2. Replace `server.js` with new version

3. Restart the service:
   ```cmd
   net start "SELRS API Server"
   ```

---

## 📞 Quick Reference

| Item | Value |
|------|-------|
| Server IP | 41.199.252.107 |
| Server Port | 3000 |
| API Base URL | http://41.199.252.107:3000/api |
| Health Check | http://41.199.252.107:3000/api/health |
| Database Path | C:\Users\selrs\OneDrive\Documents\SELRS\الخزنه.accdb |
| Server Folder | C:\SELRS\api-server |

---

**Last Updated:** January 2026
**Version:** 1.0.0
