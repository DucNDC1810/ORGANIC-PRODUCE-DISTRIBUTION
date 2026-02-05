# ZaloPay Integration Setup Guide

## 📋 Giới Thiệu

Dự án đã tích hợp ZaloPay Sandbox để hỗ trợ thanh toán trực tuyến. Đây là hướng dẫn cấu hình và sử dụng chi tiết.

## ✅ Trạng Thái Hiện Tại

Đã hoàn thành 3 phần chính:

1. **CREATE ORDER** - Tạo đơn hàng thanh toán
2. **CALLBACK** - Nhận xác nhận thanh toán từ ZaloPay
3. **CHECK ORDER STATUS** - Truy vấn trạng thái đơn hàng

## 🔧 Cấu Hình Environment

### 1. File `.env` đã được thiết lập với các biến:

```env
# ZaloPay Configuration (Sandbox)
ZALOPAY_APP_ID=553
ZALOPAY_KEY1=9phuAOYhan4urywHTh0ndEXiV3pKHr5Q
ZALOPAY_KEY2=Iyz2habzyr7AG8SgvoBCbKwKi3UzlLi3
ZALOPAY_BASE_URL=https://sandbox.zalopay.com.vn/v001/tpe
```

### 2. File `.env` nên có thêm:

```env
# API Base URL (để ZaloPay gọi callback)
API_BASE_URL=https://16e7ff83539b.ngrok-free.app

# Frontend URL
CORS_ORIGIN=http://localhost:5173
```

## 📁 Cấu Trúc File

```
BE/
├── src/
│   ├── controllers/
│   │   └── zalopay.controller.ts      # 3 methods chính
│   ├── services/
│   │   └── zalopay.service.ts         # Logic ZaloPay API
│   └── routes/
│       └── zalopay.routes.ts          # Routes: /api/zalopay
├── ZALOPAY_CREATE_ORDER_GUIDE.md      # Hướng dẫn CREATE ORDER
├── ZALOPAY_CALLBACK_GUIDE.md          # Hướng dẫn CALLBACK
├── ZALOPAY_CHECK_ORDER_STATUS_GUIDE.md # Hướng dẫn CHECK STATUS
└── ZALOPAY_INTEGRATION_COMPLETE.md    # Tổng hợp
```

## 🚀 API Endpoints

### 1. Tạo Đơn Hàng

**Endpoint**: `POST /api/zalopay/create-order`

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "orderId": "temp",
  "amount": 50000,
  "description": "Mua rau hữu cơ",
  "items": [
    {
      "itemid": "prod_001",
      "itemname": "Cà chua hữu cơ",
      "itemprice": 25000,
      "itemquantity": 2
    }
  ],
  "deliveryInfo": {
    "address": "123 Nguyễn Hữu Cảnh, Q1, HCM",
    "phone": "0934568239",
    "email": "user@gmail.com"
  }
}
```

**Response**:
```json
{
  "success": true,
  "message": "ZaloPay order created successfully",
  "data": {
    "paymentId": "507f1f77bcf86cd799439011",
    "orderId": "507f1f77bcf86cd799439012",
    "orderUrl": "https://sandbox.zalopay.com.vn/payment/...",
    "apptransid": "260205_123456",
    "amount": 50000
  }
}
```

**Tiếp theo**: Redirect user đến `orderUrl` để thanh toán

---

### 2. Callback Webhook (ZaloPay → Backend)

**Endpoint**: `POST /api/zalopay/callback`

**Authentication**: None (ZaloPay gọi trực tiếp)

**Request Body** (từ ZaloPay):
```json
{
  "data": "{\"appid\":553,\"apptransid\":\"260205_123456\",...}",
  "mac": "hmacsha256_signature"
}
```

**Response**:
```json
{
  "returncode": 1,
  "returnmessage": "success"
}
```

**Quy trình**:
1. ZaloPay gửi callback khi user thanh toán thành công
2. Backend verify MAC signature = HmacSHA256(data, key2)
3. Update Payment status = "paid"
4. Update Order status = "confirmed"
5. Return returncode = 1 để ZaloPay biết callback đã xử lý

---

### 3. Kiểm Tra Trạng Thái Đơn Hàng

**Endpoint**: `POST /api/zalopay/check-order-status`

**Authentication**: Required (Bearer Token)

**Request Body**:
```json
{
  "apptransid": "260205_123456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Order status retrieved",
  "data": {
    "returncode": 1,
    "returnmessage": "success",
    "isprocessing": false,
    "amount": 50000,
    "discountamount": 0,
    "zptransid": 160413000003083,
    "zaloTransId": "160413000003083"
  }
}
```

**Ghi chú**: 
- Dùng này để kiểm tra lại trạng thái nếu không nhận được callback
- Hữu ích khi `isprocessing = true` (đang xử lý)

---

## 🔐 Bảo Mật & MAC Signature

### Công Thức Tính MAC

**CREATE ORDER (key1)**:
```
data = appid|apptransid|appuser|amount|apptime|embeddata|item
mac = HmacSHA256(data, key1).toString()
```

**CALLBACK (key2)**:
```
mac = HmacSHA256(dataStr, key2).toString()
```

**CHECK STATUS (key1)**:
```
data = appid|apptransid|key1
mac = HmacSHA256(data, key1).toString()
```

### Ví Dụ MAC Calculation
```
// Create Order
appid: 553
apptransid: 260205_123456
appuser: user123
amount: 50000
apptime: 1707030000000
embeddata: {"merchantinfo":"organica"}
item: [{"itemid":"knb","itemname":"rau","itemprice":50000,"itemquantity":1}]

data = "553|260205_123456|user123|50000|1707030000000|{\"merchantinfo\":\"organica\"}|[{\"itemid\":\"knb\",\"itemname\":\"rau\",\"itemprice\":50000,\"itemquantity\":1}]"
mac = HmacSHA256(data, "9phuAOYhan4urywHTh0ndEXiV3pKHr5Q")
```

---

## 🧪 Testing (Sandbox)

### Thông Tin Sandbox
- **App ID**: 553
- **Environment**: Sandbox (Testing)
- **API Base URL**: https://sandbox.zalopay.com.vn/v001/tpe

### Test Cards (ZaloPay Sandbox)

```
Thẻ Thành Công:
- Card Number: 4111111111111111
- Expiry: 12/25
- OTP: 123456

Thẻ Thất Bại:
- Card Number: 4012888888881881
- Expiry: 12/25
- OTP: 000000
```

### Test Flow

1. **Tạo đơn hàng**:
   ```bash
   curl -X POST http://localhost:5000/api/zalopay/create-order \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "orderId": "temp",
       "amount": 10000,
       "description": "Test payment",
       "items": [{"itemid": "test", "itemname": "Test", "itemprice": 10000, "itemquantity": 1}],
       "deliveryInfo": {"address": "Test", "phone": "0123456789", "email": "test@test.com"}
     }'
   ```

2. **Lấy orderUrl từ response**

3. **Redirect user đến orderUrl**

4. **User nhập thông tin thẻ test**

5. **ZaloPay callback về `/api/zalopay/callback`**

6. **Backend update Payment & Order status**

---

## 📊 Database Schema

### Payment Collection
```javascript
{
  orderId: ObjectId,
  paymentMethod: "zalopay",
  amount: 50000,
  transactionId: "zptranstoken...",
  metadata: {
    appTransId: "260205_123456",
    zptranstoken: "...",
    provider: "zalopay",
    returncode: 1,
    zaloTransId: 160413000003083  // được thêm sau callback
  },
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "cancelled",
  paymentDate: Date,
  refundedAt: Date,
  refundAmount: 0
}
```

### Order Collection
```javascript
{
  userId: ObjectId,
  paymentMethod: "zalopay",
  items: [...],
  totalAmount: 50000,
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled",
  paymentStatus: "pending" | "paid",
  deliveryInfo: {...}
}
```

---

## 🔄 Quy Trình Thanh Toán Chi Tiết

```
1. USER → CREATE ORDER ENDPOINT
   ↓
2. BACKEND → VALIDATE & CREATE ORDER
   ↓
3. BACKEND → CALL ZALOPAY API
   ↓
4. ZALOPAY → RETURN ORDER_URL
   ↓
5. BACKEND → SAVE PAYMENT (status: pending)
   ↓
6. RETURN ORDER_URL TO FRONTEND
   ↓
7. FRONTEND → REDIRECT USER TO ORDER_URL
   ↓
8. USER → FILL PAYMENT INFO ON ZALOPAY
   ↓
9. ZALOPAY → POST CALLBACK TO /api/zalopay/callback
   ↓
10. BACKEND → VERIFY MAC SIGNATURE
    ↓
11. BACKEND → UPDATE PAYMENT (status: paid)
    ↓
12. BACKEND → UPDATE ORDER (status: confirmed)
    ↓
13. RETURN {returncode: 1} TO ZALOPAY
```

---

## 🛠 Troubleshooting

### 1. "mac not equal"
- **Nguyên nhân**: MAC signature không match
- **Giải pháp**: 
  - Kiểm tra key1/key2 đúng chưa
  - Đảm bảo dữ liệu được stringify chính xác
  - Check format của data string

### 2. "Payment not found"
- **Nguyên nhân**: Callback không tìm thấy payment
- **Giải pháp**:
  - Kiểm tra apptransid được lưu vào metadata chưa
  - Đảm bảo apptransid từ create order được lưu đúng

### 3. "isprocessing = true"
- **Nguyên nhân**: Giao dịch đang được xử lý
- **Giải pháp**:
  - Chờ vài giây rồi check-order-status lại
  - Mặc định chỉ cần tối đa 48 tiếng là kết thúc

### 4. ZaloPay callback không được nhận
- **Nguyên nhân**: API_BASE_URL không đúng
- **Giải pháp**:
  - Sử dụng ngrok để expose localhost: `ngrok http 5000`
  - Update `API_BASE_URL` trong .env
  - Restart server

---

## 📚 File Tham Khảo

- [CREATE ORDER Guide](./ZALOPAY_CREATE_ORDER_GUIDE.md)
- [CALLBACK Guide](./ZALOPAY_CALLBACK_GUIDE.md)
- [CHECK STATUS Guide](./ZALOPAY_CHECK_ORDER_STATUS_GUIDE.md)
- [Integration Summary](./ZALOPAY_INTEGRATION_COMPLETE.md)

---

## 🔗 Tài Liệu Chính Thức

- [ZaloPay Developer Portal](https://docs.zalopay.vn)
- [Sandbox Documentation](https://docs.zalopay.vn/sandbox)
- [Payment Status Codes](https://docs.zalopay.vn/payment-status)

---

## ⚠️ Lưu Ý Quan Trọng

1. **Production Setup**: Cần thay đổi từ Sandbox sang Real environment
2. **Real Keys**: Thay `ZALOPAY_KEY1` và `ZALOPAY_KEY2` bằng key production
3. **HTTPS**: Production bắt buộc phải dùng HTTPS
4. **API_BASE_URL**: Phải là domain thực, không phải ngrok
5. **Timeout**: ZaloPay callback có timeout 15 phút, cần xử lý nhanh

---

## ✨ Hoàn Tất

ZaloPay đã được tích hợp đầy đủ vào dự án. 

**Các bước tiếp theo** (khi cần):
- [ ] Thêm phần REFUND (hoàn tiền)
- [ ] Thêm phần RETRY callback logic
- [ ] Thêm phần Webhook verification chi tiết
- [ ] Setup production environment

Mọi câu hỏi vui lòng tham khảo các file guide hoặc kiểm tra ZaloPay official documentation.
