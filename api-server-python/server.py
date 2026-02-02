"""
SELRS API Server - Python Version with pyodbc
Connects to MS Access database without OLEDB provider issues
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import jwt
import pyodbc
import os
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Configuration
PORT = int(os.getenv('PORT', 3000))
DB_PATH = os.getenv('DB_PATH', r'C:\Users\selrs\OneDrive\Documents\SELRS\الخزنه.accdb')
JWT_SECRET = os.getenv('JWT_SECRET', 'selrs-secret-key-2024')
ADMIN_USERNAME = os.getenv('ADMIN_USERNAME', 'admin')
ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'selrs2024')

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database connection string for MS Access
DRIVER = '{Microsoft Access Driver (*.mdb, *.accdb)}'
CONNECTION_STRING = f'Driver={DRIVER};DBQ={DB_PATH};'

def get_db_connection():
    """Create and return database connection"""
    try:
        conn = pyodbc.connect(CONNECTION_STRING)
        conn.setdecoding(pyodbc.SQL_CHAR, encoding='utf-8')
        conn.setdecoding(pyodbc.SQL_WCHAR, encoding='utf-8')
        conn.setencoding(encoding='utf-8')
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        raise

def dict_from_row(row, cursor):
    """Convert database row to dictionary"""
    return dict(zip([column[0] for column in cursor.description], row))

def authenticate_token(f):
    """Decorator for token authentication"""
    from functools import wraps
    
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        token = None
        
        if auth_header:
            try:
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Access token required'}), 401
        
        try:
            jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 403
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 403
        
        return f(*args, **kwargs)
    
    return decorated

# ==================== AUTH ROUTES ====================

@app.route('/api/auth/login', methods=['POST'])
def login():
    """User login endpoint - NO AUTHENTICATION REQUIRED"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Request body is empty'
            }), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({
                'success': False,
                'error': 'Username and password are required'
            }), 400
        
        if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
            token = jwt.encode(
                {'username': username, 'exp': datetime.utcnow() + timedelta(days=30)},
                JWT_SECRET,
                algorithm='HS256'
            )
            return jsonify({
                'success': True,
                'token': token,
                'message': 'Login successful'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Invalid credentials'
            }), 401
    except Exception as e:
        logger.error(f"Login error: {e}")
        return jsonify({'error': str(e)}), 500

# ==================== KHAZINA ROUTES ====================

@app.route('/api/khazina', methods=['GET'])
@authenticate_token
def get_khazina():
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
        logger.error(f"Error fetching Khazina records: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/khazina/<int:record_id>', methods=['GET'])
@authenticate_token
def get_khazina_by_id(record_id):
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
        logger.error(f"Error fetching Khazina record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/khazina', methods=['POST'])
@authenticate_token
def create_khazina():
    """Create new Khazina record"""
    try:
        data = request.get_json()
        date = data.get('date')
        revenue = data.get('revenue', 0)
        expense = data.get('expense', 0)
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get previous balance
        cursor.execute(f"SELECT TOP 1 [الرصيد] FROM [All] WHERE [التاريخ] < ? ORDER BY [التاريخ] DESC", (date,))
        prev_row = cursor.fetchone()
        prev_balance = prev_row[0] if prev_row else 0
        
        new_balance = prev_balance + revenue - expense
        
        insert_query = """
            INSERT INTO [All] ([التاريخ], [الايراد], [المصروف], [ملاحظات], [الرصيد])
            VALUES (?, ?, ?, ?, ?)
        """
        
        cursor.execute(insert_query, (date, revenue, expense, notes, new_balance))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating Khazina record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/khazina/<int:record_id>', methods=['PUT'])
@authenticate_token
def update_khazina(record_id):
    """Update Khazina record"""
    try:
        data = request.get_json()
        date = data.get('date')
        revenue = data.get('revenue', 0)
        expense = data.get('expense', 0)
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get previous balance
        cursor.execute(f"SELECT TOP 1 [الرصيد] FROM [All] WHERE [التاريخ] < ? AND ID <> ? ORDER BY [التاريخ] DESC", (date, record_id))
        prev_row = cursor.fetchone()
        prev_balance = prev_row[0] if prev_row else 0
        
        new_balance = prev_balance + revenue - expense
        
        update_query = """
            UPDATE [All]
            SET [التاريخ] = ?,
                [الايراد] = ?,
                [المصروف] = ?,
                [ملاحظات] = ?,
                [الرصيد] = ?
            WHERE ID = ?
        """
        
        cursor.execute(update_query, (date, revenue, expense, notes, new_balance, record_id))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record updated successfully'}), 200
    except Exception as e:
        logger.error(f"Error updating Khazina record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/khazina/<int:record_id>', methods=['DELETE'])
@authenticate_token
def delete_khazina(record_id):
    """Delete Khazina record"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"DELETE FROM [All] WHERE ID = {record_id}")
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting Khazina record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== SULF ROUTES ====================

@app.route('/api/sulf', methods=['GET'])
@authenticate_token
def get_sulf():
    """Get all Sulf records"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM [سلف] ORDER BY [التاريخ] DESC")
        rows = cursor.fetchall()
        records = []
        for row in rows:
            record = dict_from_row(row, cursor)
            # Calculate remaining amount
            amount = record.get('المبلغ', 0) or 0
            payment = record.get('سداد', 0) or 0
            record['المتبقي'] = amount - payment
            records.append(record)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': records,
            'count': len(records)
        }), 200
    except Exception as e:
        logger.error(f"Error fetching Sulf records: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sulf/<int:record_id>', methods=['GET'])
@authenticate_token
def get_sulf_by_id(record_id):
    """Get single Sulf record"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"SELECT * FROM [سلف] WHERE ID = {record_id}")
        row = cursor.fetchone()
        
        conn.close()
        
        if not row:
            return jsonify({'success': False, 'error': 'Record not found'}), 404
        
        record = dict_from_row(row, cursor)
        # Calculate remaining amount
        amount = record.get('المبلغ', 0) or 0
        payment = record.get('سداد', 0) or 0
        record['المتبقي'] = amount - payment
        return jsonify({'success': True, 'data': record}), 200
    except Exception as e:
        logger.error(f"Error fetching Sulf record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sulf', methods=['POST'])
@authenticate_token
def create_sulf():
    """Create new Sulf record"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        date = data.get('date')
        amount = data.get('amount', 0)
        payment = data.get('payment', 0)
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO [سلف] ([الاسم], [التاريخ], [المبلغ], [سداد], [ملاحظات])
            VALUES (?, ?, ?, ?, ?)
        """
        
        cursor.execute(insert_query, (name, date, amount, payment, notes))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating Sulf record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sulf/<int:record_id>', methods=['PUT'])
@authenticate_token
def update_sulf(record_id):
    """Update Sulf record"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        date = data.get('date')
        amount = data.get('amount', 0)
        payment = data.get('payment', 0)
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        update_query = """
            UPDATE [سلف]
            SET [الاسم] = ?,
                [التاريخ] = ?,
                [المبلغ] = ?,
                [سداد] = ?,
                [ملاحظات] = ?
            WHERE ID = ?
        """
        
        cursor.execute(update_query, (name, date, amount, payment, notes, record_id))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record updated successfully'}), 200
    except Exception as e:
        logger.error(f"Error updating Sulf record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/sulf/<int:record_id>', methods=['DELETE'])
@authenticate_token
def delete_sulf(record_id):
    """Delete Sulf record"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"DELETE FROM [سلف] WHERE ID = {record_id}")
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting Sulf record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== QARD ROUTES ====================

@app.route('/api/qard', methods=['GET'])
@authenticate_token
def get_qard():
    """Get all Qard records"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM [القرض] ORDER BY [التاريخ] DESC")
        rows = cursor.fetchall()
        records = []
        for row in rows:
            record = dict_from_row(row, cursor)
            # Calculate remaining amount
            amount = record.get('المبلغ', 0) or 0
            payment = record.get('سداد', 0) or 0
            record['المتبقي'] = amount - payment
            records.append(record)
        
        conn.close()
        
        return jsonify({
            'success': True,
            'data': records,
            'count': len(records)
        }), 200
    except Exception as e:
        logger.error(f"Error fetching Qard records: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/qard/<int:record_id>', methods=['GET'])
@authenticate_token
def get_qard_by_id(record_id):
    """Get single Qard record"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"SELECT * FROM [القرض] WHERE ID = {record_id}")
        row = cursor.fetchone()
        
        conn.close()
        
        if not row:
            return jsonify({'success': False, 'error': 'Record not found'}), 404
        
        record = dict_from_row(row, cursor)
        # Calculate remaining amount
        amount = record.get('المبلغ', 0) or 0
        payment = record.get('سداد', 0) or 0
        record['المتبقي'] = amount - payment
        return jsonify({'success': True, 'data': record}), 200
    except Exception as e:
        logger.error(f"Error fetching Qard record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/qard', methods=['POST'])
@authenticate_token
def create_qard():
    """Create new Qard record"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        date = data.get('date')
        amount = data.get('amount', 0)
        payment = data.get('payment', 0)
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO [القرض] ([الاسم], [التاريخ], [المبلغ], [سداد], [ملاحظات])
            VALUES (?, ?, ?, ?, ?)
        """
        
        cursor.execute(insert_query, (name, date, amount, payment, notes))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record created successfully'}), 201
    except Exception as e:
        logger.error(f"Error creating Qard record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/qard/<int:record_id>', methods=['PUT'])
@authenticate_token
def update_qard(record_id):
    """Update Qard record"""
    try:
        data = request.get_json()
        name = data.get('name', '')
        date = data.get('date')
        amount = data.get('amount', 0)
        payment = data.get('payment', 0)
        notes = data.get('notes', '')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        update_query = """
            UPDATE [القرض]
            SET [الاسم] = ?,
                [التاريخ] = ?,
                [المبلغ] = ?,
                [سداد] = ?,
                [ملاحظات] = ?
            WHERE ID = ?
        """
        
        cursor.execute(update_query, (name, date, amount, payment, notes, record_id))
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record updated successfully'}), 200
    except Exception as e:
        logger.error(f"Error updating Qard record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/qard/<int:record_id>', methods=['DELETE'])
@authenticate_token
def delete_qard(record_id):
    """Delete Qard record"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(f"DELETE FROM [القرض] WHERE ID = {record_id}")
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Record deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error deleting Qard record: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'message': 'SELRS API Server is running',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

# ==================== START SERVER ====================

if __name__ == '__main__':
    import socket
    
    # Get local IP
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           SELRS API Server Started Successfully           ║
║                                                           ║
║  Port: {PORT}                                              ║
║  Database: {DB_PATH[:40]}...  ║
║                                                           ║
║  Access URLs:                                            ║
║  - Local: http://localhost:{PORT}                         ║
║  - Network: http://{local_ip}:{PORT}                      ║
║                                                           ║
║  Health Check: http://localhost:{PORT}/api/health         ║
║                                                           ║
║  CORS: Enabled for all origins                           ║
║  Database: MS Access (pyodbc)                            ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    app.run(host='0.0.0.0', port=PORT, debug=False)
