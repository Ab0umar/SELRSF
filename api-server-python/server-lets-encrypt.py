"""
SELRS API Server V13 - Correct column names for all tables
"""

import warnings
warnings.filterwarnings("ignore")

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import jwt
import ssl
import os
import sys
import io
import socket
import logging
from datetime import datetime, timedelta, timezone
from functools import wraps

logging.getLogger('werkzeug').setLevel(logging.ERROR)

if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', line_buffering=True)

app = Flask(__name__)
CORS(app)

# Configuration
SECRET_KEY = "selrs2024_secure_and_long_secret_key_for_jwt_compliance_v13"
ALGORITHM = "HS256"
CERT_FILE = r"C:\Certbot\live\selrs.cc\fullchain.pem"
KEY_FILE = r"C:\Certbot\live\selrs.cc\privkey.pem"
DB_PATH = r"C:\Users\selrs\OneDrive\Documents\SELRS\الخزنه.accdb"
CONNECTION_STRING = f"Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={DB_PATH};"

# Helper Functions
def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"

READ_ONLY_FIELDS = ['الرصيد', 'المتبقي', 'balance', 'remaining']

def get_db_connection():
    try:
        conn = pyodbc.connect(CONNECTION_STRING, autocommit=True)
        return conn
    except Exception as e:
        print(f"DB Error: {e}")
        return None

@app.after_request
def add_header(response):
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '-1'
    return response

def format_date(date_obj):
    if date_obj:
        if isinstance(date_obj, str): return date_obj
        try: return date_obj.strftime('%d/%m/%Y')
        except: return str(date_obj)
    return None

def format_number(val):
    if val is None: return 0
    try:
        f_val = float(val)
        return int(f_val) if f_val == int(f_val) else round(f_val, 2)
    except: return val

def dict_from_row(row, cursor):
    columns = [description[0] for description in cursor.description]
    record = dict(zip(columns, row))
    for key in record:
        if 'تاريخ' in key.lower() or key in ['التاريخ', 'date']:
            record[key] = format_date(record[key])
        elif key in ['المبلغ', 'سداد', 'المتبقي', 'الايراد', 'المصروف', 'الرصيد', 'الاجمالي', 'معاه', 'منه', 'amount', 'payment', 'revenue', 'expense']:
            record[key] = format_number(record[key])
    return record

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').split(" ")[-1]
        if not token: return jsonify({'message': 'Token missing'}), 401
        try:
            data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return f(data['user'], *args, **kwargs)
        except: return jsonify({'message': 'Invalid token'}), 401
    return decorated

# --- AUTH ---
@app.route('/api/login', methods=['POST'])
@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if username and password:
        token = jwt.encode(
            {
                'user': username,
                'exp': datetime.now(timezone.utc) + timedelta(days=7)
            },
            SECRET_KEY,
            algorithm=ALGORITHM
        )
        return jsonify({'token': token, 'user': username}), 200
    return jsonify({'message': 'Credentials required'}), 400

# --- KHAZINA ---
@app.route('/api/khazina', methods=['GET'])
@token_required
def get_khazina(current_user):
    """Get all Khazina records"""
    try:
        year = request.args.get('year')
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if year:
            query = f"SELECT * FROM [All] WHERE YEAR([التاريخ]) = {year} ORDER BY [التاريخ] DESC"
        else:
            query = "SELECT * FROM [All] ORDER BY [التاريخ] DESC"
        
        cursor.execute(query)
        rows = cursor.fetchall()
        records = [dict_from_row(row, cursor) for row in rows]
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': records,
            'count': len(records)
        }), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/khazina/<int:record_id>', methods=['GET'])
@token_required
def get_khazina_by_id(current_user, record_id):
    """Get single Khazina record"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"SELECT * FROM [All] WHERE ID = {record_id}")
        row = cursor.fetchone()
        
        conn.close()
        
        if not row:
            return jsonify({'success': False, 'error': 'Record not found'}), 404
        
        record = dict_from_row(row, cursor)
        return jsonify({'success': True, 'data': record}), 200
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/khazina', methods=['POST'])
@token_required
def create_khazina(user):
    try:
        data = request.get_json()
        if not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required field: date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("INSERT INTO [All] ([التاريخ], [الايراد], [المصروف], [ملاحظات]) VALUES (?, ?, ?, ?)",
                       (data.get('date'), data.get('revenue', 0), data.get('expense', 0), data.get('notes', '')))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/khazina/<int:id>', methods=['PUT'])
@token_required
def update_khazina(user, id):
    try:
        data = request.get_json()
        if not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required field: date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE [All] SET [التاريخ]=?, [الايراد]=?, [المصروف]=?, [ملاحظات]=? WHERE ID=?",
                       (data.get('date'), data.get('revenue', 0), data.get('expense', 0), data.get('notes', ''), id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- SULF ---
@app.route('/api/sulf', methods=['GET'])
@token_required
def get_sulf(user):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM [سلف] ORDER BY [التاريخ] DESC")
        records = []
        for row in cursor.fetchall():
            record = dict_from_row(row, cursor)
            sulf_amount = record.get('المبلغ', 0) if record.get('المبلغ') else 0
            payment = record.get('سداد', 0) if record.get('سداد') else 0
            record['الاجمالي'] = sulf_amount
            record['المتبقي'] = sulf_amount - payment
            records.append(record)
        conn.close()
        return jsonify({'success': True, 'data': records})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sulf', methods=['POST'])
@token_required
def create_sulf(user):
    try:
        data = request.get_json()
        if not data.get('name') or not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required fields: name, date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("INSERT INTO [سلف] ([الاسم], [التاريخ], [المبلغ], [سداد], [ملاحظات]) VALUES (?, ?, ?, ?, ?)",
                       (data.get('name'), data.get('date'), data.get('advance', 0), data.get('payment', 0), data.get('notes', '')))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sulf/<int:id>', methods=['PUT'])
@token_required
def update_sulf(user, id):
    try:
        data = request.get_json()
        if not data.get('name') or not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required fields: name, date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE [سلف] SET [الاسم]=?, [التاريخ]=?, [المبلغ]=?, [سداد]=?, [ملاحظات]=? WHERE ID=?",
                       (data.get('name'), data.get('date'), data.get('advance', 0), data.get('payment', 0), data.get('notes', ''), id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- QARD ---
@app.route('/api/qard', methods=['GET'])
@token_required
def get_qard(user):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM [القرض] ORDER BY [التاريخ] DESC")
        records = []
        for row in cursor.fetchall():
            record = dict_from_row(row, cursor)
            qard_amount = record.get('المبلغ', 0) if record.get('المبلغ') else 0
            payment = record.get('سداد', 0) if record.get('سداد') else 0
            record['الاجمالي'] = qard_amount
            record['المتبقي'] = qard_amount - payment
            records.append(record)
        conn.close()
        return jsonify({'success': True, 'data': records})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/qard', methods=['POST'])
@token_required
def create_qard(user):
    try:
        data = request.get_json()
        if not data.get('name') or not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required fields: name, date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("INSERT INTO [القرض] ([الاسم], [التاريخ], [المبلغ], [سداد], [ملاحظات]) VALUES (?, ?, ?, ?, ?)",
                       (data.get('name'), data.get('date'), data.get('advance', 0), data.get('payment', 0), data.get('notes', '')))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/qard/<int:id>', methods=['PUT'])
@token_required
def update_qard(user, id):
    try:
        data = request.get_json()
        if not data.get('name') or not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required fields: name, date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE [القرض] SET [الاسم]=?, [التاريخ]=?, [المبلغ]=?, [سداد]=?, [ملاحظات]=? WHERE ID=?",
                       (data.get('name'), data.get('date'), data.get('advance', 0), data.get('payment', 0), data.get('notes', ''), id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- BAIT (Correct columns) ---
@app.route('/api/bait', methods=['GET'])
@token_required
def get_bait(user):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM [البيت] ORDER BY [التاريخ] DESC")
        records = []
        for row in cursor.fetchall():
            record = dict_from_row(row, cursor)
            records.append(record)
        conn.close()
        return jsonify({'success': True, 'data': records})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/bait', methods=['POST'])
@token_required
def create_bait(user):
    try:
        data = request.get_json()
        if not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required field: date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("INSERT INTO [البيت] ([التاريخ], [الاجمالي], [الرصيد], [معاه], [منه], [ملاحظات]) VALUES (?, ?, ?, ?, ?, ?)",
                       (data.get('date'), data.get('advance', 0), data.get('balance', 0), data.get('with', 0), data.get('payment', 0), data.get('notes', '')))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/bait/<int:id>', methods=['PUT'])
@token_required
def update_bait(user, id):
    try:
        data = request.get_json()
        if not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required field: date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE [البيت] SET [التاريخ]=?, [الاجمالي]=?, [الرصيد]=?, [معاه]=?, [منه]=?, [ملاحظات]=? WHERE ID=?",
                       (data.get('date'), data.get('advance', 0), data.get('balance', 0), data.get('with', 0), data.get('payment', 0), data.get('notes', ''), id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- INSTAPAY (Correct columns) ---
@app.route('/api/instapay', methods=['GET'])
@token_required
def get_instapay(user):
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM [انستا] ORDER BY [التاريخ] DESC")
        records = []
        for row in cursor.fetchall():
            record = dict_from_row(row, cursor)
            records.append(record)
        conn.close()
        return jsonify({'success': True, 'data': records})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instapay', methods=['POST'])
@token_required
def create_instapay(user):
    try:
        data = request.get_json()
        if not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required field: date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("INSERT INTO [انستا] ([التاريخ], [الاجمالي], [الرصيد], [معاه], [منه], [ملاحظات]) VALUES (?, ?, ?, ?, ?, ?)",
                       (data.get('date'), data.get('advance', 0), data.get('balance', 0), data.get('with', 0), data.get('payment', 0), data.get('notes', '')))
        conn.commit()
        conn.close()
        return jsonify({'success': True}), 201
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/instapay/<int:id>', methods=['PUT'])
@token_required
def update_instapay(user, id):
    try:
        data = request.get_json()
        if not data.get('date'):
            return jsonify({'success': False, 'error': 'Missing required field: date'}), 400
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute("UPDATE [انستا] SET [التاريخ]=?, [الاجمالي]=?, [الرصيد]=?, [معاه]=?, [منه]=?, [ملاحظات]=? WHERE ID=?",
                       (data.get('date'), data.get('advance', 0), data.get('balance', 0), data.get('with', 0), data.get('payment', 0), data.get('notes', ''), id))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- DELETE ENDPOINTS ---
@app.route('/api/khazina/<int:id>', methods=['DELETE'])
@app.route('/api/sulf/<int:id>', methods=['DELETE'])
@app.route('/api/qard/<int:id>', methods=['DELETE'])
@app.route('/api/bait/<int:id>', methods=['DELETE'])
@app.route('/api/instapay/<int:id>', methods=['DELETE'])
@token_required
def delete_record(user, id):
    try:
        if "khazina" in request.path:
            table = "[All]"
        elif "sulf" in request.path:
            table = "[سلف]"
        elif "qard" in request.path:
            table = "[القرض]"
        elif "bait" in request.path:
            table = "[البيت]"
        elif "instapay" in request.path:
            table = "[انستا]"
        
        conn = get_db_connection()
        if not conn:
            return jsonify({'success': False, 'error': 'Database connection failed'}), 500
        cursor = conn.cursor()
        cursor.execute(f"DELETE FROM {table} WHERE ID=?", (id,))
        conn.commit()
        conn.close()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# --- HEALTH CHECK ---
@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'SELRS API Server V13 is running',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

if __name__ == '__main__':
    local_ip = get_local_ip()
    
    print("\n" + "="*60, flush=True)
    print("SELRS API Server V13 - Let's Encrypt HTTPS", flush=True)
    print("Correct column names for all tables", flush=True)
    print("="*60, flush=True)
    
    # Check Certificate
    if os.path.exists(CERT_FILE):
        print(f"✅ Certificate found: {CERT_FILE}", flush=True)
    else:
        print(f"❌ Certificate not found: {CERT_FILE}", flush=True)
        sys.exit(1)
        
    if os.path.exists(KEY_FILE):
        print(f"✅ Private key found: {KEY_FILE}", flush=True)
    else:
        print(f"❌ Private key not found: {KEY_FILE}", flush=True)
        sys.exit(1)
        
    # Check DB
    conn = get_db_connection()
    if conn:
        print(f"✅ Database connection successful: {DB_PATH}", flush=True)
        conn.close()
    else:
        print(f"⚠️  Database connection failed: {DB_PATH}", flush=True)

    print("\n" + "="*60, flush=True)
    print("🔒 Starting HTTPS server...", flush=True)
    print("="*60, flush=True)
    print(f"📍 Local:   https://127.0.0.1:3000", flush=True)
    print(f"🏠 Network: https://{local_ip}:3000", flush=True)
    print(f"🌐 Domain:  https://selrs.cc:3000", flush=True)
    print(f"✅ Health:  https://selrs.cc:3000/api/health", flush=True)
    print(f"📱 Mobile:  Use 'https://selrs.cc:3000' in app settings", flush=True)
    print("="*60 + "\n", flush=True)
    print("⚠️  Press Ctrl+C to stop the server\n", flush=True)
    
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    ssl_context.load_cert_chain(CERT_FILE, KEY_FILE)
    app.run(host='0.0.0.0', port=3000, ssl_context=ssl_context, threaded=True)
