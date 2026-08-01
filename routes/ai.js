const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const pool = require('../config/db');

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

    const prompt = `
You are an expert literary advisor. Based on the following library of books read or saved by a user, provide 3 personalized book recommendations.

User Library:
${JSON.stringify(userBooks, null, 2)}

Requirements:
- Recommend exactly 3 books not present in the user's library.
- For each recommendation, provide the title, author, a short reasoning based on their library, and the primary language.
- Format the response as a clean HTML snippet (using <h3>, <p>, <ul>, <li>) without markdown code blocks.
`;

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const response = await model.generateContent(prompt);
    const outputText = response.response.text();

    res.json({ recommendations: outputText });
  } catch (err) {
    console.error('Detailed Gemini Error:', err.message || err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

module.exports = router;