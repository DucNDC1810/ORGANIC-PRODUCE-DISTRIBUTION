import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  ShoppingCart,
  CheckCircle2,
  RefreshCw,
  LogOut,
  Plus,
  Minus,
  Trash2,
  Zap,
  Check,
  Lock,
  Wallet,
  Loader2,
  ChevronDown,
  X,
  AlertTriangle,
  UserPlus,
  Truck,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { groupService, type Group, type GroupMember, type GroupCartItem } from "../../services/groupService";
import { useGroup } from "../../context/GroupContext";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import walletService from "../../services/walletService";

// ── Constants ──────────────────────────────────────────────────────────────────
const TIERS = [
  { members: 2, pct: 2 },
  { members: 3, pct: 4 },
  { members: 5, pct: 6 },
  { members: 8, pct: 10 },
];

const AVATARS = ["🧑‍🌾", "👩‍🍳", "🧑‍💼", "👩‍🌾", "👨‍🍳", "🧑‍🦱", "👩‍🦰", "🧑‍🦳"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtVND(n: number | undefined | null) {
  const v = Number(n);
  if (!isFinite(v) || isNaN(v)) return '0đ';
  return v.toLocaleString("vi-VN") + "đ";
}

function getMemberName(m: GroupMember): string {
  return m.userId?.name || m.tempName || "Guest";
}

function getAvatar(idx: number): string {
  return AVATARS[idx % AVATARS.length];
}

function calcProgress(count: number): number {
  if (count <= 0) return 0;
  if (count >= TIERS[TIERS.length - 1].members) return 100;
  const idx   = TIERS.reduce((acc, t, i) => (count >= t.members ? i : acc), 0);
  const cur   = TIERS[idx];
  const next  = TIERS[idx + 1] ?? cur;
  const range = next.members - cur.members || 1;
  const start = (idx / (TIERS.length - 1)) * 100;
  const end   = ((idx + 1) / (TIERS.length - 1)) * 100;
  return start + ((count - cur.members) / range) * (end - start);
}

// ─────────────────────────────────────────────────────────────────────────────

// ─── QuickTopupModal (member) ─────────────────────────────────────────────────
function roundUpTo(amount: number, step: number): number {
  return Math.ceil(amount / step) * step;
}

interface MemberTopupModalProps {
  shortfall: number;
  groupId: string;
  onClose: () => void;
}

function MemberQuickTopupModal({ shortfall, groupId, onClose }: MemberTopupModalProps) {
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
    setLoading(true);
    try {
      const res = await walletService.topUp(selected, {
        groupId,
        returnPath: `/group/members`,
      });
      const payUrl: string | undefined = (res as any)?.data?.payUrl ?? (res as any)?.payUrl;
      if (payUrl) {
        window.location.href = payUrl;
      } else {
        toast.error("Did not receive payment link from MoMo.");
        setLoading(false);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Could not initiate MoMo payment.");
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
        <div className="px-6 py-5 bg-gradient-to-r from-pink-500 to-rose-500 flex items-center gap-3">
          <Wallet className="w-5 h-5 text-white" />
          <p className="text-white font-bold text-lg flex-1">Quick Top-up via MoMo</p>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">
              Wallet needs <span className="font-extrabold">{fmtVND(shortfall)}</span> more to deposit
            </p>
          </div>

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

          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button
              onClick={handleTopup}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold hover:from-pink-600 hover:to-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Opening MoMo…</> : <>💜 Top up {fmtVND(selected)}</>}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center leading-relaxed">
            MoMo payment will open in a new tab. Once topped up, your wallet will update automatically.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function GroupMemberPage() {
  const navigate = useNavigate();
  const { groupSession, clearGroupSession } = useGroup();
  const { user } = useAuth();
  const { clearCart } = useCart();

  const [group,           setGroup]           = useState<Group | null>(null);
  const [members,         setMembers]         = useState<GroupMember[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState("");
  const [myCart,          setMyCart]          = useState<GroupCartItem[]>([]);
  const [confirming,      setConfirming]      = useState(false);
  const [unconfirming,    setUnconfirming]    = useState(false);
  const [leaving,         setLeaving]         = useState(false);
  const [expandedMember,  setExpandedMember]  = useState<string | null>(null);

  // Hold wallet share
  const [holdConfirm,    setHoldConfirm]   = useState(false);
  const [holdLoading,    setHoldLoading]   = useState(false);

  // Wallet balance for deposit check
  const [walletBalance,  setWalletBalance] = useState<number>(0);
  const [showTopupModal, setShowTopupModal] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  // Refs to always have fresh state inside socket callbacks
  const myCartRef  = useRef<GroupCartItem[]>([]);
  const membersRef = useRef<GroupMember[]>([]);
  const groupRef   = useRef<Group | null>(null);

  const groupId  = groupSession?.groupId;
  const memberId = groupSession?.memberId;

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) { setError("Group session not found."); setLoading(false); return; }

    Promise.all([
      groupService.getGroup(groupId),
      groupService.getMembers(groupId),
    ])
      .then(([g, m]) => {
        setGroup(g);
        setMembers(m);
        const me = m.find((x) => x._id === memberId);
        if (me) setMyCart(me.cartItems ?? []);
      })
      .catch(() => setError("Could not load group information."))
      .finally(() => setLoading(false));
  }, [groupId, memberId]);

  // ── Fetch member wallet balance ─────────────────────────────────────────────
  useEffect(() => {
    walletService.getWalletInfo()
      .then((res: any) => setWalletBalance(res?.data?.walletBalance ?? res?.walletBalance ?? 0))
      .catch(() => setWalletBalance(0));
  }, []);

  // Keep refs in sync with state so socket callbacks always read the latest values
  useEffect(() => { myCartRef.current  = myCart;   }, [myCart]);
  useEffect(() => { membersRef.current = members;  }, [members]);
  useEffect(() => { groupRef.current   = group;    }, [group]);

  // ── Socket.io realtime ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) return;
    const socketUrl =
      (import.meta.env.VITE_API_URL as string)?.replace("/api", "") ||
      "http://localhost:5000";
    const socket = io(socketUrl, { transports: ["websocket", "polling"] });
    socket.emit("join-group-room", groupId);
    socket.on("member:joined", (m: GroupMember) =>
      setMembers((prev) => (prev.find((x) => x._id === m._id) ? prev : [...prev, m]))
    );
    socket.on("member:updated", (m: GroupMember) => {
      setMembers((prev) => prev.map((x) => (x._id === m._id ? m : x)));
      if (m._id === memberId) setMyCart(m.cartItems ?? []);
    });
    socket.on("member:item_added", (m: GroupMember) => {
      setMembers((prev) => prev.map((x) => (x._id === m._id ? m : x)));
      if (m._id === memberId) setMyCart(m.cartItems ?? []);
      // Nếu là Owner cập nhật món, tự động mở rộng để Members thấy
      if (m.role === 'owner' && m.cartItems?.length > 0) {
        setExpandedMember(m._id);
      }
    });
    socket.on("member:wallet_paid", (m: GroupMember) => {
      setMembers((prev) => prev.map((x) => (x._id === m._id ? m : x)));
    });
    socket.on("group:payment_option_changed", (data: { groupId: string; paymentOption: string }) => {
      setGroup((prev) => prev ? { ...prev, paymentOption: data.paymentOption as any } : prev);
    });
    // Nhận event nạp ví thành công từ server – cập nhật số dư real-time
    socket.on("wallet:topup_success", (data: { newBalance: number }) => {
      setWalletBalance(data.newBalance);
      toast.success("Top-up successful! Wallet updated.", {
        description: `New balance: ${data.newBalance.toLocaleString("vi-VN")}đ`,
        icon: "💚",
        id: "wallet-topup-success",
        duration: 6000,
      });
    });
    socket.on("group:deleted", () => {
      const isOwnerPays = (groupRef.current?.paymentOption ?? 'owner_only') === 'owner_only';
      const msg = isOwnerPays
        ? "The group order has been cancelled by the owner."
        : "The group order has been cancelled by the owner. Your deposit has been refunded to your wallet.";
      toast.info(msg, { duration: 6000 });
      clearGroupSession();
      navigate("/");
    });

    // ── Owner đã chốt đơn → chuyển member sang trang xác nhận thành công ──
    socket.on("group:order_placed", (data: { groupId: string; orderId: string; total: number }) => {
      const latestMembers = membersRef.current;
      const latestMyCart  = myCartRef.current;
      const latestGroup   = groupRef.current;

      const me = latestMembers.find((x) => x._id === memberId);
      const memberName   = me ? getMemberName(me) : "Member";
      const subtotal     = latestMyCart.reduce((s, i) => s + i.price * i.qty, 0);
      const orderedCount = latestMembers.filter((m) =>
        m.role === 'owner' ? (m.cartItems ?? []).length > 0 : m.isReady
      ).length;
      const tierIdx      = TIERS.reduce((acc, t, i) => (orderedCount >= t.members ? i : acc), -1);
      const pct          = tierIdx >= 0 ? TIERS[tierIdx].pct : 0;

      clearCart(true);
      navigate("/group-order/success", {
        replace: true,
        state: {
          memberName,
          myCart:           latestMyCart,
          mySubtotal:       subtotal,
          walletHoldAmount: me?.walletHoldAmount ?? 0,
          orderId:          data.orderId,
          groupName:        latestGroup?.groupName ?? "Group Order",
          activePct:        pct,
          groupTotal:       data.total,
        },
      });
      clearGroupSession();
    });

    // ── Giao hàng nhóm hoàn tất → thông báo cho tất cả thành viên ──
    socket.on("group:order_delivered", (data: { groupId: string; address: string; ownerName: string }) => {
      toast.success(`Đơn hàng nhóm đã được giao đến địa chỉ của ${data.ownerName || 'Owner'}!`, {
        description: data.address ? `Địa chỉ: ${data.address}` : 'Đơn hàng đã được giao thành công.',
        icon: '🚚',
        duration: 8000,
      });
    });

    return () => { socket.disconnect(); };
  }, [groupId, memberId]);

  // ── Cart management ────────────────────────────────────────────────────────
  const updateQty = async (item: GroupCartItem, delta: number) => {
    if (!groupId || !memberId || isReady) return;
    const newQty = item.qty + delta;
    if (newQty <= 0) {
      setMyCart((prev) => prev.filter((i) => i.productId !== item.productId));
      return;
    }
    setMyCart((prev) =>
      prev.map((i) => (i.productId === item.productId ? { ...i, qty: newQty } : i))
    );
    try {
      await groupService.addGroupItem(groupId, memberId, { ...item, qty: newQty });
    } catch {
      setMyCart((prev) =>
        prev.map((i) => (i.productId === item.productId ? { ...i, qty: item.qty } : i))
      );
      toast.error("Could not update quantity.");
    }
  };

  const removeItem = (productId: string) => {
    if (isReady) return;
    setMyCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  // ── Confirm ready ──────────────────────────────────────────────────────────
  const handleConfirmReady = async () => {
    if (!groupId || !memberId) return;
    setConfirming(true);
    try {
      await groupService.setMemberReady(groupId, memberId, true);
      toast.success("Confirmed! Waiting for the owner to place the order.");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  // ── Unconfirm (edit items) ─────────────────────────────────────────────────
  const handleUnconfirm = async () => {
    if (!groupId || !memberId) return;
    setUnconfirming(true);
    try {
      await groupService.setMemberReady(groupId, memberId, false);
      toast.info("You can now edit your items.");
    } catch {
      toast.error("An error occurred. Please try again.");
    } finally {
      setUnconfirming(false);
    }
  };

  const handleLeave = async () => {
    if (!groupId || !memberId) { clearGroupSession(); navigate("/products"); return; }
    setLeaving(true);
    try {
      // Gọi API xóa khỏi DB
      await groupService.leaveGroup(groupId, memberId);
      // Emit socket để Owner và các thành viên khác cập nhật ngay
      socketRef.current?.emit("member:left", { groupId, memberId });
    } catch {
      // Vẫn cho rời dù API lỗi (session đã xóa ở client)
    } finally {
      clearGroupSession();
      navigate("/products");
    }
  };

  // ── Hold wallet share ────────────────────────────────────────────────────
  const handleHoldWallet = async () => {
    if (!groupId || !memberId) return;
    setHoldLoading(true);
    try {
      const { member: updated, walletBalance } = await groupService.holdWalletShare(groupId, memberId);
      setMembers((prev) => prev.map((x) => (x._id === updated._id ? { ...x, walletPaid: true, walletHoldAmount: updated.walletHoldAmount } : x)));
      toast.success(
        `Deposit of ${fmtVND(updated.walletHoldAmount ?? mySubtotal)} successful! 🎉 Wallet balance: ${fmtVND(walletBalance)}`,
        { duration: 5000 }
      );
      setHoldConfirm(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Deposit failed. Please try again.';
      toast.error(msg);
    } finally {
      setHoldLoading(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const myMember    = members.find((m) => m._id === memberId);
  const isReady     = myMember?.isReady ?? false;
  const isLocked    = group?.status === "locked" || group?.status === "completed";

  // Cho Owner: tính là "đã chọn" khi có ít nhất 1 món trong cartItems
  const orderedCount  = members.filter((m) =>
    m.role === 'owner' ? (m.cartItems ?? []).length > 0 : m.isReady
  ).length;
  const activeTierIdx = TIERS.reduce((acc, t, i) => (orderedCount >= t.members ? i : acc), -1);
  const activePct     = activeTierIdx >= 0 ? TIERS[activeTierIdx].pct : 0;
  const nextTier      = TIERS[activeTierIdx + 1];
  const progress      = calcProgress(orderedCount);

  const mySubtotal  = myCart.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const groupTotal  = members.reduce((s, m) => {
    const items = m._id === memberId ? myCart : (m.cartItems ?? []);
    return s + items.reduce((si, i) => si + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  }, 0);

  // Per-member share based on paymentOption
  const paymentOpt = (group?.paymentOption ?? 'owner_only') as 'owner_only' | 'individual' | 'equal_split';

  // Shipping split: 25,000đ divided by total member count
  const SHIPPING_FEE = 25_000;
  const sharedShipping = members.length > 0
    ? Math.round(SHIPPING_FEE / members.length)
    : 0;
  const myDiscountPct = members.length > 0 ? activePct / members.length : 0;
  const myDiscount = Math.round(mySubtotal * myDiscountPct / 100);

  // equal_split: full bill (after group discount + full shipping) divided equally
  const groupDiscount = Math.round(groupTotal * activePct / 100);
  const groupNetTotal = groupTotal - groupDiscount + SHIPPING_FEE;
  const equalShare    = members.length > 0 ? Math.round(groupNetTotal / members.length) : 0;

  const myShare =
    paymentOpt === 'equal_split' && members.length > 0
      ? equalShare
      : paymentOpt === 'individual'
        ? mySubtotal + sharedShipping - myDiscount
        : mySubtotal;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-7 h-7 text-green-500 animate-spin" />
      </div>
    );
  }

  // ── Error / no session ─────────────────────────────────────────────────────
  if (error || !groupSession || !group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl shadow-xl p-10 max-w-sm w-full text-center space-y-4">
          <Users className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-gray-500 text-sm">{error || "You haven't joined any group."}</p>
          <button
            onClick={() => navigate("/products")}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
          >
            Browse Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ══════════════ LOCKED OVERLAY ══════════════ */}
      {isLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-3xl shadow-2xl p-10 max-w-sm mx-4 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-orange-50 flex items-center justify-center">
              <Lock className="w-8 h-8 text-orange-500" />
            </div>
            <h2 className="text-xl font-extrabold text-gray-900">Order has been placed</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              The owner has placed the order. You can no longer change your items.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
            >
              Browse Products
            </button>
          </div>
        </div>
      )}

      {/* ── Top nav bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-bold text-gray-900 truncate flex-1">{group.groupName}</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Active
          </span>
        </div>
      </div>

      {/* ── Identity sub-bar ── */}
      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">👥</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-orange-700 truncate">{group.groupName}</p>
            <p className="text-xs text-orange-500">{orderedCount}/{members.length} members ready</p>
          </div>
          {/* Current user badge */}
          <div className="flex items-center gap-2 bg-white/70 border border-orange-100 rounded-xl px-3 py-1.5 flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{user?.name}</span>
            <span className="text-xs text-green-600 font-medium">(you)</span>
          </div>
        </div>
      </div>

      {/* ── Main two-column grid ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ══════════════════════════
            LEFT (2/3)
        ══════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Discount tier progress ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-1">
              <h2 className="text-lg font-extrabold text-gray-900">Get up to 10% off!</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Everyone confirm your selection to unlock a better discount.
              </p>
            </div>

            {/* Progress bar with tier dots */}
            <div className="relative mt-6 pb-10">
              {/* Track */}
              <div className="relative h-4 bg-gray-100 rounded-full shadow-inner">
                {/* Filled portion */}
                <motion.div
                  className="absolute top-0 left-0 h-4 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #86efac 0%, #22c55e 50%, #16a34a 100%)",
                    boxShadow: "0 2px 8px 0 rgba(34,197,94,0.35)",
                  }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.7, ease: "easeInOut" }}
                />
                {/* Milestone dots */}
                {TIERS.map((tier, i) => {
                  const left   = (i / (TIERS.length - 1)) * 100;
                  const active = orderedCount >= tier.members;
                  const isNext = !active && TIERS[activeTierIdx + 1]?.members === tier.members;
                  return (
                    <div
                      key={tier.members}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${left}%` }}
                    >
                      <motion.div
                        animate={active ? { scale: [1, 1.25, 1] } : {}}
                        transition={{ duration: 0.4 }}
                        className={`w-6 h-6 rounded-full border-[3px] z-10 flex items-center justify-center transition-colors duration-300 ${
                          active
                            ? "bg-green-500 border-green-600 shadow-lg shadow-green-200"
                            : isNext
                            ? "bg-orange-50 border-orange-400"
                            : "bg-white border-gray-300"
                        }`}
                      >
                        {active && <span className="text-white text-[10px] font-bold leading-none">✓</span>}
                      </motion.div>
                      <div className="absolute top-7 flex flex-col items-center gap-0">
                        <span className={`text-sm font-extrabold leading-tight ${
                          active ? "text-green-600" : isNext ? "text-orange-500" : "text-gray-400"
                        }`}>
                          {tier.pct}%
                        </span>
                        <span className={`text-[11px] whitespace-nowrap ${
                          active ? "text-gray-600" : isNext ? "text-orange-400" : "text-gray-400"
                        }`}>
                          {tier.members} people
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status badges */}
            <div className="flex items-stretch gap-3 mt-1">
              <AnimatePresence mode="wait">
                {activePct > 0 ? (
                  <motion.div
                    key="active"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-2.5 bg-green-600 text-white rounded-full px-5 py-2.5 flex-1 shadow-md"
                  >
                    <span className="text-base leading-none">🎊</span>
                    <p className="text-sm font-bold">
                      Group getting&nbsp;
                      <span className="text-lg font-extrabold">{activePct}%</span> off
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="inactive"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }}
                    className="flex items-center gap-2.5 bg-gray-100 border border-gray-200 rounded-full px-5 py-2.5 flex-1"
                  >
                    <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-500">
                      Need <span className="font-bold text-gray-700">{TIERS[0].members} members</span> ready to unlock discount
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {nextTier && (
                <motion.div
                  animate={{ y: [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
                  className="flex items-center gap-2 bg-orange-50 border border-orange-200 text-orange-600 rounded-2xl px-4 py-2.5 flex-shrink-0 shadow-sm"
                >
                  <UserPlus className="w-4 h-4 flex-shrink-0" />
                  <div className="text-xs leading-tight">
                    <span className="font-extrabold text-sm">{nextTier.members - orderedCount}</span> more<br />
                    <span className="font-bold">→ {nextTier.pct}%</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ── My cart ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Your items
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {myCart.length}
                </span>
              </h3>
              {!isReady && (
                <button
                  onClick={() => navigate("/products")}
                  className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add items
                </button>
              )}
            </div>

            {myCart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No items yet. Start choosing your items!</p>
                <button
                  onClick={() => navigate("/products")}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  Start choosing
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myCart.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group"
                  >
                    {/* Image */}
                    <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm overflow-hidden">
                      {item.image?.startsWith("http") ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>🛒</span>
                      )}
                    </div>

                    {/* Name & price */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{fmtVND(item.price)}</p>
                    </div>

                    {/* Qty stepper */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => updateQty(item, -1)}
                        disabled={isReady}
                        className="w-7 h-7 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-3 h-3 text-gray-600" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item, 1)}
                        disabled={isReady}
                        className="w-7 h-7 rounded-full bg-green-100 hover:bg-green-200 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3 text-green-700" />
                      </button>
                    </div>

                    {/* Line total */}
                    <p className="text-sm font-bold text-gray-900 w-20 text-right flex-shrink-0">
                      {fmtVND(item.price * item.qty)}
                    </p>

                    {/* Delete – chỉ khi chưa xác nhận xong */}
                    {!isReady && (
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Member list ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="text-lg">👥</span>
                Group members
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {members.length}
                </span>
              </h3>
              <span className="text-xs text-gray-400">{orderedCount}/{members.length} ready</span>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
              {members.map((m, idx) => {
                const isMe       = m._id === memberId;
                const isOwner    = m.role === "owner";
                const memberItems = isMe ? myCart : (m.cartItems ?? []);
                const isExpanded  = expandedMember === m._id;
                // Trạng thái thực tế: owner được xem là "sẵn sàng" khi có ít nhất 1 món
                const effectivelyReady = isOwner
                  ? memberItems.length > 0
                  : m.isReady;
                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                  <div className={`rounded-xl border overflow-hidden ${
                    isMe ? "border-green-100" : "border-gray-100"
                  }`}>
                    {/* Member row */}
                    <div
                      className={`flex items-center gap-4 p-3.5 transition-colors ${
                        isMe ? "bg-green-50" : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      {/* Avatar with crown badge */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl border-2 shadow-sm ${
                          isMe ? "border-green-300 bg-green-100" : "border-gray-200 bg-white"
                        }`}>
                          {getAvatar(idx)}
                        </div>
                        {isOwner && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white">
                            👑
                          </div>
                        )}
                      </div>

                      {/* Name & role / item summary */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-sm font-semibold truncate ${isMe ? "text-green-700" : "text-gray-900"}`}>
                            {getMemberName(m)}
                          </span>
                          {isMe && (
                            <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium flex-shrink-0">
                              you
                            </span>
                          )}
                        </div>
                        {effectivelyReady && memberItems.length > 0 ? (
                          <p className="text-xs text-green-600 font-medium mt-0.5">
                            {memberItems.length} items · {memberItems.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString("vi-VN")}đ
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {isOwner ? "Owner" : "Member"}
                          </p>
                        )}
                      </div>

                      {/* Status badge */}
                      {effectivelyReady ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex-shrink-0">
                          <Check className="w-3 h-3" />
                          Ready
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full flex-shrink-0">
                          Choosing
                        </span>
                      )}

                      {/* Wallet payment status badge */}
                      {m.walletPaid && (
                        <span className="flex items-center gap-1 text-xs text-teal-700 font-semibold bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-full flex-shrink-0">
                          <Wallet className="w-3 h-3" />
                          Deposited
                        </span>
                      )}

                      {/* Expand toggle – show if member has items */}
                      {memberItems.length > 0 && (
                        <button
                          onClick={() => setExpandedMember(isExpanded ? null : m._id)}
                          className="w-7 h-7 rounded-full bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 transition-transform duration-200"
                          style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        >
                          <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
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
                              <p className="text-xs text-gray-400">{item.price.toLocaleString("vi-VN")}đ / serving</p>
                            </div>
                            <span className="text-xs text-gray-400 flex-shrink-0">×{item.qty}</span>
                            <span className="text-xs font-semibold text-gray-900 flex-shrink-0 w-16 text-right">
                              {(item.price * item.qty).toLocaleString("vi-VN")}đ
                            </span>
                          </div>
                        ))}
                        <div className="flex justify-end px-4 py-2 bg-green-50">
                          <span className="text-xs font-bold text-green-700">
                            Total: {memberItems.reduce((s, i) => s + i.price * i.qty, 0).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>

            {orderedCount === members.length && members.length > 0 && (
              <div className="mt-4 py-3 bg-green-50 rounded-xl text-center text-sm text-green-700 font-semibold">
                🎉 Everyone has chosen their items!
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════
            RIGHT sidebar (1/3, sticky)
        ══════════════════════════ */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-[72px]">

          {/* ── Group order summary ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-gray-900 mb-5">Group order summary</h3>

            {/* equal_split banner */}
            {paymentOpt === 'equal_split' && (
              <div className="mb-4 flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <span className="text-lg flex-shrink-0 mt-0.5">⚖️</span>
                <p className="text-sm text-green-700 font-medium leading-snug">
                  The group is splitting the bill equally. Everyone contributes the same amount.
                </p>
              </div>
            )}

            {/* Per-member rows */}
            <div className="space-y-2.5 mb-4">
              {members.map((m, idx) => {
                const items         = m._id === memberId ? myCart : (m.cartItems ?? []);
                const qty           = items.reduce((s, i) => s + i.qty, 0);
                const memberAmount  = items.reduce((s, i) => s + i.price * i.qty, 0);
                const hasOrdered    = m.isReady || (m._id === memberId && myCart.length > 0);
                return (
                  <div key={m._id} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                      {getAvatar(idx)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 truncate">{getMemberName(m)}</p>
                      {hasOrdered && memberAmount > 0 && (
                        <p className="text-xs text-green-600 font-medium">{fmtVND(memberAmount)}</p>
                      )}
                    </div>
                    <span className={`text-xs font-semibold flex-shrink-0 ${
                      hasOrdered ? "text-green-600" : "text-gray-400"
                    }`}>
                      {qty > 0 ? `${qty} items` : "Choosing"}
                    </span>
                  </div>
                );
              })}
            </div>

            {paymentOpt === 'equal_split' ? (
              /* ── equal_split breakdown ── */
              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal (whole group)</span>
                  <span className="font-semibold text-gray-900">{fmtVND(groupTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping fee</span>
                  <span className="font-semibold text-gray-900">{fmtVND(SHIPPING_FEE)}</span>
                </div>
                {activePct > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Group discount ({activePct}%)</span>
                    <span className="font-medium">−{fmtVND(groupDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>Member count</span>
                  <span className="font-medium">{members.length} people</span>
                </div>
                <div className="border-t border-green-100 pt-2.5 flex justify-between">
                  <span className="font-bold text-gray-900">Group total</span>
                  <span className="font-extrabold text-green-600 text-base">{fmtVND(groupNetTotal)}</span>
                </div>
                <div className="bg-green-50 rounded-xl px-4 py-3 flex justify-between items-center">
                  <span className="font-bold text-green-800 text-sm">Your share</span>
                  <span className="font-extrabold text-green-600 text-lg">{fmtVND(equalShare)}</span>
                </div>
              </div>
            ) : (
              /* ── individual / owner_only breakdown ── */
              <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm text-gray-600">
                {paymentOpt !== 'individual' && (
                  <div className="flex justify-between">
                    <span>Subtotal (whole group)</span>
                    <span className="font-semibold text-gray-900">{fmtVND(groupTotal)}</span>
                  </div>
                )}
                {paymentOpt === 'individual' && (
                  <div className="flex justify-between">
                    <span>Subtotal (Your items)</span>
                    <span className="font-semibold text-gray-900">{fmtVND(mySubtotal)}</span>
                  </div>
                )}
                {paymentOpt === 'individual' && sharedShipping > 0 && (
                  <div className="flex justify-between text-gray-500">
                    <span>Shipping (Your share)</span>
                    <span className="font-medium">+{fmtVND(sharedShipping)}</span>
                  </div>
                )}
                {paymentOpt === 'individual' && myDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Your discount ({myDiscountPct.toFixed(1).replace(/\.0$/, '')}%)</span>
                    <span className="font-medium">−{fmtVND(myDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                  <span className="font-bold text-gray-900">Total</span>
                  <span className="font-extrabold text-green-600 text-base">
                    {fmtVND(paymentOpt === 'individual' ? myShare : groupTotal)}
                  </span>
                </div>
                {paymentOpt !== 'individual' && (
                  <p className="text-xs text-gray-400 text-center">
                    Your share:{" "}
                    <span className="font-semibold text-gray-700">{fmtVND(myShare)}</span>
                  </p>
                )}
              </div>
            )}

            {/* ── Wallet-hold CTA ── */}
            {myMember?.role !== 'owner' && (
              <>
                {/* Info badge – always shown, text depends on paymentOpt */}
                {paymentOpt === 'owner_only' ? (
                  <div className="mt-4 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                    <span className="text-lg flex-shrink-0">💳</span>
                    <div>
                      <p className="text-sm font-bold text-blue-700">The owner will pay this bill</p>
                      <p className="text-xs text-blue-500 mt-0.5">You just need to choose your items and confirm.</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                    <span className="text-lg flex-shrink-0">{paymentOpt === 'individual' ? '🧾' : '⚖️'}</span>
                    <div>
                      <p className="text-sm font-bold text-orange-700">
                        {paymentOpt === 'individual' ? 'Everyone pays their own share' : 'Bill split equally for everyone'}
                      </p>
                      <p className="text-xs text-orange-500 mt-0.5">
                        {paymentOpt === 'individual' ? 'Pay for your selected items via wallet.' : 'Total bill divided equally among all members.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment button / paid status – only for non-owner_only */}
                {paymentOpt !== 'owner_only' && (
                  <>
                    {/* Delivery note: items go to owner's address */}
                    <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                      <Truck className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-blue-700 leading-relaxed">
                        Your items will be delivered together to the group owner's address to save shipping costs.
                      </p>
                    </div>
                  </>
                )}

                {/* Payment button / paid status – only for non-owner_only */}
                {paymentOpt !== 'owner_only' && (
                  myMember?.walletPaid ? (
                    <div className="mt-3 flex items-center gap-2 bg-teal-50 border border-teal-200 rounded-xl px-4 py-3">
                      <Wallet className="w-4 h-4 text-teal-600 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-teal-700">Deposited!</p>
                        <p className="text-xs text-teal-600 mt-0.5">
                          You contributed <span className="font-bold">{fmtVND(myMember?.walletHoldAmount ?? myShare)}</span>. Waiting for the owner to place the order.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Wallet balance indicator */}
                      {myShare > 0 && isReady && (
                        <div className={`mt-3 flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-medium ${
                          walletBalance >= myShare
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

                      {/* Conditional: topup or deposit button */}
                      {myShare > 0 && isReady && walletBalance < myShare ? (
                        <button
                          onClick={() => setShowTopupModal(true)}
                          className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold shadow hover:from-pink-600 hover:to-rose-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                        >
                          <Wallet className="w-4 h-4" />
                          Top up {fmtVND(myShare - walletBalance)} to deposit
                        </button>
                      ) : (
                        <button
                          onClick={() => setHoldConfirm(true)}
                          disabled={(paymentOpt === 'equal_split' ? equalShare <= 0 : mySubtotal === 0) || !isReady}
                          className="mt-2 w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold shadow hover:from-teal-600 hover:to-emerald-600 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Wallet className="w-4 h-4" />
                          {paymentOpt === 'equal_split'
                            ? `Contribute equal share · ${fmtVND(equalShare)}`
                            : `Pay my share${mySubtotal > 0 ? ` · ${fmtVND(myShare)}` : ''}`}
                        </button>
                      )}
                      {paymentOpt === 'individual' && (
                        <p className="text-xs text-gray-400 text-center mt-1.5">
                          You are paying for your selected items only
                        </p>
                      )}
                    </>
                  )
                )}
              </>
            )}
            {myMember?.role !== 'owner' && paymentOpt !== 'owner_only' && !isReady && mySubtotal > 0 && !myMember?.walletPaid && (
              <p className="text-center text-xs text-amber-500 font-medium mt-1">
                ⚠ Please confirm you're ready before depositing
              </p>
            )}
          </div>

          {/* ── Member readiness avatars ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Member status</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {members.map((m, idx) => {
                const avatarReady = m.role === 'owner'
                  ? (m.cartItems ?? []).length > 0
                  : m.isReady;
                return (
                  <div key={m._id} title={getMemberName(m)} className="relative">
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl ${
                      avatarReady
                        ? "border-green-400 bg-green-50"
                        : "border-yellow-300 bg-yellow-50"
                    }`}>
                      {getAvatar(idx)}
                    </div>
                    {avatarReady && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Check className="w-2 h-2 text-white" />
                      </div>
                    )}
                </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {orderedCount}/{members.length} confirmed ready
            </p>
          </div>

          {/* ── Confirm / Already ready ── */}
          {isReady ? (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-green-700">You're done!</p>
                  <p className="text-xs text-green-600 mt-0.5">Waiting for the owner to place the order...</p>
                </div>
              </div>
              {!myMember?.walletPaid && !isLocked && (
                <button
                  onClick={handleUnconfirm}
                  disabled={unconfirming}
                  className="w-full py-2.5 rounded-2xl border border-gray-200 text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {unconfirming ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Updating...</>
                  ) : (
                    <><Minus className="w-4 h-4" /> Edit items</>
                  )}
                </button>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={handleConfirmReady}
                disabled={confirming || myCart.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-base font-extrabold shadow-lg hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirming ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Confirming...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Confirm Ready</>
                )}
              </button>
              {myCart.length === 0 && (
                <p className="text-center text-xs text-amber-500 font-medium -mt-1">
                  ⚠ Add at least 1 item to confirm
                </p>
              )}
            </>
          )}

          {/* ── Leave group ── */}
          <button
            onClick={handleLeave}
            disabled={leaving}
            className="w-full py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {leaving ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Leaving...</>
            ) : (
              <><LogOut className="w-4 h-4" /> Leave group</>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════ HOLD WALLET MODAL ══════════════ */}
      {showTopupModal && groupId && (
        <MemberQuickTopupModal
          shortfall={Math.max(0, myShare - walletBalance)}
          groupId={groupId}
          onClose={() => setShowTopupModal(false)}
        />
      )}

      {holdConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
             onClick={() => !holdLoading && setHoldConfirm(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-teal-500 to-emerald-500 text-white">
              <Wallet className="w-5 h-5" />
              <h3 className="text-lg font-bold flex-1">
                {paymentOpt === 'equal_split' ? 'Contribute equal share' : 'Deposit your share'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount row */}
              <div className="flex items-center justify-between bg-teal-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Your share</p>
                  <p className="text-2xl font-extrabold text-teal-600">{fmtVND(myShare)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Group</p>
                  <p className="text-sm font-bold text-gray-800">{group?.groupName}</p>
                  <p className="text-xs text-gray-400">{members.length} members</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
                💡 This amount will be <strong>held</strong> from your FreshMarket wallet. If you leave the group or the owner cancels the order, it will be <strong>refunded immediately</strong>.
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setHoldConfirm(false)}
                  disabled={holdLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleHoldWallet}
                  disabled={holdLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold hover:from-teal-600 hover:to-emerald-600 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {holdLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Deposit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
