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

// Seed Database from books.json if Table is Empty
// Seed Database from books.json if Table is Empty
async function seedDatabaseFromJSON() {
  try {
    // 1. Create table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS books (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255) NOT NULL
      )
    `);

    // 2. Check book count
    const checkTable = await pool.query('SELECT COUNT(*) FROM books');
    const bookCount = parseInt(checkTable.rows[0].count, 10);

    // 3. Populate from JSON if table is empty
    if (bookCount === 0) {
      const jsonPath = path.join(__dirname, 'books.json');
      if (fs.existsSync(jsonPath)) {
        const rawData = fs.readFileSync(jsonPath, 'utf8');
        const books = JSON.parse(rawData);

        for (const book of books) {
          await pool.query(
            'INSERT INTO books (title, author) VALUES ($1, $2)',
            [book.title, book.author]
          );
        }
        console.log(`Successfully migrated ${books.length} books from books.json to PostgreSQL.`);
      }
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
}