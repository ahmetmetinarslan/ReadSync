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
  if (input.current_page !== undefined) {
    const parsedCurrent = Number.parseInt(input.current_page, 10);
    payload.current_page = Number.isNaN(parsedCurrent) || parsedCurrent < 0 ? 0 : parsedCurrent;
  }
  if (typeof input.isbn === 'string') {
    const isbn = input.isbn.trim();
    payload.isbn = isbn.length ? isbn : null;
  }
  if (typeof input.cover_url === 'string') {
    const coverUrl = input.cover_url.trim();
    if (!coverUrl) {
      payload.cover_url = null;
    } else if (!/^https?:\/\//i.test(coverUrl)) {
      throw Object.assign(new Error('Cover image URL must start with http or https.'), { statusCode: 400 });
    } else {
      payload.cover_url = coverUrl;
    }
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

function clampCurrentPage(payload, pagesLimit) {
  if (!Object.prototype.hasOwnProperty.call(payload, 'current_page')) {
    return;
  }
  if (payload.current_page < 0) {
    payload.current_page = 0;
  }
  if (typeof pagesLimit === 'number' && !Number.isNaN(pagesLimit)) {
    payload.current_page = Math.min(payload.current_page, pagesLimit);
  }
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
    if (!Object.prototype.hasOwnProperty.call(payload, 'current_page')) {
      payload.current_page = 0;
    }
    const pagesLimit = typeof payload.pages === 'number' ? payload.pages : null;
    clampCurrentPage(payload, pagesLimit);

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
    const limitSource = Object.prototype.hasOwnProperty.call(payload, 'pages')
      ? payload.pages
      : existing.pages;
    const normalizedLimit = typeof limitSource === 'number' ? limitSource : null;
    clampCurrentPage(payload, normalizedLimit);

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

