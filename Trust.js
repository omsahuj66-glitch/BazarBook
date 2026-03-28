const mongoose = require('mongoose');

const trustSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true },
  customerName: { type: String, default: '' },
  score: { type: Number, default: 5 },
  totalBookings: { type: Number, default: 0 },
  completedBookings: { type: Number, default: 0 },
  noShows: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Trust', trustSchema);
