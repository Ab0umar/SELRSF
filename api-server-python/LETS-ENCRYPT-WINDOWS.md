# Let's Encrypt SSL Setup for Windows - Complete Guide

## الهدف
إعداد HTTPS صحيح للدومين `selrs.cc` بحيث يعمل مع Android بدون أخطاء certificate.

---

## المتطلبات
- ✅ دومين `selrs.cc` (عندك)
- ✅ DNS موصول (عندك)
- ✅ البورت 80 و 443 مفتوح على الراوتر
- ✅ Python مثبت على الويندوز

---

## الخطوة 1: تثبيت Certbot على Windows

### الطريقة الأسهل - استخدام WSL (Windows Subsystem for Linux)

إذا عندك WSL:
```bash
# في WSL terminal
sudo apt update
sudo apt install certbot python3-certbot-dns-cloudflare
```

### الطريقة البديلة - استخدام Python مباشرة

```bash
# في Command Prompt (كـ Administrator)
pip install certbot certbot-dns-cloudflare
```

---

## الخطوة 2: فتح البورتات على الراوتر

**مهم جداً:** Let's Encrypt يحتاج الوصول للبورتات:
- **80** (HTTP)
- **443** (HTTPS)

### فتح البورتات:
1. ادخل إلى إعدادات الراوتر (عادة `192.168.0.1`)
2. اذهب إلى Port Forwarding
3. أضف:
   - External Port 80 → Internal IP 192.168.0.170 Port 80
   - External Port 443 → Internal IP 192.168.0.170 Port 443

---

## الخطوة 3: إنشاء Certificate من Let's Encrypt

### الطريقة 1: Standalone (الأسهل)

```bash
# في Command Prompt (كـ Administrator)
certbot certonly --standalone -d selrs.cc
```

**ملاحظة:** هذا يتطلب أن تكون البورتات 80 و 443 خالية (لا يوجد سيرفر آخر يستخدمها).

### الطريقة 2: DNS Challenge (إذا كانت البورتات مشغولة)

```bash
certbot certonly --dns-cloudflare -d selrs.cc
```

**ستحتاج:**
- API Token من Cloudflare
- ملف `~/.secrets/certbot/cloudflare.ini`

---

## الخطوة 4: موقع الـ Certificate

بعد التثبيت الناجح، ستجد الـ Certificate في:

```
C:\Certbot\live\selrs.cc\
├── fullchain.pem      (الشهادة الكاملة)
├── privkey.pem        (المفتاح الخاص)
├── cert.pem           (الشهادة فقط)
└── chain.pem          (السلسلة)
```

**ملاحظة:** إذا استخدمت WSL، ستكون في:
```
/etc/letsencrypt/live/selrs.cc/
```

---

## الخطوة 5: تحديث السيرفر Python

### تحديث `server-https.py`:

```python
from flask import Flask, jsonify
from flask_cors import CORS
import ssl
import os
from datetime import datetime
import jwt

app = Flask(__name__)
CORS(app)

# ===== Configuration =====
SECRET_KEY = "your-secret-key-here"
CERT_FILE = r"C:\Certbot\live\selrs.cc\fullchain.pem"
KEY_FILE = r"C:\Certbot\live\selrs.cc\privkey.pem"

# ===== Routes =====
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'ssl': 'enabled'
    })

@app.route('/api/login', methods=['POST'])
def login():
    # Your login logic here
    token = jwt.encode({'user': 'admin'}, SECRET_KEY, algorithm='HS256')
    return jsonify({'token': token})

# ===== Main =====
if __name__ == '__main__':
    # Check if certificate files exist
    if not os.path.exists(CERT_FILE):
        print(f"❌ Certificate not found: {CERT_FILE}")
        print("Run: certbot certonly --standalone -d selrs.cc")
        exit(1)
    
    if not os.path.exists(KEY_FILE):
        print(f"❌ Private key not found: {KEY_FILE}")
        exit(1)
    
    print("✅ Certificate found")
    print(f"📁 Cert: {CERT_FILE}")
    print(f"📁 Key: {KEY_FILE}")
    
    # Create SSL context
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(CERT_FILE, KEY_FILE)
    
    print("🔒 Starting HTTPS server on https://0.0.0.0:3000")
    print("🌐 Access at: https://selrs.cc:3000")
    
    app.run(
        host='0.0.0.0',
        port=3000,
        ssl_context=ssl_context,
        debug=False
    )
```

---

## الخطوة 6: تشغيل السيرفر

### في Command Prompt:
```bash
cd C:\path\to\api-server-python
python server-https.py
```

### أو استخدم الـ Batch Script:
```bash
# إنشاء start-https.bat
@echo off
cd /d C:\path\to\api-server-python
python server-https.py
pause
```

---

## الخطوة 7: تحديث التطبيق الموبايل

في إعدادات التطبيق، غيّر الـ URL إلى:
```
https://selrs.cc:3000
```

---

## الخطوة 8: اختبار الاتصال

### من الويندوز:
```bash
# في Command Prompt
curl -k https://selrs.cc:3000/api/health
```

### من الموبايل:
- فتح التطبيق
- الذهاب للإعدادات
- إدخال: `https://selrs.cc:3000`
- الضغط على "اختبار الاتصال"

---

## تجديد الـ Certificate (مهم!)

Let's Encrypt certificates تنتهي بعد 90 يوم.

### تجديد يدوي:
```bash
certbot renew
```

### تجديد تلقائي (Windows Task Scheduler):

1. افتح Task Scheduler
2. Create Basic Task
3. الاسم: "Renew Let's Encrypt Certificate"
4. Trigger: Daily at 2:00 AM
5. Action: Run program
   - Program: `C:\Python311\python.exe`
   - Arguments: `-m certbot renew`

---

## استكشاف الأخطاء

| المشكلة | الحل |
|--------|------|
| "Port 80 already in use" | أغلق البرامج الأخرى أو استخدم DNS challenge |
| "Certificate not found" | تأكد من مسار الملفات في server.py |
| "Connection refused" | تأكد أن السيرفر يعمل والبورت 3000 مفتوح |
| "SSL error on Android" | استخدم Let's Encrypt (مش self-signed) |
| "DNS not resolving" | انتظر 24 ساعة لتحديث DNS |

---

## ملخص الخطوات السريعة

```bash
# 1. تثبيت Certbot
pip install certbot

# 2. إنشاء Certificate
certbot certonly --standalone -d selrs.cc

# 3. تشغيل السيرفر
python server-https.py

# 4. اختبار
curl -k https://selrs.cc:3000/api/health
```

---

## نصائح مهمة

✅ **استخدم Let's Encrypt** - مجاني وموثوق
✅ **فتح البورتات 80 و 443** - ضروري جداً
✅ **تجديد الـ Certificate** - كل 90 يوم
✅ **استخدم HTTPS** - أفضل أماناً
❌ **لا تستخدم self-signed** - Android ما يقبله

---

## الدعم

إذا واجهت مشكلة:
1. تحقق من أن البورتات مفتوحة: `netstat -ano | findstr :80`
2. تحقق من الـ DNS: `nslookup selrs.cc`
3. اختبر الـ Certificate: `openssl s_client -connect selrs.cc:443`
