import { useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Home,
  Package,
  RefreshCcw,
  Clock,
} from 'lucide-react';
import { motion } from 'framer-motion';
import Header from '../../components/Header';

const MOMO_FAILURE_MAP: Record<string, string> = {
  '1001': 'Transaction cancelled by user.',
  '1002': 'Transaction declined by MoMo.',
  '1003': 'Payment source has insufficient balance.',
  '1005': 'Payment authentication failed.',
  '1006': 'Payment request was rejected by the system.',
  '9999': 'Unexpected error while processing payment.',
};

function getFailureMessage(resultCode: string | null, fallback?: string | null): string {
  if (fallback && fallback.trim()) return fallback;
  if (!resultCode) return 'Payment failed. Please try again.';
  return MOMO_FAILURE_MAP[resultCode] || `Payment failed with code ${resultCode}. Please try again.`;
}

export default function OrderFailurePage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);

  const orderId = searchParams.get('orderId') || location.state?.orderId || null;
  const requestId = searchParams.get('requestId') || location.state?.requestId || null;
  const resultCode = searchParams.get('resultCode') || location.state?.resultCode || null;
  const amountParam = searchParams.get('amount') || location.state?.amount;

  const amount = useMemo(() => {
    const parsed = Number(amountParam);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountParam]);

  const resultMessage = getFailureMessage(
    resultCode,
    searchParams.get('message') || searchParams.get('localMessage') || location.state?.message
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 280, damping: 26 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-rose-50 to-transparent">
      <Header />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
              className="inline-flex mb-6"
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 bg-red-300/20 rounded-full animate-pulse" />
                <div className="relative inset-0 w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-16 h-16 text-red-600" strokeWidth={1.5} />
                </div>
              </div>
            </motion.div>

            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">Payment Failed</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">{resultMessage}</p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid gap-4 md:grid-cols-3">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="text-sm text-muted-foreground mb-2">Order Number</div>
              <div className="text-2xl font-bold text-red-600 break-all">{orderId?.substring(0, 12) || 'N/A'}</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Clock className="w-4 h-4" />
                Attempt Time
              </div>
              <div className="text-lg font-semibold text-foreground">{new Date().toLocaleString('vi-VN')}</div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-border hover:shadow-md transition-shadow">
              <div className="text-sm text-muted-foreground mb-2">Attempted Amount</div>
              <div className="text-lg font-semibold text-red-600">
                {amount > 0 ? `${amount.toLocaleString('vi-VN')} ₫` : 'Unavailable'}
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            <motion.div variants={itemVariants} className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-red-100 to-rose-50 px-6 py-4 border-b border-border">
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    Transaction Details
                  </h2>
                </div>

                <div className="p-6 space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
                    Your order was not completed because the payment could not be confirmed.
                    No successful charge was recorded for this attempt.
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-muted-foreground">Status</span>
                      <span className="font-semibold text-red-700">Failed</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-muted-foreground">Result code</span>
                      <span className="font-medium text-foreground">{resultCode || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-muted-foreground">Request ID</span>
                      <span className="font-medium text-foreground break-all text-right">{requestId || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div variants={itemVariants} className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-border overflow-hidden sticky top-20">
                <div className="bg-gradient-to-r from-red-100 to-rose-50 px-6 py-4 border-b border-border">
                  <h3 className="font-semibold text-foreground">What You Can Do Next</h3>
                </div>
                <div className="p-6 space-y-4 text-sm text-muted-foreground">
                  <p>1. Retry checkout and select MoMo again.</p>
                  <p>2. Choose another payment method like Wallet or COD.</p>
                  <p>3. If money was deducted, contact support with your Order Number.</p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-900 mb-2">
                  <strong>Need help?</strong>
                </p>
                <p className="text-xs text-red-700 leading-relaxed">
                  If this keeps happening, please contact support and provide your order ID and result code.
                </p>
              </div>
            </motion.div>
          </div>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
          >
            <Link
              to="/checkout"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              Retry Checkout
              <RefreshCcw className="w-5 h-5" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-red-600 text-red-600 rounded-xl font-semibold hover:bg-red-50 transition-all"
            >
              Back to Home
              <Home className="w-5 h-5" />
            </Link>
            <Link
              to="/profile?tab=orders"
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white border-2 border-border text-foreground rounded-xl font-semibold hover:bg-muted/40 transition-all"
            >
              View Orders
              <Package className="w-5 h-5" />
            </Link>
          </motion.div>

          <motion.div variants={itemVariants} className="text-center pt-2">
            <Link
              to="/products"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Continue shopping instead
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}