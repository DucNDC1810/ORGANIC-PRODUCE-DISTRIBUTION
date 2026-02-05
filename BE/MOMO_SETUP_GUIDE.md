# MoMo Payment Integration Guide

## Tổng Quan
MoMo là ví điện tử lớn nhất Việt Nam. Integration này sử dụng MoMo Sandbox environment cho testing.

## Thông Số Configuration

### Environment Variables (đã cấu hình trong .env)
```env
MOMO_PARTNER_CODE=MOMOOJOI20210410
MOMO_ACCESS_KEY=obF3bMIIukZFu79k
MOMO_SECRET_KEY=CfDJ87kLw5okDlVnUMnridvQmftureKc
MOMO_ENDPOINT=https://test-payment.momo.vn/v3/gateway
FE_BASE_URL=http://localhost:5173  # Frontend return URL
API_BASE_URL=https://16e7ff83539b.ngrok-free.app  # Callback URL
```

## API Endpoints

### 1. Tạo Link Thanh Toán
**POST** `/api/momo/create-payment`

**Request Body:**
```json
{
  "orderId": "string hoặc 'temp'",
  "amount": 10000,
  "description": "Thanh toán đơn hàng",
  "deliveryInfo": {
    "address": "123 Đường ABC",
    "phone": "0987654321",
    "name": "Tên người nhận"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "MoMo payment link created successfully",
  "data": {
    "paymentId": "payment_id",
    "orderId": "order_id",
    "payUrl": "https://test-payment.momo.vn/v3/gateway/...",
    "deeplink": "momo://...",
    "deeplinkWebInApp": "momo://...",
    "qrCodeUrl": "...",
    "momoOrderId": "timestamp_random",
    "requestId": "...",
    "amount": 10000
  }
}
```

### 2. Query Payment Status
**POST** `/api/momo/query-payment`

**Request Body:**
```json
{
  "momoOrderId": "timestamp_random",
  "requestId": "requestId_from_response"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment status queried successfully",
  "data": {
    "momoOrderId": "...",
    "orderStatus": "confirmed|pending|failed",
    "paymentStatus": "paid|pending|failed",
    "amount": 10000,
    "momoTransId": "...",
    "resultCode": 0,
    "resultDescription": "..."
  }
}
```

### 3. Test Callback (FOR TESTING ONLY)
**POST** `/api/momo/test-callback`

**Request Body:**
```json
{
  "momoOrderId": "timestamp_random"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Test callback successful - Payment status updated to PAID",
  "data": {
    "paymentId": "payment_id",
    "orderId": "order_id",
    "paymentStatus": "paid",
    "orderStatus": "confirmed"
  }
}
```

### 4. Callback Handler (Webhook)
**POST** `/api/momo/callback`

**MoMo sẽ gửi callback tới endpoint này khi thanh toán thành công/thất bại**

**Callback Parameters:**
- `partnerCode`: Mã partner
- `orderId`: Mã đơn hàng MoMo
- `requestId`: Request ID
- `amount`: Số tiền
- `orderInfo`: Thông tin đơn hàng
- `orderType`: Loại đơn hàng
- `transId`: Transaction ID của MoMo
- `resultCode`: 0 = success, khác = failed
- `responseTime`: Thời gian response
- `message`: Thông báo
- `signature`: Digital signature để verify
- `extraData`: Extra data (base64 encoded)

## Flow Thanh Toán

### 1. **Client gửi yêu cầu thanh toán**
```
POST /api/momo/create-payment
→ Server tạo Payment record với status = 'pending'
→ Gọi MoMo API để tạo link thanh toán
→ Trả về payUrl cho client
```

### 2. **Client redirect đến MoMo**
```
User click "Thanh toán MoMo"
→ Redirect tới payUrl
→ User nhập mật khẩu MoMo (sandbox: 123456)
→ User xác nhận thanh toán
```

### 3. **MoMo gửi callback (Webhook)**
```
MoMo POST tới /api/momo/callback
→ Server verify signature
→ Update Payment status = 'paid'
→ Update Order status = 'confirmed'
→ Return response cho MoMo
```

### 4. **Client nhận kết quả**
```
MoMo redirect tới returnUrl
→ Client có thể query status hoặc chờ callback
```

## Testing Steps

### Sandbox Credentials
- **Số điện thoại test**: 0987654321 (hoặc bất kỳ số nào)
- **Mật khẩu test**: 123456
- **Giới hạn amount**: 50,000 VND - 50,000,000 VND

### 1. Tạo Payment Link
```bash
curl -X POST http://localhost:5000/api/momo/create-payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "temp",
    "amount": 10000,
    "description": "Test order",
    "deliveryInfo": {
      "address": "Test Address",
      "phone": "0987654321",
      "name": "Test User"
    }
  }'
```

### 2. User thanh toán (Manual)
- Copy `payUrl` từ response
- Open link trong browser
- Nhập số điện thoại: 0987654321
- Nhập mật khẩu: 123456
- Xác nhận thanh toán

### 3. Check payment status (Optional)
```bash
curl -X POST http://localhost:5000/api/momo/query-payment \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "momoOrderId": "timestamp_random_from_response",
    "requestId": "requestId_from_response"
  }'
```

### 4. Simulate Callback (FOR TESTING)
```bash
curl -X POST http://localhost:5000/api/momo/test-callback \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "momoOrderId": "timestamp_random_from_response"
  }'
```

## Key Differences vs ZaloPay

| Aspect | MoMo | ZaloPay |
|--------|------|---------|
| Setup | Đơn giản (2 keys) | Phức tạp (3 keys) |
| MAC Signature | accessKey\|amount\|...\|partnerCode\|... | appid\|apptransid\|...\|item |
| Callback Format | JSON simple | JSON with items array |
| Amount Limit | 50K - 50M VND | Flexible |
| User Experience | Direct payment | Embedded/app |
| Market Share | #1 in Vietnam | #2 in Vietnam |

## Troubleshooting

### "Signature verification failed"
- Kiểm tra MOMO_SECRET_KEY có đúng không
- Kiểm tra order của rawSignature
- Check logs để xem expected vs received signature

### "Payment not found"
- Kiểm tra momoOrderId có khớp với database không
- Kiểm tra Payment record tồn tại không

### "MoMo API returns error"
- Kiểm tra MOMO_ENDPOINT có đúng (sandbox vs production)
- Kiểm tra amount valid (50K - 50M VND)
- Kiểm tra callback URL reachable từ MoMo

## Integration Checklist
- [x] Service: `src/services/momo.service.ts`
- [x] Controller: `src/controllers/momo.controller.ts`
- [x] Routes: `src/routes/momo.routes.ts`
- [x] Environment variables configured
- [x] app.ts updated với MoMo routes
- [ ] Frontend integration (create-react-app payment page)
- [ ] Database migration (if needed)
- [ ] Error handling & logging
- [ ] Security: verify signature properly
- [ ] Testing: create integration tests

## Next Steps

1. **Frontend Integration**: Tạo payment page để hiển thị payUrl
2. **Webhook Verification**: Implement ngrok/secure tunnel cho testing callbacks
3. **Production Setup**: Register MoMo merchant account, get production credentials
4. **Error Handling**: Add retry logic, timeout handling
5. **Monitoring**: Add payment analytics, error tracking

## References
- [MoMo API Documentation](https://developers.momo.vn/)
- [Sandbox Testing Guide](https://developers.momo.vn/docs/guides/getting-started-with-the-momo-sandbox)
- [Payment Flow](https://developers.momo.vn/docs/guides/payment-flow)
