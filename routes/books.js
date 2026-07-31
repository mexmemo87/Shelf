const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Middleware to ensure authentication
function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

// GET all books for authenticated user
router.get('/api/books', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, title, author, rating, status, language, cover_url FROM books WHERE user_id = $1 ORDER BY id DESC',
      [req.session.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST add a new book (Handles manual input directly)
router.post('/add-book', requireAuth, async (req, res) => {
  const { title, author, rating, status, language } = req.body;
  
  if (!title || !author) {
    return res.status(400).send('Title and Author are required');
  }

  try {
    await pool.query(
      `INSERT INTO books (title, author, rating, status, language, user_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        title, 
        author, 
        rating || 5, 
        status || 'To Read', 
        language || 'EN', 
        req.session.userId
      ]
    );
    res.redirect('/');
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).send('Database error');
  }
});

// POST update book rating / status
router.post('/update-book/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { rating, status } = req.body;

  try {
    await pool.query(
      'UPDATE books SET rating = $1, status = $2 WHERE id = $3 AND user_id = $4',
      [rating, status, id, req.session.userId]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating book:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST delete book
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