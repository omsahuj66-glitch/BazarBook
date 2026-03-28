const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const sellerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  password: { type: String, required: true },
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null },
  isBlocked: { type: Boolean, default: false },
  isVerified: { type: Boolean, default: true }
}, { timestamps: true });

sellerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

sellerSchema.methods.comparePassword = function(pass) {
  return bcrypt.compare(pass, this.password);
};

module.exports = mongoose.model('Seller', sellerSchema);
