require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const pool = require('./config/db');
const bookRoutes = require('./routes/books');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for production environments (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Persistent Session Configuration in PostgreSQL
app.use(session({
  store: new PgSession({
    pool: pool,
    tableName: 'session',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'supersecretkey',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Setup Database Tables and Migrations
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
        status VARCHAR(20) DEFAULT 'To Read',
        language VARCHAR(10) DEFAULT 'EN',
        cover_url TEXT,
        user_id INT REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    // Ensure columns exist on older database instances
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS rating INT DEFAULT 5;`);
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'To Read';`);
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'EN';`);
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS cover_url TEXT;`);
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE CASCADE;`);

    // Assign orphaned books to the first registered user
    await pool.query(`UPDATE books SET user_id = (SELECT id FROM users ORDER BY id ASC LIMIT 1) WHERE user_id IS NULL;`);

  } catch (err) {
    console.error('Database setup error:', err);
  }
}

// GOOGLE BOOKS PROXY SEARCH (Bypasses client-side CORS restriction)
app.get('/api/search-books', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.json([]);

  try {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5`);
    const data = await response.json();

    if (!data.items) return res.json([]);

    const results = data.items.map(item => {
      const info = item.volumeInfo;
      let cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || '';
      if (cover) cover = cover.replace('http://', 'https://');

      return {
        title: info.title || 'Untitled',
        author: info.authors ? info.authors.join(', ') : 'Unknown Author',
        cover_url: cover
      };
    });

    res.json(results);
  } catch (err) {
    console.error('Error in book search proxy:', err);
    res.status(500).json({ error: 'Failed to search books' });
  }
});

// Routes
app.use('/', authRoutes);
app.use('/', bookRoutes);

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  await setupDatabase();
});