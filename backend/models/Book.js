const { getDb } = require('../db');

const updatableFields = ['title', 'author', 'pages', 'status', 'start_date', 'end_date', 'current_page'];

function getAllByUser(userId) {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT id, user_id, title, author, pages, current_page, status, start_date, end_date, created_at, updated_at
     FROM books WHERE user_id = ? ORDER BY created_at DESC`
  );
  return stmt.all(userId);
}

function getByIdForUser(bookId, userId) {
  const db = getDb();
  const stmt = db.prepare(
    `SELECT id, user_id, title, author, pages, current_page, status, start_date, end_date, created_at, updated_at
     FROM books WHERE id = ? AND user_id = ?`
  );
  return stmt.get(bookId, userId);
}

function createBook(userId, data) {
  const db = getDb();
  const stmt = db.prepare(
    `INSERT INTO books (user_id, title, author, pages, current_page, status, start_date, end_date)
     VALUES (@user_id, @title, @author, @pages, @current_page, @status, @start_date, @end_date)`
  );
  const payload = {
    user_id: userId,
    title: data.title,
    author: data.author,
    pages: data.pages ?? null,
    current_page: data.current_page ?? 0,
    status: data.status ?? 'planned',
    start_date: data.start_date ?? null,
    end_date: data.end_date ?? null,
  };
  const result = stmt.run(payload);
  return getByIdForUser(result.lastInsertRowid, userId);
}

function updateBook(userId, bookId, updates) {
  const db = getDb();
  const assignments = [];
  const values = {};

  updatableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      assignments.push(`${field} = @${field}`);
      values[field] = updates[field];
    }
  });

  if (!assignments.length) {
    return getByIdForUser(bookId, userId);
  }

  const stmt = db.prepare(
    `UPDATE books SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = @bookId AND user_id = @userId`
  );

  stmt.run({
    ...values,
    bookId,
    userId,
  });

  return getByIdForUser(bookId, userId);
}

function deleteBook(userId, bookId) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM books WHERE id = ? AND user_id = ?');
  const info = stmt.run(bookId, userId);
  return info.changes > 0;
}

module.exports = {
  getAllByUser,
  getByIdForUser,
  createBook,
  updateBook,
  deleteBook,
};
