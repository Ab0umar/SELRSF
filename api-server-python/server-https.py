"""
SELRS API Server with HTTPS Support
Supports both HTTP and HTTPS (with SSL certificate)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import jwt
import os
from datetime import datetime, timedelta
from functools import wraps
import ssl
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
DATABASE_PATH = r"C:\Users\selrs\OneDrive\Documents\SELRS\SELRS.accdb"
SECRET_KEY = os.getenv('SECRET_KEY', 'selrs-secret-key-2024')
JWT_EXPIRATION = 24  # hours

# Database connection
def get_db_connection():
    """Create database connection"""
    try:
        conn_str = f'Driver={{Microsoft Access Driver (*.mdb, *.accdb)}};DBQ={DATABASE_PATH};'
        conn = pyodbc.connect(conn_str)
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

# JWT Authentication
def authenticate_token(f):
    """Decorator to verify JWT token"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'Missing token'}), 401
        
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            request.user_id = payload.get('user_id')
            request.username = payload.get('username')
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(*args, **kwargs)
    
    return decorated

# ============================================
# Health & Status Endpoints
# ============================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'service': 'SELRS API Server',
        'version': '1.0.0'
    })

# ============================================
# Authentication Endpoints
# ============================================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Hardcoded credentials (replace with database lookup)
        if username == 'admin' and password == 'selrs2024':
            token = jwt.encode(
                {
                    'user_id': 1,
                    'username': username,
                    'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION)
                },
                SECRET_KEY,
                algorithm='HS256'
            )
            
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Login successful: {username}")
            
            return jsonify({
                'token': token,
                'user_id': 1,
                'username': username,
                'message': 'Login successful'
            }), 200
        else:
            print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Login failed: {username}")
            return jsonify({'error': 'Invalid credentials'}), 401
    
    except Exception as e:
        print(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================
# Sulf (السلف) Endpoints
# ============================================

@app.route('/api/sulf', methods=['GET'])
@authenticate_token
def get_sulf():
    """Get all Sulf records"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM Sulf ORDER BY [التاريخ] DESC')
        
        records = []
        for row in cursor.fetchall():
            remaining = row[2] - row[3]  # المبلغ - السداد
            records.append({
                'id': row[0],
                'الاسم': row[1],
                'المبلغ': row[2],
                'السداد': row[3],
                'المتبقي': remaining,
                'التاريخ': str(row[4]) if row[4] else None,
                'الملاحظات': row[5]
            })
        
        conn.close()
        return jsonify(records), 200
    
    except Exception as e:
        print(f"Error fetching Sulf: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/sulf', methods=['POST'])
@authenticate_token
def create_sulf():
    """Create new Sulf record"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO Sulf ([الاسم], [المبلغ], [السداد], [التاريخ], [الملاحظات])
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data.get('الاسم'),
            data.get('المبلغ', 0),
            data.get('السداد', 0),
            data.get('التاريخ'),
            data.get('الملاحظات')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Sulf record created'}), 201
    
    except Exception as e:
        print(f"Error creating Sulf: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================
# Qard (القرض) Endpoints
# ============================================

@app.route('/api/qard', methods=['GET'])
@authenticate_token
def get_qard():
    """Get all Qard records"""
    try:
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM Qard ORDER BY [التاريخ] DESC')
        
        records = []
        for row in cursor.fetchall():
            remaining = row[2] - row[3]  # المبلغ - السداد
            records.append({
                'id': row[0],
                'الاسم': row[1],
                'المبلغ': row[2],
                'السداد': row[3],
                'المتبقي': remaining,
                'التاريخ': str(row[4]) if row[4] else None,
                'الملاحظات': row[5]
            })
        
        conn.close()
        return jsonify(records), 200
    
    except Exception as e:
        print(f"Error fetching Qard: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/qard', methods=['POST'])
@authenticate_token
def create_qard():
    """Create new Qard record"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO Qard ([الاسم], [المبلغ], [السداد], [التاريخ], [الملاحظات])
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data.get('الاسم'),
            data.get('المبلغ', 0),
            data.get('السداد', 0),
            data.get('التاريخ'),
            data.get('الملاحظات')
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Qard record created'}), 201
    
    except Exception as e:
        print(f"Error creating Qard: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================
# Update/Delete Endpoints
# ============================================

@app.route('/api/sulf/<int:record_id>', methods=['PUT'])
@authenticate_token
def update_sulf(record_id):
    """Update Sulf record"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE Sulf SET [الاسم]=?, [المبلغ]=?, [السداد]=?, [التاريخ]=?, [الملاحظات]=?
            WHERE [ID]=?
        ''', (
            data.get('الاسم'),
            data.get('المبلغ'),
            data.get('السداد'),
            data.get('التاريخ'),
            data.get('الملاحظات'),
            record_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Sulf record updated'}), 200
    
    except Exception as e:
        print(f"Error updating Sulf: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/qard/<int:record_id>', methods=['PUT'])
@authenticate_token
def update_qard(record_id):
    """Update Qard record"""
    try:
        data = request.get_json()
        conn = get_db_connection()
        if not conn:
            return jsonify({'error': 'Database connection failed'}), 500
        
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE Qard SET [الاسم]=?, [المبلغ]=?, [السداد]=?, [التاريخ]=?, [الملاحظات]=?
            WHERE [ID]=?
        ''', (
            data.get('الاسم'),
            data.get('المبلغ'),
            data.get('السداد'),
            data.get('التاريخ'),
            data.get('الملاحظات'),
            record_id
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Qard record updated'}), 200
    
    except Exception as e:
        print(f"Error updating Qard: {e}")
        return jsonify({'error': str(e)}), 500

# ============================================
# Error Handlers
# ============================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def server_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ============================================
# Server Startup
# ============================================

if __name__ == '__main__':
    print("\n" + "="*60)
    print("SELRS API Server Starting")
    print("="*60 + "\n")
    
    # Check if SSL certificates exist
    use_https = os.path.exists('cert.pem') and os.path.exists('key.pem')
    
    if use_https:
        print("🔒 HTTPS Mode: Using SSL certificates")
        print("   Certificate: cert.pem")
        print("   Private Key: key.pem")
        
        ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_context.load_cert_chain('cert.pem', 'key.pem')
        
        app.run(
            host='0.0.0.0',
            port=3000,
            ssl_context=ssl_context,
            debug=False
        )
    else:
        print("⚠️  HTTP Mode: No SSL certificates found")
        print("   To enable HTTPS, create cert.pem and key.pem")
        print("   See SSL-SETUP.md for instructions")
        
        app.run(
            host='0.0.0.0',
            port=3000,
            debug=False
        )
