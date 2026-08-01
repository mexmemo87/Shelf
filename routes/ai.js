const express = require('express');
const router = express.Router();
const pool = require('../config/db');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/api/recommendations', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT title, author, rating, status, language FROM books WHERE user_id = $1',
      [req.session.userId]
    );

    const userBooks = result.rows;

    if (userBooks.length === 0) {
      return res.json({ 
        recommendations: "Add a few books to your library first so the AI can analyze your reading preferences!" 
      });
    }

    const promptText = `
You are an expert literary advisor. Based on the following library of books read or saved by a user, provide 3 personalized book recommendations.

User Library:
${JSON.stringify(userBooks, null, 2)}

Requirements:
- Recommend exactly 3 books not present in the user's library.
- For each recommendation, provide the title, author, a short reasoning based on their library, and the primary language.
- Format the response as a clean HTML snippet (using <h3>, <p>, <ul>, <li>) without markdown code blocks.
`;

    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error Detail:', JSON.stringify(data));
      throw new Error(data.error?.message || 'API request failed');
    }

    const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    res.json({ recommendations: outputText });

  } catch (err) {
    console.error('Detailed Gemini Error:', err.message || err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;