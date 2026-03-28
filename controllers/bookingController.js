// ── bookingController.js ──
const { Booking, Trust } = require('../models');
exports.autoCancelExpired = async () => {
  try {
    const expired = await Booking.find({ status: 'pending', expiresAt: { $lt: new Date() } });
    for (const b of expired) {
      b.status = 'cancelled'; b.cancelReason = 'Auto-cancelled: timeout';
      await b.save();
      await Trust.findOneAndUpdate({ phone: b.phone }, { $inc: { score: -2, noShows: 1 } }, { upsert: true });
    }
    if (expired.length) console.log(`⚡ Auto-cancelled ${expired.length} bookings`);
  } catch(e) { console.error('AutoCancel:', e.message); }
};

// ── bookings route ──
const bookRouter = require('express').Router();
const { Booking: Bk, Trust: Tr, OTP, Seller } = require('../models');
const { sellerAuth, adminAuth } = require('../middleware/auth');

bookRouter.post('/', async (req, res) => {
  try {
    const { shopId, productId, quantity, customerName, phone } = req.body;
    if (!shopId||!productId||!quantity||!customerName||!phone) return res.status(400).json({ error: 'All fields required' });
    const otpRec = await OTP.findOne({ phone, verified: true });
    if (!otpRec) return res.status(400).json({ error: 'Phone not verified' });
    const trust = await Tr.findOne({ phone });
    const Product = require('../models').Product;
    const prod = await Product.findById(productId);
    const booking = await Bk.create({
      shopId, productId, quantity, customerName, phone,
      expiresAt: new Date(Date.now() + 45 * 60000),
      trustScoreSnapshot: trust?.score || 5,
      totalAmount: (prod?.price || 0) * quantity
    });
    await Tr.findOneAndUpdate({ phone }, { $inc: { totalBookings: 1 }, $set: { customerName } }, { upsert: true });
    await OTP.deleteMany({ phone });
    res.json({ success: true, booking });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

bookRouter.get('/track/:id', async (req, res) => {
  try {
    const b = await Bk.findOne({ bookingId: req.params.id }).populate('shopId','name phone upiId').populate('productId','name price unit');
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json(b);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

bookRouter.get('/seller/mine', sellerAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller.id);
    if (!seller?.shopId) return res.json([]);
    res.json(await Bk.find({ shopId: seller.shopId }).populate('productId','name price').sort({ createdAt: -1 }));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

bookRouter.put('/:id/status', sellerAuth, async (req, res) => {
  try {
    const b = await Bk.findById(req.params.id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    const old = b.status; b.status = req.body.status; await b.save();
    if (req.body.status === 'completed' && old !== 'completed')
      await Tr.findOneAndUpdate({ phone: b.phone }, { $inc: { score: 1, completedBookings: 1 } }, { upsert: true });
    res.json({ ok: true, booking: b });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

bookRouter.get('/admin/all', adminAuth, async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.shopId) filter.shopId = req.query.shopId;
    res.json(await Bk.find(filter).populate('shopId','name').populate('productId','name price').sort({ createdAt: -1 }).limit(300));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

bookRouter.put('/:id/cancel', adminAuth, async (req, res) => {
  try {
    const b = await Bk.findByIdAndUpdate(req.params.id, { status: 'cancelled', cancelReason: 'Admin cancelled' }, { new: true });
    res.json({ ok: true, booking: b });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
module.exports.bookRouter = bookRouter;

// ── admin route ──
const adminRouter = require('express').Router();
const { Seller: Sl, Shop, Booking: B2, Location, Trust: T2 } = require('../models');
const { adminAuth: aa } = require('../middleware/auth');
const bcrypt = require('bcryptjs');

adminRouter.get('/stats', aa, async (req, res) => {
  try {
    const [shops, bookings, locs, pending, sellers, pendingShops] = await Promise.all([
      Shop.countDocuments({ isApproved: true }),
      B2.countDocuments(),
      Location.countDocuments({ isActive: true }),
      B2.countDocuments({ status: 'pending' }),
      Sl.countDocuments(),
      Shop.countDocuments({ isApproved: false })
    ]);
    res.json({ shops, bookings, locs, pending, sellers, pendingShops });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

adminRouter.get('/sellers', aa, async (req, res) => {
  try { res.json(await Sl.find().populate('shopId','name').sort({ createdAt: -1 })); } catch(e) { res.status(500).json({ error: e.message }); }
});
adminRouter.post('/sellers', aa, async (req, res) => {
  try { res.json(await Sl.create(req.body)); } catch(e) { res.status(500).json({ error: e.message }); }
});
adminRouter.put('/sellers/:id/block', aa, async (req, res) => {
  try {
    const s = await Sl.findById(req.params.id);
    s.isBlocked = !s.isBlocked; await s.save();
    res.json({ ok: true, isBlocked: s.isBlocked });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
adminRouter.put('/sellers/:id/reset-password', aa, async (req, res) => {
  try {
    await Sl.findByIdAndUpdate(req.params.id, { password: await bcrypt.hash(req.body.newPassword, 10) });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
adminRouter.put('/sellers/:id/assign-shop', aa, async (req, res) => {
  try {
    const { shopId } = req.body;
    await Sl.findByIdAndUpdate(req.params.id, { shopId });
    if (shopId) await Shop.findByIdAndUpdate(shopId, { sellerId: req.params.id });
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

adminRouter.get('/trust', aa, async (req, res) => {
  try { res.json(await T2.find().sort({ score: 1 })); } catch(e) { res.status(500).json({ error: e.message }); }
});
adminRouter.put('/trust/:id/reset', aa, async (req, res) => {
  try { await T2.findByIdAndUpdate(req.params.id, { score: 5 }); res.json({ ok: true }); } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports.adminRouter = adminRouter;
