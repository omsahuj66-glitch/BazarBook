const express = require('express');
const router = express.Router();
const Seller = require('../models/Seller');
const Shop = require('../models/Shop');
const Booking = require('../models/Booking');
const Location = require('../models/Location');
const Trust = require('../models/Trust');
const bcrypt = require('bcryptjs');
const { adminAuth } = require('../middleware/auth');

// Stats
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const [totalShops, totalBookings, activeLocations, pendingBookings, sellers] = await Promise.all([
      Shop.countDocuments(),
      Booking.countDocuments(),
      Location.countDocuments({ isActive: true }),
      Booking.countDocuments({ status: 'pending' }),
      Seller.countDocuments()
    ]);
    res.json({ totalShops, totalBookings, activeLocations, pendingBookings, sellers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sellers
router.get('/sellers', adminAuth, async (req, res) => {
  try {
    const sellers = await Seller.find().populate('shopId', 'name').sort({ createdAt: -1 });
    res.json(sellers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sellers', adminAuth, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    const seller = await Seller.create({ name, email, phone, password });
    res.json(seller);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sellers/:id/block', adminAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    seller.isBlocked = !seller.isBlocked;
    await seller.save();
    res.json({ success: true, isBlocked: seller.isBlocked });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sellers/:id/reset-password', adminAuth, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const hashed = await bcrypt.hash(newPassword, 10);
    await Seller.findByIdAndUpdate(req.params.id, { password: hashed });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sellers/:id/assign-shop', adminAuth, async (req, res) => {
  try {
    const { shopId } = req.body;
    await Seller.findByIdAndUpdate(req.params.id, { shopId });
    if (shopId) await Shop.findByIdAndUpdate(shopId, { sellerId: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trust scores
router.get('/trust', adminAuth, async (req, res) => {
  try {
    const trust = await Trust.find().sort({ score: 1 });
    res.json(trust);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/trust/:id/reset', adminAuth, async (req, res) => {
  try {
    await Trust.findByIdAndUpdate(req.params.id, { score: 5 });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
