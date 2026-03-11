import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useGroup } from "../../context/GroupContext";
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
  Search,
} from "lucide-react";
import { useCart } from "../../context/CartContext";
import { useAuth } from "../../context/AuthContext";
import Header from "../../components/Header";
import momoService from "../../services/momoService";
import voucherService from "../../services/voucherService";
import { orderService } from "../../services/orderService";
import walletService from "../../services/walletService";
import subscriptionService from "../../services/subscriptionService";
import StorePickupModal, { type Store as StoreData } from "../../components/StorePickupModal";
import RecurringDeliveryModal, {
  type RecurringData,
  FREQUENCY_LABELS,
  DAY_LABELS,
  DURATION_LABELS,
} from "../../components/RecurringDeliveryModal";

export default function CheckoutPage() {
  const { cart, removeFromCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { groupSession } = useGroup();

  // Buy Now: single item passed directly from ProductDetailPage (does not touch cart)
  const buyNowItem = (location.state as any)?.buyNowItem as {
    id: string; name: string; price: number; image: string; category: string; quantity: number;
  } | undefined;

  // Items selected in CartPage (undefined = all items)
  const selectedItemIds = (location.state as any)?.selectedItemIds as string[] | undefined;
  const checkoutItems = buyNowItem
    ? [{ ...buyNowItem }]
    : selectedItemIds
    ? cart.filter((i) => selectedItemIds.includes(i.id))
    : cart;

  // Local quantity state — isolated from CartContext so minicart is unaffected
  const [localQty, setLocalQty] = useState<Record<string, number>>(() =>
    Object.fromEntries(checkoutItems.map((i) => [i.id, i.quantity]))
  );
  // Sync when checkoutItems first loads (e.g. after cart fetch)
  useEffect(() => {
    setLocalQty(Object.fromEntries(checkoutItems.map((i) => [i.id, i.quantity])));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  const overStock = checkoutItems.some((i) => {
    const q = localQty[i.id] ?? i.quantity;
    const s = (i as any).stock;
    return q < 1 || (s !== undefined && q > s);
  });

  // ── Group checkout detection ─────────────────────────────────────────────
  // Populated when navigating from the Active Group page
  const navGroupData = (location.state as any)?.groupCheckout as {
    groupId: string;
    groupName: string;
    activePct: number;
    discount: number;
    subtotal: number;
    shipping: number;
    total: number;
  } | null | undefined;

  // isGroupOrder = true if we arrived from the group page OR there is an
  // active group session saved in localStorage
  const isGroupOrder = navGroupData != null || groupSession != null;
  const activeGroupId = navGroupData?.groupId ?? groupSession?.groupId ?? null;
  const groupDiscountPct = navGroupData?.activePct ?? 0;
  // ─────────────────────────────────────────────────────────────────────────

  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [recurringData, setRecurringData] = useState<RecurringData | null>(null);
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
      setLocationSearch("");
      setLocationTab(!selectedProvince ? "province" : !selectedDistrict ? "district" : "ward");
      setTimeout(() => locationSearchRef.current?.focus(), 50);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<string>("");
  const [voucherError, setVoucherError] = useState(""); // voucher-specific error
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreData | null>(null);

  // ── Wallet ────────────────────────────────────────────────────────────────
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setWalletLoading(true);
    walletService.getWalletInfo()
      .then((res: any) => setWalletBalance(res?.data?.walletBalance ?? res?.walletBalance ?? 0))
      .catch(() => setWalletBalance(0))
      .finally(() => setWalletLoading(false));
  }, [user]);
  // ─────────────────────────────────────────────────────────────────────────

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    email: user?.email || "",
    address: (user as any)?.street || "",
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
  const [locationSearch, setLocationSearch] = useState("");
  const locationPanelRef = useRef<HTMLDivElement>(null);
  const locationSearchRef = useRef<HTMLInputElement>(null);

  // Normalise Vietnamese diacritics for fuzzy search
  const normalise = (str: string) =>
    str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

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

  // Auto-fill province/district/ward from saved profile address once provinces are loaded
  useEffect(() => {
    if (provinces.length === 0) return;
    const savedProvince = (user as any)?.province as string | undefined;
    if (!savedProvince) return;
    const matchedP = provinces.find((p) => p.name === savedProvince);
    if (!matchedP) return;
    setSelectedProvince({ code: matchedP.code, name: matchedP.name });
    setLoadingDistricts(true);
    fetch(`https://provinces.open-api.vn/api/p/${matchedP.code}?depth=2`)
      .then((r) => r.json())
      .then(async (pData) => {
        const dList: DistrictItem[] = pData.districts ?? [];
        setDistricts(dList);
        const savedDistrict = (user as any)?.district as string | undefined;
        if (!savedDistrict) return;
        const matchedD = dList.find((d) => d.name === savedDistrict);
        if (!matchedD) return;
        setSelectedDistrict({ code: matchedD.code, name: matchedD.name });
        setLoadingWards(true);
        try {
          const wRes = await fetch(`https://provinces.open-api.vn/api/d/${matchedD.code}?depth=2`);
          const wData = await wRes.json();
          const wList: WardItem[] = wData.wards ?? [];
          setWards(wList);
          const savedWard = (user as any)?.ward as string | undefined;
          if (!savedWard) return;
          const matchedW = wList.find((w) => w.name === savedWard);
          if (matchedW) setSelectedWard({ code: matchedW.code, name: matchedW.name });
        } finally {
          setLoadingWards(false);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingDistricts(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinces]);

  const handleProvinceChange = async (code: number, name: string) => {
    setSelectedProvince({ code, name });
    setSelectedDistrict(null);
    setSelectedWard(null);
    setWards([]);
    setLocationSearch("");
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
    setLocationSearch("");
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
    setLocationSearch("");
    setShowLocationPanel(false);
  };
  // ----------------------------------------------------------------

  const baseSubtotal = checkoutItems.reduce((sum, i) => sum + i.price * (localQty[i.id] ?? i.quantity), 0);
  // For group orders, honour the subtotal/shipping/discount from the Active Group page
  const subtotal = isGroupOrder && navGroupData ? navGroupData.subtotal : baseSubtotal;
  const shipping = isGroupOrder
    ? (navGroupData?.shipping ?? 25000)
    : deliveryType === "pickup" ? 0 : 25000;
  const groupDiscount = isGroupOrder && navGroupData
    ? navGroupData.discount
    : Math.round(baseSubtotal * groupDiscountPct / 100);
  const recurringDiscount = isRecurringOrder ? subtotal * 0.05 : 0;
  // Group orders use the exact total from Active Group page (no separate VAT)
  const vat = isGroupOrder ? 0 : (subtotal + shipping - recurringDiscount) * 0.0476;
  const total = isGroupOrder && navGroupData
    ? navGroupData.total - recurringDiscount - voucherDiscount
    : subtotal + shipping - groupDiscount - recurringDiscount - voucherDiscount + vat;

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
        setError("Please enter specific address (house number, street name)");
        return false;
      }
      if (!selectedProvince) {
        setError("Please select Province/City");
        return false;
      }
      if (!selectedDistrict) {
        setError("Please select District");
        return false;
      }
      if (!selectedWard) {
        setError("Please select Ward");
        return false;
      }
    }
    if (isGroupOrder && navGroupData && !navGroupData.groupName?.trim()) {
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
      setVoucherDiscount(response.data.discountValue);
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

  // ── Build subscription payload from recurringData (maps frontend → backend) ──
  const buildSubscriptionPayload = () => {
    if (!recurringData) return null;
    const weekdayToNum: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };
    const frequencyMap: Record<string, "weekly" | "bi-weekly" | "monthly"> = {
      weekly: "weekly", biweekly: "bi-weekly", monthly: "monthly",
    };
    const deliveryDay =
      recurringData.recurringFrequency === "monthly"
        ? parseInt(recurringData.recurringDay)
        : weekdayToNum[recurringData.recurringDay] ?? 1;
    // Ưu tiên dùng firstDeliveryDate đã được tính sẵn trong Modal;
    // fallback về recurringStartDate nếu chưa có (tương thích ngược).
    const nextDelivery = recurringData.firstDeliveryDate
      ? new Date(recurringData.firstDeliveryDate)
      : new Date(recurringData.recurringStartDate);

    return {
      frequency: frequencyMap[recurringData.recurringFrequency],
      deliveryDay,
      nextDeliveryDate: nextDelivery.toISOString(),
      items: checkoutItems.map((item) => ({
        productId: item.id,
        quantity: localQty[item.id] ?? item.quantity,
        priceAtSubscription: item.price,
      })),
      discountRate: 0.05,
      paymentMethod: formData.paymentMethod,
      notes: formData.notes || undefined,
    };
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;
    if (!user) {
      setError("Please log in to place an order");
      return;
    }


        // MoMo payment
    if (formData.paymentMethod === "Momo") {
      setLoading(true);
      try {
        const momoBuiltAddress = deliveryType === "delivery"
          ? [formData.address, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name].filter(Boolean).join(', ')
          : (selectedStore ? `${selectedStore.name} - ${selectedStore.address}` : "Store pickup");
        const orderData = {
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: momoBuiltAddress,
            type: deliveryType,
          },
          ...(deliveryType === 'pickup' && selectedStore
            ? { pickupLocation: { name: selectedStore.name, address: selectedStore.address } }
            : {}),
          items: checkoutItems.map((item) => ({
            productId: item.id,
            quantity: localQty[item.id] ?? item.quantity,
            price: item.price,
            subtotal: item.price * (localQty[item.id] ?? item.quantity),
          })),
          notes: formData.notes,
          paymentMethod: "momo",
          amount: total,
          description: `Order payment from FreshMarket - ${formData.fullName}`,
          ...(activeGroupId
            ? { groupId: activeGroupId, isGroupOrder: true, groupDiscount, groupDiscountPct }
            : {}),
        };

        const response = await momoService.createPayment({
          orderId: "temp",
          amount: total,
          description: orderData.description,
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: momoBuiltAddress,
            type: deliveryType,
          },
          items: checkoutItems.map((item) => ({
            productId: item.id,
            quantity: localQty[item.id] ?? item.quantity,
            price: item.price,
            subtotal: item.price * (localQty[item.id] ?? item.quantity),
          })),
          notes: formData.notes || undefined,
          ...(deliveryType === 'pickup' && selectedStore
            ? { pickupLocation: { name: selectedStore.name, address: selectedStore.address } }
            : {}),
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
              subscriptionConfig: isRecurringOrder ? buildSubscriptionPayload() : null,
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
        const codBuiltAddress = deliveryType === "delivery"
          ? [formData.address, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name].filter(Boolean).join(', ')
          : (selectedStore ? `${selectedStore.name} - ${selectedStore.address}` : "Store pickup");
        const orderPayload = {
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: codBuiltAddress,
            type: deliveryType,
          },
          ...(deliveryType === 'pickup' && selectedStore
            ? { pickupLocation: { name: selectedStore.name, address: selectedStore.address } }
            : {}),
          items: checkoutItems.map((item) => ({
            productId: item.id,
            quantity: localQty[item.id] ?? item.quantity,
            price: item.price,
            subtotal: item.price * (localQty[item.id] ?? item.quantity),
          })),
          notes: formData.notes,
          paymentMethod: "cod",
          totalAmount: total,
          ...(activeGroupId
            ? {
                groupId: activeGroupId,
                isGroupOrder: true,
                groupDiscount,
                groupDiscountPct,
              }
            : {}),
        };

        const response = await orderService.createOrder(orderPayload as any);
        const result = (response as any)?.data || response;

        if (result?.success !== false) {
          // Create subscription if recurring order was configured
          if (isRecurringOrder && recurringData) {
            try {
              const subPayload = buildSubscriptionPayload();
              if (subPayload) {
                await subscriptionService.createSubscription(subPayload as any);
              }
            } catch (subErr) {
              // Non-fatal: order was placed successfully, log and continue
              console.warn("Subscription creation failed:", subErr);
            }
          }
          // Snapshot cart items before clearing (for display on success page)
          const cartItemsSnapshot = checkoutItems.map((item) => ({
            productId: { _id: item.id, name: item.name, thumbnail: item.image },
            quantity: localQty[item.id] ?? item.quantity,
            price: item.price,
            subtotal: item.price * (localQty[item.id] ?? item.quantity),
          }));

          // Xoá các sản phẩm đã đặt hàng khỏi giỏ
          if (!buyNowItem) {
            for (const item of checkoutItems) {
              await removeFromCart(item.id);
            }
          }

          navigate("/order-success", {
            state: {
              orderId: result?._id || result?.data?._id,
              paymentMethod: "COD",
              totalAmount: total,
              notes: formData.notes || null,
              isRecurring: isRecurringOrder,
              subscriptionConfig: isRecurringOrder ? buildSubscriptionPayload() : null,
              deliveryType,
              cartItems: cartItemsSnapshot,
              pickupLocation:
                deliveryType === "pickup" && selectedStore
                  ? { name: selectedStore.name, address: selectedStore.address }
                  : null,
              deliveryInfo: {
                fullName: formData.fullName,
                phone: formData.phone,
                email: formData.email,
                address: codBuiltAddress,
                type: deliveryType,
              },
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

    // ── Wallet payment ────────────────────────────────────────────────────
    if (formData.paymentMethod === "Wallet") {
      if (walletBalance < total) {
        setError(
          `Insufficient wallet balance. Current balance: ${walletBalance.toLocaleString("vi-VN")}₫, amount due: ${total.toLocaleString("vi-VN")}₫`
        );
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const walletBuiltAddress =
          deliveryType === "delivery"
            ? [formData.address, selectedWard?.name, selectedDistrict?.name, selectedProvince?.name]
                .filter(Boolean)
                .join(", ")
            : selectedStore
            ? `${selectedStore.name} - ${selectedStore.address}`
            : "Store pickup";

        const response = await walletService.payWithWallet({
          deliveryInfo: {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            address: walletBuiltAddress,
            type: deliveryType,
          },
          ...(deliveryType === "pickup" && selectedStore
            ? { pickupLocation: { name: selectedStore.name, address: selectedStore.address } }
            : {}),
          items: checkoutItems.map((item) => ({
            productId: item.id,
            quantity: localQty[item.id] ?? item.quantity,
            price: item.price,
            subtotal: item.price * (localQty[item.id] ?? item.quantity),
          })),
          totalAmount: total,
          notes: formData.notes || undefined,
          shippingCost: shipping,
          discountAmount: groupDiscount + recurringDiscount + voucherDiscount,
        } as any);

        const result = (response as any)?.data || response;
        const newBalance = result?.walletBalance ?? walletBalance - total;
        setWalletBalance(newBalance);

        // Snapshot cart items before clearing (for display on success page)
        const cartItemsSnapshot = checkoutItems.map((item) => ({
          productId: { _id: item.id, name: item.name, thumbnail: item.image },
          quantity: localQty[item.id] ?? item.quantity,
          price: item.price,
          subtotal: item.price * (localQty[item.id] ?? item.quantity),
        }));

        // Xoá các sản phẩm đã đặt hàng khỏi giỏ
        if (!buyNowItem) {
          for (const item of checkoutItems) {
            await removeFromCart(item.id);
          }
        }

        navigate("/order-success", {
          state: {
            orderId: result?.order?._id,
            paymentMethod: "Wallet",
            walletBalance: newBalance,
            totalAmount: total,
            notes: formData.notes || null,
            deliveryType,
            cartItems: cartItemsSnapshot,
            pickupLocation:
              deliveryType === "pickup" && selectedStore
                ? { name: selectedStore.name, address: selectedStore.address }
                : null,
            deliveryInfo: {
              fullName: formData.fullName,
              phone: formData.phone,
              email: formData.email,
              address: walletBuiltAddress,
              type: deliveryType,
            },
          },
        });
      } catch (err: any) {
        setError(
          err.response?.data?.message || err.message || "Error placing order with wallet."
        );
        setLoading(false);
      }
      return;
    }
    // ── END Wallet payment ────────────────────────────────────────────────

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

  const handleUpdateQuantity = (productId: string, newQuantity: number, stock?: number) => {
    if (newQuantity < 1) return;
    const max = stock ?? 999;
    setLocalQty((prev) => ({ ...prev, [productId]: Math.min(newQuantity, max) }));
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
            to={{
              pathname: '/login',
              search: `?redirect=${encodeURIComponent(location.pathname + location.search)}`
            }}
            state={{ from: location.pathname + location.search }}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
          >
            Log in now
          </Link>
        </div>
      </div>
    );
  }

  if (cart.length === 0 && !buyNowItem) {
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
                      placeholder="Specific address (house number, street name)"
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
                            const tab = !selectedProvince ? "province"
                              : !selectedDistrict ? "district"
                              : "ward";
                            setLocationTab(tab);
                            setLocationSearch("");
                            // auto-focus search after paint
                            setTimeout(() => locationSearchRef.current?.focus(), 50);
                          }
                        }}
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-left bg-white hover:border-primary focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors"
                      >
                        {selectedWard && selectedDistrict && selectedProvince ? (
                          <span className="text-gray-800">
                            {selectedWard.name}, {selectedDistrict.name}, {selectedProvince.name}
                          </span>
                        ) : (
                          <span className="text-gray-400">Province/City, District, Ward</span>
                        )}
                      </button>

                      {/* Dropdown panel */}
                      {showLocationPanel && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                          {/* Tab headers */}
                          <div className="flex border-b border-gray-200">
                            {([
                              { key: "province" as const, label: "Province / City" },
                              { key: "district" as const, label: "District" },
                              { key: "ward"     as const, label: "Ward" },
                            ]).map(({ key, label }) => (
                              <button
                                key={key}
                                type="button"
                                disabled={
                                  (key === "district" && !selectedProvince) ||
                                  (key === "ward"     && !selectedDistrict)
                                }
                                onClick={() => {
                                  setLocationTab(key);
                                  setLocationSearch("");
                                  setTimeout(() => locationSearchRef.current?.focus(), 50);
                                }}
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

                          {/* Search bar */}
                          <div className="px-3 pt-2.5 pb-1.5">
                            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 focus-within:border-primary focus-within:bg-white transition-colors">
                              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                              <input
                                ref={locationSearchRef}
                                type="text"
                                value={locationSearch}
                                onChange={(e) => setLocationSearch(e.target.value)}
                                placeholder={
                                  locationTab === "province"
                                    ? "Tìm kiếm tỉnh/thành phố..."
                                    : locationTab === "district"
                                    ? "Tìm kiếm quận/huyện..."
                                    : "Tìm kiếm phường/xã..."
                                }
                                className="flex-1 text-sm bg-transparent outline-none text-gray-700 placeholder-gray-400"
                              />
                              {locationSearch && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setLocationSearch("");
                                    locationSearchRef.current?.focus();
                                  }}
                                  className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* List */}
                          <div className="max-h-52 overflow-y-auto py-1">
                            {locationTab === "province" && (() => {
                              const filtered = locationSearch
                                ? provinces.filter((p) => normalise(p.name).includes(normalise(locationSearch)))
                                : provinces;
                              return filtered.length > 0
                                ? filtered.map((p) => (
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
                                  ))
                                : <p className="text-center py-6 text-sm text-gray-400">Không tìm thấy địa điểm phù hợp</p>;
                            })()}

                            {locationTab === "district" && (() => {
                              if (loadingDistricts) return <p className="text-center py-6 text-sm text-gray-400">Loading...</p>;
                              const filtered = locationSearch
                                ? districts.filter((d) => normalise(d.name).includes(normalise(locationSearch)))
                                : districts;
                              return filtered.length > 0
                                ? filtered.map((d) => (
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
                                : <p className="text-center py-6 text-sm text-gray-400">Không tìm thấy địa điểm phù hợp</p>;
                            })()}

                            {locationTab === "ward" && (() => {
                              if (loadingWards) return <p className="text-center py-6 text-sm text-gray-400">Loading...</p>;
                              const filtered = locationSearch
                                ? wards.filter((w) => normalise(w.name).includes(normalise(locationSearch)))
                                : wards;
                              return filtered.length > 0
                                ? filtered.map((w) => (
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
                                : <p className="text-center py-6 text-sm text-gray-400">Không tìm thấy địa điểm phù hợp</p>;
                            })()}
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
                      {selectedStore ? selectedStore.name : "Select a store"}
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
              onClick={() =>
                isGroupOrder
                  ? navigate('/group-order/active', {
                      state: {
                        groupId: activeGroupId,
                        groupName: navGroupData?.groupName ?? groupSession?.groupName,
                        cartItems: cart,
                      },
                    })
                  : navigate('/group-order', { state: { cartItems: cart } })
              }
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
                        Group Order
                      </h2>
                      {isGroupOrder && (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                          🎉 Set up
                        </span>
                      )}
                    </div>
                    {isGroupOrder && navGroupData ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs text-gray-700">
                          <span className="font-medium">Group:</span>{" "}
                          {navGroupData.groupName}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Save more when ordering with friends &amp; get free shipping
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-primary font-medium mt-0.5 flex-shrink-0">
                  {isGroupOrder ? "Edit" : "Set up"} ›
                </span>
              </div>
            </button>

            {/* Scheduled Recurring Delivery — Clickable card */}
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
                        Schedule Recurring Delivery
                      </h2>
                      {isRecurringOrder && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                          ⏰ Scheduled
                        </span>
                      )}
                    </div>
                    {isRecurringOrder && recurringData ? (
                      <div className="mt-1 space-y-0.5">
                        <p className="text-xs font-medium text-blue-700">
                          ✅ Set up
                        </p>
                        <p className="text-xs text-blue-600">
                          {FREQUENCY_LABELS[recurringData.recurringFrequency]} ·{" "}
                          {recurringData.recurringFrequency === "monthly"
                            ? `Day ${recurringData.recurringDay} of each month`
                            : DAY_LABELS[recurringData.recurringDay]}{" "}
                          · {DURATION_LABELS[recurringData.recurringDuration]}
                        </p>
                        <p className="text-xs text-gray-500">
                          📅 Starts:{" "}
                          {new Date(
                            recurringData.recurringStartDate
                          ).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-0.5">
                        Save 5% on each order &amp; no need to re-order manually
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-primary font-medium mt-0.5 flex-shrink-0">
                  {isRecurringOrder ? "Edit" : "Set up"} ›
                </span>
              </div>
            </button>

            {/* Phương thức thanh toán */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-base font-semibold text-gray-800 mb-4">
                Payment method
              </h2>

              <div className="space-y-2">
                {/* ── Ví FreshMarket (ưu tiên đầu) ───────────────────────── */}
                <label
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                    formData.paymentMethod === "Wallet"
                      ? "border-primary bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Wallet"
                    checked={formData.paymentMethod === "Wallet"}
                    onChange={handleInputChange}
                    className="w-4 h-4 text-primary mt-0.5"
                  />
                  <span className="text-lg leading-none">👛</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-700">
                        FreshMarket Wallet
                      </span>
                      {walletLoading ? (
                        <span className="text-xs text-gray-400">Loading...</span>
                      ) : (
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            walletBalance >= total
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          Balance: {walletBalance.toLocaleString("vi-VN")}₫
                        </span>
                      )}
                    </div>
                    {!walletLoading && walletBalance < total && (
                      <p className="text-xs text-red-500 mt-0.5">
                        Insufficient balance.{" "}
                        <Link
                          to="/profile?tab=wallet"
                          className="underline font-medium hover:text-red-600"
                        >
                          Top up?
                        </Link>
                      </p>
                    )}
                  </div>
                </label>

                {/* ── Các phương thức khác ─────────────────────────────── */}
                {[
                  { value: "Momo", label: "MoMo", icon: "🏦" },
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
                    <span className="text-sm text-gray-700">{method.label}</span>
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

              {/* Group order badge */}
              {isGroupOrder && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg">
                  <Users className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-green-700">
                      Group order{navGroupData?.groupName ? ` · ${navGroupData.groupName}` : ""}
                    </p>
                    {groupDiscountPct > 0 && (
                      <p className="text-xs text-green-600">
                        Applying group discount of {groupDiscountPct}%
                      </p>
                    )}
                  </div>
                </div>
              )}
              {/* Giỏ hàng */}
              <div>
                <h3 className="text-base font-semibold text-gray-800 mb-4">
                  Cart
                </h3>

                <div className="space-y-4">
                  {checkoutItems.map((item) => (
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
                              onClick={() => handleUpdateQuantity(item.id, (localQty[item.id] ?? item.quantity) - 1, (item as any).stock)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Decrease quantity"
                              disabled={(localQty[item.id] ?? item.quantity) <= 1}
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={(item as any).stock ?? 999}
                              value={localQty[item.id] ?? item.quantity}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isNaN(val)) handleUpdateQuantity(item.id, val, (item as any).stock);
                              }}
                              className={`w-10 text-xs font-medium text-center border-x border-gray-300 focus:outline-none py-0.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                (() => { const q = localQty[item.id] ?? item.quantity; const s = (item as any).stock; return s !== undefined && q > s ? 'bg-red-50 text-red-600' : 'focus:bg-gray-50'; })()
                              }`}
                            />
                            <button 
                              onClick={() => handleUpdateQuantity(item.id, (localQty[item.id] ?? item.quantity) + 1, (item as any).stock)}
                              disabled={(localQty[item.id] ?? item.quantity) >= ((item as any).stock ?? 999)}
                              className="w-6 h-6 flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                  <p className="text-xs text-gray-500">Invoice: none</p>
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
                    <span className="font-medium text-gray-800">
                      {shipping === 0 ? "Free" : `${shipping.toLocaleString("vi-VN")}₫`}
                    </span>
                  </div>
                  {isGroupOrder && groupDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600">Group discount ({groupDiscountPct}%)</span>
                      <span className="font-medium text-green-600">
                        −{groupDiscount.toLocaleString("vi-VN")}₫
                      </span>
                    </div>
                  )}
                  {isRecurringOrder && (
                    <div className="flex justify-between text-sm">
                      <span className="text-blue-600">✨ Recurring discount (−5%)</span>
                      <span className="font-medium text-blue-600">
                        −{recurringDiscount.toLocaleString("vi-VN")}₫
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
                    {!isGroupOrder && (
                      <p className="text-xs text-gray-400 text-right">
                        Price includes VAT {vat.toLocaleString("vi-VN")}₫
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (validateForm()) setShowConfirmModal(true);
                  }}
                  disabled={loading || overStock}
                  title={overStock ? 'Quantity exceeds available stock' : undefined}
                  className="w-full px-5 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm flex items-center justify-center gap-2"
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
                <h2 className="text-sm font-bold text-white leading-tight">Order Confirmation</h2>
                <p className="text-xs text-green-100">Review before checkout</p>
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
                    {deliveryType === "pickup" ? "Store pickup" : "Home delivery"}
                  </p>
                  {deliveryType === "pickup" ? (
                    <>
                      <p className="text-xs font-medium text-gray-800 mt-0.5">
                        {selectedStore?.name ?? "No store selected"}
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
              {(isGroupOrder || recurringData) && (
                <div className="bg-gray-50 rounded-xl px-3 py-2 space-y-1.5">
                  {isGroupOrder && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      <p className="text-xs text-gray-700 truncate">
                        <span className="font-semibold">Group: </span>
                        {navGroupData?.groupName ?? groupSession?.groupName ?? ""}
                        {groupDiscountPct > 0 ? ` · discount ${groupDiscountPct}%` : ""}
                      </p>
                    </div>
                  )}
                  {recurringData && (
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <p className="text-xs text-gray-700 truncate">
                        <span className="font-semibold">Recurring: </span>
                        {FREQUENCY_LABELS[recurringData.recurringFrequency]} ·{": "}
                        {recurringData.recurringFrequency === "monthly"
                          ? `Day ${recurringData.recurringDay} of each month`
                          : DAY_LABELS[recurringData.recurringDay]}{": "}
                        · {new Date(recurringData.recurringStartDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 3. Product list */}
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Products ({checkoutItems.length})
                  </p>
                </div>
                <div className="divide-y divide-gray-50">
                  {checkoutItems.map((item) => (
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
                        {formData.paymentMethod === "Momo" ? "🏦" : "🚚"}
                      </span>
                      Payment
                    </span>
                    <span className="font-medium text-gray-700">
                      {formData.paymentMethod === "COD" ? "COD" : formData.paymentMethod}
                    </span>
                  </div>

                  {shipping > 0 && (
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Shipping fee</span>
                      <span className="text-gray-700">{shipping.toLocaleString("vi-VN")}₫</span>
                    </div>
                  )}
                  {recurringData && (
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-600">Recurring discount (5%)</span>
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
                    <span className="text-sm font-bold text-gray-800">Total</span>
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
                {loading ? "Processing..." : "Confirm & Pay"}
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-1.5 text-gray-400 text-xs hover:text-gray-700 transition-colors"
              >
                ← Back to edit
              </button>
              <p className="text-center text-xs text-gray-400 leading-relaxed">
                By confirming, you agree to FreshMarket's{" "}
                <span className="underline underline-offset-2 cursor-pointer hover:text-gray-600">purchase terms</span>.
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
