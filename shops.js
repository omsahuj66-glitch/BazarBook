const express = require('express');
const router = express.Router();
const Shop = require('../models/Shop');
const { adminAuth, sellerAuth } = require('../middleware/auth');

// Public: Get shops by location
router.get('/location/:locationId', async (req, res) => {
  try {
    const shops = await Shop.find({ locationId: req.params.locationId, isActive: true })
      .populate('locationId', 'name type');
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get single shop
router.get('/:id', async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('locationId', 'name type');
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all shops
router.get('/', adminAuth, async (req, res) => {
  try {
    const shops = await Shop.find().populate('locationId', 'name type').populate('sellerId', 'name email').sort({ createdAt: -1 });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create shop
router.post('/', adminAuth, async (req, res) => {
  try {
    const shop = await Shop.create(req.body);
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update shop
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const shop = await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(shop);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete shop
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
