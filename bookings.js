const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Trust = require('../models/Trust');
const OTP = require('../models/OTP');
const Seller = require('../models/Seller');
const { sellerAuth, adminAuth } = require('../middleware/auth');

// Public: Create booking (after OTP verified)
router.post('/', async (req, res) => {
  try {
    const { shopId, productId, quantity, customerName, phone, otpToken } = req.body;

    // Verify OTP was done
    const otpRecord = await OTP.findOne({ phone, verified: true });
    if (!otpRecord) return res.status(400).json({ error: 'Phone not verified. Please verify OTP first.' });

    // Get trust score
    let trust = await Trust.findOne({ phone });
    const trustScore = trust ? trust.score : 5;

    const expiresAt = new Date(Date.now() + 45 * 60 * 1000); // 45 min

    const booking = await Booking.create({
      shopId, productId, quantity,
      customerName, phone,
      expiresAt,
      trustScoreSnapshot: trustScore
    });

    // Update trust totals
    await Trust.findOneAndUpdate(
      { phone },
      { $inc: { totalBookings: 1 }, $set: { customerName } },
      { upsert: true }
    );

    // Clean up OTP
    await OTP.deleteMany({ phone });

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public: Get booking by bookingId
router.get('/track/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findOne({ bookingId: req.params.bookingId })
      .populate('shopId', 'name phone')
      .populate('productId', 'name price unit');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller: Get their shop bookings
router.get('/seller/mine', sellerAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller.id);
    if (!seller.shopId) return res.json([]);
    const bookings = await Booking.find({ shopId: seller.shopId })
      .populate('productId', 'name price')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seller: Update booking status
router.put('/:id/status', sellerAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const oldStatus = booking.status;
    booking.status = status;
    await booking.save();

    // Trust score update
    if (status === 'completed' && oldStatus !== 'completed') {
      await Trust.findOneAndUpdate(
        { phone: booking.phone },
        { $inc: { score: 1, completedBookings: 1 } },
        { upsert: true }
      );
    }

    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Get all bookings
router.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const { shopId, locationId, status } = req.query;
    let filter = {};
    if (shopId) filter.shopId = shopId;
    if (status) filter.status = status;

    const bookings = await Booking.find(filter)
      .populate('shopId', 'name locationId')
      .populate('productId', 'name price')
      .sort({ createdAt: -1 })
      .limit(200);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Force cancel
router.put('/:id/cancel', adminAuth, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled', cancelReason: 'Cancelled by admin' },
      { new: true }
    );
    res.json({ success: true, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
