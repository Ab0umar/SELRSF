# SELRS API Server - Windows Installation Guide

## ⚠️ If You Get "Failed to build pyodbc" Error

This happens when Python doesn't have a C++ compiler. Here are the solutions:

---

## ✅ Solution 1: Use Pre-built Wheels (Easiest)

### Step 1: Download Pre-built pyodbc

Go to: https://www.lfd.uci.edu/~gohlke/pythonlibs/#pyodbc

Find the file that matches your Python version:
- `pyodbc-5.0.1-cp311-cp311-win_amd64.whl` (for Python 3.11, 64-bit)
- `pyodbc-5.0.1-cp312-cp312-win_amd64.whl` (for Python 3.12, 64-bit)
- `pyodbc-5.0.1-cp310-cp310-win_amd64.whl` (for Python 3.10, 64-bit)

**To check your Python version:**
```bash
python --version
```

### Step 2: Install the Wheel

```bash
cd C:\SELRS\api-server-python

# First, install other dependencies
pip install Flask==2.3.3 Flask-CORS==4.0.0 PyJWT==2.10.1 python-dotenv==1.0.0

# Then install the pre-built pyodbc wheel
pip install C:\path\to\pyodbc-5.0.1-cp311-cp311-win_amd64.whl
```

### Step 3: Start the Server

```bash
python server.py
```

---

## ✅ Solution 2: Install Visual C++ Build Tools

If you want to build pyodbc from source:

### Step 1: Download Visual C++ Build Tools

Go to: https://visualstudio.microsoft.com/visual-cpp-build-tools/

Click "Download Build Tools"

### Step 2: Run the Installer

1. Run the installer
2. Select "Desktop development with C++"
3. Click Install
4. Wait for installation to complete

### Step 3: Install Dependencies

```bash
cd C:\SELRS\api-server-python
pip install -r requirements.txt
```

### Step 4: Start the Server

```bash
python server.py
```

---

## ✅ Solution 3: Use Alternative Database Library

If pyodbc is still problematic, use `pypyodbc` instead (pure Python, no compilation needed):

### Step 1: Create Alternative requirements.txt

Create a new file: `requirements-alt.txt`

```
Flask==2.3.3
Flask-CORS==4.0.0
PyJWT==2.10.1
pypyodbc==1.3.7
python-dotenv==1.0.0
```

### Step 2: Install

```bash
cd C:\SELRS\api-server-python
pip install -r requirements-alt.txt
```

### Step 3: Update server.py

Replace this line in `server.py`:
```python
import pyodbc
```

With:
```python
import pypyodbc as pyodbc
```

### Step 4: Start the Server

```bash
python server.py
```

---

## 🔍 Troubleshooting

### "Python version mismatch"

Make sure the wheel matches your Python version:

```bash
python --version
# Output: Python 3.11.x (64-bit)
# Download: pyodbc-5.0.1-cp311-cp311-win_amd64.whl
```

### "wheel file not found"

Make sure the path to the wheel file is correct:

```bash
pip install "C:\Users\YourUsername\Downloads\pyodbc-5.0.1-cp311-cp311-win_amd64.whl"
```

### "Still getting build errors"

Try Solution 2 (Visual C++ Build Tools) or Solution 3 (pypyodbc)

---

## 📋 Quick Decision Guide

| Situation | Solution |
|-----------|----------|
| Want quick fix | **Solution 1** (Pre-built wheel) |
| Want to build from source | **Solution 2** (Visual C++ Build Tools) |
| Don't want to install anything extra | **Solution 3** (pypyodbc) |

---

## ✅ Verify Installation

After installing, test with:

```bash
python -c "import pyodbc; print('pyodbc installed successfully')"
```

You should see:
```
pyodbc installed successfully
```

---

## 🚀 Next Steps

1. Choose a solution above
2. Install dependencies
3. Run: `python server.py`
4. Test: `http://localhost:3000/api/health`
5. Configure mobile app with server URL

Good luck! 🎉
