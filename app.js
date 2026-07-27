require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const pool = require('./config/db');
const bookRoutes = require('./routes/books');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Seed Database Function
async function seedDatabaseFromJSON() {
  try {
    // 1. Create Books Table with rating and read status
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL,
        rating INT DEFAULT 5,
        read BOOLEAN DEFAULT false
      )
    `);

    // Add columns if table already existed without them
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS rating INT DEFAULT 5;`);
    await pool.query(`ALTER TABLE books ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false;`);

    // 2. Check if DB is empty
    const { rows } = await pool.query('SELECT COUNT(*) FROM books');
    if (parseInt(rows[0].count, 10) === 0) {
      console.log('Database empty. Seeding initial books from JSON...');
      const jsonPath = path.join(__dirname, 'books.json');
      
      if (fs.existsSync(jsonPath)) {
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const books = JSON.parse(rawData);

        for (const book of books) {
          await pool.query(
            'INSERT INTO books (title, author, rating, read) VALUES ($1, $2, $3, $4)',
            [book.title, book.author, book.rating || 5, book.read !== undefined ? book.read : true]
          );
        }
        console.log('Seeding complete.');
      }
    }
  } catch (err) {
    console.error('Database setup/seeding error:', err);
  }
}

// Routes
app.use('/', bookRoutes);

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  await seedDatabaseFromJSON();
});