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
async function seedDatabaseFromJSON() {
  try {
    const checkTable = await pool.query('SELECT COUNT(*) FROM books');
    const bookCount = parseInt(checkTable.rows[0].count, 10);

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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/', bookRoutes);

// Start Server
app.listen(PORT, async () => {
  console.log(`Server running at: http://localhost:${PORT}`);
  await seedDatabaseFromJSON();
});