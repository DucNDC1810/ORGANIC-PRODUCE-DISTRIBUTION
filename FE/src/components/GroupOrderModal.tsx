import { useState, useRef, useEffect } from "react";
import { ArrowLeft, FileText, Clock, Users, Pencil, Check, CreditCard, Banknote, ChevronRight } from "lucide-react";

export interface GroupOrderData {
  groupName: string;
  groupMembers: string;
  groupAddress: string;
  groupNotes: string;
  paymentMode: string;
  timeLimit: string;
}

const PAYMENT_OPTIONS = [
  {
    value: "Bạn thanh toán cho mọi người",
    label: "Bạn thanh toán cho mọi người",
    subtitle: null,
    action: null,
  },
  {
    value: "Chia hoá đơn với mọi người",
    label: "Chia hoá đơn với mọi người",
    subtitle: "Yêu cầu phương thức thanh toán không dùng tiền mặt",
    action: "Thiết lập",
  },
];

const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = ["00", "15", "30", "45"];

function formatTimeLimit(h: string, m: string) {
  const hNum = parseInt(h, 10);
  const mNum = parseInt(m, 10);
  if (hNum === 0 && mNum === 0) return "Không có";
  if (hNum === 0) return `${mNum} phút`;
  if (mNum === 0) return `${hNum} giờ`;
  return `${hNum} giờ ${mNum} phút`;
}

const TIERS = [
  { members: 2, pct: 2  },
  { members: 3, pct: 4  },
  { members: 5, pct: 6  },
  { members: 8, pct: 10 },
];

interface GroupOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: GroupOrderData) => void;
  initialData?: Partial<GroupOrderData>;
  userName?: string;
}

export default function GroupOrderModal({
  isOpen,
  onClose,
  onConfirm,
  initialData,
  userName = "Bạn",
}: GroupOrderModalProps) {
  const defaultName = `Đơn hàng nhóm của ${userName.split(" ").pop() ?? userName}`;

  const makeDefault = (): GroupOrderData => ({
    groupName:    initialData?.groupName    ?? defaultName,
    groupMembers: initialData?.groupMembers ?? "",
    groupAddress: initialData?.groupAddress ?? "",
    groupNotes:   initialData?.groupNotes   ?? "",
    paymentMode:  initialData?.paymentMode  ?? PAYMENT_OPTIONS[0].value,
    timeLimit:    initialData?.timeLimit    ?? "Không có",
  });

  const [data, setData]       = useState<GroupOrderData>(makeDefault);
  const [editing, setEditing] = useState<keyof GroupOrderData | null>(null);
  const [showPaymentSheet, setShowPaymentSheet]           = useState(false);
  const [showPaymentMethodSheet, setShowPaymentMethodSheet] = useState(false);
  const [selectedGroupPayMethod, setSelectedGroupPayMethod] = useState("COD");
  const [showTimeLimitSheet, setShowTimeLimitSheet] = useState(false);
  const [timeLimitHour,   setTimeLimitHour]   = useState("01");
  const [timeLimitMinute, setTimeLimitMinute] = useState("15");

  const memberCount    = Number(data.groupMembers) || 0;
  const activeTierIdx  = TIERS.reduce((acc, t, i) => (memberCount >= t.members ? i : acc), -1);

  const progressPct = (() => {
    if (memberCount <= 0) return 0;
    if (memberCount >= TIERS[TIERS.length - 1].members) return 100;
    const idx  = Math.max(activeTierIdx, 0);
    const cur  = TIERS[idx];
    const next = TIERS[idx + 1] ?? cur;
    const tierStart = (idx / (TIERS.length - 1)) * 100;
    const tierEnd   = ((idx + 1) / (TIERS.length - 1)) * 100;
    return tierStart + ((memberCount - cur.members) / (next.members - cur.members)) * (tierEnd - tierStart);
  })();

  const set = (key: keyof GroupOrderData, value: string) =>
    setData((prev) => ({ ...prev, [key]: value }));

  const handleConfirm = () => { onConfirm(data); setEditing(null); setShowPaymentSheet(false); setShowPaymentMethodSheet(false); setShowTimeLimitSheet(false); onClose(); };
  const handleClose   = () => { setData(makeDefault()); setEditing(null); setShowPaymentSheet(false); setShowPaymentMethodSheet(false); setShowTimeLimitSheet(false); onClose(); };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />

      {/* sheet */}
      <div
        className="relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: "95vh" }}
      >
        {/* ── Green header + banner ── */}
        <div className="relative bg-gradient-to-br from-green-600 to-emerald-500 pt-4 pb-0 flex-shrink-0">
          {/* nav row */}
          <div className="flex items-center gap-3 px-4 pb-3">
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h2 className="text-sm font-bold text-white">Đặt đơn nhóm</h2>
              <p className="text-xs text-green-100 truncate max-w-[220px]">{data.groupName}</p>
            </div>
          </div>

          {/* illustrated banner */}
          <div className="relative h-36 flex items-end justify-center overflow-hidden select-none pointer-events-none">
            <div className="absolute top-2 left-4 w-12 h-12 bg-yellow-400/90 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg">G</div>
            <div className="absolute top-6 left-14 w-8  h-8  bg-yellow-300/80 rounded-full flex items-center justify-center text-lg font-black text-white shadow">G</div>
            <div className="absolute top-1 right-10 w-5 h-5 bg-green-300/50 rounded-full" />
            <div className="absolute top-8 right-4  w-8 h-8 bg-emerald-300/40 rounded-full" />
            <div className="flex items-end gap-1 pb-1">
              {["🧑‍🌾", "👩‍🍳", "🧑‍💼", "👩‍🌾"].map((e, i) => (
                <span key={i} className="text-4xl drop-shadow-md" style={{ marginBottom: i % 2 === 1 ? 8 : 0 }}>
                  {e}
                </span>
              ))}
            </div>
            <div className="absolute bottom-3 right-6 bg-orange-400 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
              Đặt đơn nhóm
            </div>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto flex-1 px-4 pb-28 pt-0 space-y-4">

          {/* discount progress card — overlaps green header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 -mt-4 mx-1">
            <div className="flex items-start justify-between mb-1">
              <p className="text-sm font-bold text-gray-900">Nhận ưu đãi lên đến 10%!</p>
              <span className="text-gray-400 text-lg leading-none">›</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Hãy mời thêm thành viên và đảm bảo mọi thành viên đều đặt ít nhất 1 món.
            </p>

            {/* progress track */}
            <div className="relative">
              <div className="absolute top-2.5 left-0 right-0 h-1 bg-gray-200 rounded-full" />
              <div
                className="absolute top-2.5 left-0 h-1 bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
              <div className="relative flex justify-between">
                {TIERS.map((tier, i) => {
                  const active = activeTierIdx >= i;
                  return (
                    <div key={tier.members} className="flex flex-col items-center gap-1.5">
                      <div className={`w-5 h-5 rounded-full border-2 z-10 ${active ? "bg-green-500 border-green-500" : "bg-white border-gray-300"}`} />
                      <span className={`text-xs font-bold ${active ? "text-green-600" : "text-gray-400"}`}>{tier.pct}%</span>
                      <span className={`text-[10px] ${active ? "text-gray-600" : "text-gray-400"}`}>{tier.members} người</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* quick member count input */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-xs text-gray-500 flex-shrink-0">Số thành viên:</span>
              <input
                type="number"
                min={1}
                value={data.groupMembers}
                onChange={(e) => set("groupMembers", e.target.value)}
                placeholder="Nhập số người"
                className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-400"
              />
            </div>
          </div>

          {/* ── settings rows ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-100 overflow-hidden">

            <SettingRow
              icon={<FileText className="w-5 h-5 text-green-600" />}
              label="Thanh toán hoá đơn"
              isEditing={false}
              onEdit={() => setShowPaymentSheet(true)}
              displayValue={data.paymentMode}
              note={<span className="text-xs text-blue-500 font-medium cursor-pointer hover:underline">Tìm hiểu thêm</span>}
            >
              <></>
            </SettingRow>

            <SettingRow
              icon={<Clock className="w-5 h-5 text-green-600" />}
              label="Thời hạn thêm món"
              isEditing={false}
              onEdit={() => setShowTimeLimitSheet(true)}
              displayValue={data.timeLimit}
            >
              <></>
            </SettingRow>

            <SettingRow
              icon={<Users className="w-5 h-5 text-green-600" />}
              label="Tên nhóm"
              isEditing={editing === "groupName"}
              onEdit={() => setEditing(editing === "groupName" ? null : "groupName")}
              displayValue={data.groupName}
            >
              <div className="mt-2">
                <input
                  autoFocus
                  type="text"
                  value={data.groupName}
                  onChange={(e) => set("groupName", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && setEditing(null)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-400 text-sm"
                />
              </div>
            </SettingRow>
          </div>
        </div>

        {/* ── fixed footer ── */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 pt-3 bg-gradient-to-t from-white via-white to-transparent pointer-events-none">
          <button
            onClick={handleConfirm}
            className="w-full py-3.5 rounded-full bg-green-600 text-white text-sm font-bold hover:bg-green-700 active:scale-[0.98] transition-all shadow-md pointer-events-auto"
          >
            Tạo Đơn hàng nhóm
          </button>
        </div>
      </div>

      {/* ── Payment Methods sub-sheet (Thiết lập) ── */}
      {showPaymentMethodSheet && (
        <div className="absolute inset-0 z-20 flex items-stretch justify-center">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowPaymentMethodSheet(false)}
          />
          <div className="relative bg-white w-full sm:max-w-md flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
              <button
                onClick={() => setShowPaymentMethodSheet(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h3 className="text-lg font-bold text-gray-900 flex-1">Payment Methods</h3>
              <span className="text-xs text-gray-400">
                Powered by <span className="font-bold text-blue-600">moca</span>
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
              {/* Linked methods */}
              <div>
                <p className="text-base font-bold text-gray-900 mb-0.5">Các phương thức được liên kết</p>
                <p className="text-xs text-gray-400 mb-3">Quét sang trái để đặt làm mặc định.</p>
                <button
                  onClick={() => { setSelectedGroupPayMethod("COD"); }}
                  className="w-full flex items-center gap-3 py-3"
                >
                  <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
                    <Banknote className="w-5 h-5 text-green-600" />
                  </div>
                  <span className="flex-1 text-base text-gray-900 text-left">Tiền mặt</span>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedGroupPayMethod === "COD" ? "border-green-500 bg-green-500" : "border-gray-300"
                  }`}>
                    {selectedGroupPayMethod === "COD" && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                  </div>
                </button>
              </div>

              {/* Add more */}
              <div>
                <p className="text-base font-bold text-gray-900 mb-3">Thêm phương thức khác</p>
                <div className="space-y-0 divide-y divide-gray-100">
                  {[
                    {
                      key: "card",
                      icon: <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center"><CreditCard className="w-5 h-5 text-gray-500" /></div>,
                      label: "Thẻ",
                    },
                    {
                      key: "Viettel",
                      icon: <div className="w-10 h-10 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">VT</div>,
                      label: "Viettel Money",
                    },
                    {
                      key: "Momo",
                      icon: <div className="w-10 h-10 rounded-full bg-pink-600 flex items-center justify-center">
                              <span className="text-white text-[10px] font-black leading-none">mo<br/>mo</span>
                            </div>,
                      label: "MoMo",
                    },
                    {
                      key: "ZaloPay",
                      icon: <div className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center">
                              <span className="text-blue-600 text-[9px] font-black leading-none text-center">Zalo<br/>pay</span>
                            </div>,
                      label: "Zalopay",
                    },
                  ].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => { setSelectedGroupPayMethod(m.key); }}
                      className="w-full flex items-center gap-3 py-3 group"
                    >
                      {m.icon}
                      <span className="flex-1 text-base text-gray-900 text-left">{m.label}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Time Limit sub-sheet ── */}
      {showTimeLimitSheet && (
        <div className="absolute inset-0 z-20 flex items-stretch justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowTimeLimitSheet(false)} />
          <div className="relative bg-white w-full sm:max-w-md flex flex-col overflow-hidden">
            {/* Green header + banner */}
            <div className="relative bg-gradient-to-br from-green-600 to-emerald-500 pt-4 pb-0 flex-shrink-0">
              <div className="flex items-center gap-3 px-4 pb-3">
                <button
                  onClick={() => setShowTimeLimitSheet(false)}
                  className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-sm font-bold text-white">Đặt đơn nhóm</h2>
                  <p className="text-xs text-green-100 truncate max-w-[220px]">{data.groupName}</p>
                </div>
              </div>
              {/* illustrated banner */}
              <div className="relative h-36 flex items-end justify-center overflow-hidden select-none pointer-events-none">
                <div className="absolute top-2 left-4 w-12 h-12 bg-yellow-400/90 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-lg">G</div>
                <div className="absolute top-6 left-14 w-8  h-8  bg-yellow-300/80 rounded-full flex items-center justify-center text-lg font-black text-white shadow">G</div>
                <div className="absolute top-1 right-10 w-5 h-5 bg-green-300/50 rounded-full" />
                <div className="absolute top-8 right-4  w-8 h-8 bg-emerald-300/40 rounded-full" />
                <div className="flex items-end gap-1 pb-1">
                  {["🧑‍🌾", "👩‍🍳", "🧑‍💼", "👩‍🌾"].map((e, i) => (
                    <span key={i} className="text-4xl drop-shadow-md" style={{ marginBottom: i % 2 === 1 ? 8 : 0 }}>{e}</span>
                  ))}
                </div>
                <div className="absolute bottom-3 right-6 bg-orange-400 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md">
                  Đặt đơn nhóm
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pt-8 pb-6 flex flex-col">
              <h3 className="text-2xl font-extrabold text-gray-900 leading-snug mb-3">
                Đặt thời hạn cho các thành viên thêm món
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-10">
                Chúng tôi sẽ nhắc bạn đặt đơn khi gần đến thời hạn thêm món. Bạn có thể cập nhật thời hạn nếu các thành viên cần thêm thời gian.
              </p>

              {/* Drum picker */}
              <div className="flex items-center justify-center gap-4 mb-auto">
                <DrumPicker items={HOURS}   selected={timeLimitHour}   onChange={setTimeLimitHour} />
                <DrumPicker items={MINUTES} selected={timeLimitMinute} onChange={setTimeLimitMinute} />
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-8 pt-4 space-y-3 flex-shrink-0">
              <button
                onClick={() => {
                  set("timeLimit", formatTimeLimit(timeLimitHour, timeLimitMinute));
                  setShowTimeLimitSheet(false);
                }}
                className="w-full py-4 rounded-full bg-green-600 text-white text-base font-bold hover:bg-green-700 active:scale-[0.98] transition-all shadow-md"
              >
                Đặt thời hạn thêm món
              </button>
              <button
                onClick={() => {
                  set("timeLimit", "Không có");
                  setShowTimeLimitSheet(false);
                }}
                className="w-full py-4 rounded-full bg-gray-100 text-gray-700 text-base font-semibold hover:bg-gray-200 active:scale-[0.98] transition-all"
              >
                Bỏ qua thời hạn và tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentSheet && (
        <div className="absolute inset-0 z-10 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowPaymentSheet(false)}
          />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl px-5 pt-6 pb-10 shadow-2xl">
            {/* drag handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-5" />

            <h3 className="text-xl font-bold text-gray-900 mb-2">Chọn người thanh toán</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              Nếu bạn muốn chia hoá đơn này, vui lòng xem qua cách chúng tôi áp dụng để chia số tiền giảm giá,
              phí giao hàng và tiền típ cho mỗi người trong nhóm.
            </p>

            <div className="space-y-0 divide-y divide-gray-100">
              {PAYMENT_OPTIONS.map((opt) => {
                const selected = data.paymentMode === opt.value;
                const isSplit  = opt.action !== null; // "Chia hoá đơn" option
                return (
                  <button
                    key={opt.value}
                    onClick={() => {
                      if (!isSplit) {
                        set("paymentMode", opt.value);
                        setShowPaymentSheet(false);
                      }
                    }}
                    className="w-full flex items-center justify-between py-4 text-left group"
                  >
                    <div className="flex-1 pr-4">
                      <p className={`text-base ${selected && !isSplit ? "font-medium text-gray-900" : "text-gray-800"}`}>
                        {opt.label}
                      </p>
                      {opt.subtitle && (
                        <p className="text-xs text-gray-400 mt-0.5">{opt.subtitle}</p>
                      )}
                      {isSplit && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setShowPaymentMethodSheet(true); }}
                          className="text-xs text-blue-500 font-semibold mt-0.5 inline-block hover:underline"
                        >
                          Thiết lập
                        </button>
                      )}
                    </div>
                    {/* Radio only for non-split option */}
                    {!isSplit && (
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                        selected ? "border-green-500 bg-green-500" : "border-gray-300 bg-white group-hover:border-green-400"
                      }`}>
                        {selected && <div className="w-2.5 h-2.5 rounded-full bg-white" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── DrumPicker ── */
const DRUM_ITEM_H = 48;

function DrumPicker({
  items,
  selected,
  onChange,
}: {
  items: string[];
  selected: string;
  onChange: (val: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling  = useRef(false);
  const scrollTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync scroll position when selected changes externally
  useEffect(() => {
    const idx = items.indexOf(selected);
    if (containerRef.current && idx >= 0) {
      containerRef.current.scrollTop = idx * DRUM_ITEM_H;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = () => {
    isScrolling.current = true;
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      isScrolling.current = false;
      if (!containerRef.current) return;
      const rawIdx = containerRef.current.scrollTop / DRUM_ITEM_H;
      const idx    = Math.max(0, Math.min(Math.round(rawIdx), items.length - 1));
      // Snap to nearest
      containerRef.current.scrollTop = idx * DRUM_ITEM_H;
      if (items[idx] !== selected) onChange(items[idx]);
    }, 80);
  };

  return (
    <div className="relative" style={{ width: 88, height: DRUM_ITEM_H * 5 }}>
      {/* top fade */}
      <div
        className="absolute inset-x-0 top-0 z-10 pointer-events-none"
        style={{ height: DRUM_ITEM_H * 2, background: "linear-gradient(to bottom, white 20%, transparent)" }}
      />
      {/* bottom fade */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 pointer-events-none"
        style={{ height: DRUM_ITEM_H * 2, background: "linear-gradient(to top, white 20%, transparent)" }}
      />
      {/* selection band */}
      <div
        className="absolute inset-x-0 rounded-xl bg-gray-100 z-0"
        style={{ top: DRUM_ITEM_H * 2, height: DRUM_ITEM_H }}
      />
      {/* scroll container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-scroll"
        style={{
          scrollSnapType: "y mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        } as React.CSSProperties}
      >
        {/* top padding */}
        <div style={{ height: DRUM_ITEM_H * 2, flexShrink: 0 }} />
        {items.map((item) => {
          const active = item === selected;
          return (
            <div
              key={item}
              style={{ scrollSnapAlign: "center", height: DRUM_ITEM_H }}
              className="flex items-center justify-center cursor-pointer select-none"
              onClick={() => {
                const idx = items.indexOf(item);
                if (containerRef.current) containerRef.current.scrollTop = idx * DRUM_ITEM_H;
                onChange(item);
              }}
            >
              <span
                className="font-semibold transition-all duration-150"
                style={{
                  fontSize: active ? 28 : 20,
                  color: active ? "#111827" : "#9ca3af",
                }}
              >
                {item}
              </span>
            </div>
          );
        })}
        {/* bottom padding */}
        <div style={{ height: DRUM_ITEM_H * 2, flexShrink: 0 }} />
      </div>
    </div>
  );
}

/* ── helper sub-component ── */
function SettingRow({
  icon, label, isEditing, onEdit, displayValue, note, children,
}: {
  icon: React.ReactNode;
  label: string;
  isEditing: boolean;
  onEdit: () => void;
  displayValue: string;
  note?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="px-4 py-3.5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400">{label}</p>
          <p className="text-sm font-bold text-gray-900 truncate">{displayValue}</p>
          {note && !isEditing && <div className="mt-0.5">{note}</div>}
        </div>
        <button
          onClick={onEdit}
          className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
            isEditing ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          {isEditing ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>
      </div>
      {isEditing && <div className="mt-1">{children}</div>}
    </div>
  );
}
