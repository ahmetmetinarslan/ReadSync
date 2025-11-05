const jwt = require('jsonwebtoken');
const { findById } = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');

  if (!token) {
    return res.status(401).json({ message: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = findById(payload.sub);
    if (!user) {
      return res.status(401).json({ message: 'User does not exist.' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

