import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Crown,
  Wallet,
  ShoppingBag,
  ArrowRight,
  Home,
  Star,
  MapPin,
  Clock,
  Users,
  Receipt,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';

// ── Constants ──────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#22c55e', '#16a34a', '#4ade80', '#86efac',
  '#fbbf24', '#f59e0b', '#60a5fa', '#a78bfa', '#f472b6',
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtVND(n: number) {
  return n.toLocaleString('vi-VN') + 'đ';
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface OwnerSuccessState {
  ownerName?: string;
  groupName?: string;
  orderId?: string;
  groupTotal?: number;          // total bill including shipping, after discount
  subtotal?: number;            // raw items sum before discount
  discount?: number;
  activePct?: number;
  totalMemberDeposits?: number; // total held from members' wallets
  ownerPaid?: number;           // actual amount deducted from owner's wallet
  walletBalance?: number;       // owner wallet balance after payment
  memberCount?: number;
  ownerCart?: Array<{ name: string; price: number; qty: number; image: string }>;
}

// ── Animation variants ─────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 280, damping: 22 },
  },
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function GroupOwnerSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const state                 = (location.state as OwnerSuccessState) || {};
  const ownerName             = state.ownerName             || 'Group Owner';
  const groupName             = state.groupName             || 'Group Order';
  const groupTotal            = state.groupTotal            || 0;
  const subtotal              = state.subtotal              || 0;
  const discount              = state.discount              || 0;
  const activePct             = state.activePct             || 0;
  const totalMemberDeposits   = state.totalMemberDeposits   || 0;
  const ownerPaid             = state.ownerPaid             || 0;
  const walletBalance         = state.walletBalance;
  const memberCount           = state.memberCount           || 0;
  const ownerCart             = state.ownerCart             || [];

  // Estimated delivery: 2–3 ngày từ hôm nay
  const deliveryStart = new Date();
  deliveryStart.setDate(deliveryStart.getDate() + 2);
  const deliveryEnd = new Date();
  deliveryEnd.setDate(deliveryEnd.getDate() + 3);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const estimatedDelivery = `${fmt(deliveryStart)} – ${fmt(deliveryEnd)}`;

  // Generate confetti once on mount
  const [confettiPieces] = useState(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 1.0,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: 2.4 + Math.random() * 1.6,
      rotate: Math.random() > 0.5 ? 360 : -360,
      drift: (Math.random() - 0.5) * 120,
      isCircle: Math.random() > 0.6,
    }))
  );

  const ownerSubtotal = ownerCart.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />

      {/* ── Confetti ── */}
      {confettiPieces.map((piece) => (
        <motion.div
          key={piece.id}
          className="fixed pointer-events-none z-[60]"
          style={{
            left: `${piece.x}%`,
            top: -14,
            width:  piece.isCircle ? '9px' : '6px',
            height: piece.isCircle ? '9px' : '13px',
            borderRadius: piece.isCircle ? '50%' : '3px',
            backgroundColor: piece.color,
          }}
          initial={{ y: 0, rotate: 0, opacity: 1, x: 0 }}
          animate={{
            y: '110vh',
            rotate: piece.rotate,
            x: piece.drift,
            opacity: [1, 1, 0.8, 0],
          }}
          transition={{ duration: piece.duration, delay: piece.delay, ease: 'easeIn' }}
        />
      ))}

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* ── Success Header ── */}
          <motion.div variants={itemVariants} className="text-center space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="inline-flex"
            >
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            </motion.div>

            {/* Owner role badge */}
            <div className="flex items-center justify-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 border border-orange-200 text-orange-700 text-xs font-bold">
                <Crown className="w-3.5 h-3.5" />
                Group Owner
              </span>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Group order placed! 🎉
              </h1>
              <p className="mt-2 text-gray-600 text-base sm:text-lg leading-relaxed">
                Congratulations{' '}
                <span className="font-bold text-green-600">{ownerName}</span>!{' '}
                Group order{' '}
                <span className="font-semibold text-gray-800">{groupName}</span>{' '}
                confirmed with{' '}
                <span className="font-semibold text-green-700">{memberCount} members</span>.
              </p>
            </div>
          </motion.div>

          {/* ── Bảng đối soát tiền ── */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50">
              <Receipt className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900 text-sm">Payment Summary</h3>
            </div>

            <div className="p-5 space-y-2.5 text-sm">
              {/* Row: Tổng tiền hàng */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Items subtotal</span>
                <span className="font-semibold text-gray-900">{fmtVND(subtotal)}</span>
              </div>

              {/* Row: Phí giao hàng */}
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Shipping fee</span>
                <span className="font-semibold text-gray-900">25.000đ</span>
              </div>

              {/* Row: Ưu đãi nhóm */}
              {discount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    Group discount ({activePct}%)
                  </span>
                  <span className="font-semibold">−{fmtVND(discount)}</span>
                </div>
              )}

              {/* Divider → Tổng bill */}
              <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center">
                <span className="font-bold text-gray-800">Total bill</span>
                <span className="font-extrabold text-gray-900">{fmtVND(groupTotal)}</span>
              </div>

              {/* Row: Tiền cọc thành viên */}
              {totalMemberDeposits > 0 && (
                <div className="flex justify-between items-center text-teal-600">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Member deposits
                  </span>
                  <span className="font-semibold">−{fmtVND(totalMemberDeposits)}</span>
                </div>
              )}

              {/* Divider → Thực chi ví Owner */}
              <div className="pt-2">
                <div
                  className={`flex justify-between items-center rounded-xl px-4 py-3 ${
                    ownerPaid === 0
                      ? 'bg-teal-50 border border-teal-200'
                      : 'bg-orange-50 border border-orange-200'
                  }`}
                >
                  <div>
                    <p className={`text-sm font-extrabold ${ownerPaid === 0 ? 'text-teal-700' : 'text-orange-700'}`}>
                      Charged from your wallet
                    </p>
                    {walletBalance !== undefined && (
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        <Wallet className="w-3 h-3" />
                        Remaining wallet balance: {fmtVND(walletBalance)}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-lg font-extrabold ${
                      ownerPaid === 0 ? 'text-teal-600' : 'text-orange-600'
                    }`}
                  >
                    {ownerPaid === 0 ? 'Fully covered 🎉' : fmtVND(ownerPaid)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Thông tin vận chuyển ── */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
              <MapPin className="w-5 h-5 text-green-600" />
              <h3 className="font-bold text-gray-900 text-sm">Shipping Information</h3>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Delivery address</p>
                  <p className="text-sm font-medium text-gray-700">
                    View in order history
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Estimated delivery time</p>
                  <p className="text-sm font-bold text-gray-900">{estimatedDelivery}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    FreshMarket team will contact you to confirm before delivery
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Group discount badge ── */}
          {activePct > 0 && (
            <motion.div
              variants={itemVariants}
              className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
            >
              <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Your group achieved a{' '}
                <span className="font-bold">{activePct}% discount</span>{' '}
                — the discount has been applied to the order. 🎊
              </p>
            </motion.div>
          )}

          {/* ── Owner's cart items ── */}
          {ownerCart.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <ShoppingBag className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-900 text-sm">Your selected items</h3>
                <span className="ml-auto inline-flex items-center gap-1 text-xs text-orange-600 font-semibold">
                  <Crown className="w-3 h-3" />
                  Owner
                </span>
              </div>

              <div className="divide-y divide-gray-50">
                {ownerCart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3">
                    {item.image?.startsWith('http') ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">
                        🥦
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {fmtVND(item.price)} × {item.qty}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                      {fmtVND(item.price * item.qty)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center px-5 py-3 bg-gray-50 border-t border-gray-100">
                <span className="text-sm text-gray-600 font-medium">Your subtotal</span>
                <span className="font-bold text-green-600 text-base">{fmtVND(ownerSubtotal)}</span>
              </div>
            </motion.div>
          )}

          {/* ── CTAs ── */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={() => navigate('/profile?tab=orders')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-green-600 text-white font-bold text-sm hover:bg-green-700 active:scale-95 transition-all shadow-sm"
            >
              View in Order History
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/products')}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 active:scale-95 transition-all"
            >
              <Home className="w-4 h-4" />
              Browse Products
            </button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
