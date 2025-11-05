const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findByEmail } = require('../models/User');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10);
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
const JWT_EXPIRES_IN = '24h';

function buildToken(user) {
  return jwt.sign({
    sub: user.id,
    email: user.email,
    name: user.name,
  }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    created_at: user.created_at,
  };
}

exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const existing = findByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'A user with that email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = createUser({ name, email, passwordHash });
    const token = buildToken(user);

    res.status(201).json({
      token,
      user: sanitizeUser({ ...user }),
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = buildToken(user);
    res.json({
      token,
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

exports.profile = (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

