import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, X, Loader, AlertCircle } from 'lucide-react';
import Header from '../../components/Header';
import zalopayService from '../../services/zaloPayService';

type PaymentStatus = 'loading' | 'success' | 'failed' | 'pending';

export default function PaymentResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        // Check if this is ZaloPay or MoMo payment
        const pendingZaloPayOrder = localStorage.getItem('pendingZaloPayOrder');
        const pendingMoMoOrder = localStorage.getItem('pendingMoMoOrder');

        console.log('🔍 Checking payment status...');
        console.log('  pendingZaloPayOrder:', !!pendingZaloPayOrder);
        console.log('  pendingMoMoOrder:', !!pendingMoMoOrder);
        console.log('  URL params:', Object.fromEntries(searchParams));

        if (pendingZaloPayOrder) {
          // Handle ZaloPay payment result
          const orderData = JSON.parse(pendingZaloPayOrder);
          const apptransid = searchParams.get('apptransid') || orderData.apptransid;

          if (!apptransid) {
            setStatus('failed');
            setError('Không tìm thấy thông tin giao dịch');
            return;
          }

          // Query ZaloPay status
          try {
            const response = await zalopayService.verifyReturn(orderData.orderId, apptransid);
            console.log('ZaloPay verify response:', response);

            if (response.data?.success) {
              setStatus('success');
              setPaymentInfo({
                type: 'ZaloPay',
                orderId: orderData.orderId,
                paymentId: orderData.paymentId,
                amount: orderData.orderData.amount,
                apptransid,
              });

              // Clear localStorage after successful verification
              localStorage.removeItem('pendingZaloPayOrder');
            } else {
              // Payment might still be processing
              setStatus('pending');
              setPaymentInfo({
                type: 'ZaloPay',
                orderId: orderData.orderId,
                amount: orderData.orderData.amount,
              });
            }
          } catch (err: any) {
            console.error('ZaloPay verify error:', err);
            // Still consider as pending since callback might arrive later
            setStatus('pending');
            setPaymentInfo({
              type: 'ZaloPay',
              orderId: orderData.orderId,
              amount: orderData.orderData.amount,
            });
          }
        } else if (pendingMoMoOrder) {
          // Handle MoMo payment result
          const orderData = JSON.parse(pendingMoMoOrder);
          const resultCode = searchParams.get('resultCode');

          console.log('💳 MoMo Payment Processing...');
          console.log('  ResultCode from URL:', resultCode);
          console.log('  Order data:', orderData);

          // resultCode: 0 = success, otherwise = failed
          if (resultCode === '0') {
            setStatus('success');
            setPaymentInfo({
              type: 'MoMo',
              orderId: orderData.orderId,
              paymentId: orderData.paymentId,
              amount: orderData.orderData.amount,
              momoOrderId: orderData.momoOrderId,
            });

            // Clear localStorage after successful payment
            localStorage.removeItem('pendingMoMoOrder');
          } else if (resultCode === null) {
            // Still processing - MoMo hasn't returned yet
            // Verify payment status from backend
            try {
              console.log('⏳ Pending - checking backend status...');
              setStatus('pending');
              setPaymentInfo({
                type: 'MoMo',
                orderId: orderData.orderId,
                amount: orderData.orderData.amount,
                momoOrderId: orderData.momoOrderId,
              });
            } catch (error) {
              console.error('Status check error:', error);
              setStatus('pending');
              setPaymentInfo({
                type: 'MoMo',
                orderId: orderData.orderId,
                amount: orderData.orderData.amount,
                momoOrderId: orderData.momoOrderId,
              });
            }
          } else {
            setStatus('failed');
            setError(`Thanh toán MoMo thất bại. Mã lỗi: ${resultCode}`);
          }
        } else {
          // No pending order found in localStorage
          // Check if we have URL params from payment gateway
          const resultCode = searchParams.get('resultCode');
          const transId = searchParams.get('transId');
          const momoOrderId = searchParams.get('orderId');

          console.log('⚠️ No pending order in localStorage');
          console.log('  resultCode:', resultCode);
          console.log('  transId:', transId);
          console.log('  momoOrderId:', momoOrderId);

          if (resultCode !== null || transId !== null || momoOrderId !== null) {
            // We have URL params, likely from MoMo callback
            console.log('�3️⃣ Detected MoMo callback params, waiting for backend callback...');
            setStatus('pending');
            setPaymentInfo({
              type: 'MoMo',
              momoOrderId,
              resultCode,
              transId,
            });
            setError('Đang chờ xác nhận thanh toán từ hệ thống...');
          } else {
            setStatus('failed');
            setError('Không tìm thấy thông tin đơn hàng thanh toán. Vui lòng thử lại hoặc quay lại trang thanh toán.');
          }
        }
      } catch (err: any) {
        console.error('Payment status check error:', err);
        setStatus('failed');
        setError(err.message || 'Có lỗi xảy ra khi kiểm tra trạng thái thanh toán');
      }
    };

    // Đợi một chút để đảm bảo localStorage đã được cập nhật
    const timer = setTimeout(() => {
      checkPaymentStatus();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchParams]);

  // Show helpful hint if still loading after 5 seconds
  useEffect(() => {
    if (status === 'loading') {
      const hintTimer = setTimeout(() => {
        setShowHint(true);
      }, 5000);
      return () => clearTimeout(hintTimer);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-lg mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {status === 'loading' && (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <Loader className="w-12 h-12 animate-spin mx-auto text-primary mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Đang xử lý thanh toán
            </h1>
            <p className="text-gray-600 mb-4">
              Vui lòng chờ, chúng tôi đang kiểm tra trạng thái giao dịch của bạn...
            </p>
            {showHint && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="flex gap-3 items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-blue-800 font-medium text-sm mb-2">Mất quá lâu?</p>
                    <p className="text-blue-700 text-sm mb-3">
                      Nếu trang này không thay đổi, có thể quá trình thanh toán đã hoàn tất. Hãy thử:
                    </p>
                    <ul className="text-blue-700 text-sm space-y-1 list-disc list-inside mb-3">
                      <li>Làm mới trang (F5)</li>
                      <li>Quay lại trang thanh toán</li>
                      <li>Kiểm tra lịch sử đơn hàng</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500">
              {showHint ? (
                <span>
                  Nếu vấn đề vẫn tiếp tục, vui lòng{' '}
                  <button
                    onClick={() => navigate('/checkout')}
                    className="text-primary underline hover:text-primary-dark"
                  >
                    quay lại checkout
                  </button>
                </span>
              ) : (
                <span>
                  Nếu trang này không thay đổi sau 10 giây, vui lòng:{' '}
                  <button
                    onClick={() => window.location.reload()}
                    className="text-primary underline hover:text-primary-dark"
                  >
                    làm mới trang
                  </button>
                  {' '}hoặc{' '}
                  <button
                    onClick={() => navigate('/checkout')}
                    className="text-primary underline hover:text-primary-dark"
                  >
                    quay lại checkout
                  </button>
                </span>
              )}
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Thanh toán thành công!
            </h1>

            <p className="text-gray-600 mb-6">
              Đơn hàng của bạn đã được xác nhận. Chúng tôi sẽ liên hệ với bạn sớm.
            </p>

            {paymentInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span className="font-medium text-gray-800">
                    {paymentInfo.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium text-gray-800 text-sm break-all">
                    {paymentInfo.orderId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã thanh toán:</span>
                  <span className="font-medium text-gray-800 text-sm break-all">
                    {paymentInfo.paymentId}
                  </span>
                </div>
                {paymentInfo.apptransid && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">App Trans ID:</span>
                    <span className="font-medium text-gray-800 text-sm break-all">
                      {paymentInfo.apptransid}
                    </span>
                  </div>
                )}
                {paymentInfo.momoOrderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">MoMo Order ID:</span>
                    <span className="font-medium text-gray-800 text-sm break-all">
                      {paymentInfo.momoOrderId}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600 font-medium">Tổng tiền:</span>
                  <span className="font-bold text-gray-800">
                    {paymentInfo.amount.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Quay về trang chủ
              </button>
              <button
                onClick={() => navigate('/customer/orders')}
                className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Xem đơn hàng của tôi
              </button>
            </div>
          </div>
        )}

        {status === 'pending' && (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Đang xử lý thanh toán
            </h1>

            <p className="text-gray-600 mb-6">
              Thanh toán của bạn đang được xử lý. Vui lòng không tắt trang này.
            </p>

            {paymentInfo && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left space-y-3 border border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phương thức thanh toán:</span>
                  <span className="font-medium text-gray-800">
                    {paymentInfo.type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-medium text-gray-800 text-sm break-all">
                    {paymentInfo.orderId}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="text-gray-600 font-medium">Tổng tiền:</span>
                  <span className="font-bold text-gray-800">
                    {paymentInfo.amount.toLocaleString('vi-VN')}₫
                  </span>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 mb-4">
              Hệ thống sẽ tự động cập nhật trạng thái khi thanh toán hoàn tất.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Làm mới
            </button>
          </div>
        )}

        {status === 'failed' && (
          <div className="bg-white rounded-lg p-8 shadow-sm text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <X className="w-8 h-8 text-red-600" />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Thanh toán thất bại
            </h1>

            <p className="text-gray-600 mb-2">
              {error || 'Có lỗi xảy ra trong quá trình thanh toán'}
            </p>

            <p className="text-sm text-gray-500 mb-6">
              Vui lòng thử lại hoặc liên hệ với bộ phận hỗ trợ nếu vấn đề vẫn tiếp tục.
            </p>

            <div className="space-y-3">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
              >
                Quay lại trang thanh toán
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full px-4 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              >
                Quay về trang chủ
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              Nếu bạn cần hỗ trợ, vui lòng liên hệ: support@organica.vn
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
