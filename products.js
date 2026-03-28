const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const { sellerAuth } = require('../middleware/auth');

// Public: Get products by shop
router.get('/shop/:shopId', async (req, res) => {
  try {
    const products = await Product.find({ shopId: req.params.shopId, isAvailable: true });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller: Add product
router.post('/', sellerAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller.id);
    if (!seller.shopId) return res.status(400).json({ error: 'No shop assigned' });
    const product = await Product.create({ ...req.body, shopId: seller.shopId });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller: Update product
router.put('/:id', sellerAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller: Delete product
router.delete('/:id', sellerAuth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
