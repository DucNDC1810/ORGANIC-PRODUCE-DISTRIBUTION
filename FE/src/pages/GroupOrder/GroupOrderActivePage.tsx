import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Copy,
  Check,
  Share2,
  ShoppingCart,
  Clock,
  Truck,
  ChevronRight,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Header from "../../components/Header";

// ─── Types & Constants ────────────────────────────────────────────────────────

interface GroupMember {
  id: number;
  name: string;
  avatar: string;
  isHost: boolean;
  items: number;
  total: number;
  status: "ordered" | "pending" | "invited";
}

interface CartItem {
  id: number;
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

const MOCK_MEMBERS: GroupMember[] = [
  { id: 1, name: "Bạn (chủ nhóm)",   avatar: "🧑‍🌾", isHost: true,  items: 3, total: 185000, status: "ordered"  },
  { id: 2, name: "Nguyễn Lan Anh",   avatar: "👩‍🍳", isHost: false, items: 2, total: 124000, status: "ordered"  },
  { id: 3, name: "Trần Minh Khôi",   avatar: "🧑‍💼", isHost: false, items: 0, total: 0,      status: "pending"  },
  { id: 4, name: "Lê Thu Hiền",      avatar: "👩‍🌾", isHost: false, items: 0, total: 0,      status: "invited"  },
];

const MOCK_CART: CartItem[] = [
  { id: 1, name: "Rau muống tươi",     price: 12000, qty: 2, image: "🥬", unit: "bó"  },
  { id: 2, name: "Cà chua bi hữu cơ", price: 35000, qty: 1, image: "🍅", unit: "túi" },
  { id: 3, name: "Dưa leo sạch",      price: 18000, qty: 2, image: "🥒", unit: "kg"  },
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

// ─── Component ───────────────────────────────────────────────────────────────

export default function GroupOrderActivePage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const groupName = (location.state as any)?.groupName ?? "Đơn hàng nhóm của Trung";

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
        name: item.name,
        price: item.price,
        qty: item.quantity,
        image: item.image || "🛒",
        unit: "phần",
      }))
    : MOCK_CART;

  const [members, setMembers]   = useState<GroupMember[]>(MOCK_MEMBERS);
  const [cart,    setCart]      = useState<CartItem[]>(initialCart);
  const [copied,  setCopied]    = useState(false);
  const [inviteLink]            = useState("https://freshmarket.vn/join/nhom-abc123");

  // derived
  const joinedCount   = members.filter((m) => m.status === "ordered").length;
  const activeTierIdx = TIERS.reduce((acc, t, i) => (joinedCount >= t.members ? i : acc), -1);
  const activePct     = activeTierIdx >= 0 ? TIERS[activeTierIdx].pct : 0;
  const nextTier      = TIERS[activeTierIdx + 1];
  const progress      = calcProgress(joinedCount);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const discount = Math.round(subtotal * activePct / 100);
  const total    = subtotal - discount;
  const allOrdered = members.every((m) => m.status === "ordered");

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

  const removeMember = (id: number) => setMembers((prev) => prev.filter((m) => m.id !== id));

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
            Quay lại
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-sm text-gray-400">Đặt đơn nhóm</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px]">{groupName}</span>
          <span className="ml-auto flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Đang mở
            </span>
          </span>
        </div>
      </div>

      {/* ── Group identity banner ── */}
      <div className="bg-orange-50 border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-orange-400 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-lg">👥</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-orange-700 truncate">{groupName}</p>
            <p className="text-xs text-orange-500">{joinedCount}/{members.length} thành viên đã thêm món</p>
          </div>
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              copied ? "bg-green-500 text-white" : "bg-orange-100 text-orange-700 hover:bg-orange-200"
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Đã sao chép link" : "Sao chép link mời"}
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-400 text-white text-xs font-semibold hover:bg-orange-500 transition-colors">
            <Share2 className="w-3.5 h-3.5" />
            Chia sẻ
          </button>
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
                <h2 className="text-lg font-extrabold text-gray-900">Nhận ưu đãi lên đến 10%!</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Hãy mời thêm thành viên và đảm bảo mọi thành viên đều đặt ít nhất 1 món.
                </p>
              </div>
              <button className="flex items-center gap-1 text-sm text-green-600 font-medium hover:underline flex-shrink-0 ml-4">
                Tìm hiểu thêm <ChevronRight className="w-3.5 h-3.5" />
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
                          {tier.members} người
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
                    Nhóm đang được giảm <span className="text-green-600 text-base">{activePct}%</span>
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 flex-1">
                  <Zap className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <p className="text-sm text-gray-500">
                    Cần <span className="font-bold text-gray-700">{TIERS[0].members} thành viên</span> để mở khoá ưu đãi đầu tiên
                  </p>
                </div>
              )}
              {nextTier && (
                <div className="text-xs text-gray-500 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5 text-center flex-shrink-0">
                  Thêm <span className="font-bold text-orange-600">{nextTier.members - joinedCount} người</span><br />
                  để đạt <span className="font-bold">{nextTier.pct}%</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Your cart items ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-green-600" />
                Món của bạn
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {cart.length}
                </span>
              </h3>
              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-1.5 text-sm text-green-600 font-medium hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm món
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Chưa có món nào. Hãy thêm vào giỏ hàng!</p>
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
                Thành viên nhóm
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  {members.length}
                </span>
              </h3>
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors">
                <UserPlus className="w-3.5 h-3.5" />
                Mời thêm thành viên
              </button>
            </div>

            <div className="space-y-2.5">
              {members.map((m) => (
                <div key={m.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xl shadow-sm">
                      {m.avatar}
                    </div>
                    {m.isHost && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange-400 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white">
                        👑
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {m.items > 0 ? `${m.items} món · ${fmtVND(m.total)}` : "Chưa thêm món"}
                    </p>
                  </div>
                  {/* Status badge */}
                  {m.status === "ordered" && (
                    <span className="flex items-center gap-1 text-xs text-green-600 font-semibold bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                      <Check className="w-3 h-3" />
                      Đã đặt món
                    </span>
                  )}
                  {m.status === "pending" && (
                    <span className="text-xs text-yellow-600 font-semibold bg-yellow-50 border border-yellow-200 px-2.5 py-1 rounded-full">
                      Đang chọn
                    </span>
                  )}
                  {m.status === "invited" && (
                    <span className="text-xs text-gray-400 font-medium bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-full">
                      Đã mời
                    </span>
                  )}
                  {!m.isHost && (
                    <button
                      onClick={() => removeMember(m.id)}
                      className="opacity-0 group-hover:opacity-100 w-7 h-7 rounded-full bg-red-50 text-red-400 hover:bg-red-100 hover:text-red-600 flex items-center justify-center transition-all flex-shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
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
                {copied ? "Đã sao chép" : "Sao chép"}
              </button>
              <button className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-colors flex-shrink-0">
                <Share2 className="w-3.5 h-3.5" />
                Chia sẻ
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
            <h3 className="text-base font-bold text-gray-900 mb-5">Tóm tắt đơn nhóm</h3>

            {/* Per-member rows */}
            <div className="space-y-3 mb-4">
              {members.filter((m) => m.items > 0).map((m) => (
                <div key={m.id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-base flex-shrink-0">
                    {m.avatar}
                  </div>
                  <p className="flex-1 text-xs text-gray-600 truncate">{m.name}</p>
                  <p className="text-xs font-semibold text-gray-900 flex-shrink-0">{fmtVND(m.total)}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 pt-4 space-y-2.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span className="font-semibold text-gray-900">{fmtVND(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Phí giao hàng</span>
                <span className="font-semibold text-gray-900">25.000đ</span>
              </div>
              {activePct > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Ưu đãi nhóm ({activePct}%)</span>
                  <span className="font-semibold">−{fmtVND(discount)}</span>
                </div>
              )}
              <div className="border-t border-gray-100 pt-2.5 flex justify-between">
                <span className="font-bold text-gray-900">Tổng cộng</span>
                <span className="font-extrabold text-green-600 text-base">{fmtVND(total + 25000)}</span>
              </div>
            </div>
          </div>

          {/* ── Member readiness ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Trạng thái thành viên</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {members.map((m) => (
                <div key={m.id} title={m.name} className="relative">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xl ${
                    m.status === "ordered"  ? "border-green-400 bg-green-50"  :
                    m.status === "pending"  ? "border-yellow-400 bg-yellow-50" :
                    "border-gray-200 bg-gray-50"
                  }`}>
                    {m.avatar}
                  </div>
                  {m.status === "ordered" && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <Check className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <button className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-green-400 hover:text-green-500 transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {allOrdered ? (
              <p className="text-xs text-green-600 font-semibold mt-3">✅ Tất cả thành viên đã đặt món!</p>
            ) : (
              <p className="text-xs text-gray-400 mt-3">
                {members.filter((m) => m.status === "ordered").length}/{members.length} đã thêm món
              </p>
            )}
          </div>

          {/* ── Checkout button ── */}
          <button
            onClick={() => navigate("/checkout")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-base font-extrabold shadow-lg hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-5 h-5" />
            Tiến hành thanh toán →
          </button>
          {!allOrdered && (
            <p className="text-center text-xs text-amber-500 font-medium -mt-1">
              ⚠ Còn {members.filter((m) => m.status !== "ordered").length} thành viên chưa đặt món
            </p>
          )}

          {/* ── Delivery scheduling ── */}
          <button className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-300 text-gray-500 text-sm font-medium hover:border-green-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2">
            <Clock className="w-4 h-4" />
            Đặt giao hàng sau
          </button>
        </div>
      </div>
    </div>
  );
}
