const express = require('express');
const router = express.Router();
const pool = require('../config/db');

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  next();
}

router.get('/api/books', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM books WHERE user_id = $1 ORDER BY id ASC',
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/add-book', requireAuth, async (req, res) => {
  const { title, author, rating, status } = req.body;
  const bookRating = parseInt(rating, 10) || 5;
  const bookStatus = status || 'To Read';

  try {
    await pool.query(
      'INSERT INTO books (title, author, rating, status, user_id) VALUES ($1, $2, $3, $4, $5)',
      [title, author, bookRating, bookStatus, req.session.userId]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).send('Database error');
  }
});

router.post('/update-book/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rating, status } = req.body;
  const bookRating = parseInt(rating, 10);

  try {
    await pool.query(
      'UPDATE books SET rating = $1, status = $2 WHERE id = $3 AND user_id = $4',
      [bookRating, status, id, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/delete-book/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM books WHERE id = $1 AND user_id = $2', [id, req.session.userId]);
    res.redirect('/');
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).send('Database error');
  }
});

module.exports = router;