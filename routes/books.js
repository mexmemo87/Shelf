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
  const { title, author, rating, read } = req.body;
  const isRead = read === 'on' || read === 'true' || read === true;
  const bookRating = parseInt(rating, 10) || 5;

  try {
    await pool.query(
      'INSERT INTO books (title, author, rating, read) VALUES ($1, $2, $3, $4)',
      [title, author, bookRating, isRead]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).send('Database error');
  }
});

// Update Book (Rating and Read status)
router.post('/update-book/:id', async (req, res) => {
  const { id } = req.params;
  const { rating, read } = req.body;
  const isRead = read === 'true' || read === true;
  const bookRating = parseInt(rating, 10);

  try {
    await pool.query(
      'UPDATE books SET rating = $1, read = $2 WHERE id = $3',
      [bookRating, isRead, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Database error' });
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