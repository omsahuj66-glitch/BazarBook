# 🛒 Smart Kirana Booking System

Production-ready booking system with **3 separate panels**:

| Panel | URL | Users |
|-------|-----|-------|
| Customer App | `/` | Public (no login) |
| Seller Panel | `/seller` | Registered Sellers |
| Admin Panel | `/admin` | Admin Only |

---

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your MongoDB URI & secrets

# 3. Run
node server.js
# or for development:
npx nodemon server.js
```

Open: `http://localhost:3000`

---

## 🔐 Default Login

**Admin Panel** (`/admin`):
- Username: `admin`
- Password: `admin123` (change in .env → ADMIN_PASSWORD)

**Seller Panel** (`/seller`):
- Register a new account, then admin assigns a shop

---

## 📂 Project Structure

```
/project
  server.js           ← Main entry point
  /routes
    auth.js           ← Login/Register
    locations.js      ← City/Town/Village
    shops.js          ← Shop management
    products.js       ← Product CRUD
    bookings.js       ← Booking flow
    admin.js          ← Admin-only routes
    otp.js            ← OTP send/verify
  /models
    Location.js
    Shop.js
    Product.js
    Seller.js
    Booking.js
    Trust.js
    Admin.js
    OTP.js
  /controllers
    bookingController.js  ← Auto-cancel logic
  /middleware
    auth.js           ← JWT middleware
  /public
    index.html        ← Customer App
    /seller
      index.html      ← Seller Panel
    /admin
      index.html      ← Admin Panel
```

---

## ✨ Features

### 👤 Customer App
- Select area manually (city/town/village)
- Browse shops by location
- View products with prices
- Book with OTP verification
- 45-minute pickup countdown

### 👨‍💼 Seller Panel
- JWT-based login/register
- Add/edit/delete products
- View all bookings with customer trust score
- Update booking status: pending → ready → completed

### 🛡️ Admin Panel
- **Location Management** – Add/edit/delete cities, towns, villages
- **Shop Management** – Add shops, assign locations, activate/deactivate
- **Seller Management** – Create accounts, assign shops, block/unblock, reset passwords
- **Booking Control** – View all bookings, filter by shop/status, force cancel
- **Trust Monitoring** – View & reset customer trust scores
- **Live Stats** – Total shops, bookings, active locations

---

## ⭐ Trust Score System

| Event | Score Change |
|-------|-------------|
| Pickup (completed) | +1 |
| No-show (auto-cancelled) | -2 |
| Default score | 5 |

---

## ⏳ Auto-Cancel

Bookings auto-cancel after **45 minutes** if status remains `pending`.
The system checks every **60 seconds**.

---

## 🔧 OTP Integration

In `/routes/otp.js`, add your OTP provider:

```javascript
// Fast2SMS example:
await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${OTP_KEY}&route=otp&variables_values=${otp}&numbers=${phone}`);

// MSG91 example:
// Use their SDK
```

---

## 🔒 Security

- JWT tokens for sellers (7-day expiry)
- Admin tokens (1-day expiry, session-based)
- Rate limiting: 100 requests / 15 min per IP
- bcrypt password hashing
- OTP expires in 5 minutes
- Input validation on all routes

---

## 📱 Mobile-First Design

All 3 panels are fully responsive and optimized for mobile.

---

## 🆘 Troubleshooting

**MongoDB not connecting?**
- Check `MONGO_URI` in `.env`
- For local: `mongodb://localhost:27017/smart_kirana`

**Admin login fails?**
- Default: `admin` / `admin123`
- Check `ADMIN_PASSWORD` in `.env`

**OTP not working?**
- In dev mode, OTP is shown on screen
- Add your OTP API key in `.env`
