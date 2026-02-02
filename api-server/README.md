# SELRS API Server

API server for SELRS Accounting mobile application. Connects the mobile app to MS Access database on Windows 11.

## 📦 Package Contents

- `server.js` - Main API server code
- `package.json` - Node.js dependencies
- `.env.example` - Environment configuration template
- `install-service.js` - Windows service installer
- `uninstall-service.js` - Windows service uninstaller
- `DEPLOYMENT_GUIDE.md` - Complete deployment instructions

## 🚀 Quick Start

### 1. Install Node.js
Download from: https://nodejs.org/ (LTS version)

### 2. Install Microsoft Access Database Engine
Download 64-bit version from Microsoft

### 3. Install Dependencies
```cmd
cd C:\SELRS\api-server
npm install
```

### 4. Configure Environment
1. Copy `.env.example` to `.env`
2. Update database path and credentials

### 5. Start Server
```cmd
npm start
```

## 📖 Full Documentation

See **DEPLOYMENT_GUIDE.md** for complete step-by-step instructions including:
- Prerequisites
- Installation
- Configuration
- Windows Firewall setup
- Port forwarding
- Running as Windows Service
- Troubleshooting

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login and get JWT token

### Khazina (Treasury)
- `GET /api/khazina` - Get all records (optional ?year=2024)
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
- `GET /api/health` - Server status

## 🔐 Authentication

All API endpoints (except `/api/auth/login` and `/api/health`) require JWT authentication.

1. Login to get token:
```bash
POST /api/auth/login
{
  "username": "admin",
  "password": "selrs2024"
}
```

2. Use token in subsequent requests:
```bash
Authorization: Bearer <your_token_here>
```

## 🗄️ Database Structure

### Table: All (Khazina)
- `ID` - Auto-increment primary key
- `التاريخ` - Date
- `الايراد` - Revenue/Income
- `المصروف` - Expense
- `الرصيد` - Balance
- `ملاحظات` - Notes

### Table: سلف (Sulf)
- `ID` - Auto-increment primary key
- `الاسم` - Employee name
- `التاريخ` - Date
- `سلفه` - Advance amount
- `سداد` - Payment amount
- `ملاحظات` - Notes

### Table: القرض (Qard)
- `ID` - Auto-increment primary key
- `الاسم` - Name
- `التاريخ` - Date
- `المبلغ` - Loan amount
- `سداد` - Payment amount
- `ملاحظات` - Notes

## 🛠️ Configuration

Edit `.env` file:

```env
PORT=3000
DB_PATH=C:\\Users\\selrs\\OneDrive\\Documents\\SELRS\\الخزنه.accdb
JWT_SECRET=your-secret-key
ADMIN_USERNAME=admin
ADMIN_PASSWORD=selrs2024
```

## 📱 Mobile App Connection

The mobile app connects to:
```
http://41.199.252.107:3000
```

Make sure:
- Server is running
- Port 3000 is open in firewall
- Port forwarding is configured on router
- Static IP is correct

## 🔧 Troubleshooting

### Server won't start
- Check Node.js is installed: `node --version`
- Check dependencies: `npm install`
- Check port availability: `netstat -ano | findstr :3000`

### Cannot connect to database
- Install Access Database Engine
- Check DB_PATH in `.env`
- Verify database file exists

### Mobile app can't connect
- Check firewall allows port 3000
- Verify port forwarding on router
- Test: `curl http://41.199.252.107:3000/api/health`

## 📊 Monitoring

Check server status:
```cmd
curl http://localhost:3000/api/health
```

View logs (if running as service):
```
C:\ProgramData\SELRS API Server\daemon\
```

## 🔄 Updates

To update the server:
1. Stop the service
2. Replace `server.js`
3. Restart the service

## 📞 Support

For issues or questions, refer to:
- `DEPLOYMENT_GUIDE.md` - Complete setup guide
- Server logs - Check for error messages
- Windows Event Viewer - For service issues

## 📝 Version

**Version:** 1.0.0
**Last Updated:** January 2026

## 🏗️ Architecture

```
Mobile App (React Native)
    ↓
    ↓ HTTP/REST API
    ↓
API Server (Node.js + Express)
    ↓
    ↓ ADODB Connection
    ↓
MS Access Database (.accdb)
```

## 🔒 Security Notes

- Change default credentials in `.env`
- Use strong JWT secret
- Consider HTTPS for production
- Restrict access by IP if possible
- Regular database backups
- Keep Node.js updated

## 📦 Dependencies

- **express** - Web framework
- **cors** - Cross-origin resource sharing
- **body-parser** - Request body parsing
- **jsonwebtoken** - JWT authentication
- **node-adodb** - MS Access database connection
- **dotenv** - Environment variables
- **node-windows** - Windows service management (optional)

## 🎯 Features

✅ RESTful API design
✅ JWT authentication
✅ MS Access database integration
✅ CRUD operations for all tables
✅ Year filtering for Khazina
✅ Error handling
✅ Health check endpoint
✅ Windows service support
✅ CORS enabled for mobile app

---

**Made for SELRS Sales Center Accounting System**
