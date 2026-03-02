import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Plus,
  Minus,
  Trash2,
  Calendar,
  Truck,
  Store as StoreIcon,
  Users,
  Loader,
  X,
  AlertCircle,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import zalopayService from "../../services/zaloPayService";
import momoService from "../../services/momoService";
import voucherService from "../../services/voucherService";
import { orderService } from "../../services/orderService";
import StorePickupModal, { type Store as StoreData } from "../../components/StorePickupModal";
import GroupOrderModal, { type GroupOrderData } from "../../components/GroupOrderModal";
import RecurringDeliveryModal, {
  type RecurringData,
  FREQUENCY_LABELS,
  DAY_LABELS,
  DURATION_LABELS,
} from "../../components/RecurringDeliveryModal";

export default function CheckoutPage() {
  const { cart, getTotalPrice, removeFromCart, updateQuantity } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupOrderData, setGroupOrderData] = useState<GroupOrderData | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringData, setRecurringData] = useState<RecurringData | null>(null);
  const isGroupOrder = groupOrderData !== null;
  const isRecurringOrder = recurringData !== null;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(""), 4000);
    return () => clearTimeout(t);
  }, [error]);

  // Auto-focus first empty / invalid field when error toast appears
  useEffect(() => {
    if (!error) return;
    const textFields: Array<[string, string]> = [
      ["fullName", formData.fullName],
      ["phone",    formData.phone],
      ["email",    formData.email],
    ];
    if (deliveryType === "delivery") {
      textFields.push(["address", formData.address]);
    }
    for (const [name, value] of textFields) {
      if (!value.trim()) {
        document.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.focus();
        return;
      }
    }
    // Location picker: open panel at the first incomplete level
    if (deliveryType === "delivery" && (!selectedProvince || !selectedDistrict || !selectedWard)) {
      setShowLocationPanel(true);
      setLocationTab(!selectedProvince ? "province" : !selectedDistrict ? "district" : "ward");
      setTimeout(() => {
        locationPanelRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
      }, 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<string>("");
  const [voucherError, setVoucherError] = useState(""); // voucher-specific error
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: "",
    paymentMethod: "COD",
    notes: "",
    promoCode: "",
    groupName: "",
    groupMembers: "",
    groupAddress: "",
    groupNotes: "",
    recurringFrequency: "weekly",
    recurringDay: "monday",
    recurringStartDate: "",
    recurringDuration: "3",
  });

  // ---------- Vietnam Province / District / Ward state ----------
  interface ProvinceItem { code: number; name: string; }
  interface DistrictItem { code: number; name: string; }
  interface WardItem    { code: number; name: string; }

  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [wards,     setWards]     = useState<WardItem[]>([]);

  const [selectedProvince, setSelectedProvince] = useState<{ code: number; name: string } | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<{ code: number; name: string } | null>(null);
  const [selectedWard,     setSelectedWard]     = useState<{ code: number; name: string } | null>(null);

  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards,     setLoadingWards]     = useState(false);

  // Tab-based location picker state
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [locationTab, setLocationTab] = useState<"province" | "district" | "ward">("province");
  const locationPanelRef = useRef<HTMLDivElement>(null);

  // Close panel on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (locationPanelRef.current && !locationPanelRef.current.contains(e.target as Node)) {
        setShowLocationPanel(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch all provinces once on mount
  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=1")
      .then((r) => r.json())
      .then((data: ProvinceItem[]) => setProvinces(data))
      .catch(() => setProvinces([]));
  }, []);

  const handleProvinceChange = async (code: number, name: string) => {
    setSelectedProvince({ code, name });
    setSelectedDistrict(null);
    setSelectedWard(null);
    setWards([]);
    setLocationTab("district");
    setLoadingDistricts(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/p/${code}?depth=2`);
      const data = await res.json();
      setDistricts(data.districts ?? []);
    } catch {
      setDistricts([]);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (code: number, name: string) => {
    setSelectedDistrict({ code, name });
    setSelectedWard(null);
    setLocationTab("ward");
    setLoadingWards(true);
    try {
      const res = await fetch(`https://provinces.open-api.vn/api/d/${code}?depth=2`);
      const data = await res.json();
      setWards(data.wards ?? []);
    } catch {
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };

  const handleWardChange = (code: number, name: string) => {
    setSelectedWard({ code, name });
    setShowLocationPanel(false);
  };
  // ----------------------------------------------------------------

  const subtotal = getTotalPrice();
  const shipping = deliveryType === "pickup" ? 0 : 25000; // 25k for delivery
  const recurringDiscount = isRecurringOrder ? subtotal * 0.05 : 0; // 5% discount for recurring
  const vat = (subtotal + shipping - recurringDiscount) * 0.0476; // 4.76% VAT
  const total = subtotal + shipping - recurringDiscount - voucherDiscount + vat;

  const validateForm = (): boolean => {
    if (!formData.fullName.trim()) {
      setError("Please enter your full name");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Please enter your phone number");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Please enter your email");
      return false;
    }
    if (deliveryType === "delivery") {
      if (!formData.address.trim()) {
        setError("Vui lòng nhập địa chỉ cụ thể (số nhà, tên đường)");
        return false;
      }
      if (!selectedProvince) {
        setError("Vui lòng chọn Tỉnh/Thành phố");
        return false;
      }
      if (!selectedDistrict) {
        setError("Vui lòng chọn Quận/Huyện");
        return false;
      }
      if (!selectedWard) {
        setError("Vui lòng chọn Phường/Xã");
        return false;
      }
    }
    if (isGroupOrder && !groupOrderData?.groupName?.trim()) {
      setError("Please enter a group name");
      return false;
    }
    if (isRecurringOrder && !recurringData?.recurringStartDate) {
      setError("Please select a start date for recurring delivery");
      return false;
    }
    setError("");
    return true;
  };

  const applyVoucher = async () => {
    const code = formData.promoCode.trim().toUpperCase();
    // Voucher optional: trống thì không lỗi
    if (!code) {
      setVoucherError("");
      setVoucherDiscount(0);
      setAppliedVoucher("");
      return;
    }

    try {
      setLoading(true);
      setVoucherError("");
      // const response = await voucherService.validateVoucher(
      //   formData.promoCode,
      //   { purchaseAmount: subtotal }
      // );
      const response = await voucherService.validateVoucher(code, {
        purchaseAmount: subtotal,
      });
      setVoucherDiscount(response.data.data.discountValue);
      setAppliedVoucher(code);
      setVoucherError("");
    } catch (err: any) {
      setVoucherError(
        err.response?.data?.message || "Invalid promo code",
      );
      setVoucherDiscount(0);
      setAppliedVoucher("");
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (!user) {
      setError("Please log in to place an order");
      return;
    }

    // ZaloPay: redirect directly without creating order first
    if (formData.paymentMethod === "ZaloPay") {
      setLoading(true);
      try {
        // Gọi API zalopay/init để tạo order + khởi tạo thanh toán ZaloPay
        const orderData = {
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: deliveryType === "delivery" ? "Delivery address" : "Store pickup",
            type: deliveryType,
          },
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
          notes: formData.notes,
          paymentMethod: "zalopay",
          amount: total,
          description: `Order payment from FreshMarket - ${formData.fullName}`,
        };

        const response = await zalopayService.initPayment({
          orderId: "temp", // Sẽ được tạo trên backend
          amount: total,
          description: orderData.description,
          returnUrl: `${window.location.origin}/order-success`,
          notifyUrl: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/zalopay/callback`,
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: deliveryType === "delivery" ? "Delivery address" : "Store pickup",
            type: deliveryType,
          },
        });

        // Response interceptor unwraps response.data, so response is the data object directly
        const zaloPayResponse = response as any;
        console.log('ZaloPay Response:', zaloPayResponse);
        console.log('ZaloPay Response type:', typeof zaloPayResponse);
        console.log('ZaloPay Response keys:', Object.keys(zaloPayResponse));
        console.log('ZaloPay Response.data:', zaloPayResponse.data);
        console.log('ZaloPay Response.success:', zaloPayResponse.success);
        console.log('🔗 Order URL received:', zaloPayResponse.data?.orderUrl);
        console.log('📋 Full response data:', JSON.stringify(zaloPayResponse.data, null, 2));

        // Lấy orderUrl từ response (có thể là orderUrl hoặc checkoutUrl)
        const orderUrl = zaloPayResponse.data?.orderUrl || zaloPayResponse.data?.checkoutUrl;

        if (zaloPayResponse.success && orderUrl) {
          console.log('✅ Redirecting to ZaloPay:', orderUrl);
          console.log('Order ID:', zaloPayResponse.data.orderId);
          console.log('Payment ID:', zaloPayResponse.data.paymentId);
          console.log('AppTransId:', zaloPayResponse.data.apptransid);
          
          // Lưu order data để xử lý khi quay về
          localStorage.setItem(
            "pendingZaloPayOrder",
            JSON.stringify({
              orderData,
              orderId: zaloPayResponse.data.orderId,
              paymentId: zaloPayResponse.data.paymentId,
              apptransid: zaloPayResponse.data.apptransid,
            })
          );

          // ✅ Redirect sang ZaloPay payment page
          window.location.href = orderUrl;
        } else {
          console.error('Invalid ZaloPay response:', zaloPayResponse);
          console.error('Expected orderUrl but got:', orderUrl);
          throw new Error(
            zaloPayResponse.message || "Failed to initialize ZaloPay payment"
          );
        }
      } catch (err: any) {
        console.error("Full ZaloPay error object:", err);
        console.error("Error response:", err.response);
        console.error("Error response data:", err.response?.data);
        console.error("Error message:", err.message);
        
        setError(
          err.response?.data?.message || err.message || "Error initializing ZaloPay payment"
        );
        console.error("ZaloPay init error:", err);
        setLoading(false);
      }
      return; // Stop here, do not proceed with other payment methods
    }

    // MoMo payment
    if (formData.paymentMethod === "Momo") {
      setLoading(true);
      try {
        const orderData = {
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: deliveryType === "delivery" ? "Delivery address" : "Store pickup",
            type: deliveryType,
          },
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
          notes: formData.notes,
          paymentMethod: "momo",
          amount: total,
          description: `Order payment from FreshMarket - ${formData.fullName}`,
        };

        const response = await momoService.createPayment({
          orderId: "temp",
          amount: total,
          description: orderData.description,
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: deliveryType === "delivery" ? "Delivery address" : "Store pickup",
            type: deliveryType,
          },
        });

        const momoResponse = response as any;
        console.log('MoMo Response:', momoResponse);
        console.log('🔗 Pay URL received:', momoResponse.data?.payUrl);

        if (momoResponse.success && momoResponse.data?.payUrl) {
          console.log('✅ Redirecting to MoMo:', momoResponse.data.payUrl);
          console.log('Order ID:', momoResponse.data.orderId);
          console.log('Payment ID:', momoResponse.data.paymentId);
          console.log('MoMo Order ID:', momoResponse.data.momoOrderId);
          
          // Lưu order data để xử lý khi quay về
          sessionStorage.setItem(
            "pendingMoMoOrder",
            JSON.stringify({
              orderData,
              orderId: momoResponse.data.orderId,
              paymentId: momoResponse.data.paymentId,
              momoOrderId: momoResponse.data.momoOrderId,
              requestId: momoResponse.data.requestId,
              fromMoMo: true,
            })
          );

          // ✅ Redirect sang MoMo payment page
          window.location.href = momoResponse.data.payUrl;
        } else {
          console.error('Invalid MoMo response:', momoResponse);
          throw new Error(
            momoResponse.message || "Failed to initialize MoMo payment"
          );
        }
      } catch (err: any) {
        console.error("MoMo error:", err);
        setError(
          err.response?.data?.message || err.message || "Error initializing MoMo payment"
        );
        setLoading(false);
      }
      return;
    }

    // COD payment
    if (formData.paymentMethod === "COD") {
      setLoading(true);
      try {
        const orderPayload = {
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address:
              deliveryType === "delivery" ? "Delivery address" : "Store pickup",
            type: deliveryType,
          },
          items: cart.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
          notes: formData.notes,
          paymentMethod: "cod",
          totalAmount: total,
        };

        const response = await orderService.createOrder(orderPayload as any);
        const result = (response as any)?.data || response;

        if (result?.success !== false) {
          navigate("/order-success", {
            state: {
              orderId: result?.data?._id,
              paymentMethod: "COD",
              totalAmount: total,
            },
          });
        } else {
          throw new Error(result?.message || "Failed to create COD order");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Error placing order. Please try again.",
        );
        setLoading(false);
      }
      return;
    }

    // No valid payment method selected
    setError("Please select a payment method");
    setLoading(false);
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleRemoveItem = async (productId: string) => {
    try {
      await removeFromCart(productId);
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Please log in
          </h2>
          <p className="text-gray-600 mb-6">
            You need to log in to continue placing an order
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Log in now
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Your cart is empty
          </h2>
          <Link
            to="/"
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Continue shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4">Organica</h1>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-4">
            {/* Đăng nhập banner */}
            <div className="bg-white rounded-lg p-4 shadow-sm flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Logged in as: <strong>{user.email}</strong>
              </p>
              <button
                onClick={() => navigate("/profile")}
                className="px-6 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Edit profile
              </button>
            </div>

            {/* Thông tin giao hàng */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Delivery information
              </h2>

              {/* Tabs */}
              <div className="flex gap-2 mb-4 border-b border-gray-200">
                <button
                  onClick={() => setDeliveryType("delivery")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    deliveryType === "delivery"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Home delivery
                </button>
                <button
                  onClick={() => setDeliveryType("pickup")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    deliveryType === "pickup"
                      ? "border-primary text-primary"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <StoreIcon className="w-4 h-4" />
                  Store pickup
                </button>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Full name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />

                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Phone number"
                    className="w-full px-3 py-2.5 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg">
                    🇻🇳
                  </span>
                </div>

                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Email (optional)"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                />

                {deliveryType === "delivery" && (
                  <>
                    {/* Street address */}
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      placeholder="Địa chỉ cụ thể (số nhà, tên đường)"
                      required
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                    />

                    {/* Tab-based location picker */}
                    <div className="relative" ref={locationPanelRef}>
                      {/* Trigger button, shows selected value */}
                      <button
                        type="button"
                        onClick={() => {
                          const open = !showLocationPanel;
                          setShowLocationPanel(open);
                          if (open) {
                            setLocationTab(
                              !selectedProvince ? "province"
                              : !selectedDistrict ? "district"
                              : "ward"
                            );
                          }
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-left bg-white hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      >
                        {selectedWard && selectedDistrict && selectedProvince ? (
                          <span className="text-gray-800">
                            {selectedWard.name}, {selectedDistrict.name}, {selectedProvince.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">Tỉnh/Thành phố, Quận/Huyện, Phường/Xã</span>
                        )}
                      </button>

                      {/* Dropdown panel */}
                      {showLocationPanel && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                          {/* Tab headers */}
                          <div className="flex border-b border-gray-200">
                            {([
                              { key: "province" as const, label: "Tỉnh / TP" },
                              { key: "district" as const, label: "Quận / Huyện" },
                              { key: "ward"     as const, label: "Phường / Xã" },
                            ]).map(({ key, label }) => (
                              <button
                                key={key}
                                type="button"
                                disabled={
                                  (key === "district" && !selectedProvince) ||
                                  (key === "ward"     && !selectedDistrict)
                                }
                                onClick={() => setLocationTab(key)}
                                className={`flex-1 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                                  locationTab === key
                                    ? "border-primary text-primary"
                                    : "border-transparent text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed"
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>

                          {/* List */}
                          <div className="max-h-56 overflow-y-auto py-1">
                            {locationTab === "province" && provinces.map((p) => (
                              <button
                                key={p.code}
                                type="button"
                                onClick={() => handleProvinceChange(p.code, p.name)}
                                className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                  selectedProvince?.code === p.code
                                    ? "text-primary font-medium bg-green-50"
                                    : "text-gray-700"
                                }`}
                              >
                                {p.name}
                              </button>
                            ))}

                            {locationTab === "district" && (
                              loadingDistricts
                                ? <p className="text-center py-6 text-sm text-gray-400">Đang tải...</p>
                                : districts.map((d) => (
                                    <button
                                      key={d.code}
                                      type="button"
                                      onClick={() => handleDistrictChange(d.code, d.name)}
                                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                        selectedDistrict?.code === d.code
                                          ? "text-primary font-medium bg-green-50"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {d.name}
                                    </button>
                                  ))
                            )}

                            {locationTab === "ward" && (
                              loadingWards
                                ? <p className="text-center py-6 text-sm text-gray-400">Đang tải...</p>
                                : wards.map((w) => (
                                    <button
                                      key={w.code}
                                      type="button"
                                      onClick={() => handleWardChange(w.code, w.name)}
                                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                                        selectedWard?.code === w.code
                                          ? "text-primary font-medium bg-green-50"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {w.name}
                                    </button>
                                  ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {deliveryType === "pickup" && (
                  <button
                    type="button"
                    onClick={() => setShowStoreModal(true)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
                      selectedStore
                        ? "border-gray-900 text-gray-900 bg-gray-50 hover:bg-gray-100"
                        : "border-gray-300 text-gray-600 hover:border-primary hover:text-primary"
                    }`}
                  >
                    <StoreIcon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left truncate">
                      {selectedStore ? selectedStore.name : "Chọn cửa hàng"}
                    </span>
                    {selectedStore && (
                      <span className="text-xs text-gray-400 truncate max-w-[160px] text-right">
                        {selectedStore.address}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Đặt theo nhóm — Clickable card */}
            <button
              type="button"
              onClick={() => setShowGroupModal(true)}
              className={`w-full text-left bg-white rounded-lg p-5 shadow-sm border-2 transition-all duration-150 hover:shadow-md ${
                isGroupOrder
                  ? "border-green-400 bg-green-50"
                  : "border-transparent hover:border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isGroupOrder ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    <Users
                      className={`w-4 h-4 ${
                        isGroupOrder ? "text-green-600" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-800">
                        Đặt theo nhóm
                      </h2>
                      {isGroupOrder && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          🎉 Đã thiết lập
                        </span>
                      )}
                    </div>
                    {isGroupOrder && groupOrderData ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Nhóm:</span>{" "}
                          {groupOrderData.groupName}
                          {groupOrderData.groupMembers
                            ? ` · ${groupOrderData.groupMembers} thành viên`
                            : ""}
                        </p>
                        {groupOrderData.groupAddress && (
                          <p className="text-xs text-gray-500">
                            📍 {groupOrderData.groupAddress}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tiết kiệm hơn khi đặt cùng bạn bè &amp; nhận miễn phí ship
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-primary font-medium mt-0.5 flex-shrink-0">
                  {isGroupOrder ? "Chỉnh sửa" : "Thiết lập"} ›
                </span>
              </div>
            </button>

            {/* Đặt hẹn giao định kỳ — Clickable card */}
            <button
              type="button"
              onClick={() => setShowRecurringModal(true)}
              className={`w-full text-left bg-white rounded-lg p-5 shadow-sm border-2 transition-all duration-150 hover:shadow-md ${
                isRecurringOrder
                  ? "border-blue-400 bg-blue-50"
                  : "border-transparent hover:border-gray-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isRecurringOrder ? "bg-blue-100" : "bg-gray-100"
                    }`}
                  >
                    <Calendar
                      className={`w-4 h-4 ${
                        isRecurringOrder ? "text-blue-500" : "text-gray-500"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-semibold text-gray-800">
                        Đặt hẹn giao định kỳ
                      </h2>
                      {isRecurringOrder && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          ⏰ Đã lên lịch
                        </span>
                      )}
                    </div>
                    {isRecurringOrder && recurringData ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-gray-700">
                          {FREQUENCY_LABELS[recurringData.recurringFrequency]} ·{" "}
                          {DAY_LABELS[recurringData.recurringDay]} ·{" "}
                          {DURATION_LABELS[recurringData.recurringDuration]}
                        </p>
                        <p className="text-xs text-gray-500">
                          📅 Bắt đầu:{" "}
                          {new Date(
                            recurringData.recurringStartDate
                          ).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Tiết kiệm 5% mỗi đơn &amp; không cần đặt lại thủ công
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-primary font-medium mt-0.5 flex-shrink-0">
                  {isRecurringOrder ? "Chỉnh sửa" : "Thiết lập"} ›
                </span>
              </div>
            </button>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Payment method
              </h2>

              <div className="space-y-2">
                {[
                  // { value: 'Chuyển khoản', icon: '💳' },
                  // { value: 'Tiền mặt', icon: '💵' },
                  // { value: 'Visa/Master', icon: '💳' },
                  // { value: 'Cần trợ công nợ', icon: '💰' },
                  { value: "ZaloPay", label: "ZaloPay", icon: "💳" },
                  // { value: 'Thanh toán online qua ví MoMo', icon: '🏦' },
                  // { value: 'Ví Trả Sau - MoMo', icon: '💳' },
                  { value: "Momo", label: "MoMo", icon: "🏦" },
                  // { value: 'Chuyển khoản qua QR - BIDV', icon: '📱' },
                  { value: "COD", label: "Cash on Delivery (COD)", icon: "🚚" },
                ].map((method) => (
                  <label
                    key={method.value}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                      formData.paymentMethod === method.value
                        ? "border-primary bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.value}
                      checked={formData.paymentMethod === method.value}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary"
                    />
                    <span className="text-lg">{method.icon}</span>
                    <span className="text-sm text-gray-700">
                      {method.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Hoá đơn điện tử */}
            {/* <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-gray-800">Hoá đơn điện tử</h2>
                <button className="text-sm text-primary hover:underline">
                  Yêu cầu xuất →
                </button>
              </div>
            </div> */}

            {/* Ghi chú đơn hàng */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Order notes
              </h2>

              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Notes..."
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm resize-none"
              />
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg p-5 shadow-sm sticky top-6 space-y-5">
              {/* Giỏ hàng */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Cart
                </h3>

                <div className="space-y-4">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-14 h-14 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <p className="text-xs text-gray-500">{item.name}</p>
                          <button 
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                          <span>Default Title</span>
                          <span>›</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">
                            {item.price.toLocaleString("vi-VN")}₫
                          </p>
                          <div className="flex items-center gap-1 border border-gray-300 rounded">
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Decrease quantity"
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="text-xs font-medium px-2">
                              {item.quantity}
                            </span>
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-50 transition-colors"
                              title="Increase quantity"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">invoice : no</p>
                </div>
              </div>

              {/* Mã khuyến mãi */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  Promo code
                </h3>
                {/*                 
                <button className="w-full flex items-center justify-between p-3 mb-3 border border-gray-300 rounded-lg text-left hover:border-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">🎫</span>
                    <span className="text-sm text-gray-600">Chọn mã</span>
                  </div>
                  <span className="text-gray-400">›</span>
                </button> */}

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      name="promoCode"
                      value={formData.promoCode}
                      onChange={handleInputChange}
                      placeholder="Enter Code"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-sm"
                      disabled={appliedVoucher !== ""}
                    />

                    <button
                      onClick={applyVoucher}
                      disabled={loading || appliedVoucher !== ""}
                      className="px-5 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 transition-colors text-sm whitespace-nowrap flex items-center gap-2"
                    >
                      {loading ? (
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : null}
                      {appliedVoucher ? "Applied" : "Apply"}
                    </button>
                  </div>

                  {voucherError && (
                    <p className="text-xs font-medium text-red-600">
                      {voucherError}
                    </p>
                  )}
                </div>

                {appliedVoucher && (
                  <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-green-700 text-xs">
                    ✓ Code {appliedVoucher} has been applied
                  </div>
                )}
              </div>

              {/* Tóm tắt đơn hàng */}
              <div className="border-t border-gray-200 pt-5">
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Order summary
                </h3>

                <div className="space-y-2.5 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-800">
                      {subtotal.toLocaleString("vi-VN")}₫
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    {isGroupOrder ? (
                      <span className="font-medium text-green-600">
                        Free
                      </span>
                    ) : (
                      <span className="font-medium text-gray-800">-</span>
                    )}
                  </div>
                  {isGroupOrder && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Group discount</span>
                      <span className="font-medium text-green-600">-0₫</span>
                    </div>
                  )}
                  {isRecurringOrder && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">
                        Recurring order discount (5%)
                      </span>
                      <span className="font-medium text-blue-600">
                        -{recurringDiscount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-600">
                        Voucher {appliedVoucher} discount
                      </span>
                      <span className="font-medium text-purple-600">
                        -{voucherDiscount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}
                  <div className="pt-2.5 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-base font-semibold text-gray-800">
                        Total
                      </span>
                      <span className="text-lg font-bold text-gray-800">
                        {total.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 text-right">
                      Price includes VAT {vat.toLocaleString("vi-VN")}₫
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (validateForm()) setShowConfirmModal(true);
                  }}
                  disabled={loading}
                  className="w-full px-5 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                  {loading ? "Processing..." : "Place order"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Order Confirmation Modal — redesigned */}
      {showConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowConfirmModal(false);
          }}
        >
          <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* ── Header ── */}
            <div className="relative bg-gradient-to-r from-green-600 to-emerald-500 px-5 pt-4 pb-3 flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">Xác nhận đơn hàng</h2>
                <p className="text-xs text-green-100">Kiểm tra lại trước khi thanh toán</p>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="ml-auto w-6 h-6 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors flex-shrink-0"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Scrollable body ── */}
            <div className="px-4 py-3 space-y-2 overflow-y-auto" style={{ maxHeight: "50vh" }}>

              {/* 1. Delivery */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {deliveryType === "pickup"
                    ? <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
                    : <Truck className="w-3.5 h-3.5 text-emerald-600" />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {deliveryType === "pickup" ? "Nhận tại cửa hàng" : "Giao tận nơi"}
                  </p>
                  {deliveryType === "pickup" ? (
                    <>
                      <p className="text-xs font-medium text-gray-800 mt-0.5">
                        {selectedStore?.name ?? "Chưa chọn cửa hàng"}
                      </p>
                      {selectedStore?.address && (
                        <p className="text-xs text-gray-400 truncate">{selectedStore.address}</p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-xs font-medium text-gray-800 mt-0.5">
                        {formData.fullName || "—"}{formData.phone ? ` · ${formData.phone}` : ""}
                      </p>
                      {(formData.address || selectedWard || selectedDistrict || selectedProvince) && (
                        <p className="text-xs text-gray-400 mt-0.5 flex items-start gap-1">
                          <span className="flex-shrink-0">📍</span>
                          <span>
                            {[
                              formData.address,
                              selectedWard?.name,
                              selectedDistrict?.name,
                              selectedProvince?.name,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* 2. Optional features */}
              {(groupOrderData || recurringData) && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-1.5">
                  {groupOrderData && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-gray-700 truncate">
                        <span className="font-semibold">Nhóm: </span>
                        {groupOrderData.groupName}
                        {groupOrderData.groupMembers ? ` · ${groupOrderData.groupMembers} TV` : ""}
                      </p>
                    </div>
                  )}
                  {recurringData && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <p className="text-xs text-gray-700 truncate">
                        <span className="font-semibold">Định kỳ: </span>
                        {FREQUENCY_LABELS[recurringData.recurringFrequency]} · {DAY_LABELS[recurringData.recurringDay]} · {new Date(recurringData.recurringStartDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Product list */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Sản phẩm ({cart.length})
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 px-3 py-2">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">x{item.quantity}</p>
                      </div>
                      <span className="text-xs font-semibold text-gray-800 flex-shrink-0">
                        {(item.price * item.quantity).toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Payment + totals combined */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 space-y-1.5">
                  {/* payment row */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <span>
                        {formData.paymentMethod === "ZaloPay" ? "💳" : formData.paymentMethod === "Momo" ? "🏦" : "🚚"}
                      </span>
                      Thanh toán
                    </span>
                    <span className="font-medium text-gray-700">
                      {formData.paymentMethod === "COD" ? "COD" : formData.paymentMethod}
                    </span>
                  </div>

                  {shipping > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Phí ship</span>
                      <span className="text-gray-700">{shipping.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  {recurringData && (
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-600">Giảm định kỳ (5%)</span>
                      <span className="text-emerald-600 font-medium">-{(subtotal * 0.05).toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  {voucherDiscount > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-purple-500">Voucher</span>
                      <span className="text-purple-600 font-medium">-{voucherDiscount.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>VAT (4.76%)</span>
                    <span>{vat.toLocaleString("vi-VN")}₫</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-1.5 flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-800">Tổng cộng</span>
                    <span className="text-base font-bold text-emerald-600">{total.toLocaleString("vi-VN")}₫</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Footer ── */}
            <div className="px-4 pb-5 pt-2.5 space-y-1.5 border-t border-gray-100">
              <button
                onClick={() => { setShowConfirmModal(false); handlePlaceOrder(); }}
                disabled={loading}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-semibold text-sm hover:bg-black disabled:bg-gray-400 transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
                {loading ? "Đang xử lý..." : "Xác nhận & Thanh toán"}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-1.5 text-gray-400 text-xs hover:text-gray-700 transition-colors"
              >
                ← Quay lại chỉnh sửa
              </button>
              <p className="text-center text-xs text-gray-400 leading-relaxed">
                Bằng cách nhấn xác nhận, bạn đồng ý với{" "}
                <span className="underline underline-offset-2 cursor-pointer hover:text-gray-600">điều khoản mua hàng</span>{" "}
                của FreshMarket.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Store Pickup Modal */}
      <StorePickupModal
        isOpen={showStoreModal}
        onClose={() => setShowStoreModal(false)}
        onConfirm={(store) => setSelectedStore(store)}
        selectedStoreId={selectedStore?.id}
      />

      {/* Group Order Modal */}
      <GroupOrderModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onConfirm={(data) => setGroupOrderData(data)}
        initialData={groupOrderData ?? undefined}
      />

      {/* Recurring Delivery Modal */}
      <RecurringDeliveryModal
        isOpen={showRecurringModal}
        onClose={() => setShowRecurringModal(false)}
        onConfirm={(data) => setRecurringData(data)}
        initialData={recurringData ?? undefined}
      />

      {/* Toast notification */}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] transition-all duration-300 ${
          error ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 bg-gray-900 text-white px-4 py-3 rounded-xl shadow-2xl min-w-[280px] max-w-[420px]">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <p className="text-sm font-medium flex-1">{error}</p>
          <button
            onClick={() => setError("")}
            className="ml-1 p-0.5 rounded-md hover:bg-white/10 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
