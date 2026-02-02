# SELRS API Server - Windows Firewall Setup

## ⚠️ Error: "Access to a socket in a way forbidden by its access permissions"

This error means **Windows Firewall is blocking port 3000**.

---

## ✅ Solution: Allow Port 3000 Through Firewall

### Method 1: GUI (Easiest)

1. **Open Windows Defender Firewall:**
   - Press `Win+R`
   - Type: `wf.msc`
   - Press Enter

2. **Click "Inbound Rules"** (left panel)

3. **Click "New Rule"** (right panel)

4. **Configure the Rule:**
   - **Rule Type:** Select "Port" → Click Next
   - **Protocol and Ports:** 
     - Protocol: TCP
     - Specific local ports: 3000
     - Click Next
   - **Action:** Select "Allow the connection" → Click Next
   - **Profile:** Keep all checked → Click Next
   - **Name:** Type "SELRS API Server" → Click Finish

5. **Restart your API Server:**
   ```bash
   python server.py
   ```

---

### Method 2: Command Line (For Administrators)

Open Command Prompt as Administrator and run:

```bash
netsh advfirewall firewall add rule name="SELRS API Server" dir=in action=allow protocol=tcp localport=3000
```

Then restart the server:
```bash
python server.py
```

---

### Method 3: PowerShell (For Administrators)

Open PowerShell as Administrator and run:

```powershell
New-NetFirewallRule -DisplayName "SELRS API Server" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 3000
```

Then restart the server:
```bash
python server.py
```

---

## ✅ Verify Firewall Rule is Working

### Test Local Connection

```bash
curl http://localhost:3000/api/health
```

You should see:
```json
{
  "status": "ok",
  "message": "SELRS API Server is running",
  "timestamp": "2026-01-27T..."
}
```

### Test Network Connection

From another computer on the same network:

```bash
curl http://192.168.0.170:3000/api/health
```

(Replace `192.168.0.170` with your actual IP)

---

## 🔍 Troubleshooting

### Still Getting Connection Refused?

1. **Check if server is running:**
   ```bash
   netstat -ano | findstr :3000
   ```

2. **Check if firewall rule exists:**
   ```bash
   netsh advfirewall firewall show rule name="SELRS API Server"
   ```

3. **Disable firewall temporarily (for testing only):**
   ```bash
   netsh advfirewall set allprofiles state off
   ```
   
   Then re-enable:
   ```bash
   netsh advfirewall set allprofiles state on
   ```

### Port Already in Use?

If port 3000 is already in use:

1. Find what's using it:
   ```bash
   netstat -ano | findstr :3000
   ```

2. Kill the process:
   ```bash
   taskkill /PID <PID> /F
   ```

3. Or use a different port in `.env`:
   ```
   PORT=3001
   ```

---

## 📋 Firewall Rule Checklist

- [ ] Rule name: "SELRS API Server"
- [ ] Direction: Inbound
- [ ] Action: Allow
- [ ] Protocol: TCP
- [ ] Port: 3000
- [ ] Enabled: Yes

---

## 🚀 Next Steps

1. ✅ Add firewall rule (using one of the methods above)
2. ✅ Restart API Server: `python server.py`
3. ✅ Test local: `http://localhost:3000/api/health`
4. ✅ Test network: `http://192.168.0.170:3000/api/health`
5. ✅ Configure mobile app with server URL

---

## 💡 Tips

- **Keep the rule:** Don't delete the firewall rule after testing
- **Check logs:** If still having issues, check the API server console for errors
- **Restart after changes:** Always restart the server after firewall changes
- **Test both ways:** Test from local and from another device

Good luck! 🎉
