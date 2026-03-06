import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle2, Wallet, ShoppingBag, ArrowRight, Home, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';
import type { GroupCartItem } from '../../services/groupService';

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
interface SuccessState {
  memberName?: string;
  myCart?: GroupCartItem[];
  mySubtotal?: number;
  walletHoldAmount?: number;
  orderId?: string;
  groupName?: string;
  activePct?: number;
  groupTotal?: number;
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
export default function GroupOrderSuccess() {
  const location = useLocation();
  const navigate = useNavigate();

  const state = (location.state as SuccessState) || {};
  const memberName      = state.memberName      || 'You';
  const myCart          = state.myCart          || [];
  const mySubtotal      = state.mySubtotal      || 0;
  const walletHoldAmount = state.walletHoldAmount ?? 0;
  const groupName       = state.groupName       || 'Group Order';
  const activePct       = state.activePct       || 0;

  // Generate confetti once on mount
  const [confettiPieces] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
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
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
              className="inline-flex"
            >
              <CheckCircle2 className="w-20 h-20 text-green-500" />
            </motion.div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                Order Confirmed! 🎉
              </h1>
              <p className="mt-2 text-gray-600 text-base sm:text-lg leading-relaxed">
                Congratulations{' '}
                <span className="font-bold text-green-600">{memberName}</span>!{' '}
                The group order{' '}
                <span className="font-semibold text-gray-800">{groupName}</span>
                {' '}has been confirmed successfully.
              </p>
            </div>
          </motion.div>

          {/* ── Deposit history box ── */}
          <motion.div
            variants={itemVariants}
            className="bg-green-50 border border-green-200 rounded-2xl p-5 flex gap-4 items-start"
          >
            <div className="bg-green-100 rounded-xl p-2.5 flex-shrink-0">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-green-800 text-sm mb-1">Deposit History</h3>
              <p className="text-sm text-green-700 leading-relaxed">
                The amount{' '}
                <span className="font-extrabold text-green-600">
                  {fmtVND(walletHoldAmount)}
                </span>{' '}
                has been deducted from your FreshMarket wallet to pay for items in this order.
              </p>
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

          {/* ── My items ── */}
          {myCart.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                <ShoppingBag className="w-5 h-5 text-gray-500" />
                <h3 className="font-bold text-gray-900 text-sm">Your selected items</h3>
              </div>

              <div className="divide-y divide-gray-50">
                {myCart.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 px-5 py-3">
                    {item.image ? (
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
                <span className="font-bold text-green-600 text-base">{fmtVND(mySubtotal)}</span>
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
