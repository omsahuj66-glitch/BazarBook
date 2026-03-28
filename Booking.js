const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  bookingId: { type: String, unique: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'ready', 'completed', 'cancelled'],
    default: 'pending'
  },
  expiresAt: { type: Date, required: true },
  trustScoreSnapshot: { type: Number, default: 0 },
  cancelReason: { type: String, default: '' }
}, { timestamps: true });

bookingSchema.pre('save', async function(next) {
  if (!this.bookingId) {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).substr(2, 4).toUpperCase();
    this.bookingId = `BK-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
