const {
  getAllByUser,
  getByIdForUser,
  createBook,
  updateBook,
  deleteBook,
} = require('../models/Book');

const ALLOWED_STATUSES = new Set(['planned', 'reading', 'finished']);

function parseId(raw) {
  const id = Number.parseInt(raw, 10);
  if (Number.isNaN(id)) {
    const error = new Error('Invalid book identifier.');
    error.statusCode = 400;
    throw error;
  }
  return id;
}

function normalizeBookInput(input) {
  const payload = {};

  if (typeof input.title === 'string') {
    payload.title = input.title.trim();
  }
  if (typeof input.author === 'string') {
    payload.author = input.author.trim();
  }
  if (input.pages !== undefined) {
    const parsedPages = Number.parseInt(input.pages, 10);
    payload.pages = Number.isNaN(parsedPages) || parsedPages < 0 ? null : parsedPages;
  }
  if (typeof input.status === 'string') {
    const status = input.status.toLowerCase().trim();
    if (!ALLOWED_STATUSES.has(status)) {
      throw Object.assign(new Error('Invalid status value.'), { statusCode: 400 });
    }
    payload.status = status;
  }
  if (input.start_date !== undefined) {
    payload.start_date = input.start_date || null;
  }
  if (input.end_date !== undefined) {
    payload.end_date = input.end_date || null;
  }

  return payload;
}

exports.list = (req, res, next) => {
  try {
    const books = getAllByUser(req.user.id);
    res.json({ books });
  } catch (error) {
    next(error);
  }
};

exports.get = (req, res, next) => {
  try {
    const book = getByIdForUser(parseId(req.params.id), req.user.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    res.json({ book });
  } catch (error) {
    next(error);
  }
};

exports.create = (req, res, next) => {
  try {
    const payload = normalizeBookInput(req.body);
    if (!payload.title || !payload.author) {
      return res.status(400).json({ message: 'Title and author are required.' });
    }
    if (!payload.status) {
      payload.status = 'planned';
    }

    const book = createBook(req.user.id, payload);
    res.status(201).json({ book });
  } catch (error) {
    next(error);
  }
};

exports.update = (req, res, next) => {
  try {
    const existing = getByIdForUser(parseId(req.params.id), req.user.id);
    if (!existing) {
      return res.status(404).json({ message: 'Book not found.' });
    }

    const payload = normalizeBookInput(req.body);
    const updated = updateBook(req.user.id, existing.id, payload);
    res.json({ book: updated });
  } catch (error) {
    next(error);
  }
};

exports.remove = (req, res, next) => {
  try {
    const success = deleteBook(req.user.id, parseId(req.params.id));
    if (!success) {
      return res.status(404).json({ message: 'Book not found.' });
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

