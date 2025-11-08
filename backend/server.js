require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const { getDb } = require('./db');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/books');

const PORT = process.env.PORT || 5000;

function createServer() {
  // Ensure database initializes and migrations run at startup
  getDb();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/books', bookRoutes);

  const staticDir = path.resolve(__dirname, '..', 'frontend');
  app.use(express.static(staticDir));
  app.get('/books', (_req, res) => {
    res.sendFile(path.join(staticDir, 'books.html'));
  });
  app.get('/add-book', (_req, res) => {
    res.sendFile(path.join(staticDir, 'add-book.html'));
  });
  app.get(['/dashboard', '/dashboard.html'], (_req, res) => {
    res.redirect(302, '/books');
  });
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(staticDir, 'index.html'));
  });

  // Basic error handler so we always respond with JSON
  app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error.' : err.message;
    res.status(statusCode).json({ message });
  });

  return app;
}

if (require.main === module) {
  const app = createServer();
  app.listen(PORT, () => {
    console.log(`ReadSync API listening on port ${PORT}`);
  });
}

module.exports = { createServer };

