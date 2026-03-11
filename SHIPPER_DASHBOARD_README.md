# Shipper Dashboard - Hệ thống quản lý giao hàng

## Tổng quan
Dashboard dành cho shipper để quản lý và giao hàng các đơn hàng trong hệ thống Organic Produce Distribution.

## Tính năng chính

### 1. Dashboard Overview (Tổng quan)
- **Thống kê tổng quan:**
  - Tổng số đơn hàng đã giao
  - Số đơn đang giao
  - Số đơn đã hoàn thành
  - Số đơn giao hôm nay
  - Tổng thu nhập từ phí giao hàng

- **Quick Actions:**
  - Xem đơn hàng có sẵn
  - Xem đơn của tôi
  - Làm mới thống kê

### 2. Available Orders (Đơn hàng có sẵn)
- Hiển thị danh sách đơn hàng sẵn sàng để giao
- **Chức năng:**
  - Tìm kiếm đơn hàng theo tên, số điện thoại, địa chỉ
  - Xem thông tin chi tiết: khách hàng, địa chỉ giao hàng, sản phẩm
  - Nhận đơn hàng (Accept Order)
- **Điều kiện hiển thị:** 
  - Trạng thái: `confirmed` hoặc `processing`
  - Chưa có shipper nhận

### 3. My Deliveries (Đơn của tôi)
- Quản lý các đơn hàng đã nhận
- **Chức năng:**
  - Lọc theo trạng thái: Đang giao, Đã giao, Đã hủy
  - Xem thông tin liên hệ khách hàng (phone, email)
  - Click địa chỉ để mở Google Maps
  - **Cập nhật trạng thái:**
    - ✅ Mark as Delivered (Đánh dấu đã giao)
    - ❌ Cancel Order (Hủy đơn - yêu cầu lý do)

## Flow hoạt động

### Quy trình giao hàng:
```
1. Manager xác nhận đơn hàng (status: confirmed/processing)
   ↓
2. Đơn hàng xuất hiện trong "Available Orders"
   ↓
3. Shipper chọn và nhận đơn hàng
   ↓
4. Đơn hàng chuyển sang trạng thái "shipped" (đang giao)
   ↓
5. Shipper giao hàng và cập nhật:
   - Delivered: Giao thành công
   - Cancelled: Hủy đơn (với lý do)
```

### Auto-updates:
- Khi shipper nhận đơn: Khách hàng nhận notification "Đơn hàng đang giao"
- Khi giao thành công: Khách hàng nhận notification "Đơn hàng đã giao"
- Khi hủy: Khách hàng nhận notification với lý do hủy

## API Endpoints

### Backend (BE)
```
GET    /api/shipper/dashboard              - Lấy thống kê dashboard
GET    /api/shipper/available-orders       - Lấy đơn hàng có sẵn
GET    /api/shipper/my-orders              - Lấy đơn của shipper
POST   /api/shipper/orders/:id/accept      - Nhận đơn hàng
PATCH  /api/shipper/orders/:id/status      - Cập nhật trạng thái
GET    /api/shipper/orders/:id             - Xem chi tiết đơn
```

### Query Parameters:
- `page`: Số trang (mặc định: 1)
- `limit`: Số item mỗi trang (mặc định: 10)
- `search`: Tìm kiếm (cho available-orders)
- `status`: Lọc theo trạng thái (cho my-orders)

## Database Schema Updates

### Order Model - Trường mới:
```typescript
shipperId?: mongoose.Types.ObjectId;      // ID của shipper
shippingAcceptedAt?: Date;                 // Thời gian shipper nhận đơn
```

### Notification Model - Cập nhật:
```typescript
userId?: mongoose.Types.ObjectId;          // Notification cho user cụ thể
type: 'order_update' (thêm mới)           // Loại thông báo cập nhật đơn
```

## Setup & Installation

### Backend:
```bash
cd BE
npm install
npm run dev
```

### Frontend:
```bash
cd FE
npm install
npm run dev
```

## Testing

### 1. Tạo tài khoản shipper:
- Đăng ký tài khoản mới
- Admin cập nhật role thành `shipper`

### 2. Test flow:
```
1. Login với role shipper
2. Truy cập: http://localhost:5173/shipper
3. Kiểm tra dashboard overview
4. Vào "Available Orders" và nhận đơn
5. Vào "My Deliveries" và cập nhật trạng thái
```

## Lưu ý quan trọng

### Permissions:
- Chỉ user với role `shipper` hoặc `admin` có thể truy cập
- Shipper chỉ xem được đơn hàng của mình
- Không thể cập nhật đơn của shipper khác

### Business Rules:
- Chỉ nhận được đơn có status: `confirmed` hoặc `processing`
- Đơn đã có shipper không hiển thị trong Available Orders
- Phải nhập lý do khi hủy đơn
- COD orders tự động chuyển payment status sang `paid` khi delivered

### UI/UX:
- Responsive design cho mobile shipper
- Real-time refresh với nút Refresh
- Loading states cho tất cả actions
- Toast notifications cho feedback
- Color coding theo status

## Troubleshooting

### Lỗi thường gặp:

1. **"Order not found"**
   - Kiểm tra orderId có đúng không
   - Đơn có thể đã bị xóa

2. **"Order already assigned"**
   - Shipper khác đã nhận đơn
   - Refresh lại Available Orders

3. **"You are not assigned to this order"**
   - Đơn thuộc về shipper khác
   - Không có quyền cập nhật

4. **"Invalid status"**
   - Chỉ cho phép: shipped, delivered, cancelled
   - Kiểm tra request payload

## Future Enhancements
- [ ] Real-time notifications với WebSocket
- [ ] Map integration trực tiếp trong dashboard
- [ ] Route optimization cho nhiều đơn
- [ ] Earning reports chi tiết
- [ ] Rating system cho shipper
- [ ] Photo proof of delivery
- [ ] Chat với khách hàng

## Support
Contact: support@organicproduce.com
