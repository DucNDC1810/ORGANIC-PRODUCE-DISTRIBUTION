import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import zalopayService from "../../services/zaloPayService";
import { Loader, CheckCircle, AlertCircle } from "lucide-react";
import Header from "../../components/Header";

export default function ZaloPayReturnPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "pending" | "failed">(
    "loading"
  );
  const [message, setMessage] = useState("");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get pending order data from localStorage
        const pendingOrderData = localStorage.getItem("pendingZaloPayOrder");
        if (!pendingOrderData) {
          setStatus("failed");
          setMessage("Không tìm thấy thông tin đơn hàng. Vui lòng thử lại.");
          return;
        }

        const { orderData, appTransId } = JSON.parse(pendingOrderData);
        const orderId = orderData?.items?.[0]?.productId || appTransId;
        setOrderId(orderId);

        console.log("Verifying payment for order:", orderId, "appTransId:", appTransId);

        // In development/sandbox, simulate successful payment
        if (import.meta.env.DEV) {
          console.log("🧪 Development mode: Simulating successful payment callback");
          try {
            await zalopayService.testCallback(appTransId);
            console.log("✅ Test callback completed");
          } catch (testError) {
            console.warn("Test callback failed, continuing with normal verification:", testError);
          }
        }

        // Call verify-return endpoint to check and update payment status
        const response = await zalopayService.verifyReturn(orderId, appTransId);
        console.log("Verify return response:", response);

        const paymentStatus = (response as any).data?.status;

        if (paymentStatus === "paid") {
          setStatus("success");
          setMessage("Thanh toán thành công! Đơn hàng của bạn đã được xác nhận.");
          
          // Clear pending order from localStorage
          localStorage.removeItem("pendingZaloPayOrder");
          
          // Redirect to success page after 2 seconds
          setTimeout(() => {
            navigate("/order-success", { state: { orderId } });
          }, 2000);
        } else if (paymentStatus === "pending") {
          setStatus("pending");
          setMessage("Đơn hàng của bạn đang chờ xác nhận. Vui lòng chờ...");
          
          // Retry after 3 seconds
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        } else {
          setStatus("failed");
          setMessage("Thanh toán thất bại. Vui lòng thử lại.");
        }
      } catch (error: any) {
        console.error("Payment verification error:", error);
        setStatus("failed");
        setMessage(
          error.response?.data?.message || 
          error.message || 
          "Lỗi khi xác nhận thanh toán. Vui lòng thử lại."
        );
      }
    };

    verifyPayment();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 text-primary animate-spin" />
              <p className="text-gray-600 text-lg">Đang xác nhận thanh toán...</p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h2 className="text-2xl font-bold text-gray-800">Thanh Toán Thành Công</h2>
              <p className="text-gray-600">Đơn hàng của bạn đã được xác nhận.</p>
              {orderId && (
                <p className="text-sm text-gray-500">
                  Mã đơn hàng: <strong>{orderId}</strong>
                </p>
              )}
              <p className="text-sm text-gray-500">
                Bạn sẽ được chuyển hướng đến trang xác nhận đơn hàng...
              </p>
            </div>
          )}

          {status === "pending" && (
            <div className="flex flex-col items-center gap-4">
              <Loader className="w-12 h-12 text-yellow-500 animate-spin" />
              <h2 className="text-2xl font-bold text-gray-800">Đơn Hàng Đang Chờ Xác Nhận</h2>
              <p className="text-gray-600">Vui lòng chờ...</p>
              <p className="text-sm text-gray-500">Trang sẽ tự động làm mới...</p>
            </div>
          )}

          {status === "failed" && (
            <div className="flex flex-col items-center gap-4">
              <AlertCircle className="w-12 h-12 text-red-500" />
              <h2 className="text-2xl font-bold text-gray-800">Lỗi Thanh Toán</h2>
              <p className="text-gray-600">{message}</p>
              <button
                onClick={() => navigate("/checkout")}
                className="mt-4 px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
              >
                Quay Lại Trang Thanh Toán
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
