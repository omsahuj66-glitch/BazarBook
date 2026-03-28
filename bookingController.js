const Booking = require('../models/Booking');
const Trust = require('../models/Trust');

exports.autoCancelExpired = async () => {
  try {
    const expired = await Booking.find({
      status: 'pending',
      expiresAt: { $lt: new Date() }
    });

    for (const booking of expired) {
      booking.status = 'cancelled';
      booking.cancelReason = 'Auto-cancelled: expired';
      await booking.save();

      // Update trust score: -2 for no-show
      await Trust.findOneAndUpdate(
        { phone: booking.phone },
        { $inc: { score: -2, noShows: 1 } },
        { upsert: true }
      );
    }

    if (expired.length > 0) {
      console.log(`⚡ Auto-cancelled ${expired.length} expired bookings`);
    }
  } catch (err) {
    console.error('Auto-cancel error:', err.message);
  }
};
