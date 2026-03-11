import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useGroup } from "../../context/GroupContext";
import {
  ArrowLeft,
  UserPlus,
  Copy,
  Check,
  Share2,
  ShoppingCart,
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
  X,
  QrCode,
  ChevronDown,
  Wallet,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import Header from "../../components/Header";
import { groupService, type GroupMember as APIMember } from "../../services/groupService";
import walletService from "../../services/walletService";

// ─── QuickTopupModal ─────────────────────────────────────────────────────────

interface QuickTopupModalProps {
  shortfall: number;
  groupId: string;
  /** Serialised cart items saved to sessionStorage so they survive the MoMo redirect */
  cartSnapshot: string;
  groupName: string;
  onClose: () => void;
}

function roundUpTo(amount: number, step: number): number {
  return Math.ceil(amount / step) * step;
}

function QuickTopupModal({ shortfall, groupId, cartSnapshot, groupName, onClose }: QuickTopupModalProps) {
  const exactShortfall = Math.max(shortfall, 10000);
  const presets = (() => {
    const buffer = roundUpTo(shortfall + 50000, 50000);
    const candidates = [exactShortfall, buffer, 100000, 200000, 500000];
    const uniq = Array.from(new Set(candidates)).filter((v) => v >= 10000).sort((a, b) => a - b);
    return uniq.slice(0, 4);
  })();

  const [selected, setSelected] = useState<number>(exactShortfall);
  const [loading,  setLoading]  = useState(false);

  const handleTopup = async () => {
    if (!groupId) return;
    setLoading(true);
    try {
      // Persist cart to sessionStorage so TopupResultPage can restore it
      sessionStorage.setItem(`goa_cart_${groupId}`,  cartSnapshot);
      sessionStorage.setItem(`goa_name_${groupId}`,  groupName);

      const res = await walletService.topUp(selected, {
        groupId,
        returnPath: `/group-order/active`,
      });
      const payUrl: string | undefined = (res as any)?.data?.payUrl ?? (res as any)?.payUrl;
      if (payUrl) {
        // Open MoMo in a NEW TAB — current page stays alive so socket update works in real-time
        window.open(payUrl, "_blank", "noopener,noreferrer");
        onClose();
        toast.info("MoMo window opened. Complete payment and come back here!", {
          duration: 10000,
          icon: "💜",
        });
      } else {
        toast.error("Did not receive payment link from MoMo.");
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not initiate MoMo payment. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-white" />
          <p className="text-white font-bold text-lg flex-1">Quick Top-up via MoMo</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Shortfall banner */}
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Wallet needs <span className="font-extrabold">{fmtVND(shortfall)}</span> more to place order
            </p>
          </div>

          {/* Preset grid */}
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Select top-up amount</p>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setSelected(amt)}
                  className={`py-3 rounded-xl text-sm font-bold border-2 transition-all ${
                    selected === amt
                      ? "border-pink-500 bg-pink-50 text-pink-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-pink-300"
                  }`}
                >
                  {amt === exactShortfall && shortfall > 0 ? (
                    <span>
                      {fmtVND(amt)}
                      <span className="block text-xs font-normal text-pink-500">exact shortfall</span>
                    </span>
                  ) : (
                    fmtVND(amt)
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleTopup}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Opening MoMo…</>
              ) : (
                <>💜 Top up {fmtVND(selected)}</>
              )}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            MoMo payment will open in a new tab. Once topped up, your wallet will update automatically and you can place the order right here.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Types & Constants ────────────────────────────────────────────────────────


interface CartItem {
  id: number;
  productId: string;   // MongoDB ObjectId – preserved from source
  name: string;
  price: number;
  qty: number;
  image: string;
  unit: string;
}

const TIERS = [
  { members: 2, pct: 2 },
  { members: 3, pct: 4 },
  { members: 5, pct: 6 },
  { members: 8, pct: 10 },
];



// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtVND(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function calcProgress(count: number) {
  if (count <= 0) return 0;
  if (count >= TIERS[TIERS.length - 1].members) return 100;
  const idx  = TIERS.reduce((acc, t, i) => (count >= t.members ? i : acc), 0);
  const cur  = TIERS[idx];
  const next = TIERS[idx + 1] ?? cur;
  const start = (idx / (TIERS.length - 1)) * 100;
  const end   = ((idx + 1) / (TIERS.length - 1)) * 100;
  return start + ((count - cur.members) / (next.members - cur.members)) * (end - start);
}
const AVATARS = ["🧑‍🌾", "👩‍🍳", "🧑‍💼", "👩‍🌾", "👨‍🍳", "🧑‍🦱", "👩‍🦰", "🧑‍🦳"];

function getMemberName(m: APIMember): string {
  return m.userId?.name || m.tempName || "Guest";
}

function getMemberAvatar(idx: number): string {
  return AVATARS[idx % AVATARS.length];
}
// ─── Component ───────────────────────────────────────────────────────────────

export default function GroupOrderActivePage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { groupSession, setGroupSession, clearGroupSession } = useGroup();
  const groupName = (location.state as any)?.groupName ?? groupSession?.groupName ?? "Group Order";
  const groupId   = ((location.state as any)?.groupId as string | undefined) ?? groupSession?.groupId;

  // Map cart items from checkout (CartContext shape) → local CartItem shape
  const initialCart: CartItem[] = ((location.state as any)?.cartItems ?? []).length > 0
    ? ((location.state as any).cartItems as Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
        image: string;
      }>).map((item, idx) => ({
        id: idx + 1,
        productId: item.id,
        name: item.name,
        price: item.price,
        qty: item.quantity,
        image: item.image || "🛒",
        unit: "serving",
      }))
    : [];

  const [members,        setMembers]        = useState<APIMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [showQRModal,    setShowQRModal]    = useState(false);
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [cart,           setCart]           = useState<CartItem[]>(initialCart);
  const [copied,         setCopied]         = useState(false);
  const [inviteLink]                        = useState(
    groupId ? `${window.location.origin}/join-group/${groupId}` : ""
  );

  // Wallet balance for owner — checked before placing order
  const [walletBalance,    setWalletBalance]   = useState<number>(0);
  const [showTopupModal,   setShowTopupModal]  = useState(false);

  // Owner's member ID in DB – for syncing cart items to server
  const ownerMemberIdRef = useRef<string | null>(null);
  // True for exactly one sync cycle after we hydrate cart from DB (skip that write-back)
  const isLoadingCartFromDB = useRef(false);

  // Place order / cancel state
  const [placeOrderLoading,  setPlaceOrderLoading]  = useState(false);
  const [cancelLoading,      setCancelLoading]      = useState(false);
  const [showPlaceConfirm,   setShowPlaceConfirm]   = useState(false);
  const [showCancelConfirm,  setShowCancelConfirm]  = useState(false);
  const [paymentOption,      setPaymentOption]      = useState<'owner_only' | 'individual' | 'equal_split'>(
    ((location.state as any)?.paymentOption as 'owner_only' | 'individual' | 'equal_split') ?? 'owner_only'
  );
  const [showPayOptionModal, setShowPayOptionModal] = useState(false);
  const [payOptionLoading,   setPayOptionLoading]   = useState(false);

  // ── Fetch members from API on mount ────────────────────────────────────
  useEffect(() => {
    if (!groupId) { setMembersLoading(false); return; }
    Promise.all([
      groupService.getMembers(groupId),
      groupService.getGroup(groupId),
    ])
      .then(([ms, g]) => {
        setMembers(ms);
        if (g.paymentOption) setPaymentOption(g.paymentOption);
        // Lưu lại memberId của Owner để dùng cho việc đồng bộ giỏ hàng
        const ownerMember = ms.find((m) => m.role === 'owner');
        if (ownerMember) {
          ownerMemberIdRef.current = ownerMember._id;
          // Safety net: if session is missing memberId (e.g. older session or sticky bar return),
          // patch it in so Add-to-Group works on product pages
          if (groupSession && !groupSession.memberId) {
            setGroupSession({ ...groupSession, memberId: ownerMember._id });
          }
          if (initialCart.length > 0) {
            // Came from checkout: push checkout cart to DB right away
            const payload = initialCart.map((i) => ({
              productId: i.productId || String(i.id),
              name:      i.name,
              price:     i.price,
              image:     i.image,
              qty:       i.qty,
            }));
            groupService.syncGroupItems(groupId!, ownerMember._id, payload).catch(() => {});
          } else {
            // Came back via Sticky Bar (no location.state): restore cart from DB
            const dbCart: CartItem[] = (ownerMember.cartItems ?? []).map((item, idx) => ({
              id:        idx + 1,
              productId: item.productId,
              name:      item.name,
              price:     item.price,
              qty:       item.qty,
              image:     item.image || '🛒',
              unit:      'serving',
            }));
            if (dbCart.length > 0) {
              isLoadingCartFromDB.current = true; // skip the write-back sync
              setCart(dbCart);
            }
          }
        }
      })
      .catch(console.error)
      .finally(() => setMembersLoading(false));
  }, [groupId]);

  // ── Fetch owner wallet balance ──────────────────────────────────────────
  useEffect(() => {
    walletService.getWalletInfo()
      .then((res: any) => setWalletBalance(res?.data?.walletBalance ?? res?.walletBalance ?? 0))
      .catch(() => setWalletBalance(0));
  }, []);

  // ── Đồng bộ giỏ của Owner lên DB mỗi khi cart thay đổi (debounce 800ms) ──
  const syncOwnerCart = useCallback(
    (items: CartItem[]) => {
      const ownerId = ownerMemberIdRef.current;
      if (!groupId || !ownerId) return;
      const payload = items.map((i) => ({
        productId: i.productId || String(i.id),
        name:      i.name,
        price:     i.price,
        image:     i.image,
        qty:       i.qty,
      }));
      groupService.syncGroupItems(groupId, ownerId, payload).catch(() => {
        // silent fail – trạng thái có thể sync lại lần sau
      });
    },
    [groupId]
  );

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    // Skip sync for the one render triggered by loading cart from DB (avoid write-back)
    if (isLoadingCartFromDB.current) {
      isLoadingCartFromDB.current = false;
      return;
    }
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => syncOwnerCart(cart), 800);
    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [cart, syncOwnerCart]);

  // ── Socket.io – realtime khi có thành viên mới join ─────────────────────
  useEffect(() => {
    if (!groupId) return;
    const socketUrl =
      (import.meta.env.VITE_API_URL as string)?.replace("/api", "") ||
      "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["websocket", "polling"] });
    socket.emit("join-group-room", groupId);
    socket.on("member:joined", (newMember: APIMember) => {
      setMembers((prev) =>
        prev.find((m) => m._id === newMember._id) ? prev : [...prev, newMember]
      );
    });
    socket.on("member:updated", (updated: APIMember) => {
      setMembers((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
    });
    socket.on("member:item_added", (updated: APIMember) => {
      setMembers((prev) => prev.map((m) => (m._id === updated._id ? updated : m)));
      const name = updated.userId?.name || updated.tempName || "Member";
      const latestItem = updated.cartItems?.[updated.cartItems.length - 1];
      if (latestItem) {
        toast.success(`${name} added items!`, {
          description: latestItem.name,
          icon: "🛒",
          id: `item:${updated._id}:${latestItem.productId}`,
        });
      }
      // Mở rộng thành viên đó để chủ nhóm thấy món mới
      setExpandedMember(updated._id);
    });
    // Thành viên đặt cọc: cập nhật badge
    socket.on("member:wallet_paid", (updated: APIMember) => {
      setMembers((prev) => prev.map((m) => (m._id === updated._id ? { ...m, walletPaid: updated.walletPaid, walletHoldAmount: updated.walletHoldAmount } : m)));
      const name = updated.userId?.name || updated.tempName || "Member";
      toast.success(`${name} deposited their share!`, { icon: "💰" });
    });
    // Member left: remove from list
    socket.on("member:left", (leftMemberId: string) => {
      setMembers((prev) => prev.filter((m) => m._id !== leftMemberId));
      toast.info("A member just left the group.", { icon: "🚪" });
    });
    // Chủ nhóm đổi hình thức thanh toán: cập nhật cho tất cả
    socket.on("group:payment_option_changed", (data: { groupId: string; paymentOption: string }) => {
      setPaymentOption(data.paymentOption as 'owner_only' | 'individual' | 'equal_split');
    });
    // Ví chủ nhóm vừa được nạp tiền — cập nhật số dư & reset warning
    socket.on("wallet:topup_success", (data: { newBalance: number }) => {
      setWalletBalance(data.newBalance);
      toast.success("Top-up successful! Wallet balance updated.", {
        description: `New balance: ${data.newBalance.toLocaleString("vi-VN")}đ`,
        icon: "💚",
        id: "wallet-topup-success",
        duration: 6000,
      });
    });
    return () => { socket.disconnect(); };
  }, [groupId]);

  // ── Helpers: owner's items live in local `cart` state, others in m.cartItems ──
  // The owner's member record on the server has empty cartItems; local cart is source of truth.
  const getMemberTotalQty = (m: APIMember): number => {
    if (m.role === "owner")
      return cart.reduce((s, i) => s + i.qty, 0);
    return (m.cartItems ?? []).reduce((s, i) => s + i.qty, 0);
  };

  const isMemberOrdered = (m: APIMember): boolean => {
    if (m.role === "owner") return cart.length > 0;
    return m.isReady;
  };

  // derived
  const joinedCount   = members.filter(isMemberOrdered).length;
  const activeTierIdx = TIERS.reduce((acc, t, i) => (joinedCount >= t.members ? i : acc), -1);
  const activePct     = activeTierIdx >= 0 ? TIERS[activeTierIdx].pct : 0;
  const nextTier      = TIERS[activeTierIdx + 1];
  const progress      = calcProgress(joinedCount);

  const ownerCartSubtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const hasOwnerInMembers  = members.some((m) => m.role === "owner");
  const groupSubtotal = members.reduce((s, m) => {
    const memberCart = m.role === "owner" ? cart : (m.cartItems ?? []);
    return s + memberCart.reduce((cs, i) => cs + i.price * i.qty, 0);
  }, 0) + (hasOwnerInMembers ? 0 : ownerCartSubtotal);
  const subtotal   = groupSubtotal;
  const discount   = Math.round(groupSubtotal * activePct / 100);
  const total      = groupSubtotal - discount;
  const ownerSharedShipping = members.length > 0 ? Math.round(25000 / members.length) : 25000;
  const ownerDiscountPct = members.length > 0 ? activePct / members.length : activePct;
  const ownerDiscount = Math.round(ownerCartSubtotal * ownerDiscountPct / 100);

  // equal_split rounding: non-owner members pay ceil, owner pays remainder
  const groupNetTotal    = total + 25000;
  const nonOwnerCount    = members.filter((m) => m.role !== 'owner').length;
  const memberEqualShare = members.length > 0 ? Math.ceil(groupNetTotal / members.length) : groupNetTotal;
  const ownerEqualShare  = Math.max(0, groupNetTotal - nonOwnerCount * memberEqualShare);
  const allNonOwnerPaid  = nonOwnerCount > 0 && members.filter((m) => m.role !== 'owner').every((m) => m.walletPaid);

  const allOrdered = members.length > 0 && members.every(isMemberOrdered);

  // Total amount already held from members' wallets (deposits)
  const totalHeld      = members
    .filter((m) => m.walletPaid)
    .reduce((s, m) => s + (m.walletHoldAmount ?? 0), 0);
  // Owner's individual-mode total: their own items + shared shipping − personal discount
  const ownerIndividualTotal = ownerCartSubtotal + ownerSharedShipping - ownerDiscount;

  // For equal_split: owner pays a fixed ownerEqualShare regardless of what others held
  const ownerRemaining = paymentOption === 'equal_split'
    ? ownerEqualShare
    : paymentOption === 'individual'
      ? ownerIndividualTotal
      : Math.max(0, total + 25000 - totalHeld);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateQty = (id: number, delta: number) =>
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0)
    );

  const removeItem = (id: number) => setCart((prev) => prev.filter((i) => i.id !== id));

  const removeMember = (_id: string) => setMembers((prev) => prev.filter((m) => m._id !== _id));

  // ── Place group order ────────────────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!groupId) return;
    setPlaceOrderLoading(true);
    setShowPlaceConfirm(false);
    try {
      const ownerCartItems = cart.map((i) => ({
        productId: i.productId || String(i.id),
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image,
      }));
      const result = await groupService.placeGroupOrder(groupId, ownerCartItems);
      const ownerMember = members.find((m) => m.role === "owner");
      const ownerName   = ownerMember ? getMemberName(ownerMember) : "Group Owner";
      navigate("/group-order/owner-success", {
        replace: true,
        state: {
          ownerName,
          groupName,
          orderId:             result.order?._id ?? "",
          groupTotal:          total + 25000,
          subtotal,
          discount:            result.discount  ?? discount,
          activePct,
          totalMemberDeposits: result.totalHeld ?? totalHeld,
          ownerPaid:           result.ownerCharge ?? ownerRemaining,
          walletBalance:       result.walletBalance,
          memberCount:         members.length,
          ownerCart:           cart.map((i) => ({ name: i.name, price: i.price, qty: i.qty, image: i.image })),
        },
      });
      clearGroupSession();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Failed to place order. Please try again."; 
      toast.error(msg);
    } finally {
      setPlaceOrderLoading(false);
    }
  };

  // ── Cancel group ──────────────────────────────────────────────────────────
  const handleCancelGroup = async () => {
    if (!groupId) return;
    setCancelLoading(true);
    setShowCancelConfirm(false);
    try {
      await groupService.cancelGroup(groupId);
      const msg = paymentOption === 'owner_only'
        ? "Group order deleted successfully."
        : "Group order cancelled. Deposits have been refunded to all members."; 
      toast.success(msg, { duration: 6000 });
      clearGroupSession();
      navigate("/checkout");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Cancellation failed. Please try again."; 
      toast.error(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  // ── Update payment option ─────────────────────────────────────────────────
  const handleSelectPaymentOption = async (option: 'owner_only' | 'individual' | 'equal_split') => {
    if (option === paymentOption) { setShowPayOptionModal(false); return; }
    setPaymentOption(option);
    setShowPayOptionModal(false);
    if (!groupId) return;
    setPayOptionLoading(true);
    try {
      await groupService.updatePaymentOption(groupId, option);
      toast.success('Payment method updated!', { icon: '💳' });
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Could not update. Please try again.');
    } finally {
      setPayOptionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── Top breadcrumb bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/group-order")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm text-gray-400">Group Order</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{groupName}</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Active
            </span>
          </span>
        </div>
      </div>


      {/* ── Main two-column grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ══════════════════════════
            LEFT (2/3)
        ══════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Discount tier banner ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">Get up to 10% off!</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Invite more members and make sure everyone orders at least 1 item.
                </p>
              </div>
              <button className="flex items-center gap-1 text-sm text-green-600 font-medium hover:underline flex-shrink-0 ml-4">
                Learn more <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="relative mt-6 pb-8">
              <div className="relative h-2.5 bg-gray-200 rounded-full">
                <div
                  className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
                {TIERS.map((tier, i) => {
                  const left  = (i / (TIERS.length - 1)) * 100;
                  const active = joinedCount >= tier.members;
                  return (
                    <div
                      key={tier.members}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${left}%` }}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 z-10 transition-all duration-300 ${
                          active
                            ? "bg-green-500 border-green-500 shadow-md shadow-green-200"
                            : "bg-white border-gray-300"
                        }`}
                      />
                      <div className="absolute top-6 flex flex-col items-center gap-0.5">
                        <span className={`text-sm font-extrabold ${active ? "text-green-600" : "text-gray-400"}`}>
                          {tier.pct}%
                        </span>
                        <span className={`text-xs whitespace-nowrap ${active ? "text-gray-600" : "text-gray-400"}`}>
                          {tier.members} people
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status pill */}
            <div className="flex items-center gap-3 mt-3">
              {activePct > 0 ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex-1">
                  <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-green-700">
                    Group getting <span className="text-green-600 text-base">{activePct}%</span> off
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
                  <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500">
                    Need <span className="font-bold text-gray-700">{TIERS[0].members} members</span> to unlock the first discount
                  </p>
                </div>
              )}
              {nextTier && (
                <div className="text-xs text-gray-500 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-center flex-shrink-0">
                  Add <span className="font-bold text-orange-600">{nextTier.members - joinedCount} more</span><br />
                  to reach <span className="font-bold">{nextTier.pct}%</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Your cart items ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Your items
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {cart.length}
                </span>
              </h3>
              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Add items
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No items yet. Add something to your cart!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm overflow-hidden">
                      {item.image.startsWith("http") ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        item.image
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtVND(item.price)} / {item.unit}</p>
                    </div>
                    {/* Qty stepper */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3 text-green-700" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-gray-900 w-20 text-right flex-shrink-0">
                      {fmtVND(item.price * item.qty)}
                    </p>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Member order status ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="text-lg">👥</span>
                Group members
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {members.length}
                </span>
              </h3>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                onClick={() => setShowQRModal(true)}
              >
                <UserPlus className="w-3.5 h-3.5" />
                Invite members
              </button>
            </div>

            <div className="space-y-2.5">
              {membersLoading ? (
                <div className="py-6 text-center text-sm text-gray-400">Loading members...</div>
              ) : members.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-400">No members yet.</div>
              ) : (
              <AnimatePresence initial={false}>
              {members.map((m, idx) => {
                const isExpanded  = expandedMember === m._id;
                const memberItems = m.cartItems ?? [];
                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.28 }}
                    className="overflow-hidden"
                  >
                  <div className="rounded-xl border border-gray-100 overflow-hidden mb-2.5">
                    {/* Member row */}
                    <div className="flex items-center gap-4 p-3.5 bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm">
                          {getMemberAvatar(idx)}
                        </div>
                        {m.role === "owner" && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white">
                            👑
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{getMemberName(m)}</p>
                        {paymentOption === 'individual' && m.isReady && memberItems.length > 0 && (
                          <p className="text-xs text-green-600 font-medium mt-0.5">
                            {fmtVND(memberItems.reduce((s, i) => s + i.price * i.qty, 0))}
                          </p>
                        )}
                        {paymentOption === 'equal_split' && (
                          <p className="text-xs text-teal-600 font-medium mt-0.5">
                            Contribution: {fmtVND(m.role === 'owner' ? ownerEqualShare : memberEqualShare)}
                          </p>
                        )}
                        {paymentOption !== 'individual' && paymentOption !== 'equal_split' && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {m.isReady ? `Chose ${memberItems.length} items` : "No items yet"}
                          </p>
                        )}
                      </div>
                      {/* Status badge */}
                      {m.isReady ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                          <Check className="w-3 h-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
                          Choosing
                        </span>
                      )}
                      {/* Wallet payment badge */}
                      {m.walletPaid && (
                        <span className="flex items-center gap-1 text-xs text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full">
                          <Wallet className="w-3 h-3" />
                          {paymentOption === 'equal_split'
                            ? 'Contributed'
                            : `Deposited ${m.walletHoldAmount ? `${m.walletHoldAmount.toLocaleString("vi-VN")}đ` : ""}`}
                        </span>
                      )}
                      {/* Expand toggle */}
                      {memberItems.length > 0 && (
                        <button
                          onClick={() => setExpandedMember(isExpanded ? null : m._id)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      )}
                      {m.role !== "owner" && (
                        <button
                          onClick={() => removeMember(m._id)}
                          className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Expandable items list */}
                    {isExpanded && memberItems.length > 0 && (
                      <div className="divide-y divide-gray-50 bg-white">
                        {memberItems.map((item, iIdx) => (
                          <div key={iIdx} className="flex items-center gap-3 px-4 py-2.5">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {item.image?.startsWith('http') ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-base">🛒</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-gray-700 truncate">{item.name}</p>
                              <p className="text-xs text-gray-400">{fmtVND(item.price)} / serving</p>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">×{item.qty}</span>
                            <span className="text-xs font-semibold text-gray-900 flex-shrink-0 w-16 text-right">
                              {fmtVND(item.price * item.qty)}
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-end px-4 py-2 bg-green-50">
                          <span className="text-xs font-bold text-green-700">
                            Total: {fmtVND(memberItems.reduce((s, i) => s + i.price * i.qty, 0))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
              )}
            </div>

            {/* Invite link row */}
            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-500 truncate">
                {inviteLink}
              </div>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                  copied ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors flex-shrink-0">
                <Share2 className="w-3.5 h-3.5" />
                Share
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════
            RIGHT sidebar (1/3, sticky)
        ══════════════════════════ */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-[72px]">

          {/* ── Order summary card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">Group order summary</h3>

            {/* Per-member rows – amount shown depends on paymentOption */}
            <div className="space-y-2.5">
              {membersLoading ? (
                <div className="py-6 text-center text-sm text-gray-400">Loading...</div>
              ) : members.map((m, idx) => {
                const ordered    = isMemberOrdered(m);
                const itemsQty   = getMemberTotalQty(m);
                const memberCart = m.role === "owner" ? cart : (m.cartItems ?? []);
                const rawAmount  = memberCart.reduce((s, i) => s + i.price * i.qty, 0);
                const memberShare =
                  paymentOption === 'equal_split'
                    ? (m.role === 'owner' ? ownerEqualShare : memberEqualShare)
                    : rawAmount;
                return (
                  <div key={m._id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                      {getMemberAvatar(idx)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">{getMemberName(m)}</p>
                      {ordered && memberShare > 0 && (
                        <p className="text-xs text-green-600 font-medium">{fmtVND(memberShare)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {m.walletPaid && (
                        <Wallet className="w-3 h-3 text-teal-500" />
                      )}
                      <span className={`text-xs font-semibold ${
                        ordered ? "text-green-600" : "text-gray-400"
                      }`}>
                        {ordered ? `${itemsQty} items` : "Choosing"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>
                  {paymentOption === 'individual'
                    ? 'Subtotal (Your items)'
                    : <span>Subtotal <span className="text-gray-400 font-normal">(whole group)</span></span>}
                </span>
                <span className="font-semibold text-gray-900">
                  {fmtVND(paymentOption === 'individual' ? ownerCartSubtotal : subtotal)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{paymentOption === 'individual' ? 'Shipping (Your share)' : 'Shipping fee'}</span>
                <span className="font-semibold text-gray-900">{paymentOption === 'individual' ? fmtVND(ownerSharedShipping) : '25.000đ'}</span>
              </div>
              {activePct > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>
                    {paymentOption === 'individual'
                      ? `Your discount (${ownerDiscountPct.toFixed(1).replace(/\.0$/, '')}%)`
                      : `Group discount (${activePct}%)`}
                  </span>
                  <span className="font-semibold">−{fmtVND(paymentOption === 'individual' ? ownerDiscount : discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-green-600 text-base">
                  {fmtVND(paymentOption === 'individual' ? ownerIndividualTotal : total + 25000)}
                </span>
              </div>

              {/* ── Deposit breakdown – only for individual / equal_split ── */}
              {paymentOption !== 'owner_only' && (
                <>
                  {totalHeld > 0 && (
                    <div className="flex justify-between text-teal-600">
                      <span className="flex items-center gap-1 flex-col items-start gap-0">
                        <span className="flex items-center gap-1">
                          <Wallet className="w-3.5 h-3.5" />
                          Total deposited
                        </span>
                        <span className="text-xs text-teal-500 font-normal">
                          Deposits from {members.filter((m) => m.walletPaid).length}/{members.filter((m) => m.role !== 'owner').length} members
                        </span>
                      </span>
                      <span className="font-semibold">−{fmtVND(totalHeld)}</span>
                    </div>
                  )}
                  <div className={`border-t pt-2.5 flex justify-between ${
                    ownerRemaining === 0 ? "border-teal-100" : "border-orange-100"
                  }`}>
                    <span className={`font-bold ${
                      ownerRemaining === 0 ? "text-teal-700" : "text-orange-700"
                    }`}>
                      {paymentOption === 'equal_split' ? 'Your share (Owner)' : paymentOption === 'individual' ? 'Your share' : 'Owner still owes'}
                    </span>
                    <span className={`font-extrabold text-base ${
                      ownerRemaining === 0 ? "text-teal-600" : "text-orange-600"
                    }`}>
                      {ownerRemaining === 0 ? "Fully covered 🎉" : fmtVND(ownerRemaining)}
                    </span>
                  </div>
                  {ownerRemaining > 0 && (
                    <p className="text-xs text-orange-500 leading-relaxed">
                      💡 This amount will be deducted from your wallet when placing the order.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* ── Payment option selector ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400 font-medium">Payment method</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">
                  {paymentOption === 'owner_only'   ? 'Owner pays for everyone'
                   : paymentOption === 'individual' ? 'Each person pays for their own'
                   : 'Split bill equally'}
                </p>
              </div>
              <button
                onClick={() => setShowPayOptionModal(true)}
                className="text-xs font-semibold text-green-600 hover:underline flex-shrink-0 ml-3"
              >
                Change
              </button>
            </div>
          </div>

          {/* ── Member readiness ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Member status</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {members.map((m, idx) => {
                const ordered = isMemberOrdered(m);
                return (
                  <div key={m._id} title={getMemberName(m)} className="relative">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl ${
                      ordered
                        ? "border-green-400 bg-green-50"
                        : "border-yellow-400 bg-yellow-50"
                    }`}>
                      {getMemberAvatar(idx)}
                    </div>
                    {ordered && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
              <button
                onClick={() => setShowQRModal(true)}
                className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {allOrdered ? (
              <p className="text-xs text-green-600 font-semibold mt-3">✅ All members have selected their items!</p>
            ) : (
              <p className="text-xs text-gray-400 mt-3">
                {joinedCount}/{members.length} have added items
              </p>
            )}
          </div>

          {/* ── Wallet stats for members – only for split modes ── */}
          {paymentOption !== 'owner_only' && (() => {
            const paidCount    = members.filter((m) => m.role !== 'owner' && m.walletPaid).length;
            const regularCount = members.filter((m) => m.role !== 'owner').length;
            if (regularCount === 0) return null;
            return (
              <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-bold text-teal-700">Deposits via wallet</span>
                </div>
                <p className="text-xs text-teal-600">{paidCount}/{regularCount} members have deposited</p>
                {totalHeld > 0 && (
                  <p className="text-xs font-semibold text-teal-700 mt-0.5">Total held: {fmtVND(totalHeld)}</p>
                )}
              </div>
            );
          })()}

          {/* ── Wallet balance indicator ── */}
          {ownerRemaining > 0 && (
            <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium ${
              walletBalance >= ownerRemaining
                ? "bg-green-50 border border-green-200 text-green-700"
                : "bg-red-50 border border-red-200 text-red-600"
            }`}>
              <span className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Your wallet balance
              </span>
              <span className="font-bold">{fmtVND(walletBalance)}</span>
            </div>
          )}

          {/* ── Chốt đơn / Nạp thêm button ── */}
          {walletBalance < ownerRemaining && ownerRemaining > 0 ? (
            <button
              onClick={() => setShowTopupModal(true)}
              disabled={cart.length === 0}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-base font-extrabold shadow-lg hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Wallet className="w-5 h-5" />
              Top up {fmtVND(ownerRemaining - walletBalance)} to pay
            </button>
          ) : (
            <button
              onClick={() => setShowPlaceConfirm(true)}
              disabled={placeOrderLoading || cart.length === 0 || (paymentOption === 'equal_split' && !allNonOwnerPaid)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-base font-extrabold shadow-lg hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {placeOrderLoading ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Processing...</>
              ) : paymentOption === 'individual' ? (
                <><ShoppingCart className="w-5 h-5" /> Pay my share & Place order →</>
              ) : paymentOption !== 'owner_only' ? (
                <><ShoppingCart className="w-5 h-5" /> Finalize order →</>
              ) : (
                <><ShoppingCart className="w-5 h-5" /> Place group order →</>
              )}
            </button>
          )}
          {paymentOption === 'individual' && (
            <p className="text-center text-xs text-gray-400 -mt-1">
              You are paying for your selected items only
            </p>
          )}
          {paymentOption === 'equal_split' && !allNonOwnerPaid && nonOwnerCount > 0 && (
            <p className="text-center text-xs text-amber-500 font-medium -mt-1">
              ⚠ {members.filter((m) => m.role !== 'owner' && !m.walletPaid).length}/{nonOwnerCount} members haven't contributed yet
            </p>
          )}
          {!allOrdered && !(paymentOption === 'equal_split' && !allNonOwnerPaid) && (
            <p className="text-center text-xs text-amber-500 font-medium -mt-1">
              ⚠ {members.filter((m) => !m.isReady).length} members haven't chosen items yet
            </p>
          )}

          {/* ── Cancel / Delete group button ── */}
          <button
            onClick={() => setShowCancelConfirm(true)}
            disabled={cancelLoading}
            className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {cancelLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            {paymentOption === 'owner_only' ? 'Delete group order' : 'Cancel & refund'}
          </button>

        </div>
      </div>

      {/* ════════════ PLACE ORDER CONFIRM MODAL ════════════ */}
      {showPlaceConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
             onClick={() => setShowPlaceConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-green-600 to-emerald-500 flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-white" />
              <p className="text-white font-bold text-lg">{paymentOption === 'individual' ? 'Pay my share & Place order' : 'Place group order'}</p>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-green-50 rounded-xl p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal <span className="text-gray-400 font-normal">(whole group)</span></span>
                  <span className="font-semibold">{fmtVND(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{paymentOption === 'individual' ? 'Shipping (your share)' : 'Shipping fee'}</span>
                  <span className="font-semibold">{paymentOption === 'individual' ? fmtVND(ownerSharedShipping) : '25.000đ'}</span>
                </div>
                {activePct > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>
                      {paymentOption === 'individual'
                        ? `Your discount (${ownerDiscountPct.toFixed(1).replace(/\.0$/, '')}%)`
                        : `Group discount (${activePct}%)`}
                    </span>
                    <span className="font-semibold">−{fmtVND(paymentOption === 'individual' ? ownerDiscount : discount)}</span>
                  </div>
                )}
                <div className="border-t border-green-200 pt-1.5 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-green-600">{fmtVND(total + 25000)}</span>
                </div>
                {paymentOption === 'owner_only' && totalHeld > 0 && (
                  <div className="flex justify-between text-teal-600">
                    <span className="flex flex-col gap-0">
                      <span className="flex items-center gap-1">
                        <Wallet className="w-3.5 h-3.5" />
                        Total deposited
                      </span>
                      <span className="text-xs text-teal-500 font-normal">
                        Deposits from {members.filter((m) => m.walletPaid).length}/{members.filter((m) => m.role !== 'owner').length} members
                      </span>
                    </span>
                    <span className="font-semibold">−{fmtVND(totalHeld)}</span>
                  </div>
                )}
                {paymentOption !== 'owner_only' && (
                <div className={`border-t pt-1.5 flex justify-between ${
                  ownerRemaining === 0 ? "border-teal-200" : "border-orange-200"
                }`}>
                  <span className={`font-bold ${
                    ownerRemaining === 0 ? "text-teal-700" : "text-orange-700"
                  }`}>
                    {paymentOption === 'equal_split' ? 'Your share (Owner)' : paymentOption === 'individual' ? 'Your share' : 'Owner still owes'}
                  </span>
                  <span className={`font-extrabold ${
                    ownerRemaining === 0 ? "text-teal-600" : "text-orange-600"
                  }`}>
                    {ownerRemaining === 0 ? "Fully covered 🎉" : fmtVND(ownerRemaining)}
                  </span>
                </div>
                )}
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                {paymentOption === 'individual'
                  ? '🧾 Each member pays for their own items after the order is placed.'
                  : paymentOption === 'equal_split'
                    ? `⚖️ Total bill split equally: each person pays ${fmtVND(Math.round((total + 25000) / Math.max(members.length, 1)))} .`
                    : ownerRemaining > 0
                      ? `💡 ${fmtVND(ownerRemaining)} will be deducted from your wallet when placing the order. Member deposits have been counted.`
                      : '✅ Member deposits are sufficient to cover the full order amount.'}
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowPlaceConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handlePlaceOrder}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-sm font-bold hover:from-green-700 hover:to-emerald-600 transition-all flex items-center justify-center gap-2">
                  Confirm order
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ PAYMENT OPTION MODAL ════════════ */}
      {showPayOptionModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setShowPayOptionModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-5 pb-4 flex items-center gap-3 border-b border-gray-100">
              <button
                onClick={() => setShowPayOptionModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h3 className="text-lg font-bold text-gray-900">Choose payment method</h3>
            </div>

            {/* Description */}
            <div className="px-6 pt-4 pb-2">
              <p className="text-sm text-gray-500 leading-relaxed">
                If you'd like to split this bill, please review how we apply discounts, delivery fees and tips to each person in the group.
              </p>
            </div>

            {/* 3 Radio options */}
            <div className="px-6 pb-5 pt-2 divide-y divide-gray-100">
              {([
                {
                  value: 'owner_only'   as const,
                  icon: '💳',
                  label: 'You pay for everyone',
                  subtitle: null,
                },
                {
                  value: 'individual'   as const,
                  icon: '🧾',
                  label: 'Each person pays for their own items',
                  subtitle: "Charged based on each member's own cart",
                },
                {
                  value: 'equal_split'  as const,
                  icon: '⚖️',
                  label: 'Split bill equally for everyone',
                  subtitle: 'Total bill ÷ number of members in the group',
                },
              ]).map((opt) => {
                const selected = paymentOption === opt.value;
                return (
                  <button
                    key={opt.value}
                    disabled={payOptionLoading}
                    onClick={() => handleSelectPaymentOption(opt.value)}
                    className="w-full flex items-center justify-between py-4 text-left group hover:bg-green-50/50 rounded-xl px-2 -mx-2 transition-colors disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-xl transition-colors ${
                        selected ? 'bg-green-100' : 'bg-gray-100 group-hover:bg-green-50'
                      }`}>
                        {opt.icon}
                      </div>
                      <div>
                        <p className={`text-sm leading-snug ${selected ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                          {opt.label}
                        </p>
                        {opt.subtitle && (
                          <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{opt.subtitle}</p>
                        )}
                      </div>
                    </div>
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ml-3 flex items-center justify-center transition-all ${
                      selected ? 'border-green-500 bg-green-500' : 'border-gray-300 group-hover:border-green-400'
                    }`}>
                      {selected && (
                        payOptionLoading
                          ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                          : <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-6 pb-5 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-400 text-center">
                Other payment methods
              </p>
              <div className="flex gap-2 mt-2 justify-center">
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-50 border border-pink-100 text-xs font-semibold text-pink-600">
                  <span className="text-sm">💜</span> MoMo
                </span>
                <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-600">
                  <span className="text-sm">💳</span> Card
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ CANCEL GROUP CONFIRM MODAL ════════════ */}
      {showCancelConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
             onClick={() => setShowCancelConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
               onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 bg-gradient-to-r from-red-500 to-rose-500 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-white" />
              <p className="text-white font-bold text-lg">
                {paymentOption === 'owner_only' ? 'Delete group order' : 'Cancel group order'}
              </p>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600 leading-relaxed">
                {paymentOption === 'owner_only'
                  ? <>Are you sure you want to <strong>delete this group order</strong>? This action cannot be undone and the group will be disbanded.</>
                  : <>Are you sure you want to <strong>cancel this group order</strong>? This action cannot be undone. All members who have deposited will be <strong>refunded immediately</strong>.</>
                }
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  No
                </button>
                <button onClick={handleCancelGroup}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 text-white text-sm font-bold hover:from-red-600 hover:to-rose-600 transition-all">
                  {paymentOption === 'owner_only' ? 'Delete order' : 'Cancel & refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ QR INVITE MODAL ════════════ */}
      {showQRModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowQRModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-500 px-6 py-5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <QrCode className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-green-100">Invite members</p>
                <p className="text-sm font-bold text-white truncate">{groupName}</p>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* QR code */}
            <div className="px-8 pt-7 pb-3 flex flex-col items-center">
              <p className="text-sm text-gray-500 text-center mb-5 leading-relaxed">
                Share the QR code or the link below to invite friends to join your group
              </p>
              {inviteLink ? (
                <div className="p-4 rounded-2xl border-2 border-green-100 bg-green-50 shadow-sm">
                  <QRCodeSVG
                    value={inviteLink}
                    size={180}
                    bgColor="#f0fdf4"
                    fgColor="#15803d"
                    level="M"
                  />
                </div>
              ) : (
                <div className="w-[180px] h-[180px] rounded-2xl bg-gray-100 flex items-center justify-center">
                  <p className="text-xs text-gray-400">No QR code</p>
                </div>
              )}
            </div>

            {/* Link copy */}
            <div className="px-6 pb-7 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-gray-500 truncate">
                  {inviteLink || "No invite link yet"}
                </div>
                <button
                  onClick={handleCopy}
                  disabled={!inviteLink}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex-shrink-0 ${
                    copied ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  } disabled:opacity-50`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                onClick={() => setShowQRModal(false)}
                className="w-full py-3 rounded-2xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ QUICK TOPUP MODAL ════════════ */}
      {showTopupModal && groupId && (
        <QuickTopupModal
          shortfall={Math.max(0, ownerRemaining - walletBalance)}
          groupId={groupId}
          cartSnapshot={JSON.stringify(cart)}
          groupName={groupName}
          onClose={() => setShowTopupModal(false)}
        />
      )}
    </div>
  );
}
