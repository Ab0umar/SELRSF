# SELRS API Server - Windows Service Setup (Command Prompt)

## ✅ If PowerShell Doesn't Work, Use Command Prompt

This guide shows how to install SELRS API Server as a Windows Service using Command Prompt.

---

## 🚀 Step-by-Step Installation

### Step 1: Download NSSM

1. Go to: https://nssm.cc/download
2. Download the latest version (e.g., `nssm-2.24-101-g897c7ad.zip`)
3. Extract to: `C:\nssm\`
   - You should have: `C:\nssm\win64\nssm.exe`

### Step 2: Open Command Prompt as Administrator

1. Press `Win+R`
2. Type: `cmd`
3. Press `Ctrl+Shift+Enter` (to run as Administrator)
4. Click "Yes" if prompted

### Step 3: Install the Service

Copy and paste this command:

```bash
C:\nssm\win64\nssm.exe install SELRS-API-Server "C:\Python314\python.exe" "C:\SELRS\api-server-python\server.py"
```

**Important:** Replace `C:\Python314\python.exe` with your actual Python path if different.

### Step 4: Start the Service

```bash
C:\nssm\win64\nssm.exe start SELRS-API-Server
```

### Step 5: Verify It's Running

```bash
C:\nssm\win64\nssm.exe status SELRS-API-Server
```

You should see: `SERVICE_RUNNING`

---

## ✅ Test the API

### From the Same Computer

```bash
curl http://localhost:3000/api/health
```

### From Another Computer

```bash
curl http://192.168.0.170:3000/api/health
```

---

## 🔧 Service Management Commands

### Check Status

```bash
C:\nssm\win64\nssm.exe status SELRS-API-Server
```

### Start Service

```bash
C:\nssm\win64\nssm.exe start SELRS-API-Server
```

### Stop Service

```bash
C:\nssm\win64\nssm.exe stop SELRS-API-Server
```

### Restart Service

```bash
C:\nssm\win64\nssm.exe restart SELRS-API-Server
```

### Remove Service

```bash
C:\nssm\win64\nssm.exe remove SELRS-API-Server confirm
```

---

## 🐛 Troubleshooting

### "Access Denied" Error

Make sure you opened Command Prompt as Administrator:
1. Press `Win+R`
2. Type: `cmd`
3. Press `Ctrl+Shift+Enter` (not just Enter)

### "Python not found"

Check your Python path:
```bash
python --version
where python
```

Then use the correct path in the install command.

### "Service already exists"

Remove the old service first:
```bash
C:\nssm\win64\nssm.exe remove SELRS-API-Server confirm
```

Then install again.

### "Service won't start"

Check the logs:
```bash
C:\nssm\win64\nssm.exe get SELRS-API-Server AppStdout
C:\nssm\win64\nssm.exe get SELRS-API-Server AppStderr
```

---

## 📋 Quick Reference

| Task | Command |
|------|---------|
| Install | `nssm install SELRS-API-Server "C:\Python314\python.exe" "C:\SELRS\api-server-python\server.py"` |
| Start | `nssm start SELRS-API-Server` |
| Stop | `nssm stop SELRS-API-Server` |
| Status | `nssm status SELRS-API-Server` |
| Restart | `nssm restart SELRS-API-Server` |
| Remove | `nssm remove SELRS-API-Server confirm` |

---

## ✅ Verification Checklist

- [ ] NSSM downloaded and extracted to `C:\nssm\`
- [ ] Command Prompt opened as Administrator
- [ ] Service installed successfully
- [ ] Service started successfully
- [ ] Status shows `SERVICE_RUNNING`
- [ ] API responds to `http://localhost:3000/api/health`
- [ ] Mobile app can connect to `http://192.168.0.170:3000`

---

## 🎯 Next Steps

1. ✅ Download and extract NSSM to `C:\nssm\`
2. ✅ Open Command Prompt as Administrator
3. ✅ Run the install command
4. ✅ Run the start command
5. ✅ Verify with status command
6. ✅ Test the API
7. ✅ Configure mobile app

---

## 💡 Tips

- **Keep NSSM folder:** Don't delete `C:\nssm\` after installation
- **Check logs:** If service won't start, check the error logs
- **Restart Windows:** Service will auto-start after reboot
- **Test before production:** Always test locally before using in production

Good luck! 🚀
