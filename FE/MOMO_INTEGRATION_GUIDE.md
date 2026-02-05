# MoMo Frontend Integration Guide

## Tổng Quan
Đã tích hợp MoMo payment vào frontend bên cạnh ZaloPay. User có thể chọn MoMo hoặc ZaloPay tại trang Checkout.

## Các File Đã Tạo/Sửa

### 1. **Service** - `src/services/momoService.ts` ✅
- `createPayment()` - Tạo link thanh toán MoMo
- `queryPayment()` - Truy vấn trạng thái giao dịch
- `testCallback()` - Test callback (for development)

**Imports:**
```typescript
import momoService from '../../services/momoService';
```

### 2. **Checkout Page** - `src/pages/Checkout/CheckoutPage.tsx` ✅
**Thay đổi:**
- Thêm import: `import momoService from '../../services/momoService';`
- Thêm "MoMo" vào danh sách payment methods (cùng ZaloPay)
- Sửa `handlePlaceOrder()` để xử lý cả ZaloPay và MoMo

**Payment Methods:**
```tsx
{ value: "ZaloPay", icon: "💳" },
{ value: "Momo", icon: "🏦" },
```

### 3. **Payment Result Page** - `src/pages/Checkout/PaymentResultPage.tsx` ✅ (NEW)
Xử lý kết quả thanh toán từ cả ZaloPay và MoMo
- Tự động nhận diện payment provider từ localStorage
- Hiển thị trạng thái: loading, success, pending, failed
- Cập nhật order status khi thanh toán thành công

### 4. **App Router** - `src/App.tsx` ✅
- Thêm route: `/payment-result` → `PaymentResultPage`

## Payment Flow

### 1. **User Checkout**
```
User chọn MoMo trên CheckoutPage
↓
Click "Đặt hàng"
↓
handlePlaceOrder() được gọi
```

### 2. **Backend Init Payment**
```
POST /api/momo/create-payment
Body: {
  orderId: "temp",
  amount: 10000,
  description: "...",
  deliveryInfo: {...}
}
↓
Response: {
  success: true,
  data: {
    payUrl: "https://test-payment.momo.vn/...",
    momoOrderId: "timestamp_random",
    requestId: "...",
    ...
  }
}
```

### 3. **Redirect to MoMo**
```
window.location.href = momoResponse.data.payUrl
↓
User nhập số điện thoại + mật khẩu MoMo
↓
MoMo xử lý thanh toán
```

### 4. **MoMo Callback (Backend)**
```
MoMo POST callback tới /api/momo/callback
↓
Backend verify signature
↓
Update Payment status = 'paid'
↓
Update Order status = 'confirmed'
```

### 5. **Return to App**
```
MoMo redirect tới returnUrl (redirectUrl)
↓
App lưu pendingMoMoOrder vào localStorage
↓
PaymentResultPage kiểm tra trạng thái
↓
Hiển thị success/pending/failed
```

## Testing Steps

### Prerequisites
- Backend chạy ở `http://localhost:5000`
- Frontend chạy ở `http://localhost:5173`
- Đăng nhập với tài khoản test

### 1. Add Product to Cart
- Chọn sản phẩm
- Click "Add to Cart"
- Số lượng ≥ 1

### 2. Go to Checkout
- Click "Checkout" từ mini cart
- Điền thông tin giao hàng
- Chọn **MoMo** làm phương thức thanh toán

### 3. Confirm Order
- Click "Đặt hàng"
- Sẽ redirect tới MoMo payment page

### 4. Payment on MoMo
- **Phone Number (Sandbox):** 0987654321 (hoặc bất kỳ số nào)
- **Password:** 123456
- Click "Confirm"

### 5. Return to App
- MoMo redirect về `/payment-result?resultCode=0` (success)
- App hiển thị success page
- localStorage được clear

### 6. Verify Payment (Optional)
```bash
curl http://localhost:5000/api/payments \
  -H "Authorization: Bearer YOUR_JWT"
```

Tìm payment với `paymentMethod: 'momo'` và `paymentStatus: 'paid'`

## Development Testing

### Using Test Callback API (No MoMo Redirect)
Nếu không muốn redirect tới MoMo, có thể test callback:

```typescript
// 1. Create payment
const response = await momoService.createPayment({...});
const momoOrderId = response.data.momoOrderId;

// 2. Simulate callback
await momoService.testCallback(momoOrderId);

// 3. Check result in PaymentResultPage
```

### Debugging

**localStorage keys:**
```javascript
// After clicking "Đặt hàng"
localStorage.getItem('pendingMoMoOrder')
// Returns: {orderId, paymentId, momoOrderId, requestId, orderData}

// After successful payment (auto-cleared)
localStorage.getItem('pendingMoMoOrder') // null
```

**Console logs:**
- MoMo Response: `console.log('MoMo Response:', momoResponse)`
- Payment Status: Check browser console for status updates

## Sandbox Credentials

```
Partner Code: MOMOOJOI20210410
Access Key: obF3bMIIukZFu79k
Secret Key: CfDJ87kLw5okDlVnUMnridvQmftureKc
Endpoint: https://test-payment.momo.vn/v3/gateway
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Không thể khởi tạo thanh toán MoMo" | Backend API error | Check backend logs, verify .env config |
| "Không tìm thấy đơn hàng đang chờ xử lý" | localStorage cleared | Don't clear localStorage during payment |
| "MoMo thanh toán thất bại" | User cancelled payment | Can retry from checkout |
| Redirect loop | returnUrl misconfigured | Check FE_BASE_URL in .env |

### Debug Checklist
- [ ] Backend running: `npm run dev` in BE folder
- [ ] Frontend running: `npm run dev` in FE folder
- [ ] .env variables set correctly
- [ ] User logged in
- [ ] Cart has items
- [ ] CORS configured properly
- [ ] localStorage not blocked by browser

## Mobile/App Integration

### For Deeplink (App Users)
MoMo provides `deeplink` and `deeplinkWebInApp` in response:

```typescript
// Instead of payUrl, use:
window.location.href = momoResponse.data.deeplink; // For app
// Or:
window.location.href = momoResponse.data.deeplinkWebInApp; // For in-app browser
```

Current implementation uses `payUrl` for web browser.

## Payment Status Polling

If callback doesn't arrive (network issue), client can query status:

```typescript
// In PaymentResultPage or any component
await momoService.queryPayment({
  momoOrderId: "...",
  requestId: "..."
});
```

## Next Steps

1. **Production Setup**
   - Get production MoMo credentials
   - Update MOMO_ENDPOINT to production URL
   - Test with real payments

2. **Email Notifications**
   - Send order confirmation email after payment success
   - Send payment receipt email

3. **Analytics**
   - Track payment methods usage
   - Monitor conversion rates
   - Track payment errors

4. **Security**
   - Verify callback signature on frontend (optional)
   - Implement webhook retry logic
   - Add rate limiting to payment endpoints

5. **UI/UX**
   - Add QR code display option (if momoResponse.qrCodeUrl)
   - Improve error messages
   - Add payment method comparison

## File Structure

```
FE/
├── src/
│   ├── services/
│   │   └── momoService.ts ✅
│   ├── pages/
│   │   └── Checkout/
│   │       ├── CheckoutPage.tsx ✅ (modified)
│   │       ├── OrderSuccessPage.tsx
│   │       └── PaymentResultPage.tsx ✅ (new)
│   └── App.tsx ✅ (modified)
```

## Integration Checklist
- [x] MoMo Service created
- [x] CheckoutPage updated (import + payment method + handler)
- [x] PaymentResultPage created
- [x] App.tsx routes updated
- [ ] Frontend testing on actual sandbox
- [ ] Payment callback verification working
- [ ] Error handling tested
- [ ] Mobile responsiveness checked
- [ ] Analytics integration (optional)

## Support

For issues:
1. Check browser console for errors
2. Check backend server logs
3. Verify .env configuration
4. Check localStorage for pending payment data
5. Contact MoMo support if API returns errors

Reference: [MoMo Developers Portal](https://developers.momo.vn/)
