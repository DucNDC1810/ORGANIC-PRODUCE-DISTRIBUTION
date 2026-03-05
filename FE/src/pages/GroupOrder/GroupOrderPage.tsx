import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { groupService } from "../../services/groupService";
import {
  ArrowLeft,
  Clock,
  Users,
  CreditCard,
  ChevronRight,
  Check,
  Edit3,
} from "lucide-react";
import Header from "../../components/Header";

// ─── Constants ───────────────────────────────────────────────────────────────

const TIERS = [
  { members: 2,  pct: 2  },
  { members: 3,  pct: 4  },
  { members: 5,  pct: 6  },
  { members: 8,  pct: 10 },
];

type PaymentOption = 'owner_only' | 'individual' | 'equal_split';

const PAYMENT_OPTIONS: { value: PaymentOption; label: string; subtitle: string | null; icon: string }[] = [
  { value: 'owner_only',   label: 'Bạn thanh toán cho mọi người',   subtitle: null,                                                           icon: '💳' },
  { value: 'individual',   label: 'Mỗi người trả theo món của mình', subtitle: 'Mỗi thành viên tự thanh toán phần của họ',                     icon: '🧾' },
  { value: 'equal_split',  label: 'Chia đều hoá đơn cho mọi người', subtitle: 'Tổng bill chia đều cho tất cả thành viên trong nhóm',           icon: '⚖️' },
];

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimeLimit(h: string, m: string) {
  const hNum = parseInt(h, 10);
  const mNum = parseInt(m, 10);
  if (hNum === 0 && mNum === 0) return "Không có";
  if (hNum === 0) return `${mNum} phút`;
  if (mNum === 0) return `${hNum} giờ`;
  return `${hNum} giờ ${mNum} phút`;
}

// ─── DrumPicker ──────────────────────────────────────────────────────────────

const DRUM_H = 52;

function DrumPicker({
  items,
  selected,
  onChange,
}: {
  items: string[];
  selected: string;
  onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const idx = items.indexOf(selected);
    if (ref.current && idx >= 0) ref.current.scrollTop = idx * DRUM_H;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onScroll = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (!ref.current) return;
      const idx = Math.max(0, Math.min(Math.round(ref.current.scrollTop / DRUM_H), items.length - 1));
      ref.current.scrollTop = idx * DRUM_H;
      if (items[idx] !== selected) onChange(items[idx]);
    }, 80);
  };

  return (
    <div className="relative" style={{ width: 100, height: DRUM_H * 5 }}>
      <div className="absolute inset-x-0 top-0 z-10 pointer-events-none" style={{ height: DRUM_H * 2, background: "linear-gradient(to bottom, white 20%, transparent)" }} />
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none" style={{ height: DRUM_H * 2, background: "linear-gradient(to top, white 20%, transparent)" }} />
      <div className="absolute inset-x-0 rounded-xl bg-gray-100 z-0" style={{ top: DRUM_H * 2, height: DRUM_H }} />
      <div
        ref={ref}
        onScroll={onScroll}
        className="absolute inset-0 overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory", scrollbarWidth: "none" } as React.CSSProperties}
      >
        <div style={{ height: DRUM_H * 2 }} />
        {items.map((item) => {
          const active = item === selected;
          return (
            <div
              key={item}
              style={{ scrollSnapAlign: "center", height: DRUM_H }}
              className="flex items-center justify-center cursor-pointer select-none"
              onClick={() => {
                const idx = items.indexOf(item);
                if (ref.current) ref.current.scrollTop = idx * DRUM_H;
                onChange(item);
              }}
            >
              <span className="font-semibold transition-all duration-150" style={{ fontSize: active ? 30 : 22, color: active ? "#111827" : "#9ca3af" }}>
                {item}
              </span>
            </div>
          );
        })}
        <div style={{ height: DRUM_H * 2 }} />
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function GroupOrderPage() {
  const navigate = useNavigate();
  const location  = useLocation();
  const passedCartItems = (location.state as any)?.cartItems ?? [];

  const [groupName,    setGroupName]    = useState("Đơn hàng nhóm của tôi");
  const [editingName,  setEditingName]  = useState(false);
  const [paymentMode,  setPaymentMode]  = useState<PaymentOption>('owner_only');
  const [timeLimit,    setTimeLimit]    = useState("Không có");

  // Time limit sheet
  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [tlHour,  setTlHour]  = useState("01");
  const [tlMin,   setTlMin]   = useState("15");

  // Payment sheet
  const [showPaySheet,  setShowPaySheet]  = useState(false);
  const [confirming,    setConfirming]    = useState(false);

  const handleConfirm = async () => {
    setConfirming(true);
    try {
      const group = await groupService.createGroup({
        groupName,
        paymentMethod: paymentMode,
        paymentOption: paymentMode,
        timeLimit: timeLimit !== "Đăng chờ" && timeLimit !== "Không có" ? null : null,
      });
      navigate("/group-order/active", {
        state: { groupName, cartItems: passedCartItems, groupId: group._id },
      });
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? "Không tạo được nhóm. Vui lòng thử lại.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* ── Page header bar ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại</span>
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <h1 className="text-base font-bold text-gray-900">Đặt đơn nhóm</h1>
          <span className="ml-auto text-xs text-gray-400">FreshMarket · {new Date().toLocaleDateString("vi-VN")}</span>
        </div>
      </div>

      {/* ── Main two-column layout ── */}
      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* ════════════════════════════════
            LEFT COLUMN  (2/3 width)
        ════════════════════════════════ */}
        <div className="lg:col-span-2 space-y-6">

          {/* ── Hero banner card ── */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            <div className="relative bg-gradient-to-br from-green-600 to-emerald-500 px-8 py-8 flex items-center justify-between">
              {/* text */}
              <div className="z-10">
                <p className="text-green-100 text-sm font-medium mb-1">FreshMarket</p>
                <h2 className="text-3xl font-extrabold text-white leading-tight mb-2">
                  Đặt đơn nhóm<br />
                  <span className="text-yellow-300">– tiết kiệm hơn!</span>
                </h2>
                <p className="text-green-100 text-sm max-w-xs leading-relaxed">
                  Mời bạn bè cùng đặt, nhận ưu đãi lên đến <span className="font-bold text-white">10%</span> cho cả nhóm.
                </p>
              </div>
              {/* decorative avatars */}
              <div className="flex items-end gap-2 select-none pointer-events-none">
                {["🧑‍🌾", "👩‍🍳", "🧑‍💼", "👩‍🌾"].map((e, i) => (
                  <span key={i} className="text-5xl drop-shadow-lg" style={{ marginBottom: i % 2 === 1 ? 16 : 0 }}>{e}</span>
                ))}
              </div>
              {/* decorative circles */}
              <div className="absolute top-4 right-40 w-16 h-16 bg-yellow-400/70 rounded-full flex items-center justify-center text-3xl font-black text-white shadow-lg">G</div>
              <div className="absolute top-10 right-28 w-10 h-10 bg-yellow-300/60 rounded-full flex items-center justify-center text-xl font-black text-white shadow">G</div>
            </div>
          </div>

          {/* ── Group name & invite link ── */}
          {/* ── Single setup card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 pt-5 pb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Thiết lập nhóm
              </h3>
            </div>

            {/* Group name inline edit */}
            <div className="px-6 pb-4 border-t border-gray-100 pt-4">
              <label className="text-xs text-gray-400 font-medium mb-1.5 block">Tên nhóm</label>
              <div className="flex items-center gap-3">
                {editingName ? (
                  <input
                    autoFocus
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    onBlur={() => setEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setEditingName(false)}
                    className="flex-1 px-4 py-2.5 border border-green-400 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                ) : (
                  <span className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-sm font-semibold text-gray-900 border border-transparent">
                    {groupName}
                  </span>
                )}
                <button
                  onClick={() => setEditingName((v) => !v)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                    editingName
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {editingName ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                  {editingName ? "Lưu" : "Chỉnh sửa"}
                </button>
              </div>
            </div>

            {/* Payment */}
            <SettingCard
              icon={<CreditCard className="w-5 h-5 text-green-600" />}
              label="Thanh toán hoá đơn"
              value={PAYMENT_OPTIONS.find(o => o.value === paymentMode)?.label ?? paymentMode}
              onEdit={() => setShowPaySheet(true)}
            />
            {/* Time limit */}
            <SettingCard
              icon={<Clock className="w-5 h-5 text-green-600" />}
              label="Thời hạn thêm món"
              value={timeLimit}
              onEdit={() => setShowTimeSheet(true)}
              valueClass={timeLimit === "Không có" ? "text-gray-400" : "text-gray-900"}
            />
          </div>

        </div>

        {/* ════════════════════════════════
            RIGHT COLUMN  (1/3 width, sticky)
        ════════════════════════════════ */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-[72px]">

          {/* ── Discount progress card ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-1">
              <p className="text-base font-extrabold text-gray-900">Nhận ưu đãi lên đến 10%!</p>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed mb-6">
              Mời thêm thành viên và đảm bảo mọi người đều đặt ít nhất 1 món.
            </p>

            {/* Static roadmap bar */}
            <div className="relative pt-1">
              <div className="relative h-2 bg-gray-200 rounded-full mb-8">
                {/* tier dots */}
                {TIERS.map((tier, i) => {
                  const left = (i / (TIERS.length - 1)) * 100;
                  return (
                    <div
                      key={tier.members}
                      className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 flex flex-col items-center"
                      style={{ left: `${left}%` }}
                    >
                      <div className="w-4 h-4 rounded-full border-2 bg-white border-gray-300 z-10" />
                      <div className="absolute top-5 flex flex-col items-center">
                        <span className="text-xs font-bold whitespace-nowrap text-gray-500">{tier.pct}%</span>
                        <span className="text-[10px] whitespace-nowrap text-gray-400">{tier.members} người</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Confirm button ── */}
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-green-600 to-emerald-500 text-white text-base font-extrabold shadow-lg hover:from-green-700 hover:to-emerald-600 active:scale-[0.98] transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {confirming ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Đang tạo nhóm...
              </>
            ) : "Tạo Đơn hàng nhóm →"}
          </button>
          <p className="text-center text-xs text-gray-400">
            Bạn có thể mời thành viên sau khi tạo nhóm
          </p>
        </div>
      </div>

      {/* ════════════ TIME LIMIT SHEET ════════════ */}
      {showTimeSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowTimeSheet(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Green header */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-500 px-6 py-5 flex items-center gap-3">
              <button onClick={() => setShowTimeSheet(false)} className="w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <p className="text-xs text-green-100">Đặt đơn nhóm</p>
                <p className="text-sm font-bold text-white">{groupName}</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-8 pt-8 pb-6">
              <h3 className="text-2xl font-extrabold text-gray-900 leading-snug mb-3">
                Đặt thời hạn cho các thành viên thêm món
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-8">
                Chúng tôi sẽ nhắc bạn đặt đơn khi gần đến thời hạn thêm món. Bạn có thể cập nhật thời hạn nếu các thành viên cần thêm thời gian.
              </p>

              {/* Drum pickers */}
              <div className="flex items-center justify-center gap-6">
                <DrumPicker items={HOURS}   selected={tlHour} onChange={setTlHour} />
                <span className="text-3xl font-bold text-gray-300 select-none mb-1">:</span>
                <DrumPicker items={MINUTES} selected={tlMin}  onChange={setTlMin} />
              </div>
              <p className="text-center text-xs text-gray-400 mt-3">
                {formatTimeLimit(tlHour, tlMin) === "Không có" ? "Không giới hạn thời gian" : `Thời hạn: ${formatTimeLimit(tlHour, tlMin)}`}
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-7 space-y-3">
              <button
                onClick={() => { setTimeLimit(formatTimeLimit(tlHour, tlMin)); setShowTimeSheet(false); }}
                className="w-full py-3.5 rounded-2xl bg-green-600 text-white font-bold text-base hover:bg-green-700 active:scale-[0.98] transition-all shadow-md"
              >
                Đặt thời hạn thêm món
              </button>
              <button
                onClick={() => { setTimeLimit("Không có"); setShowTimeSheet(false); }}
                className="w-full py-3.5 rounded-2xl bg-gray-100 text-gray-700 font-semibold text-base hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Bỏ qua thời hạn và tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════ PAYMENT SHEET ════════════ */}
      {showPaySheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowPaySheet(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 pt-6 pb-2 flex items-center gap-3 border-b border-gray-100">
              <button onClick={() => setShowPaySheet(false)} className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h3 className="text-lg font-bold text-gray-900">Chọn người thanh toán</h3>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                Chọn cách thanh toán cho nhóm của bạn. Bạn có thể thay đổi sau khi nhóm đã được tạo.
              </p>
              <div className="space-y-2">
                {PAYMENT_OPTIONS.map((opt) => {
                  const selected = paymentMode === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => { setPaymentMode(opt.value); setShowPaySheet(false); }}
                      className={`w-full flex items-center justify-between py-4 px-4 text-left rounded-2xl border-2 transition-all ${
                        selected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm text-xl">
                          {opt.icon}
                        </div>
                        <div>
                          <p className={`text-sm ${selected ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{opt.label}</p>
                          {opt.subtitle && <p className="text-xs text-gray-400 mt-0.5">{opt.subtitle}</p>}
                        </div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-colors ${selected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* External payment methods hint */}
              <div className="mt-4 border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-3 font-medium">Phương thức thanh toán khác</p>
                <div className="flex items-center gap-3">
                  {[
                    { key: "momo", label: "MoMo", icon: <span className="text-white text-[9px] font-black leading-none">mo<br />mo</span>, bg: "bg-pink-600" },
                    { key: "card", label: "Thẻ", icon: <CreditCard className="w-4 h-4 text-gray-500" />, bg: "bg-gray-100" },
                  ].map((m) => (
                    <button key={m.key} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors text-xs text-gray-600 font-medium">
                      <div className={`w-7 h-7 rounded-full ${m.bg} flex items-center justify-center flex-shrink-0`}>{m.icon}</div>
                      {m.label}
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SettingCard ─────────────────────────────────────────────────────────────

function SettingCard({
  icon,
  label,
  value,
  onEdit,
  valueClass = "text-gray-900",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onEdit: () => void;
  valueClass?: string;
}) {
  return (
    <div className="px-6 py-4 flex items-center gap-4 group hover:bg-gray-50/80 transition-colors cursor-pointer" onClick={onEdit}>
      <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className={`text-sm font-bold ${valueClass} truncate`}>{value}</p>
      </div>
      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
        <Edit3 className="w-3.5 h-3.5" />
        Chỉnh sửa
      </button>
    </div>
  );
}
