const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function loadBooks() {
  try {
    const data = fs.readFileSync('books.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading books.json:", error.message);
    return [];
  }
}

function saveBooks(books) {
  try {
    fs.writeFileSync('books.json', JSON.stringify(books, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing to books.json:", error.message);
  }
}

// MAIN DASHBOARD ROUTE
app.get('/', (req, res) => {
  const books = loadBooks();
  const totalBooks = books.length;
  const readBooks = books.filter(b => b.read).length;
  const unreadBooks = totalBooks - readBooks;

  const bookCards = books.map((book, index) => `
    <div class="card ${book.read ? 'card-read' : 'card-unread'}">
      <div>
        <div class="card-title">${book.title}</div>
        <div class="card-author">by ${book.author}</div>
      </div>
      
      <div>
        <div class="card-meta">
          <span class="rating-badge">⭐ ${book.rating} / 5</span>
          <span class="status-tag ${book.read ? 'status-read' : 'status-unread'}">
            ${book.read ? '✔ Read' : '📖 Unread'}
          </span>
        </div>

        <div class="card-actions">
          <form action="/toggle-book/${index}" method="POST" style="flex: 1;">
            <button type="submit" class="btn-secondary">
              ${book.read ? 'Mark Unread' : 'Mark Read'}
            </button>
          </form>
          <form action="/delete-book/${index}" method="POST">
            <button type="submit" class="btn-danger">Delete</button>
          </form>
        </div>
      </div>
    </div>
  `).join('');

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Digital Bookshelf Workspace</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 2rem 1rem; color: #f8fafc; }
        .container { max-width: 1050px; margin: 0 auto; }
        
        /* HEADER HERO */
        .hero { 
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); 
          border: 1px solid #334155; 
          border-radius: 12px; 
          padding: 2rem; 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 2rem;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
        }
        .hero-brand { display: flex; align-items: center; gap: 1.25rem; }
        .hero-icon { 
          width: 52px; 
          height: 52px; 
          background: #2563eb; 
          border-radius: 10px; 
          display: flex; 
          align-items: center; 
          justify-content: center;
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.4);
        }
        .hero-title h1 { margin: 0; font-size: 1.6rem; color: #f8fafc; font-weight: 700; tracking: -0.02em; }
        .hero-title p { margin: 0.25rem 0 0 0; color: #94a3b8; font-size: 0.9rem; }
        
        .stats-group { display: flex; gap: 2rem; background: rgba(15, 23, 42, 0.6); padding: 0.75rem 1.5rem; border-radius: 8px; border: 1px solid #334155; }
        .stat-badge { text-align: center; }
        .stat-value { font-size: 1.4rem; font-weight: 700; color: #f8fafc; }
        .stat-label { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em; }

        /* FORM CARD */
        .form-card { background: #1e293b; border: 1px solid #334155; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2); }
        .form-grid { display: grid; grid-template-columns: 2.5fr 2.5fr 1fr 1.2fr auto; gap: 1rem; align-items: end; }
        .form-group { display: flex; flex-direction: column; gap: 0.35rem; }
        .form-group label { font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
        .form-group input, .form-group select { 
          padding: 0.6rem 0.75rem; 
          background: #0f172a; 
          border: 1px solid #334155; 
          border-radius: 6px; 
          font-size: 0.9rem; 
          color: #f8fafc; 
          outline: none;
        }
        .form-group input:focus, .form-group select:focus { border-color: #3b82f6; }
        .btn-submit { 
          background-color: #2563eb; 
          color: white; 
          border: none; 
          padding: 0.65rem 1.5rem; 
          border-radius: 6px; 
          font-weight: 600; 
          cursor: pointer; 
          height: 38px;
          transition: background 0.2s;
        }
        .btn-submit:hover { background-color: #1d4ed8; }

        /* CARDS GRID */
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
        .card { 
          background: #1e293b; 
          border: 1px solid #334155; 
          border-radius: 10px; 
          padding: 1.25rem; 
          display: flex; 
          flex-direction: column; 
          justify-content: space-between; 
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .card-read { border-left: 4px solid #10b981; }
        .card-unread { border-left: 4px solid #f59e0b; }
        .card-title { font-size: 1.15rem; font-weight: 600; color: #f8fafc; margin-bottom: 0.25rem; }
        .card-author { font-size: 0.85rem; color: #94a3b8; margin-bottom: 1.25rem; }
        
        .card-meta { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .rating-badge { background: #0f172a; border: 1px solid #334155; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; font-weight: 600; color: #cbd5e1; }
        .status-tag { font-size: 0.8rem; font-weight: 600; }
        .status-read { color: #34d399; }
        .status-unread { color: #fbbf24; }

        .card-actions { display: flex; gap: 0.5rem; border-top: 1px solid #334155; padding-top: 0.85rem; }
        .btn-secondary { 
          width: 100%; 
          background: #0f172a; 
          color: #cbd5e1; 
          border: 1px solid #334155; 
          padding: 0.45rem; 
          border-radius: 5px; 
          font-size: 0.8rem; 
          font-weight: 600; 
          cursor: pointer; 
        }
        .btn-secondary:hover { background: #1a2744; }
        .btn-danger { 
          background: rgba(239, 68, 68, 0.1); 
          color: #f87171; 
          border: 1px solid rgba(239, 68, 68, 0.3); 
          padding: 0.45rem 0.75rem; 
          border-radius: 5px; 
          font-size: 0.8rem; 
          font-weight: 600; 
          cursor: pointer; 
        }
        .btn-danger:hover { background: rgba(239, 68, 68, 0.2); }
      </style>
    </head>
    <body>
      <div class="container">
        
        <!-- HERO HEADER WITH SVG ICON -->
        <div class="hero">
          <div class="hero-brand">
            <div class="hero-icon">
              <!-- Clean Professional SVG -->
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                <line x1="12" y1="6" x2="16" y2="6"></line>
                <line x1="12" y1="10" x2="16" y2="10"></line>
              </svg>
            </div>
            <div class="hero-title">
              <h1>Digital Bookshelf</h1>
              <p>Personal Reading & Metadata Console</p>
            </div>
          </div>
          <div class="stats-group">
            <div class="stat-badge">
              <div class="stat-value">${totalBooks}</div>
              <div class="stat-label">Total</div>
            </div>
            <div class="stat-badge">
              <div class="stat-value" style="color: #34d399;">${readBooks}</div>
              <div class="stat-label">Read</div>
            </div>
            <div class="stat-badge">
              <div class="stat-value" style="color: #fbbf24;">${unreadBooks}</div>
              <div class="stat-label">Unread</div>
            </div>
          </div>
        </div>

        <!-- FORM CARD -->
        <div class="form-card">
          <form action="/add-book" method="POST" class="form-grid">
            <div class="form-group">
              <label>Title</label>
              <input type="text" name="title" required placeholder="Enter book title...">
            </div>
            <div class="form-group">
              <label>Author</label>
              <input type="text" name="author" required placeholder="Author name...">
            </div>
            <div class="form-group">
              <label>Rating</label>
              <input type="number" name="rating" min="1" max="5" step="0.5" value="5" required>
            </div>
            <div class="form-group">
              <label>Status</label>
              <select name="read">
                <option value="true">Read</option>
                <option value="false">Unread</option>
              </select>
            </div>
            <button type="submit" class="btn-submit">Add Book</button>
          </form>
        </div>

        <!-- CARDS GRID -->
        <div class="grid">
          ${bookCards}
        </div>

      </div>
    </body>
    </html>
  `);
});

// ROUTE HANDLERS
app.post('/add-book', (req, res) => {
  const { title, author, rating, read } = req.body;
  if (!title || !author) return res.status(400).send("Title and Author required.");

  const books = loadBooks();
  books.push({
    title,
    author,
    rating: parseFloat(rating) || 5,
    read: read === 'true'
  });
  saveBooks(books);
  res.redirect('/');
});

app.post('/toggle-book/:id', (req, res) => {
  const index = parseInt(req.params.id);
  const books = loadBooks();

  if (index >= 0 && index < books.length) {
    books[index].read = !books[index].read;
    saveBooks(books);
  }
  res.redirect('/');
});

app.post('/delete-book/:id', (req, res) => {
  const index = parseInt(req.params.id);
  const books = loadBooks();

  if (index >= 0 && index < books.length) {
    books.splice(index, 1);
    saveBooks(books);
  }
  res.redirect('/');
});

app.get('/api/books', (req, res) => {
  res.json(loadBooks());
});

app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});