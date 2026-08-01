const express = require('express');
const router = express.Router();

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

router.post('/api/recommendations', requireAuth, async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();

    console.log('=== MODELOS DISPONIBLES EN TU CLAVE ===');
    if (data.models) {
      const generateModels = data.models
        .filter(m => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => m.name);
      console.log(generateModels);
      return res.json({ recommendations: `<p>Check Render logs for available models: ${generateModels.join(', ')}</p>` });
    } else {
      console.log(data);
      return res.status(500).json({ error: 'No models found' });
    }
  } catch (err) {
    console.error('Error fetching models:', err);
    res.status(500).json({ error: 'Failed to list models' });
  }
});

module.exports = router;