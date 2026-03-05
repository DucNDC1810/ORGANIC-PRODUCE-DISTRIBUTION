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
  ShieldCheck,
  Zap,
  Check,
  Lock,
  Wallet,
  Loader2,
} from "lucide-react";
import { io, type Socket } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { groupService, type Group, type GroupMember, type GroupCartItem } from "../../services/groupService";
import { useGroup } from "../../context/GroupContext";
import { useAuth } from "../../context/AuthContext";
import walletService from "../../services/walletService";

// ── Constants ──────────────────────────────────────────────────────────────────
const TIERS = [
  { members: 2, pct: 2 },
  { members: 3, pct: 4 },
  { members: 5, pct: 6 },
  { members: 8, pct: 10 },
];

const AVATARS = ["🧑‍🌾", "👩‍🍳", "🧑‍💼", "👩‍🌾", "👨‍🍳", "🧑‍🦱", "👩‍🦰", "🧑‍🦳"];
const SHIPPING = 25_000;

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtVND(n: number) {
  return n.toLocaleString("vi-VN") + "đ";
}

function getMemberName(m: GroupMember): string {
  return m.userId?.name || m.tempName || "Khách";
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

export default function GroupMemberPage() {
  const navigate = useNavigate();
  const { groupSession, clearGroupSession } = useGroup();
  const { user } = useAuth();

  const [group,      setGroup]      = useState<Group | null>(null);
  const [members,    setMembers]    = useState<GroupMember[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [myCart,     setMyCart]     = useState<GroupCartItem[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [leaving,    setLeaving]    = useState(false);

  // Pay-via-wallet to group owner
  const [payConfirm, setPayConfirm] = useState<{ ownerUserId: string; ownerName: string; amount: number } | null>(null);
  const [payLoading, setPayLoading] = useState(false);

  const socketRef = useRef<Socket | null>(null);

  const groupId  = groupSession?.groupId;
  const memberId = groupSession?.memberId;

  // ── Initial data load ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!groupId) { setError("Không tìm thấy phiên nhóm."); setLoading(false); return; }

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
      .catch(() => setError("Không tải được thông tin nhóm."))
      .finally(() => setLoading(false));
  }, [groupId, memberId]);

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
      toast.error("Không thể cập nhật số lượng.");
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
      toast.success("Xác nhận thành công! Đang chờ chủ nhóm chốt đơn.");
    } catch {
      toast.error("Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setConfirming(false);
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

  // ── Pay owner via wallet ───────────────────────────────────────────────────
  const handlePayOwner = async () => {
    if (!payConfirm) return;
    setPayLoading(true);
    try {
      const res = await walletService.transfer({
        toUserId: payConfirm.ownerUserId,
        amount:   payConfirm.amount,
        description: `Trả tiền nhóm "${group?.groupName}" cho ${payConfirm.ownerName}`,
      });
      const newBalance = (res as any)?.data?.walletBalance;
      toast.success(
        `Đã trả ${fmtVND(payConfirm.amount)} cho ${payConfirm.ownerName} thành công! 🎉` +
        (newBalance !== undefined ? ` Số dư ví: ${fmtVND(newBalance)}` : ''),
        { duration: 5000 }
      );
      setPayConfirm(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Thanh toán thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setPayLoading(false);
    }
  };

  // ── Derived values ─────────────────────────────────────────────────────────
  const myMember    = members.find((m) => m._id === memberId);
  const isReady     = myMember?.isReady ?? false;
  const isLocked    = group?.status === "locked" || group?.status === "completed";

  const orderedCount  = members.filter((m) => m.isReady).length;
  const activeTierIdx = TIERS.reduce((acc, t, i) => (orderedCount >= t.members ? i : acc), -1);
  const activePct     = activeTierIdx >= 0 ? TIERS[activeTierIdx].pct : 0;
  const nextTier      = TIERS[activeTierIdx + 1];
  const progress      = calcProgress(orderedCount);

  const mySubtotal  = myCart.reduce((s, i) => s + i.price * i.qty, 0);
  const groupTotal  = members.reduce((s, m) => {
    const items = m._id === memberId ? myCart : (m.cartItems ?? []);
    return s + items.reduce((si, i) => si + i.price * i.qty, 0);
  }, 0);
  const groupDiscount = Math.round(groupTotal * activePct / 100);

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
          <p className="text-gray-500 text-sm">{error || "Bạn chưa tham gia nhóm nào."}</p>
          <button
            onClick={() => navigate("/products")}
            className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
          >
            Về trang sản phẩm
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
            <h2 className="text-xl font-extrabold text-gray-900">Đơn hàng đã được chốt</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              Chủ nhóm đã chốt đơn. Bạn không thể thay đổi món lúc này.
            </p>
            <button
              onClick={() => navigate("/products")}
              className="w-full py-3 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 transition-colors"
            >
              Về trang sản phẩm
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
            Chọn món
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm font-bold text-gray-900 truncate flex-1">{group.groupName}</span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Đang mở
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
            <p className="text-xs text-orange-500">{orderedCount}/{members.length} thành viên đã chọn xong</p>
          </div>
          {/* Current user badge */}
          <div className="flex items-center gap-2 bg-white/70 border border-orange-100 rounded-xl px-3 py-1.5 flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{user?.name}</span>
            <span className="text-xs text-green-600 font-medium">(bạn)</span>
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
              <h2 className="text-lg font-extrabold text-gray-900">Nhận ưu đãi lên đến 10%!</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Cả nhóm cùng xác nhận chọn xong để được giảm giá tốt hơn.
              </p>
            </div>

            {/* Progress bar with tier dots */}
            <div className="relative mt-6 pb-8">
              <div className="relative h-2.5 bg-gray-200 rounded-full">
                <div
                  className="absolute top-0 left-0 h-2.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-700"
                  style={{ width: `${progress}%` }}
                />
                {TIERS.map((tier, i) => {
                  const left   = (i / (TIERS.length - 1)) * 100;
                  const active = orderedCount >= tier.members;
                  return (
                    <div
                      key={tier.members}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${left}%` }}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 z-10 transition-all duration-300 ${
                        active
                          ? "bg-green-500 border-green-500 shadow-md shadow-green-200"
                          : "bg-white border-gray-300"
                      }`} />
                      <div className="absolute top-6 flex flex-col items-center gap-0.5">
                        <span className={`text-sm font-extrabold ${active ? "text-green-600" : "text-gray-400"}`}>
                          {tier.pct}%
                        </span>
                        <span className={`text-xs whitespace-nowrap ${active ? "text-gray-600" : "text-gray-400"}`}>
                          {tier.members} người
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status pills */}
            <div className="flex items-center gap-3 mt-3">
              {activePct > 0 ? (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 flex-1">
                  <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-bold text-green-700">
                    Nhóm đang được giảm{" "}
                    <span className="text-green-600 text-base">{activePct}%</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
                  <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500">
                    Cần{" "}
                    <span className="font-bold text-gray-700">{TIERS[0].members} thành viên</span>{" "}
                    cùng chọn xong để mở khoá ưu đãi
                  </p>
                </div>
              )}
              {nextTier && (
                <div className="text-xs text-gray-500 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-center flex-shrink-0">
                  Thêm{" "}
                  <span className="font-bold text-orange-600">
                    {nextTier.members - orderedCount} người
                  </span>{" "}
                  chọn xong
                  <br />
                  để đạt{" "}
                  <span className="font-bold">{nextTier.pct}%</span>
                </div>
              )}
            </div>
          </div>

          {/* ── My cart ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Món của bạn
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
                  Thêm món
                </button>
              )}
            </div>

            {myCart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có món nào. Hãy chọn món của bạn!</p>
                <button
                  onClick={() => navigate("/products")}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors"
                >
                  Chọn món ngay
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
                Thành viên nhóm
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {members.length}
                </span>
              </h3>
              <span className="text-xs text-gray-400">{orderedCount}/{members.length} đã chọn xong</span>
            </div>

            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
              {members.map((m, idx) => {
                const isMe    = m._id === memberId;
                const isOwner = m.role === "owner";
                return (
                  <motion.div
                    key={m._id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                  <div
                    className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${
                      isMe
                        ? "bg-green-50 border-green-100"
                        : "bg-gray-50 border-gray-100"
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

                    {/* Name & role */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-sm font-semibold truncate ${isMe ? "text-green-700" : "text-gray-900"}`}>
                          {getMemberName(m)}
                        </span>
                        {isMe && (
                          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium flex-shrink-0">
                            bạn
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {isOwner ? "Chủ nhóm" : "Thành viên"}
                      </p>
                    </div>

                    {/* Status badge */}
                    {m.isReady ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full flex-shrink-0">
                        <Check className="w-3 h-3" />
                        Đã chọn xong
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full flex-shrink-0">
                        Đang chọn
                      </span>
                    )}

                    {/* Pay-via-wallet button — only for owner row, shown to non-owner members */}
                    {isOwner && !isMe && mySubtotal > 0 && m.userId?._id && (
                      <button
                        onClick={() => setPayConfirm({
                          ownerUserId: m.userId!._id,
                          ownerName:   getMemberName(m),
                          amount:      mySubtotal,
                        })}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-semibold shadow-sm hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all flex-shrink-0"
                      >
                        <Wallet className="w-3.5 h-3.5" />
                        Trả tiền qua ví
                      </button>
                    )}
                  </div>
                  </motion.div>
                );
              })}
              </AnimatePresence>
            </div>

            {orderedCount === members.length && members.length > 0 && (
              <div className="mt-4 py-3 bg-green-50 rounded-xl text-center text-sm text-green-700 font-semibold">
                🎉 Mọi người đã chọn xong món!
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
            <h3 className="text-base font-bold text-gray-900 mb-5">Tóm tắt đơn nhóm</h3>

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
                      {qty > 0 ? `${qty} món` : "Đang chọn"}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tạm tính (cả nhóm)</span>
                <span className="font-semibold text-gray-900">{fmtVND(groupTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí giao hàng</span>
                <span className="font-semibold text-gray-900">{fmtVND(SHIPPING)}</span>
              </div>
              {activePct > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Ưu đãi nhóm ({activePct}%)</span>
                  <span className="font-semibold">−{fmtVND(groupDiscount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="font-extrabold text-green-600 text-base">
                  {fmtVND(groupTotal - groupDiscount + SHIPPING)}
                </span>
              </div>
              <p className="text-xs text-gray-400 text-center">
                Phần của bạn:{" "}
                <span className="font-semibold text-gray-700">{fmtVND(mySubtotal)}</span>
              </p>
            </div>
          </div>

          {/* ── Member readiness avatars ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Trạng thái thành viên</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {members.map((m, idx) => (
                <div key={m._id} title={getMemberName(m)} className="relative">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl ${
                    m.isReady
                      ? "border-green-400 bg-green-50"
                      : "border-yellow-300 bg-yellow-50"
                  }`}>
                    {getAvatar(idx)}
                  </div>
                  {m.isReady && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              {orderedCount}/{members.length} đã xác nhận xong
            </p>
          </div>

          {/* ── Confirm / Already ready ── */}
          {isReady ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-bold text-green-700">Bạn đã xác nhận xong!</p>
                <p className="text-xs text-green-600 mt-0.5">Đang chờ chủ nhóm chốt đơn...</p>
              </div>
            </div>
          ) : (
            <>
              <button
                onClick={handleConfirmReady}
                disabled={confirming || myCart.length === 0}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-base font-extrabold shadow-lg hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {confirming ? (
                  <><RefreshCw className="w-5 h-5 animate-spin" /> Đang xác nhận...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Xác nhận chọn xong</>
                )}
              </button>
              {myCart.length === 0 && (
                <p className="text-center text-xs text-amber-500 font-medium -mt-1">
                  ⚠ Hãy thêm ít nhất 1 món để xác nhận
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
              <><RefreshCw className="w-4 h-4 animate-spin" /> Đang rời nhóm...</>
            ) : (
              <><LogOut className="w-4 h-4" /> Rời khỏi nhóm</>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════ PAY-VIA-WALLET MODAL ══════════════ */}
      {payConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
             onClick={() => !payLoading && setPayConfirm(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
              <Wallet className="w-5 h-5" />
              <h3 className="text-lg font-bold flex-1">Trả tiền qua ví</h3>
            </div>

            <div className="p-6 space-y-4">
              {/* Amount row */}
              <div className="flex items-center justify-between bg-emerald-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Phần của bạn</p>
                  <p className="text-2xl font-extrabold text-emerald-600">{fmtVND(payConfirm.amount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 mb-0.5">Chuyển đến</p>
                  <p className="text-sm font-bold text-gray-800">{payConfirm.ownerName}</p>
                  <p className="text-xs text-gray-400">Chủ nhóm</p>
                </div>
              </div>

              <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3 leading-relaxed">
                💡 Số tiền sẽ được chuyển ngay từ ví FreshMarket của bạn sang ví của chủ nhóm. Vui lòng đảm bảo số dư đủ.
              </p>

              {/* Actions */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setPayConfirm(null)}
                  disabled={payLoading}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Huỷ
                </button>
                <button
                  onClick={handlePayOwner}
                  disabled={payLoading}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {payLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Xác nhận trả tiền
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
