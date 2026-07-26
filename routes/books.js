const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Fetch All Books
router.get('/api/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add a New Book
router.post('/add-book', async (req, res) => {
  const { title, author } = req.body;
  try {
    await pool.query('INSERT INTO books (title, author) VALUES ($1, $2)', [title, author]);
    res.redirect('/');
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).send('Database error');
  }
});

// Delete Book by ID
router.post('/delete-book/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM books WHERE id = $1', [id]);
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).send('Database error');
  }
});

module.exports = router;