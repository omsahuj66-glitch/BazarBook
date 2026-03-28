// ── locations.js ──
const locRouter = require('express').Router();
const { Location } = require('../models');
const { adminAuth } = require('../middleware/auth');

locRouter.get('/', async (req, res) => {
  try { res.json(await Location.find({ isActive: true }).sort({ name: 1 })); } catch(e) { res.status(500).json({ error: e.message }); }
});
locRouter.get('/all', adminAuth, async (req, res) => {
  try { res.json(await Location.find().sort({ createdAt: -1 })); } catch(e) { res.status(500).json({ error: e.message }); }
});
locRouter.post('/', adminAuth, async (req, res) => {
  try { res.json(await Location.create(req.body)); } catch(e) { res.status(500).json({ error: e.message }); }
});
locRouter.put('/:id', adminAuth, async (req, res) => {
  try { res.json(await Location.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch(e) { res.status(500).json({ error: e.message }); }
});
locRouter.delete('/:id', adminAuth, async (req, res) => {
  try { await Location.findByIdAndDelete(req.params.id); res.json({ ok: true }); } catch(e) { res.status(500).json({ error: e.message }); }
});
module.exports.locationRouter = locRouter;

// ── shops.js ──
const shopRouter = require('express').Router();
const { Shop, Seller } = require('../models');
const { adminAuth: aAuth, sellerAuth: sAuth } = require('../middleware/auth');

shopRouter.get('/public', async (req, res) => {
  try {
    const { locationId, search } = req.query;
    let filter = { isActive: true, isApproved: true };
    if (locationId) filter.locationId = locationId;
    if (search) filter.name = { $regex: search, $options: 'i' };
    res.json(await Shop.find(filter).populate('locationId', 'name type').sort({ name: 1 }));
  } catch(e) { res.status(500).json({ error: e.message }); }
});
shopRouter.get('/location/:lid', async (req, res) => {
  try { res.json(await Shop.find({ locationId: req.params.lid, isActive: true, isApproved: true }).populate('locationId', 'name')); } catch(e) { res.status(500).json({ error: e.message }); }
});
shopRouter.get('/:id', async (req, res) => {
  try { res.json(await Shop.findById(req.params.id).populate('locationId', 'name type')); } catch(e) { res.status(500).json({ error: e.message }); }
});
// Seller creates own shop
shopRouter.post('/seller/create', sAuth, async (req, res) => {
  try {
    const existing = await Shop.findOne({ sellerId: req.seller.id });
    if (existing) return res.status(400).json({ error: 'Shop already exists' });
    const shop = await Shop.create({ ...req.body, sellerId: req.seller.id, isApproved: false });
    await Seller.findByIdAndUpdate(req.seller.id, { shopId: shop._id });
    res.json(shop);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
shopRouter.put('/seller/update', sAuth, async (req, res) => {
  try {
    const seller = await Seller.findById(req.seller.id);
    const shop = await Shop.findByIdAndUpdate(seller.shopId, req.body, { new: true });
    res.json(shop);
  } catch(e) { res.status(500).json({ error: e.message }); }
});
// Admin
shopRouter.get('/', aAuth, async (req, res) => {
  try { res.json(await Shop.find().populate('locationId','name').populate('sellerId','name email').sort({ createdAt: -1 })); } catch(e) { res.status(500).json({ error: e.message }); }
});
shopRouter.post('/', aAuth, async (req, res) => {
  try { res.json(await Shop.create(req.body)); } catch(e) { res.status(500).json({ error: e.message }); }
});
shopRouter.put('/:id', aAuth, async (req, res) => {
  try { res.json(await Shop.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch(e) { res.status(500).json({ error: e.message }); }
});
shopRouter.delete('/:id', aAuth, async (req, res) => {
  try { await Shop.findByIdAndDelete(req.params.id); res.json({ ok: true }); } catch(e) { res.status(500).json({ error: e.message }); }
});
module.exports.shopRouter = shopRouter;

// ── products.js ──
const prodRouter = require('express').Router();
const { Product, Seller: S2 } = require('../models');
const { sellerAuth: sa } = require('../middleware/auth');

prodRouter.get('/shop/:shopId', async (req, res) => {
  try { res.json(await Product.find({ shopId: req.params.shopId, isAvailable: true })); } catch(e) { res.status(500).json({ error: e.message }); }
});
prodRouter.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    const products = await Product.find({ name: { $regex: q, $options: 'i' }, isAvailable: true }).populate('shopId', 'name locationId isApproved isActive').limit(20);
    res.json(products.filter(p => p.shopId?.isApproved && p.shopId?.isActive));
  } catch(e) { res.status(500).json({ error: e.message }); }
});
prodRouter.post('/', sa, async (req, res) => {
  try {
    const seller = await S2.findById(req.seller.id);
    if (!seller.shopId) return res.status(400).json({ error: 'Create shop first' });
    res.json(await Product.create({ ...req.body, shopId: seller.shopId }));
  } catch(e) { res.status(500).json({ error: e.message }); }
});
prodRouter.put('/:id', sa, async (req, res) => {
  try { res.json(await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })); } catch(e) { res.status(500).json({ error: e.message }); }
});
prodRouter.delete('/:id', sa, async (req, res) => {
  try { await Product.findByIdAndDelete(req.params.id); res.json({ ok: true }); } catch(e) { res.status(500).json({ error: e.message }); }
});
module.exports.productRouter = prodRouter;

// ── otp.js ──
const otpRouter = require('express').Router();
const { OTP } = require('../models');

otpRouter.post('/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || phone.length !== 10) return res.status(400).json({ error: 'Valid 10-digit phone required' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OTP.deleteMany({ phone });
    await OTP.create({ phone, otp, expiresAt: new Date(Date.now() + 5 * 60000) });
    console.log(`📱 OTP [${phone}]: ${otp}`);
    // TODO: Add SMS API here
    // await sendSMS(phone, otp);
    res.json({ success: true, ...(process.env.NODE_ENV !== 'production' && { otp }) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

otpRouter.post('/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const rec = await OTP.findOne({ phone, verified: false });
    if (!rec) return res.status(400).json({ error: 'OTP not found' });
    if (new Date() > rec.expiresAt) return res.status(400).json({ error: 'OTP expired' });
    if (rec.otp !== otp) return res.status(400).json({ error: 'Wrong OTP' });
    rec.verified = true; await rec.save();
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});
module.exports.otpRouter = otpRouter;
