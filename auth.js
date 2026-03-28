const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'kirana_secret_2024';

exports.sellerAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'seller') return res.status(403).json({ error: 'Access denied' });
    req.seller = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};

exports.adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') return res.status(403).json({ error: 'Access denied' });
    req.admin = decoded;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
