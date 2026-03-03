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
  ArrowRight,
  Loader,
  AlertCircle,
  User,
  Navigation2,
  Store,
  Repeat
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';
import zalopayService from "../../services/zaloPayService";
import { orderService } from "../../services/orderService";
import momoService from "../../services/momoService";
import subscriptionService from "../../services/subscriptionService";

const CONFETTI_COLORS = [
  '#22c55e', '#16a34a', '#4ade80', '#86efac',
  '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa', '#f472b6',
];

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

function getDeliveryScheduleLabel(config: any): string {
  if (!config) return '';
  if (config.frequency === 'weekly')
    return `Hàng tuần vào ${WEEKDAYS[config.deliveryDay] ?? ''}`;
  if (config.frequency === 'bi-weekly')
    return `Mỗi 2 tuần vào ${WEEKDAYS[config.deliveryDay] ?? ''}`;
  if (config.frequency === 'monthly')
    return `Hàng tháng vào ngày ${config.deliveryDay}`;
  return config.frequency ?? '';
}

export default function OrderSuccessPage() {
  const location = useLocation();
  const [orderData, setOrderData] = useState<any>(null);
  const [subscriptionConfig, setSubscriptionConfig] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "verified">("idle");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Generate confetti particles once on mount
  const [confettiPieces] = useState(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.0,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: 2.4 + Math.random() * 1.6,
      rotate: Math.random() > 0.5 ? 360 : -360,
      drift: (Math.random() - 0.5) * 120,
      isCircle: Math.random() > 0.6,
    }))
  );
  
  // Check if coming from ZaloPay return (either from state or localStorage)
  const searchParams = new URLSearchParams(location.search);
  
  // Get orderId from URL params (MoMo) or location state
  const orderIdFromUrl = searchParams.get('orderId');
  const orderId = orderIdFromUrl || location.state?.orderId;
  
  const [paymentType, setPaymentType] = useState<"zalopay" | "momo" | null>(null);
  
  const isZaloPayReturn = !!searchParams.toString() || location.state?.fromZaloPay;
  // Check for MoMo return by checking partnerCode or orderId in URL
  const isMoMoReturn = searchParams.get('partnerCode') === 'MOMO' || !!searchParams.get('orderId') || !!sessionStorage.getItem('pendingMoMoOrder');

  useEffect(() => {
    const verifyAndLoadOrder = async () => {
      try {
        setLoading(true);

        // ── COD: navigated directly from CheckoutPage ──────────────────────
        if (location.state?.paymentMethod === "COD") {
          setPaymentType(null);
          setVerificationStatus("verified");
          const codOrderId = location.state.orderId;

          // Capture subscription config if this was a recurring COD order
          if (location.state.subscriptionConfig) {
            setSubscriptionConfig(location.state.subscriptionConfig);
          }

          // Seed immediately from navigate state so the page renders right away
          const stateDeliveryInfo = location.state.deliveryInfo || null;
          const statePickupLocation = location.state.pickupLocation || null;
          setOrderData({
            orderId: codOrderId,
            amount: location.state.totalAmount,
            paymentMethod: "COD",
            deliveryInfo: stateDeliveryInfo,
            pickupLocation: statePickupLocation,
          });

          // Also fetch full order from DB to confirm and fill any missing fields
          if (codOrderId) {
            try {
              const orderRes = await orderService.getOrderById(codOrderId);
              if (orderRes.data?.data) {
                const order = orderRes.data.data;
                const dbDeliveryInfo = (order as any).deliveryInfo || stateDeliveryInfo;
                // Prefer DB address (contains full province/district/ward text), but fall back to state
                setOrderData({
                  orderId: order._id,
                  amount: order.totalAmount,
                  paymentMethod: "COD",
                  deliveryInfo: dbDeliveryInfo,
                  pickupLocation: (order as any).pickupLocation || statePickupLocation,
                });
              }
            } catch {
              // Non-fatal — already seeded from state above
            }
          }
          setLoading(false);
          return;
        }

        // Check for MoMo payment first
        const pendingMoMoOrder = sessionStorage.getItem("pendingMoMoOrder");
        const momoOrderIdFromUrl = searchParams.get('orderId');
        const momoRequestIdFromUrl = searchParams.get('requestId');
        const partnerCode = searchParams.get('partnerCode');

        // If this is a MoMo return
        if (partnerCode === 'MOMO' || momoOrderIdFromUrl || pendingMoMoOrder) {
          console.log('🔵 Processing MoMo payment...');
          setPaymentType('momo');
          setVerificationStatus("verifying");

          // Try to get data from sessionStorage first
          let resolvedFromSession = false;
          if (pendingMoMoOrder) {
            try {
              const { orderData: data, orderId: savedDbOrderId, momoOrderId: savedMomoOrderId, subscriptionConfig } = JSON.parse(pendingMoMoOrder);
              console.log('✅ Found MoMo order data in sessionStorage');
              // Remove immediately to prevent double-execution (React Strict Mode / double useEffect)
              sessionStorage.removeItem("pendingMoMoOrder");
              resolvedFromSession = true;
              // Fetch fresh delivery info from DB (the actual address filled in by user)
              let mergedData = { ...data };
              const fetchId = savedDbOrderId || momoOrderIdFromUrl;
              if (fetchId) {
                try {
                  const orderRes = await orderService.getOrderById(fetchId);
                  if (orderRes.data?.data) {
                    mergedData = {
                      ...mergedData,
                      deliveryInfo: (orderRes.data.data as any).deliveryInfo || data.deliveryInfo,
                      pickupLocation: (orderRes.data.data as any).pickupLocation || data.pickupLocation,
                    };
                  }
                } catch { /* non-fatal — fall back to cached data */ }
              }
              setOrderData(mergedData);
              // Capture subscription config for UI display
              if (subscriptionConfig) {
                setSubscriptionConfig(subscriptionConfig);
              }
              // Create subscription if this was a recurring order
              if (subscriptionConfig) {
                subscriptionService.createSubscription(subscriptionConfig).catch((err) =>
                  console.warn('Subscription creation failed (MoMo):', err)
                );
              }

              // Query payment status from MoMo
              const queryId = savedMomoOrderId || momoOrderIdFromUrl;
              const requestIdForQuery = momoRequestIdFromUrl || queryId;
              if (queryId) {
                try {
                  const statusResponse = await momoService.queryPayment({
                    momoOrderId: queryId,
                    requestId: requestIdForQuery,
                  });
                  const paymentStatus = (statusResponse as any).data?.paymentStatus || (statusResponse as any).data?.data?.paymentStatus;
                  console.log('📊 MoMo payment status:', paymentStatus);
                  setVerificationStatus("verified");
                } catch (err) {
                  console.warn('Could not verify MoMo payment status:', err);
                  setVerificationStatus("verified");
                }
              } else {
                setVerificationStatus("verified");
              }
            } catch (parseError) {
              console.error('Error parsing pendingMoMoOrder:', parseError);
            }
          }
          
          // If no data from sessionStorage, try to fetch from backend + verify via URL params
          if (!resolvedFromSession && momoOrderIdFromUrl) {
            console.log('⚠️ No data in sessionStorage, fetching order:', momoOrderIdFromUrl);
            try {
              const orderResponse = await orderService.getOrderById(momoOrderIdFromUrl);
              if (orderResponse.data?.data) {
                const order = orderResponse.data.data;
                setOrderData({
                  orderId: order._id,
                  amount: order.totalAmount,
                  deliveryInfo: (order as any).deliveryInfo || null,                  pickupLocation: (order as any).pickupLocation || null,                  notes: order.notes,
                });
                console.log('✅ Fetched order from backend');
              }
            } catch (err) {
              console.error('Error fetching order:', err);
              setError('Không thể tải thông tin đơn hàng');
            }

            // Gọi queryPayment dùng params từ URL (requestId === orderId với MoMo của hệ thống này)
            const requestIdForQuery = momoRequestIdFromUrl || momoOrderIdFromUrl;
            try {
              console.log('🔍 Verifying MoMo payment via URL params...');
              const statusResponse = await momoService.queryPayment({
                momoOrderId: momoOrderIdFromUrl,
                requestId: requestIdForQuery,
              });
              const paymentStatus = (statusResponse as any).data?.paymentStatus || (statusResponse as any).paymentStatus;
              console.log('📊 Payment status from query:', paymentStatus);
              setVerificationStatus("verified");
            } catch (err) {
              console.warn('Could not verify MoMo payment via URL params:', err);
              setVerificationStatus("verified");
            }
          }
          
          setLoading(false);
          return;
        }

        // Get pending order data from localStorage if exists (ZaloPay)
        const pendingOrderData = localStorage.getItem("pendingZaloPayOrder");
        if (pendingOrderData) {
          const { orderData: data, appTransId, subscriptionConfig: zaloSubConfig } = JSON.parse(pendingOrderData);
          // Remove immediately to prevent double-execution (React Strict Mode / double useEffect)
          localStorage.removeItem("pendingZaloPayOrder");
          setOrderData(data);
          // Capture subscription config for UI display
          if (zaloSubConfig) {
            setSubscriptionConfig(zaloSubConfig);
          }
          // Create subscription if this was a recurring order
          if (zaloSubConfig) {
            subscriptionService.createSubscription(zaloSubConfig).catch((err) =>
              console.warn('Subscription creation failed (ZaloPay):', err)
            );
          }
          setPaymentType('zalopay');

          // If coming from ZaloPay return, verify payment status
          if (isZaloPayReturn && appTransId) {
            setVerificationStatus("verifying");
            
            // In dev mode, simulate callback
            if (import.meta.env.DEV) {
              try {
                await zalopayService.testCallback(appTransId);
              } catch (e) {
                console.warn("Test callback failed, continuing:", e);
              }
            }

            // Verify payment status with backend
            try {
              const response = await zalopayService.verifyReturn(data?.orderId || appTransId, appTransId);
              const paymentStatus = (response as any).data?.status;
              if (paymentStatus === "paid") {
                setVerificationStatus("verified");
              }
            } catch (error) {
              console.error("Payment verification error:", error);
            }
          }

        }
        
        setLoading(false);
      } catch (error) {
        console.error("Error loading order data:", error);
        setError('Có lỗi xảy ra khi tải thông tin đơn hàng');
        setLoading(false);
      }
    };

    verifyAndLoadOrder();
  }, [isZaloPayReturn]);

  const isPickup = orderData?.deliveryInfo?.type === 'pickup';

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

      {/* Confetti — shown once page finishes loading */}
      {!loading && !error && orderData && confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="fixed pointer-events-none z-[60]"
          style={{
            left: `${piece.x}%`,
            top: -14,
            width: piece.isCircle ? '9px' : '6px',
            height: piece.isCircle ? '9px' : '13px',
            borderRadius: piece.isCircle ? '50%' : '3px',
            backgroundColor: piece.color,
          }}
          initial={{ y: 0, rotate: 0, opacity: 1, x: 0 }}
          animate={{
            y: '110vh',
            rotate: piece.rotate,
            x: piece.drift,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{
            duration: piece.duration,
            delay: piece.delay,
            ease: 'easeIn',
          }}
        />
      ))}

      {loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center shadow-lg">
            <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Đang tải thông tin đơn hàng...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center shadow-lg max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-gray-800 mb-4">{error}</p>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-all"
            >
              Về trang chủ
              <Home className="w-5 h-5" />
            </Link>
          </div>
        </div>
      )}

      {/* Payment verification overlay */}
      {(isZaloPayReturn || isMoMoReturn) && verificationStatus === "verifying" && !loading && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 text-center shadow-lg">
            <Loader className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg text-gray-600">Đang xác nhận thanh toán {paymentType === 'momo' ? 'MoMo' : 'ZaloPay'}...</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!loading && !error && orderData && (
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
              {isPickup
                ? 'Cảm ơn bạn đã đặt hàng. Đơn hàng của bạn đã sẵn sàng để nhận tại cửa hàng.'
                : 'Cảm ơn bạn đã đặt hàng. Chúng tôi sẽ sớm xử lý và gửi đơn hàng của bạn.'}
            </p>
          </motion.div>

          {/* Order Confirmation Cards */}
          <motion.div variants={itemVariants} className={`grid gap-4 ${subscriptionConfig ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
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

            {/* Estimated Delivery / Pickup Time */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                {isPickup ? <Store className="w-4 h-4" /> : <Package className="w-4 h-4" />}
                {isPickup ? 'Thời Gian Nhận Hàng' : 'Giao Hàng Dự Kiến'}
              </div>
              <div className="text-lg font-semibold text-primary">
                {isPickup ? 'Hôm nay, 8:00 – 20:00' : getEstimatedDeliveryDate()}
              </div>
            </div>

            {/* Subscription delivery schedule card */}
            {subscriptionConfig && (
              <div className="bg-green-50 rounded-xl p-6 shadow-sm border border-green-200 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                  <Repeat className="w-4 h-4" />
                  Chu kỳ giao hàng
                </div>
                <div className="text-base font-semibold text-green-800 leading-snug">
                  {getDeliveryScheduleLabel(subscriptionConfig)}
                </div>
                {subscriptionConfig.nextDeliveryDate && (
                  <div className="text-xs text-green-600 mt-1">
                    Giao lần tiếp: {new Date(subscriptionConfig.nextDeliveryDate).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>
            )}
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
                        {orderData.deliveryInfo.fullName && (
                          <div className="flex items-start gap-3">
                            <User className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-muted-foreground">Tên Người Nhận</div>
                              <div className="text-foreground font-medium">
                                {orderData.deliveryInfo.fullName}
                              </div>
                            </div>
                          </div>
                        )}
                        {orderData.deliveryInfo.phone && (
                          <div className="flex items-start gap-3">
                            <Phone className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-muted-foreground">Số Điện Thoại</div>
                              <div className="text-foreground font-medium">
                                {orderData.deliveryInfo.phone}
                              </div>
                            </div>
                          </div>
                        )}
                        {isPickup ? (
                          <>
                            {orderData.pickupLocation?.name && (
                              <div className="flex items-start gap-3">
                                <Store className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-muted-foreground">Cửa Hàng</div>
                                  <div className="text-foreground font-medium">
                                    {orderData.pickupLocation.name}
                                  </div>
                                </div>
                              </div>
                            )}
                            {orderData.pickupLocation?.address && (
                              <div className="flex items-start gap-3">
                                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                                <div>
                                  <div className="text-muted-foreground">Địa Chỉ Cửa Hàng</div>
                                  <div className="text-foreground font-medium">
                                    {orderData.pickupLocation.address}
                                  </div>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(orderData.pickupLocation.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 mt-2 text-sm font-semibold text-primary hover:underline"
                                  >
                                    <Navigation2 className="w-4 h-4" />
                                    Xem đường đi
                                  </a>
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          orderData.deliveryInfo.address && (
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <div>
                                <div className="text-muted-foreground">Địa Chỉ</div>
                                <div className="text-foreground font-medium">
                                  {orderData.deliveryInfo.address}
                                </div>
                              </div>
                            </div>
                          )
                        )}
                        {orderData.deliveryInfo.email && (
                          <div className="flex items-start gap-3">
                            <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <div className="text-muted-foreground">Email</div>
                              <div className="text-foreground font-medium">
                                {orderData.deliveryInfo.email}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Payment Method */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-foreground">Phương Thức Thanh Toán</h3>
                    <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground font-medium">
                          {orderData?.paymentMethod === "COD"
                            ? "🚚 Tiền mặt khi giao hàng (COD)"
                            : paymentType === "momo"
                              ? "MoMo"
                              : paymentType === "zalopay"
                                ? "ZaloPay"
                                : "Chưa xác định"}
                        </span>
                        <span className={`inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full ${
                          orderData?.paymentMethod === "COD"
                            ? "text-orange-600 bg-orange-100"
                            : "text-primary bg-primary/10"
                        }`}>
                          {orderData?.paymentMethod === "COD" ? "⏳ Thanh toán khi nhận hàng" : "✓ Đã Thanh Toán"}
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
                      <span>{orderData?.amount ? (orderData.amount * (subscriptionConfig ? (1 / 0.95) * 0.9 : 0.9)).toLocaleString('vi-VN') : '0'} ₫</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Phí Vận Chuyển</span>
                      <span className="text-primary font-medium">Miễn Phí</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>VAT (4.76%)</span>
                      <span>{orderData?.amount ? (orderData.amount * 0.048).toLocaleString('vi-VN') : '0'} ₫</span>
                    </div>
                    {subscriptionConfig && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span className="flex items-center gap-1">
                          <Repeat className="w-3 h-3" />
                          Chiết khấu định kỳ (5%)
                        </span>
                        <span>-{orderData?.amount ? (orderData.amount * 0.05).toLocaleString('vi-VN') : '0'} ₫</span>
                      </div>
                    )}
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

          {/* Pickup Counter Instruction */}
          {isPickup && (
            <motion.div variants={itemVariants}>
              <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start gap-3">
                <span className="text-2xl leading-none">🏪</span>
                <div>
                  <p className="text-sm font-semibold text-amber-800 mb-1">Lưu ý khi nhận hàng tại cửa hàng</p>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Vui lòng đưa mã đơn hàng <span className="font-bold text-amber-900">{orderId?.substring(0, 12)}</span> cho nhân viên tại quầy để nhận hàng.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

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
              to="/profile?tab=orders"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-all"
            >
              Xem Lịch Sử Đơn Hàng
              <Package className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>
        )}
      </div>
    </div>
  );
}