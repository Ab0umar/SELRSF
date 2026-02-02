const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const ADODB = require('node-adodb');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database Configuration
const DB_PATH = process.env.DB_PATH || 'C:\\Users\\selrs\\OneDrive\\Documents\\SELRS\\الخزنه.accdb';
const connection = ADODB.open(`Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${DB_PATH};Persist Security Info=False;`);

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'selrs-secret-key-2024';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'selrs2024';

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// ==================== AUTH ROUTES ====================

// Login endpoint
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ 
      success: true, 
      token,
      message: 'Login successful' 
    });
  } else {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid credentials' 
    });
  }
});

// ==================== KHAZINA ROUTES ====================

// Get all Khazina records (with optional year filter)
app.get('/api/khazina', authenticateToken, async (req, res) => {
  try {
    const { year } = req.query;
    let query = 'SELECT * FROM [All]';
    
    if (year) {
      query += ` WHERE Year([التاريخ]) = ${year}`;
    }
    
    query += ' ORDER BY [التاريخ] DESC';
    
    const records = await connection.query(query);
    
    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('Error fetching Khazina records:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get single Khazina record by ID
app.get('/api/khazina/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const records = await connection.query(`SELECT * FROM [All] WHERE ID = ${id}`);
    
    if (records.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Record not found' 
      });
    }
    
    res.json({
      success: true,
      data: records[0]
    });
  } catch (error) {
    console.error('Error fetching Khazina record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create new Khazina record
app.post('/api/khazina', authenticateToken, async (req, res) => {
  try {
    const { date, revenue, expense, notes } = req.body;
    
    // Calculate balance from previous records
    const prevRecords = await connection.query(
      `SELECT TOP 1 [الرصيد] FROM [All] WHERE [التاريخ] < #${date}# ORDER BY [التاريخ] DESC`
    );
    
    const prevBalance = prevRecords.length > 0 ? prevRecords[0].الرصيد : 0;
    const newBalance = prevBalance + revenue - expense;
    
    const query = `
      INSERT INTO [All] ([التاريخ], [الايراد], [المصروف], [ملاحظات], [الرصيد])
      VALUES (#${date}#, ${revenue}, ${expense}, '${notes.replace(/'/g, "''")}', ${newBalance})
    `;
    
    await connection.execute(query);
    
    res.json({
      success: true,
      message: 'Record created successfully'
    });
  } catch (error) {
    console.error('Error creating Khazina record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update Khazina record
app.put('/api/khazina/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { date, revenue, expense, notes } = req.body;
    
    // Recalculate balance
    const prevRecords = await connection.query(
      `SELECT TOP 1 [الرصيد] FROM [All] WHERE [التاريخ] < #${date}# AND ID <> ${id} ORDER BY [التاريخ] DESC`
    );
    
    const prevBalance = prevRecords.length > 0 ? prevRecords[0].الرصيد : 0;
    const newBalance = prevBalance + revenue - expense;
    
    const query = `
      UPDATE [All]
      SET [التاريخ] = #${date}#,
          [الايراد] = ${revenue},
          [المصروف] = ${expense},
          [ملاحظات] = '${notes.replace(/'/g, "''")}',
          [الرصيد] = ${newBalance}
      WHERE ID = ${id}
    `;
    
    await connection.execute(query);
    
    res.json({
      success: true,
      message: 'Record updated successfully'
    });
  } catch (error) {
    console.error('Error updating Khazina record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Khazina record
app.delete('/api/khazina/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await connection.execute(`DELETE FROM [All] WHERE ID = ${id}`);
    
    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Khazina record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== SULF ROUTES ====================

// Get all Sulf records
app.get('/api/sulf', authenticateToken, async (req, res) => {
  try {
    const records = await connection.query('SELECT * FROM [سلف] ORDER BY [التاريخ] DESC');
    
    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('Error fetching Sulf records:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get single Sulf record by ID
app.get('/api/sulf/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const records = await connection.query(`SELECT * FROM [سلف] WHERE ID = ${id}`);
    
    if (records.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Record not found' 
      });
    }
    
    res.json({
      success: true,
      data: records[0]
    });
  } catch (error) {
    console.error('Error fetching Sulf record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create new Sulf record
app.post('/api/sulf', authenticateToken, async (req, res) => {
  try {
    const { name, date, payment, advance, notes } = req.body;
    
    const query = `
      INSERT INTO [سلف] ([الاسم], [التاريخ], [سداد], [سلفه], [ملاحظات])
      VALUES ('${name.replace(/'/g, "''")}', #${date}#, ${payment}, ${advance}, '${notes.replace(/'/g, "''")}')
    `;
    
    await connection.execute(query);
    
    res.json({
      success: true,
      message: 'Record created successfully'
    });
  } catch (error) {
    console.error('Error creating Sulf record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update Sulf record
app.put('/api/sulf/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, payment, advance, notes } = req.body;
    
    const query = `
      UPDATE [سلف]
      SET [الاسم] = '${name.replace(/'/g, "''")}',
          [التاريخ] = #${date}#,
          [سداد] = ${payment},
          [سلفه] = ${advance},
          [ملاحظات] = '${notes.replace(/'/g, "''")}'
      WHERE ID = ${id}
    `;
    
    await connection.execute(query);
    
    res.json({
      success: true,
      message: 'Record updated successfully'
    });
  } catch (error) {
    console.error('Error updating Sulf record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Sulf record
app.delete('/api/sulf/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await connection.execute(`DELETE FROM [سلف] WHERE ID = ${id}`);
    
    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Sulf record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== QARD ROUTES ====================

// Get all Qard records
app.get('/api/qard', authenticateToken, async (req, res) => {
  try {
    const records = await connection.query('SELECT * FROM [القرض] ORDER BY [التاريخ] DESC');
    
    res.json({
      success: true,
      data: records,
      count: records.length
    });
  } catch (error) {
    console.error('Error fetching Qard records:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Get single Qard record by ID
app.get('/api/qard/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const records = await connection.query(`SELECT * FROM [القرض] WHERE ID = ${id}`);
    
    if (records.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Record not found' 
      });
    }
    
    res.json({
      success: true,
      data: records[0]
    });
  } catch (error) {
    console.error('Error fetching Qard record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Create new Qard record
app.post('/api/qard', authenticateToken, async (req, res) => {
  try {
    const { name, date, amount, payment, notes } = req.body;
    
    const query = `
      INSERT INTO [القرض] ([الاسم], [التاريخ], [المبلغ], [سداد], [ملاحظات])
      VALUES ('${name.replace(/'/g, "''")}', #${date}#, ${amount}, ${payment}, '${notes.replace(/'/g, "''")}')
    `;
    
    await connection.execute(query);
    
    res.json({
      success: true,
      message: 'Record created successfully'
    });
  } catch (error) {
    console.error('Error creating Qard record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Update Qard record
app.put('/api/qard/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, date, amount, payment, notes } = req.body;
    
    const query = `
      UPDATE [القرض]
      SET [الاسم] = '${name.replace(/'/g, "''")}',
          [التاريخ] = #${date}#,
          [المبلغ] = ${amount},
          [سداد] = ${payment},
          [ملاحظات] = '${notes.replace(/'/g, "''")}'
      WHERE ID = ${id}
    `;
    
    await connection.execute(query);
    
    res.json({
      success: true,
      message: 'Record updated successfully'
    });
  } catch (error) {
    console.error('Error updating Qard record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Delete Qard record
app.delete('/api/qard/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await connection.execute(`DELETE FROM [القرض] WHERE ID = ${id}`);
    
    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting Qard record:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'SELRS API Server is running',
    timestamp: new Date().toISOString()
  });
});

// ==================== START SERVER ====================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           SELRS API Server Started Successfully           ║
║                                                           ║
║  Port: ${PORT}                                              ║
║  Database: ${DB_PATH.substring(0, 40)}...  ║
║  Access: http://0.0.0.0:${PORT}                            ║
║                                                           ║
║  Health Check: http://localhost:${PORT}/api/health         ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});
