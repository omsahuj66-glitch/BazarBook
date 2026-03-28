const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  locationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', required: true },
  phone: { type: String, required: true },
  upiId: { type: String, default: '' },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', default: null },
  isActive: { type: Boolean, default: true },
  description: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Shop', shopSchema);
