require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => { console.log('MongoDB connected'); seedAdmin(); })
  .catch(err => console.error('MongoDB error:', err.message));

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/locations', require('./routes/locations'));
app.use('/api/shops',     require('./routes/shops'));
app.use('/api/products',  require('./routes/products'));
app.use('/api/bookings',  require('./routes/bookings'));
app.use('/api/admin',     require('./routes/admin'));
app.use('/api/otp',       require('./routes/otp'));

app.get('/seller*', (req, res) => res.sendFile(path.join(__dirname, 'public/seller.html')));
app.get('/admin*',  (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('*',        (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

const { autoCancelExpired } = require('./controllers/bookingController');
setInterval(autoCancelExpired, 60000);

async function seedAdmin() {
  const { Admin } = require('./models');
  const bcrypt = require('bcryptjs');
  if (!await Admin.findOne({ username: 'admin' })) {
    await Admin.create({ username: 'admin', password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10) });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('BazaarBook running on ' + PORT));
