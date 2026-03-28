const express = require('express');
const router = express.Router();
const OTP = require('../models/OTP');

// Send OTP (mock - integrate your OTP API here)
router.post('/send', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min

    await OTP.deleteMany({ phone });
    await OTP.create({ phone, otp, expiresAt });

    // TODO: Integrate real OTP API
    // await sendSMS(phone, `Your Smart Kirana OTP: ${otp}`);

    console.log(`📱 OTP for ${phone}: ${otp}`); // Remove in production

    // In development, return OTP. In production, remove this!
    const isDev = process.env.NODE_ENV !== 'production';
    res.json({ 
      success: true, 
      message: 'OTP sent',
      ...(isDev && { otp }) // only in dev
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP
router.post('/verify', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const record = await OTP.findOne({ phone, verified: false });

    if (!record) return res.status(400).json({ error: 'OTP not found. Request a new one.' });
    if (new Date() > record.expiresAt) return res.status(400).json({ error: 'OTP expired' });
    if (record.otp !== otp) return res.status(400).json({ error: 'Invalid OTP' });

    record.verified = true;
    await record.save();

    res.json({ success: true, verified: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
