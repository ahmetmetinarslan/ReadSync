const { getDb } = require('../db');

function createUser({ name, email, passwordHash }) {
  const db = getDb();
  const insert = db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  );
  const lowerEmail = email.toLowerCase();
  const result = insert.run(name, lowerEmail, passwordHash);

  const select = db.prepare(
    'SELECT id, name, email, created_at FROM users WHERE id = ?'
  );
  return select.get(result.lastInsertRowid);
}

function findByEmail(email) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
  return stmt.get(email.toLowerCase());
}

function findById(id) {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
  return stmt.get(id);
}

module.exports = {
  createUser,
  findByEmail,
  findById,
};

