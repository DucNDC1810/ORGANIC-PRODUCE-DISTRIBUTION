import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus, ArrowDownLeft, ShoppingCart, RotateCcw,
  ChevronLeft, ChevronRight, X,
  Wallet, TrendingUp, Loader2
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import { toast } from 'sonner';
import walletService, { Transaction } from '../../services/walletService';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫';

function txIcon(type: Transaction['type']) {
  if (type === 'topup')   return <ArrowDownLeft className="w-5 h-5 text-green-600" />;
  if (type === 'payment') return <ShoppingCart   className="w-5 h-5 text-red-500"   />;
  return                         <RotateCcw      className="w-5 h-5 text-blue-500"  />;
}

function txBg(type: Transaction['type']) {
  if (type === 'topup')   return 'bg-green-50';
  if (type === 'payment') return 'bg-red-50';
  return 'bg-blue-50';
}

function txSign(type: Transaction['type']) {
  return type === 'payment' ? '-' : '+';
}

function txColor(type: Transaction['type']) {
  return type === 'payment' ? 'text-red-600' : 'text-emerald-600';
}

function txLabel(tx: Transaction) {
  if (tx.description) return tx.description;
  if (tx.type === 'topup')   return 'Nạp tiền vào ví';
  if (tx.type === 'payment') return `Thanh toán đơn hàng${tx.orderId ? ` #${String(tx.orderId).slice(-6)}` : ''}`;
  return 'Hoàn tiền';
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
}

// Aggregate spending (type=payment) by week or month
function aggregateSpending(txs: Transaction[], mode: 'week' | 'month') {
  const map: Record<string, number> = {};
  txs.filter(t => t.type === 'payment' && t.status === 'success').forEach(t => {
    const d = new Date(t.createdAt);
    let key: string;
    if (mode === 'month') {
      key = `T${d.getMonth() + 1}/${d.getFullYear()}`;
    } else {
      // ISO week
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const week = Math.ceil(((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7);
      key = `T${week}`;
    }
    map[key] = (map[key] ?? 0) + t.amount;
  });
  return Object.entries(map).map(([name, value]) => ({ name, value })).slice(-8);
}

// ─── Custom BarChart Tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg px-4 py-3 text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        <p className="text-emerald-600 font-bold">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ─── Top-up Modal ──────────────────────────────────────────────────────────────
interface TopUpModalProps {
  onClose: () => void;
}
function TopUpModal({ onClose }: TopUpModalProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const presets = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const handleTopUp = async () => {
    const amt = parseInt(amount.replace(/[^0-9]/g, ''));
    if (!amt || amt < 10000) { toast.error('Số tiền nạp tối thiểu là 10,000₫'); return; }
    setLoading(true);
    try {
      const res = await walletService.topUp(amt);
      const payUrl = (res as any)?.data?.payUrl || (res as any)?.payUrl;
      if (payUrl) {
        onClose();
        window.location.href = payUrl;
      } else {
        toast.error('Không thể tạo link thanh toán');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi kết nối MoMo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transition-all duration-200 scale-100">
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            <h3 className="text-lg font-bold">Nạp tiền vào ví</h3>
          </div>
          <button onClick={onClose} className="hover:bg-white/20 rounded-full p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Chọn mệnh giá</label>
            <div className="grid grid-cols-3 gap-2">
              {presets.map((p) => (
                <button
                  key={p}
                  onClick={() => setAmount(String(p))}
                  className={`py-2 text-sm rounded-xl border font-medium transition-all ${
                    amount === String(p)
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'border-gray-200 text-gray-600 hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  {p >= 1000000 ? `${p / 1000000}M` : `${p / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Hoặc nhập số tiền</label>
            <input
              type="text"
              value={amount ? parseInt(amount).toLocaleString('vi-VN') : ''}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Tối thiểu 10,000₫"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 bg-pink-50 rounded-xl p-3">
            <span className="text-pink-500 font-bold text-base">ⓘ</span>
            Thanh toán qua MoMo. Số tiền sẽ được cộng vào ví ngay sau khi giao dịch thành công.
          </div>

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Huỷ
            </button>
            <button
              onClick={handleTopUp}
              disabled={loading || !amount}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold hover:from-pink-600 hover:to-rose-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Thanh toán qua MoMo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main WalletTab ─────────────────────────────────────────────────────────────
export default function WalletTab() {
  const [balance, setBalance]         = useState(0);
  const [txAll, setTxAll]             = useState<Transaction[]>([]);   // all loaded (for chart)
  const [txPage, setTxPage]           = useState<Transaction[]>([]);   // paginated list
  const [loading, setLoading]         = useState(true);

  const [filterType, setFilterType]   = useState<'all' | 'topup' | 'payment' | 'refund'>('all');
  const [chartMode, setChartMode]     = useState<'week' | 'month'>('month');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  const [showTopUp, setShowTopUp] = useState(false);

  // Track previous balance for change notifications
  const prevBalanceRef   = useRef<number | null>(null);
  const isInitialLoad    = useRef(true);

  // ── balance change detector ──────────────────────────────────────────────
  useEffect(() => {
    if (isInitialLoad.current) return; // skip first mount
    if (prevBalanceRef.current === null) return;
    const diff = balance - prevBalanceRef.current;
    if (diff === 0) return;
    if (diff > 0) {
      toast.success(`Ví của bạn vừa được cộng +${fmt(diff)} 🎉`, { duration: 4000 });
    } else {
      toast.info(`Ví của bạn vừa bị trừ ${fmt(Math.abs(diff))}`, { duration: 4000 });
    }
    prevBalanceRef.current = balance;
  }, [balance]);

  // ── Fetch wallet data (re-usable) ────────────────────────────────────────
  const fetchWallet = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [infoRes, txAllRes] = await Promise.all([
        walletService.getWalletInfo(),
        walletService.getTransactions({ limit: 100 }),
      ]);
      const info = (infoRes as any)?.data ?? infoRes;
      const newBalance: number = info?.walletBalance ?? 0;

      setBalance((prev) => {
        if (!isInitialLoad.current && prevBalanceRef.current !== null && newBalance !== prev) {
          prevBalanceRef.current = prev; // will be compared in the balance useEffect
        }
        return newBalance;
      });

      const allTxData: Transaction[] = (txAllRes as any)?.data ?? [];
      setTxAll(allTxData);
    } catch {
      if (!silent) toast.error('Không thể tải thông tin ví');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      try {
        const [infoRes, txAllRes] = await Promise.all([
          walletService.getWalletInfo(),
          walletService.getTransactions({ limit: 100 })
        ]);
        const info = (infoRes as any)?.data ?? infoRes;
        const newBalance: number = info?.walletBalance ?? 0;
        setBalance(newBalance);
        prevBalanceRef.current = newBalance;

        const allTxData: Transaction[] = (txAllRes as any)?.data ?? [];
        setTxAll(allTxData);
      } catch {
        toast.error('Không thể tải thông tin ví');
      } finally {
        setLoading(false);
        isInitialLoad.current = false;
      }
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Periodic silent poll every 30s to catch refund/incoming transfers
  useEffect(() => {
    const id = window.setInterval(() => fetchWallet(true), 30_000);
    return () => window.clearInterval(id);
  }, [fetchWallet]);

  // Paginated + filtered
  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await walletService.getTransactions({
          page,
          limit: 8,
          type: filterType === 'all' ? undefined : filterType
        });
        const d = res as any;
        setTxPage(d?.data ?? []);
        setTotalPages(d?.pagination?.totalPages ?? 1);
      } catch {/* silent */}
    };
    fetchPage();
  }, [filterType, page]);

  const chartData = aggregateSpending(txAll, chartMode);

  const filterTabs: { key: typeof filterType; label: string }[] = [
    { key: 'all',     label: 'Tất cả' },
    { key: 'topup',   label: 'Nạp tiền' },
    { key: 'payment', label: 'Thanh toán' },
    { key: 'refund',  label: 'Hoàn tiền' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── 1. Balance Card ────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden shadow-lg">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600" />
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -left-6 w-52 h-52 bg-white/10 rounded-full" />

        <div className="relative px-6 py-7">
          <div className="flex items-center gap-2 mb-1">
            <Wallet className="w-5 h-5 text-white/80" />
            <span className="text-sm text-white/80 font-medium tracking-wide">Số dư khả dụng</span>
          </div>
          <p className="text-4xl font-bold text-white mb-1 tracking-tight">{fmt(balance)}</p>
          <p className="text-xs text-white/60 mb-6">Ví FreshMarket · Cập nhật theo thời gian thực</p>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-white text-emerald-600 rounded-xl text-sm font-semibold shadow-md hover:bg-emerald-50 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nạp tiền
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. First-time Empty State ─────────────────────────────────── */}
      {balance === 0 && txAll.length === 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
          {/* Top decorative strip */}
          <div className="h-1.5 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400" />
          <div className="flex flex-col items-center py-10 px-6 text-center">
            {/* Cute SVG illustration */}
            <div className="relative mb-5">
              <div className="w-28 h-28 rounded-full bg-emerald-50 flex items-center justify-center">
                <svg viewBox="0 0 120 120" className="w-20 h-20" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Body of wallet */}
                  <rect x="14" y="36" width="90" height="60" rx="12" fill="#D1FAE5" stroke="#6EE7B7" strokeWidth="3"/>
                  {/* Card slot */}
                  <rect x="24" y="72" width="40" height="14" rx="4" fill="#A7F3D0"/>
                  {/* Coin pocket */}
                  <rect x="78" y="52" width="20" height="28" rx="8" fill="#ECFDF5" stroke="#6EE7B7" strokeWidth="2.5"/>
                  {/* Coin inside pocket */}
                  <circle cx="88" cy="66" r="7" fill="#34D399" stroke="#10B981" strokeWidth="2"/>
                  <text x="88" y="70" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold">₫</text>
                  {/* Stars / sparkles */}
                  <circle cx="30" cy="30" r="4" fill="#FCD34D"/>
                  <circle cx="96" cy="22" r="3" fill="#FCA5A5"/>
                  <circle cx="14" cy="50" r="2.5" fill="#93C5FD"/>
                  {/* Floating coins */}
                  <ellipse cx="55" cy="22" rx="9" ry="9" fill="#FDE68A" stroke="#F59E0B" strokeWidth="2"/>
                  <text x="55" y="27" textAnchor="middle" fontSize="9" fill="#92400E" fontWeight="bold">₫</text>
                </svg>
              </div>
              {/* Animated pulse ring */}
              <div className="absolute inset-0 rounded-full border-4 border-emerald-100 animate-ping opacity-40" />
            </div>

            <h3 className="text-lg font-extrabold text-gray-800 mb-1">Chào mừng đến FreshMarket Wallet!</h3>
            <p className="text-sm text-gray-500 max-w-xs mb-6 leading-relaxed">
              Ví của bạn đang trống. Nạp tiền ngay để thanh toán nhanh, nhận hoàn tiền và nhiều ưu đãi độc quyền.
            </p>

            {/* Special first-topup CTA */}
            <button
              onClick={() => setShowTopUp(true)}
              className="flex items-center gap-2 px-7 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nạp tiền lần đầu để nhận ưu đãi 10k
            </button>

            {/* Trust badges */}
            <div className="flex items-center gap-4 mt-6">
              {[
                { icon: '🔒', label: 'Bảo mật SSL' },
                { icon: '⚡', label: 'Thanh toán tức thì' },
                { icon: '🎁', label: 'Ưu đãi thành viên' },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center gap-1">
                  <span className="text-xl">{b.icon}</span>
                  <span className="text-[10px] text-gray-400 font-medium">{b.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. & 4. Analytics + History (hidden for brand-new empty wallet) ── */}
      {(balance > 0 || txAll.length > 0) && (
        <>
        {/* ── 3. Spending Analytics ──────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-semibold text-gray-800">Chi tiêu thực phẩm hữu cơ</h3>
          </div>
          {/* Toggle week / month */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(['month', 'week'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChartMode(m)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                  chartMode === m ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {m === 'month' ? 'Theo tháng' : 'Theo tuần'}
              </button>
            ))}
          </div>
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <ShoppingCart className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Chưa có giao dịch nào để hiển thị</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} barSize={32} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis
                tickFormatter={(v) => v >= 1000000 ? `${v / 1000000}M` : v >= 1000 ? `${v / 1000}k` : v}
                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
                width={42}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F0FDF4' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i === chartData.length - 1 ? '#22C55E' : '#A7F3D0'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {chartData.length > 0 && (
          <p className="text-xs text-gray-400 text-right mt-1">
            Tổng chi: <span className="text-emerald-600 font-semibold">{fmt(chartData.reduce((s, d) => s + d.value, 0))}</span>
          </p>
        )}
      </div>

      {/* ── 4. Transaction History ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header + filter */}
        <div className="px-5 pt-5 pb-3 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800 mb-3">Lịch sử giao dịch</h3>
          <div className="flex gap-2 flex-wrap">
            {filterTabs.map((f) => (
              <button
                key={f.key}
                onClick={() => { setFilterType(f.key); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${
                  filterType === f.key
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : 'border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        {txPage.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Wallet className="w-10 h-10 mb-2 opacity-40" />
            <p className="text-sm">Chưa có giao dịch nào</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {txPage.map((tx) => (
              <li key={tx._id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${txBg(tx.type)}`}>
                  {txIcon(tx.type)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{txLabel(tx)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">{fmtDate(tx.createdAt)}</span>
                    {tx.status === 'pending' && (
                      <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                        Đang xử lý
                      </span>
                    )}
                    {tx.status === 'failed' && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
                        Thất bại
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <p className={`text-sm font-bold flex-shrink-0 ${txColor(tx.type)}`}>
                  {txSign(tx.type)}{fmt(tx.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 bg-gray-50/50">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Trước
            </button>
            <span className="text-xs text-gray-500">
              Trang <span className="font-semibold text-gray-700">{page}</span> / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Tiếp <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

        </> /* end fragment */
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </div>
  );
}
