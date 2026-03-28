require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 150 }));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => { console.log('✅ MongoDB connected'); seedAdmin(); })
  .catch(err => console.error('❌ MongoDB:', err.message));

// Routes
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/shops',     require('./routes/shops'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/bookings',  require('./routes/bookings'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/otp',       require('./routes/otp'));

// SPA fallback
app.get('/seller*', (req, res) => res.sendFile(path.join(__dirname, 'public/seller.html')));
app.get('/admin*',  (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/home.html')));

// Auto-cancel expired bookings every 60s
const { autoCancelExpired } = require('./controllers/bookingController');
setInterval(autoCancelExpired, 60000);

async function seedAdmin() {
  const Admin = require('./models/Admin');
  const bcrypt = require('bcryptjs');
  if (!await Admin.findOne({ username: 'admin' })) {
    await Admin.create({ username: 'admin', password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10) });
    console.log('✅ Admin seeded: admin / admin123');
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 BazaarBook running → http://localhost:${PORT}`));
