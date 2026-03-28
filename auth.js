const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Seller = require('../models/Seller');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'kirana_secret_2024';

// Seller Register
router.post('/seller/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !phone || !password)
      return res.status(400).json({ error: 'All fields required' });

    const exists = await Seller.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const seller = await Seller.create({ name, email, phone, password });
    const token = jwt.sign({ id: seller._id, role: 'seller' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, seller: { id: seller._id, name, email, phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller Login
router.post('/seller/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const seller = await Seller.findOne({ email });
    if (!seller) return res.status(400).json({ error: 'Invalid credentials' });
    if (seller.isBlocked) return res.status(403).json({ error: 'Account blocked by admin' });

    const match = await seller.comparePassword(password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: seller._id, role: 'seller' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, seller: { id: seller._id, name: seller.name, email, shopId: seller.shopId } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Login
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(400).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, admin.password);
    if (!match) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: admin._id, role: 'admin' }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
