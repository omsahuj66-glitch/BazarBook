const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// ── Location ──
const locationSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ['city','town','village'], required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });
exports.Location = mongoose.model('Location', locationSchema);

// ── Shop ──
const shopSchema = new mongoose.Schema({
  name:       { type: String, required: true, trim: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  sellerId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
  phone:      { type: String, required: true },
  upiId:      { type: String, default: '' },
  category:   { type: String, default: 'General' },
  description:{ type: String, default: '' },
  isActive:   { type: Boolean, default: true },
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });
exports.Shop = mongoose.model('Shop', shopSchema);

// ── Product ──
const productSchema = new mongoose.Schema({
  shopId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  name:        { type: String, required: true, trim: true },
  price:       { type: Number, required: true },
  originalPrice: { type: Number, default: 0 },
  unit:        { type: String, default: 'piece' },
  stock:       { type: Number, default: 0 },
  category:    { type: String, default: 'General' },
  description: { type: String, default: '' },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });
exports.Product = mongoose.model('Product', productSchema);

// ── Seller ──
const sellerSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  phone:      { type: String, required: true },
  password:   { type: String, required: true },
  shopId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  isBlocked:  { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },
  plan:       { type: String, enum: ['free','paid'], default: 'free' },
  planExpiry: { type: Date, default: null }
}, { timestamps: true });
sellerSchema.pre('save', async function(next) {
  if (this.isModified('password')) this.password = await bcrypt.hash(this.password, 10);
  next();
});
sellerSchema.methods.comparePassword = function(p) { return bcrypt.compare(p, this.password); };
exports.Seller = mongoose.model('Seller', sellerSchema);

// ── Booking ──
const bookingSchema = new mongoose.Schema({
  bookingId:          { type: String, unique: true },
  shopId:             { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  productId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity:           { type: Number, required: true, min: 1 },
  customerName:       { type: String, required: true },
  phone:              { type: String, required: true },
  status:             { type: String, enum: ['pending','packing','ready','completed','cancelled'], default: 'pending' },
  expiresAt:          { type: Date, required: true },
  trustScoreSnapshot: { type: Number, default: 5 },
  cancelReason:       { type: String, default: '' },
  totalAmount:        { type: Number, default: 0 }
}, { timestamps: true });
bookingSchema.pre('save', function(next) {
  if (!this.bookingId) {
    this.bookingId = 'BB-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2,3).toUpperCase();
  }
  next();
});
exports.Booking = mongoose.model('Booking', bookingSchema);

// ── Trust ──
const trustSchema = new mongoose.Schema({
  phone:             { type: String, required: true, unique: true },
  customerName:      { type: String, default: '' },
  score:             { type: Number, default: 5 },
  totalBookings:     { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  noShows:           { type: Number, default: 0 }
}, { timestamps: true });
exports.Trust = mongoose.model('Trust', trustSchema);

// ── Admin ──
const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
exports.Admin = mongoose.model('Admin', adminSchema);

// ── OTP ──
const otpSchema = new mongoose.Schema({
  phone:    { type: String, required: true },
  otp:      { type: String, required: true },
  expiresAt:{ type: Date, required: true },
  verified: { type: Boolean, default: false }
});
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.OTP = mongoose.model('OTP', otpSchema);
