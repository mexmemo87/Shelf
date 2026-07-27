require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const pool = require('../config/db');
const bookRoutes = require('./routes/books');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

async function setupDatabase() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        rating INT DEFAULT 5,
        status VARCHAR(20) DEFAULT 'To Read',
        user_id INT REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS rating INT DEFAULT 5;`);
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'To Read';`);
  } catch (err) {
    console.error('Database setup error:', err);
  }
}

app.use('/', authRoutes);
app.use('/', bookRoutes);

app.listen(PORT, async () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  await setupDatabase();
});