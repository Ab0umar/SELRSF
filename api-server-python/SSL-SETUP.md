# SSL/HTTPS Setup for SELRS API Server

## Option 1: Using Let's Encrypt (Recommended - Free)

### Requirements:
- Domain name (selrs.cc) ✅
- Port 80 and 443 open on router
- Certbot installed

### Steps:

1. **Install Certbot:**
   ```bash
   pip install certbot certbot-dns-cloudflare
   ```

2. **Generate SSL Certificate:**
   ```bash
   certbot certonly --standalone -d selrs.cc
   ```

3. **Certificate Location:**
   - Certificate: `C:\Certbot\live\selrs.cc\fullchain.pem`
   - Private Key: `C:\Certbot\live\selrs.cc\privkey.pem`

---

## Option 2: Using Self-Signed Certificate (Quick Testing)

### Generate Certificate:

```bash
# On Windows, use OpenSSL or WSL
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
```

### Save in project folder:
```
C:\SELRS\api-server-python\
  ├── cert.pem
  └── key.pem
```

---

## Update Python Server for HTTPS

### Modify `server.py`:

```python
from flask import Flask
import ssl

app = Flask(__name__)

# ... existing routes ...

if __name__ == '__main__':
    # For HTTPS with SSL certificate
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain('cert.pem', 'key.pem')
    
    app.run(
        host='0.0.0.0',
        port=3000,
        ssl_context=ssl_context,
        debug=False
    )
```

---

## Update Mobile App

### In Settings:
- Change URL from: `http://selrs.cc:3000`
- To: `https://selrs.cc:3000`

### For Self-Signed Certificates:
- Add certificate to app's trust store
- Or disable SSL verification (dev only)

---

## Verify HTTPS:

```bash
# Test from command line
curl -k https://selrs.cc:3000/api/health

# Or in browser (accept certificate warning)
https://selrs.cc:3000/api/health
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Certificate not found | Check file paths in server.py |
| Port 443 blocked | Open port 443 in router/firewall |
| SSL error on mobile | Add certificate to trusted store or use Let's Encrypt |
| Mixed content error | Ensure all URLs use HTTPS |

---

## Recommended: Let's Encrypt

**Best for production:**
1. Free SSL certificate
2. Auto-renewal
3. Trusted by all browsers/apps
4. No certificate warnings

**Setup time:** ~5 minutes
