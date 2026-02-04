import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  CheckCircle, 
  Package, 
  Home, 
  MapPin, 
  Phone,
  Mail,
  Clock,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';

export default function OrderSuccessPage() {
  const location = useLocation();
  const [orderData, setOrderData] = useState<any>(null);
  const orderId = location.state?.orderId;

  useEffect(() => {
    // Get pending order data from localStorage if exists
    const pendingOrderData = localStorage.getItem("pendingZaloPayOrder");
    if (pendingOrderData) {
      try {
        const { orderData } = JSON.parse(pendingOrderData);
        setOrderData(orderData);
        localStorage.removeItem("pendingZaloPayOrder");
      } catch (error) {
        console.error("Error parsing order data:", error);
      }
    }
  }, []);

  const getEstimatedDeliveryDate = () => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    return deliveryDate.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-transparent">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Success Header */}
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 200,
                damping: 15,
                delay: 0.2,
              }}
              className="inline-flex mb-6"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse" />
                <div className="relative inset-0 w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-16 h-16 text-primary" strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Đơn Hàng Đã Xác Nhận!
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ sớm xử lý và gửi đơn hàng của bạn.
            </p>
          </motion.div>

          {/* Order Confirmation Cards */}
          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-4">
            {/* Order Number */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="text-sm text-muted-foreground mb-2">Mã Đơn Hàng</div>
              <div className="text-2xl font-bold text-primary break-all">
                {orderId?.substring(0, 12) || 'TBD'}
              </div>
            </div>

            {/* Order Date */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                Ngày Đặt Hàng
              </div>
              <div className="text-lg font-semibold text-foreground">
                {new Date().toLocaleDateString('vi-VN')}
              </div>
            </div>

            {/* Estimated Delivery */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Package className="w-4 h-4" />
                Giao Hàng Dự Kiến
              </div>
              <div className="text-lg font-semibold text-primary">
                {getEstimatedDeliveryDate()}
              </div>
            </div>
          </motion.div>

          {/* Main Content Cards */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Order Details */}
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    Chi Tiết Đơn Hàng
                  </h2>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Delivery Info */}
                  {orderData?.deliveryInfo && (
                    <div className="space-y-4 pb-6 border-b border-border">
                      <h3 className="font-semibold text-foreground">Thông Tin Giao Hàng</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-3">
                          <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-muted-foreground">Địa Chỉ</div>
                            <div className="text-foreground font-medium">
                              {orderData.deliveryInfo.address}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-muted-foreground">Số Điện Thoại</div>
                            <div className="text-foreground font-medium">
                              {orderData.deliveryInfo.phone}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <div className="text-muted-foreground">Email</div>
                            <div className="text-foreground font-medium">
                              {orderData.deliveryInfo.email}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Phương Thức Thanh Toán</h3>
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">ZaloPay</span>
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary bg-primary/10 px-3 py-1 rounded-full">
                          ✓ Đã Thanh Toán
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {orderData?.notes && (
                    <div className="pt-4 border-t border-border">
                      <h3 className="font-semibold text-foreground mb-2">Ghi Chú</h3>
                      <p className="text-muted-foreground text-sm italic">
                        {orderData.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Summary Sidebar */}
            <motion.div variants={itemVariants} className="space-y-6">
              {/* Order Summary */}
              <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden sticky top-20">
                <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">Tóm Tắt Đơn Hàng</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Tạm Tính</span>
                      <span>{orderData?.amount ? (orderData.amount * 0.9).toLocaleString('vi-VN') : '0'} ₫</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phí Vận Chuyển</span>
                      <span className="text-primary font-medium">Miễn Phí</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT (4.76%)</span>
                      <span>{orderData?.amount ? (orderData.amount * 0.048).toLocaleString('vi-VN') : '0'} ₫</span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="flex justify-between">
                      <span className="font-semibold text-foreground">Tổng Cộng</span>
                      <span className="text-2xl font-bold text-primary">
                        {orderData?.amount ? orderData.amount.toLocaleString('vi-VN') : '0'} ₫
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                <p className="text-sm text-foreground mb-2">
                  <strong>📧 Xác nhận qua email</strong>
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Chúng tôi đã gửi email xác nhận với chi tiết đơn hàng và thông tin theo dõi.
                </p>
              </div>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
          >
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Tiếp Tục Mua Sắm
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/profile"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-all"
            >
              Xem Lịch Sử Đơn Hàng
              <Home className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}