require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const pool = require('./config/db');
const bookRoutes = require('./routes/books');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 horas
}));

// Setup Database Tables
async function setupDatabase() {
  try {
    // 1. Create Users Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create Books Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        rating INT DEFAULT 5,
        read BOOLEAN DEFAULT false,
        user_id INT REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Ensure user_id column exists if books table was created earlier
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;`);

  } catch (err) {
    console.error('Database setup error:', err);
  }
}

// Routes
app.use('/', authRoutes);
app.use('/', bookRoutes);

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  await setupDatabase();
});