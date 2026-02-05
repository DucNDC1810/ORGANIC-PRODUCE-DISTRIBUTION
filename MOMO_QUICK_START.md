# 🚀 MoMo Integration - Quick Start Guide

## ⚡ 5 Minutes Setup

### 1. Backend Ready ✅
- MoMo service, controller, routes đã tạo
- .env đã cấu hình với sandbox credentials
- Routes đã thêm vào app.ts

**Verify:**
```bash
cd BE
npm run dev
# Check console: Server should run without errors
```

---

### 2. Frontend Ready ✅
- MoMo service created
- CheckoutPage updated
- PaymentResultPage created  
- Routes configured

**Verify:**
```bash
cd FE
npm run dev
# Check console: No TypeScript errors
```

---

## 🧪 Test Payment (Sandbox)

### Step 1: Add Product to Cart
1. Open http://localhost:5173
2. Login with test account
3. Find any product
4. Click "Add to Cart"

### Step 2: Checkout
1. Click "Cart" or mini cart icon
2. Click "Checkout"
3. Fill in info:
   - **Name:** Any name
   - **Phone:** Any phone
   - **Email:** Any email
4. Select **"Momo"** payment method
5. Click **"Đặt hàng"**

### Step 3: MoMo Payment
You'll be redirected to MoMo page. Enter:
- **Phone:** 0987654321 (or any number)
- **Password:** 123456
- Click "Xác nhận"

### Step 4: Payment Result
After payment, you'll see:
- ✅ Success message
- Order details
- Order ID & Payment ID
- Buttons to go home or view orders

---

## 🔍 Verify Payment in Database

### Check Order Created
```bash
# Login to MongoDB
# Find order with status "confirmed"
db.orders.findOne({status: "confirmed", paymentMethod: "momo"})
```

### Check Payment Created
```bash
# Find payment with status "paid"
db.payments.findOne({paymentStatus: "paid", paymentMethod: "momo"})
```

---

## 🐛 Quick Troubleshooting

### "Không thể khởi tạo thanh toán MoMo"
**Solution:**
- Check backend logs
- Verify .env has MoMo credentials
- Check network in DevTools

### "Không tìm thấy đơn hàng đang chờ xử lý"
**Solution:**
- Don't clear localStorage during payment
- Check browser's Application tab
- Try again from beginning

### Stuck at "Đang xử lý thanh toán"
**Solution:**
- Click "Làm mới" button
- Or wait a few seconds for callback
- Check backend logs for callback errors

---

## 📂 Key Files

```
BE/
├── src/
│   ├── services/momo.service.ts
│   ├── controllers/momo.controller.ts
│   ├── routes/momo.routes.ts
│   ├── app.ts (updated)
│   └── .env (updated)
└── MOMO_SETUP_GUIDE.md

FE/
├── src/
│   ├── services/momoService.ts
│   ├── pages/Checkout/
│   │   ├── CheckoutPage.tsx (updated)
│   │   └── PaymentResultPage.tsx
│   └── App.tsx (updated)
└── MOMO_INTEGRATION_GUIDE.md
```

---

## 💡 Tips

### For Development
- Use **test-callback** endpoint to test without MoMo UI:
  ```bash
  curl -X POST http://localhost:5000/api/momo/test-callback \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"momoOrderId": "..."}'
  ```

### Check Logs
- **Frontend:** Open DevTools (F12) → Console
- **Backend:** Watch terminal where you ran `npm run dev`

### localStorage Data
- **Before payment:** `localStorage.getItem('pendingMoMoOrder')`
- **After success:** Data automatically cleared
- **On error:** Check what's in localStorage

---

## 📊 Test Account Credentials

```
Phone: 0987654321
Password: 123456
Amount: 10,000 - 50,000,000 VND
```

---

## ✅ What's Working

- ✅ Create payment link
- ✅ Redirect to MoMo
- ✅ Handle callback
- ✅ Verify signature
- ✅ Update order & payment status
- ✅ Display success/error page
- ✅ localStorage management
- ✅ Error handling

---

## ❓ Questions?

See detailed guides:
- **Backend:** `BE/MOMO_SETUP_GUIDE.md`
- **Frontend:** `FE/MOMO_INTEGRATION_GUIDE.md`
- **Complete:** `MOMO_INTEGRATION_COMPLETE.md`

---

## 🎯 Ready to Test?

1. Start backend: `npm run dev` in `BE/`
2. Start frontend: `npm run dev` in `FE/`
3. Open http://localhost:5173
4. Login → Add product → Checkout → Select MoMo → Pay
5. Check success page!

**Enjoy! 🎉**
