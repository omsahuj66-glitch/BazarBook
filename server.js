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

// MongoDB
let isConnected = false;
async function connectDB() {
  if (isConnected) return;
  await mongoose.connect(process.env.MONGO_URI);
  isConnected = true;
}

// Routes
app.use('/api/auth',      async (req,res,next) => { await connectDB(); next(); }, require('./routes/auth'));
app.use('/api/locations', async (req,res,next) => { await connectDB(); next(); }, require('./routes/locations'));
app.use('/api/shops',     async (req,res,next) => { await connectDB(); next(); }, require('./routes/shops'));
app.use('/api/products',  async (req,res,next) => { await connectDB(); next(); }, require('./routes/products'));
app.use('/api/bookings',  async (req,res,next) => { await connectDB(); next(); }, require('./routes/bookings'));
app.use('/api/admin',     async (req,res,next) => { await connectDB(); next(); }, require('./routes/admin'));
app.use('/api/otp',       async (req,res,next) => { await connectDB(); next(); }, require('./routes/otp'));

app.get('/seller*', (req, res) => res.sendFile(path.join(__dirname, 'public/seller.html')));
app.get('/admin*',  (req, res) => res.sendFile(path.join(__dirname, 'public/admin.html')));
app.get('*',        (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

// Seed admin on first request
app.use(async (req, res, next) => {
  await connectDB();
  const Admin = require('./models').Admin;
  const bcrypt = require('bcryptjs');
  const exists = await Admin.findOne({ username: 'admin' });
  if (!exists) {
    await Admin.create({ username: 'admin', password: await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10) });
  }
  next();
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log('Running on ' + PORT));
}
