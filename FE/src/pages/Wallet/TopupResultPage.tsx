import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wallet, CheckCircle2, XCircle, Loader2,
  ArrowRight, ShoppingBag, RefreshCw, Home,
} from 'lucide-react';
import Header from '../../components/Header';
import walletService from '../../services/walletService';

// ─── Confetti colours (matches OrderSuccessPage palette) ──────────────────────
const CONFETTI_COLORS = [
  '#22c55e', '#16a34a', '#4ade80', '#86efac',
  '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa', '#f472b6',
];

// ─── Pre-generate confetti pieces (stable – never re-calculated) ───────────────
const confettiPieces = Array.from({ length: 60 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  delay: Math.random() * 0.9,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  duration: 2.4 + Math.random() * 1.8,
  rotate: Math.random() > 0.5 ? 360 : -360,
  drift: (Math.random() - 0.5) * 130,
  size: 6 + Math.random() * 7,
  isCircle: Math.random() > 0.55,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  n.toLocaleString('vi-VN') + '₫';

function fmtDate(date: Date) {
  return date.toLocaleString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// ─── Animation variants ────────────────────────────────────────────────────────
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const item = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { type: 'tween' as const, duration: 0.45, ease: 'easeOut' as const } },
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function TopupResultPage() {
  const [searchParams] = useSearchParams();
  const navigate       = useNavigate();

  // ── Derive outcome from MoMo params ────────────────────────────────────────
  //  New flow:  /wallet-topup?resultCode=0&amount=...&transId=...
  //  Legacy:    /wallet?topup=success&partnerCode=MOMO&amount=...&transId=...
  const resultCode   = searchParams.get('resultCode');
  const topupParam   = searchParams.get('topup');          // legacy "success" / "failed"
  const momoAmount   = Number(searchParams.get('amount') ?? '0');
  const transId      = searchParams.get('transId') ?? '';
  const momoMsg      = searchParams.get('message') ?? '';
  const partnerCode  = searchParams.get('partnerCode');
  const momoOrderId  = searchParams.get('orderId') ?? '';
  const momoRequestId = searchParams.get('requestId') ?? '';

  // resultCode '0' === success (new flow); "topup=success" === legacy flow
  const isSuccess   = resultCode === '0' || topupParam === 'success';
  // No MoMo params at all → direct nav / not a real result page
  const isDirectNav = resultCode === null && topupParam === null && partnerCode === null;

  // ── State ──────────────────────────────────────────────────────────────────
  const [newBalance, setNewBalance] = useState<number | null>(null);
  const [loading,    setLoading]    = useState(isSuccess);   // only fetch if success
  const [now]        = useState(() => new Date());

  // ── Fetch fresh wallet info to confirm balance ─────────────────────────────
  useEffect(() => {
    if (!isSuccess) return;
    let cancelled = false;

    const verifyAndFetch = async () => {
      try {
        // Nếu có orderId dạng "topup_<transactionId>", gọi verify-topup để
        // cập nhật DB phòng trường hợp IPN webhook không tới được server.
        if (momoOrderId && momoOrderId.startsWith('topup_')) {
          try {
            const verifyRes = await walletService.verifyTopUp(momoOrderId, momoRequestId || momoOrderId);
            if (!cancelled) {
              setNewBalance((verifyRes as any)?.data?.walletBalance ?? null);
              setLoading(false);
              return; // balance đã có từ verify, không cần fetch lại
            }
          } catch (verifyErr) {
            // Nếu verify lỗi, fallback sang getWalletInfo
            console.error('verifyTopUp error, falling back to getWalletInfo', verifyErr);
          }
        }

        // Fallback: lấy số dư hiện tại
        const res  = await walletService.getWalletInfo();
        const info = (res as any)?.data ?? res;
        if (!cancelled) setNewBalance(info?.walletBalance ?? null);
      } catch {
        if (!cancelled) setNewBalance(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // Give the IPN webhook ~1 s to credit the balance before we fetch
    const t = window.setTimeout(verifyAndFetch, 1200);
    return () => { cancelled = true; window.clearTimeout(t); };
  }, [isSuccess]);

  // ── Direct navigation guard ────────────────────────────────────────────────
  if (isDirectNav) {
    return (
      <>
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <Wallet className="w-14 h-14 text-gray-300 mx-auto" />
            <p className="text-gray-500">Không có thông tin giao dịch.</p>
            <button
              onClick={() => navigate('/profile?tab=wallet')}
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-700 transition-colors"
            >
              Về trang ví
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Loading overlay after MoMo redirect ───────────────────────────────────
  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-lg">
            <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto" />
            <p className="text-gray-600 font-medium">Đang xác nhận giao dịch nạp tiền…</p>
          </div>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  SUCCESS  UI
  // ════════════════════════════════════════════════════════════════════════════
  if (isSuccess) {
    return (
      <>
        <Header />

        {/* ── Confetti ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-50" aria-hidden>
          {confettiPieces.map((p) => (
            <motion.div
              key={p.id}
              className="absolute top-0"
              style={{
                left: `${p.x}%`,
                width:  p.size,
                height: p.size,
                borderRadius: p.isCircle ? '50%' : '2px',
                backgroundColor: p.color,
              }}
              initial={{ y: 0, rotate: 0, opacity: 1, x: 0 }}
              animate={{
                y: '110vh',
                rotate: p.rotate,
                x: p.drift,
                opacity: [1, 1, 0.8, 0],
              }}
              transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
            />
          ))}
        </div>

        {/* ── Page body ── */}
        <div className="max-w-2xl mx-auto px-4 py-14">
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            className="space-y-7"
          >
            {/* ── Hero ── */}
            <motion.div variants={item} className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.2 }}
                className="inline-flex mb-6"
              >
                <div className="relative w-24 h-24">
                  <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-pulse" />
                  <div className="relative w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center ring-4 ring-emerald-100">
                    <CheckCircle2 className="w-14 h-14 text-emerald-500" strokeWidth={1.5} />
                  </div>
                </div>
              </motion.div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">
                Nạp tiền thành công! 🎉
              </h1>
              <p className="text-base text-gray-500 max-w-sm mx-auto">
                Số tiền đã được cộng vào Ví FreshMarket của bạn ngay lập tức.
              </p>
            </motion.div>

            {/* ── Info cards ── */}
            <motion.div variants={item} className="grid grid-cols-2 gap-4">
              {/* Amount topped up */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100 shadow-sm">
                <p className="text-xs font-medium text-emerald-600 uppercase tracking-wide mb-1">
                  Số tiền vừa nạp
                </p>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
                  +{fmt(momoAmount)}
                </p>
                <p className="text-xs text-gray-400 mt-1">Qua MoMo · An toàn & tức thì</p>
              </div>

              {/* New balance */}
              <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-medium text-white/80 uppercase tracking-wide mb-1">
                  Số dư mới
                </p>
                {newBalance !== null ? (
                  <p className="text-2xl sm:text-3xl font-extrabold text-white">
                    {fmt(newBalance)}
                  </p>
                ) : (
                  <p className="text-lg font-semibold text-white/70 mt-1">Đang cập nhật…</p>
                )}
                <p className="text-xs text-white/60 mt-1">Ví FreshMarket</p>
              </div>
            </motion.div>

            {/* ── Transaction detail card ── */}
            <motion.div variants={item}>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Card header */}
                <div className="flex items-center gap-2 px-5 py-4 bg-gradient-to-r from-emerald-50 to-white border-b border-gray-100">
                  <Wallet className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-800">Chi tiết giao dịch</span>
                </div>

                <dl className="divide-y divide-gray-50 text-sm">
                  {[
                    { label: 'Thời gian',           value: fmtDate(now)                       },
                    { label: 'Phương thức',          value: 'MoMo Wallet'                      },
                    { label: 'Trạng thái',           value: '✅ Thành công'                    },
                    ...(transId ? [{ label: 'Mã giao dịch MoMo', value: transId }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-5 py-3.5">
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="font-semibold text-gray-800 text-right max-w-[55%] break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </motion.div>

            {/* ── CTA buttons ── */}
            <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 pt-1">
              <button
                onClick={() => navigate('/profile?tab=wallet')}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-200 hover:from-emerald-600 hover:to-teal-600 active:scale-[0.98] transition-all"
              >
                <Wallet className="w-4 h-4" />
                Xem ví của tôi
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/products')}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 active:scale-[0.98] transition-all"
              >
                <ShoppingBag className="w-4 h-4" />
                Sử dụng ví để mua hàng
              </button>
            </motion.div>

            {/* ── Home link ── */}
            <motion.div variants={item} className="text-center">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Home className="w-3.5 h-3.5" />
                Về trang chủ
              </button>
            </motion.div>
          </motion.div>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  //  FAILURE  UI
  // ════════════════════════════════════════════════════════════════════════════
  const errorMessage = (() => {
    if (topupParam === 'failed') return 'Giao dịch bị huỷ hoặc không thành công.';
    if (momoMsg && momoMsg.toLowerCase() !== 'failed') return momoMsg;
    if (resultCode === '1006') return 'Giao dịch bị huỷ bởi người dùng.';
    if (resultCode === '1005') return 'URL hoặc QR code hết hạn.';
    if (resultCode === '49')   return 'Số tiền nạp vượt hạn mức cho phép.';
    return 'Giao dịch không thành công. Vui lòng thử lại.';
  })();

  return (
    <>
      <Header />

      <div className="max-w-lg mx-auto px-4 py-20">
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-7 text-center"
        >
          {/* ── Error icon ── */}
          <motion.div variants={item}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16, delay: 0.1 }}
              className="inline-flex"
            >
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-red-50 rounded-full animate-pulse" />
                <div className="relative w-24 h-24 bg-red-50 rounded-full flex items-center justify-center ring-4 ring-red-100">
                  <XCircle className="w-14 h-14 text-red-500" strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Title ── */}
          <motion.div variants={item}>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Nạp tiền thất bại</h1>
            <p className="text-base text-gray-500 max-w-xs mx-auto">{errorMessage}</p>
            {resultCode && resultCode !== '0' && (
              <p className="text-xs text-gray-400 mt-1">Mã lỗi: {resultCode}</p>
            )}
          </motion.div>

          {/* ── Error detail box ── */}
          <motion.div variants={item}>
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-left space-y-2 text-sm">
              {[
                { label: 'Thời gian',    value: fmtDate(now)      },
                { label: 'Kết quả',      value: '❌ Thất bại'     },
                ...(momoAmount > 0 ? [{ label: 'Số tiền',   value: fmt(momoAmount) }] : []),
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Ví FreshMarket của bạn không bị trừ tiền trong giao dịch này.
            </p>
          </motion.div>

          {/* ── CTAs ── */}
          <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 pt-1">
            <button
              onClick={() => navigate('/profile?tab=wallet')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-rose-200 hover:from-rose-600 hover:to-pink-600 active:scale-[0.98] transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Thử lại nạp tiền
            </button>

            <button
              onClick={() => navigate('/products')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-sm hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Tiếp tục mua hàng
            </button>
          </motion.div>

          <motion.div variants={item}>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Home className="w-3.5 h-3.5" />
              Về trang chủ
            </button>
          </motion.div>
        </motion.div>
      </div>
    </>
  );
}
