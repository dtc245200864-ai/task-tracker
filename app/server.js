const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres_db',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'SecurePassword123!',
});

async function ensureTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        deadline DATE,
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) {
    console.error('Table error:', err.message);
  }
}

app.get('/api/tasks', async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query('SELECT * FROM tasks ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  const { title, deadline, status } = req.body;
  try {
    await ensureTable();
    const cleanDeadline = deadline && deadline.trim() !== '' ? deadline : null;
    const result = await pool.query(
      'INSERT INTO tasks (title, deadline, status) VALUES ($1, $2, $3) RETURNING *',
      [title, cleanDeadline, status || 'Pending']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('🚀 Task Tracker Server running on port 3000'));
