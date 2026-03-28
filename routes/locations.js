const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { adminAuth } = require('../middleware/auth');

// Public: Get all active locations
router.get('/', async (req, res) => {
  try {
    const locations = await Location.find({ isActive: true }).sort({ name: 1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all locations
router.get('/all', adminAuth, async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Create location
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: 'Name and type required' });
    const loc = await Location.create({ name, type });
    res.json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update location
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const loc = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(loc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Delete location
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
