const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'bazaarbook_secret_2024';

exports.sellerAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    const d = jwt.verify(token, SECRET);
    if (d.role !== 'seller') return res.status(403).json({ error: 'Not a seller' });
    req.seller = d; next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};

exports.adminAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token required' });
  try {
    const d = jwt.verify(token, SECRET);
    if (d.role !== 'admin') return res.status(403).json({ error: 'Not admin' });
    req.admin = d; next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
};
