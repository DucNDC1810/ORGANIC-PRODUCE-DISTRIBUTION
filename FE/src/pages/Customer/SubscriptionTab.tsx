import { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock, Package, RefreshCw, PauseCircle, PlayCircle,
  XCircle, ShoppingBag, ChevronRight, Repeat2, AlertTriangle,
  CreditCard, Tag, Loader2, Clock, FlaskConical, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService, Subscription } from '../../services/subscriptionService';
import api from '../../services/api';
import { toast } from 'sonner';

// ── Helpers ─────────────────────────────────────────────────────

const FREQUENCY_LABEL: Record<string, string> = {
  weekly:     'Weekly (7 days)',
  'bi-weekly': 'Bi-weekly (14 days)',
  monthly:    'Monthly (30 days)',
};

const PAYMENT_LABELS: Record<string, string> = {
  cod:     'COD',
  momo:    'MoMo',
  cash:    'Cash',
};

const STATUS_CONFIG: Record<string, {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}> = {
  active:    { label: 'Active',     bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500' },
  paused:    { label: 'Paused',     bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  cancelled: { label: 'Cancelled',  bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-400' },
};

const TABS = [
  { key: '',          label: 'All' },
  { key: 'active',    label: 'Active' },
  { key: 'paused',    label: 'Paused' },
  { key: 'cancelled', label: 'Cancelled' },
];

function formatDate(d: string | Date) {
  return new Date(d).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatCurrency(n: number) {
  return n.toLocaleString('vi-VN') + '₫';
}

function getProductName(item: any): string {
  return item?.name ?? item?.productId?.name ?? 'Product';
}

function getProductImage(item: any): string {
  return item?.thumbnail ?? item?.productId?.thumbnail
    ?? item?.productId?.imageUrls?.[0] ?? '';
}

function getProductPrice(item: any): number {
  return item?.priceAtSubscription ?? item?.price ?? item?.productId?.price ?? 0;
}

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Status Badge ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────
function SubscriptionCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden animate-pulse">
      <div className="px-5 py-4 bg-[#FAFAFA] border-b border-[#F3F4F6] flex justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E5E7EB]" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-[#E5E7EB] rounded" />
            <div className="h-3 w-24 bg-[#F3F4F6] rounded" />
          </div>
        </div>
        <div className="h-6 w-28 bg-[#E5E7EB] rounded-full" />
      </div>
      <div className="px-5 py-4 border-b border-[#F3F4F6] space-y-2">
        <div className="h-3 w-1/2 bg-[#F3F4F6] rounded" />
        <div className="h-3 w-1/3 bg-[#F3F4F6] rounded" />
      </div>
      <div className="px-5 py-4 flex justify-between items-center">
        <div className="h-7 w-32 bg-[#E5E7EB] rounded-lg" />
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-[#F3F4F6] rounded-lg" />
          <div className="h-8 w-20 bg-[#F3F4F6] rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────
function EmptyState({ statusFilter }: { statusFilter: string }) {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-50 to-[#F3F4F6] flex items-center justify-center">
          <CalendarClock className="w-14 h-14 text-violet-300" strokeWidth={1.2} />
        </div>
        <div className="absolute top-2 right-0 w-5 h-5 rounded-full bg-violet-100" />
        <div className="absolute bottom-3 left-1 w-3 h-3 rounded-full bg-violet-100" />
      </div>
      <h3 className="text-xl font-bold text-[#101828] mb-2">
        {statusFilter ? 'No subscriptions found' : 'No recurring orders yet'}
      </h3>
      <p className="text-sm text-[#6A7282] text-center max-w-xs mb-8 leading-relaxed">
        {statusFilter
          ? `You have no subscriptions with "${STATUS_CONFIG[statusFilter]?.label ?? statusFilter}" status.`
          : 'You have not set up any recurring orders yet. Save 5% per order with recurring delivery!'}
      </p>
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 px-7 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-all shadow-sm hover:shadow-md active:scale-95"
      >
        <ShoppingBag className="w-5 h-5" />
        Browse Products
      </button>
    </div>
  );
}

// ── Cancel Confirm Modal ──────────────────────────────────────────
function CancelModal({
  subId,
  onCancel,
  onClose,
}: {
  subId: string;
  onCancel: (id: string) => Promise<void>;
  onClose: () => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 fade-in duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-[#101828]">Cancel Recurring Plan?</h3>
          <p className="text-sm text-[#6A7282] leading-relaxed">
            You will no longer receive recurring deliveries. Previously created orders will still be delivered as planned. This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] text-[#364153] font-semibold hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
          >
            No, Keep It
          </button>
          <button
            onClick={async () => { setLoading(true); await onCancel(subId); setLoading(false); onClose(); }}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Cancel Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Subscription Card ─────────────────────────────────────────────
function SubscriptionCard({
  sub,
  onPause,
  onResume,
  onCancelRequest,
  actionLoading,
}: {
  sub: Subscription & { items: any[] };
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancelRequest: (id: string) => void;
  actionLoading: string | null;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const days = daysUntil(sub.nextDeliveryDate);
  const isLoading = actionLoading === sub._id;
  const isCancelled = sub.status === 'cancelled';

  const items = sub.items ?? [];
  const totalPerCycle = items.reduce((sum: number, item: any) => {
    return sum + getProductPrice(item) * (item.quantity ?? 1);
  }, 0);
  const discount = totalPerCycle * (sub.discountRate ?? 0);
  const afterDiscount = totalPerCycle - discount;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${isCancelled ? 'border-[#E5E7EB] opacity-70' : 'border-[#E5E7EB]'}`}>

      {/* ── Row 1: Header ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center flex-shrink-0">
            <Repeat2 className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-[#101828] font-mono tracking-wide">
                #{sub._id.slice(-10).toUpperCase()}
              </p>
              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                <CalendarClock className="w-3 h-3" /> 🔁 Recurring
              </span>
            </div>
            <p className="text-xs text-[#9CA3AF] mt-0.5">
              Created {formatDate(sub.createdAt)}
            </p>
          </div>
        </div>
        <StatusBadge status={sub.status} />
      </div>

      {/* ── Row 2: Info Grid ── */}
      <div className="px-5 py-4 border-b border-[#F3F4F6] grid grid-cols-2 gap-x-4 gap-y-2.5">
        {/* Frequency */}
        <div className="flex items-start gap-2">
          <RefreshCw className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wide">Frequency</p>
            <p className="text-sm font-semibold text-[#101828]">{FREQUENCY_LABEL[sub.frequency] ?? sub.frequency}</p>
          </div>
        </div>

        {/* Payment */}
        <div className="flex items-start gap-2">
          <CreditCard className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wide">Payment</p>
            <p className="text-sm font-semibold text-[#101828]">
              {PAYMENT_LABELS[sub.paymentMethod?.toLowerCase()] ?? sub.paymentMethod ?? 'COD'}
            </p>
          </div>
        </div>

        {/* Next delivery */}
        {!isCancelled && (
          <div className="flex items-start gap-2 col-span-2">
            <Clock className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wide">Next Delivery</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-[#101828]">{formatDate(sub.nextDeliveryDate)}</p>
                {days >= 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    days === 0 ? 'bg-red-50 text-red-600' :
                    days <= 2 ? 'bg-amber-50 text-amber-600' :
                    'bg-green-50 text-green-600'
                  }`}>
                    {days === 0 ? 'Today!' : days < 0 ? 'Processing' : `${days} day(s) left`}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Discount */}
        {sub.discountRate > 0 && (
          <div className="flex items-start gap-2">
            <Tag className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#9CA3AF] font-medium uppercase tracking-wide">Recurring Discount</p>
              <p className="text-sm font-semibold text-green-600">-{Math.round(sub.discountRate * 100)}%</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Row 3: Products (collapsible) ── */}
      <div className="border-b border-[#F3F4F6]">
        <button
          onClick={() => setExpanded(p => !p)}
          className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#FAFAFA] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#9CA3AF]" />
            <span className="text-sm font-medium text-[#364153]">
              {items.length} item(s)
            </span>
          </div>
          <ChevronRight className={`w-4 h-4 text-[#9CA3AF] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`} />
        </button>

        {expanded && (
          <div className="px-5 pb-4 space-y-3">
            {items.map((item: any, idx: number) => {
              const name  = getProductName(item);
              const img   = getProductImage(item);
              const price = getProductPrice(item);
              const qty   = item.quantity ?? 1;
              return (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-lg bg-[#F3F4F6] flex-shrink-0 overflow-hidden border border-[#E5E7EB]">
                    {img
                      ? <img src={img} alt={name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      : <Package className="w-5 h-5 text-[#9CA3AF] m-auto mt-3" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#101828] truncate">{name}</p>
                    <p className="text-xs text-[#9CA3AF]">Qty: {qty}</p>
                  </div>
                  {price > 0 && (
                    <p className="text-sm font-semibold text-[#101828] flex-shrink-0">
                      {formatCurrency(price * qty)}
                    </p>
                  )}
                </div>
              );
            })}

            {/* Price summary */}
            {totalPerCycle > 0 && (() => {
              const shipping = (sub as any).shippingCost ?? 25000;
              const vatAmount = (afterDiscount + shipping) * 0.0476;
              const total = afterDiscount + shipping + vatAmount;
              return (
                <div className="mt-3 pt-3 border-t border-[#F3F4F6] space-y-1">
                  <div className="flex justify-between text-xs text-[#6A7282]">
                    <span>Subtotal / cycle</span>
                    <span>{formatCurrency(totalPerCycle)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#6A7282]">
                    <span>Shipping</span>
                    <span>{formatCurrency(shipping)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-xs text-green-600">
                      <span>Recurring discount (-{Math.round(sub.discountRate * 100)}%)</span>
                      <span>-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-[#101828]">
                    <span>Total</span>
                    <span className="text-[#00B207]">{formatCurrency(total)}</span>
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[11px] text-[#B0B7C3]">
                      Price includes VAT {formatCurrency(vatAmount)}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>

      {/* ── Row 4: Actions ── */}
      <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
        {/* "View Orders" — navigate to order history */}
        <button
          onClick={() => navigate('/profile?tab=orders')}
          className="flex items-center gap-1.5 text-sm text-violet-600 font-semibold hover:underline"
        >
          View Orders
          <ChevronRight className="w-3.5 h-3.5" />
        </button>

        {!isCancelled && (
          <div className="flex items-center gap-2 flex-wrap">
            {/* Pause / Resume */}
            {sub.status === 'active' ? (
              <button
                onClick={() => onPause(sub._id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-sm font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PauseCircle className="w-3.5 h-3.5" />}
                Pause
              </button>
            ) : sub.status === 'paused' ? (
              <button
                onClick={() => onResume(sub._id)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-semibold hover:bg-green-100 transition-colors disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlayCircle className="w-3.5 h-3.5" />}
                Resume
              </button>
            ) : null}

            {/* Cancel */}
            <button
              onClick={() => onCancelRequest(sub._id)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
            >
              <XCircle className="w-3.5 h-3.5" />
              Cancel Plan
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────
export default function SubscriptionTab() {
  const [subscriptions, setSubscriptions] = useState<(Subscription & { items: any[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  // ── Dev test panel state (only used in development) ──
  const [devOpen, setDevOpen] = useState(false);
  const [devLoading, setDevLoading] = useState<string | null>(null); // 'trigger' | subId
  const [devLog, setDevLog] = useState<{ type: 'ok' | 'err'; msg: string }[]>([]);

  const devLog$ = (type: 'ok' | 'err', msg: string) =>
    setDevLog(prev => [{ type, msg }, ...prev].slice(0, 20));

  const fetchSubscriptions = useCallback(async (status: string, p: number) => {
    setLoading(true);
    try {
      const res = await subscriptionService.getMySubscriptions(p, 5, status || undefined);
      // api interceptor returns response.data directly, so `res` IS the response body
      const body = res as any;
      const list: any[] = Array.isArray(body?.data) ? body.data : [];
      const pagination = body?.pagination ?? { totalPages: 1, totalItems: list.length };
      setSubscriptions(list);
      setTotalPages(pagination.totalPages ?? 1);
      setTotalItems(pagination.totalItems ?? list.length);
    } catch (err: any) {
      setSubscriptions([]);
      toast.error(err?.response?.data?.message ?? 'Failed to load recurring plans');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubscriptions(activeTab, page);
  }, [activeTab, page, fetchSubscriptions]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setPage(1);
  };

  const handlePause = async (id: string) => {
    setActionLoading(id);
    try {
      await subscriptionService.pauseSubscription(id);
      toast.success('Recurring plan paused');
      fetchSubscriptions(activeTab, page);
    } catch {
      toast.error('Failed to pause plan. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResume = async (id: string) => {
    setActionLoading(id);
    try {
      await subscriptionService.resumeSubscription(id);
      toast.success('Recurring plan resumed');
      fetchSubscriptions(activeTab, page);
    } catch {
      toast.error('Failed to resume plan. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await subscriptionService.cancelSubscription(id);
      toast.success('Recurring plan cancelled');
      fetchSubscriptions(activeTab, page);
    } catch {
      toast.error('Failed to cancel plan. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // ── Dev helpers ──────────────────────────────────────
  const handleDevSetDue = async (subId: string) => {
    setDevLoading(subId);
    try {
      const res = await api.patch(`/subscriptions/dev/set-due/${subId}`) as any;
      devLog$('ok', `[Set due] ${res?.message ?? 'nextDeliveryDate → yesterday'}`);
      fetchSubscriptions(activeTab, page);
    } catch (err: any) {
      devLog$('err', `[Set due] ${err?.response?.data?.message ?? err.message}`);
    } finally {
      setDevLoading(null);
    }
  };

  const handleDevTrigger = async () => {
    setDevLoading('trigger');
    devLog$('ok', '[Trigger] Running processSubscriptionOrders()...');
    try {
      const res = await api.post('/subscriptions/dev/trigger-now') as any;
      devLog$('ok', `[Trigger] ${res?.message ?? 'Done'}`);
      toast.success('Cron job completed! Check Order History and email.');
      fetchSubscriptions(activeTab, page);
    } catch (err: any) {
      devLog$('err', `[Trigger] ${err?.response?.data?.message ?? err.message}`);
      toast.error('Cron job error — check backend console');
    } finally {
      setDevLoading(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E5E7EB] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5E7EB]">
        <div>
          <h2 className="text-xl font-bold text-[#101828] flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-violet-600" />
            Recurring Orders
          </h2>
          <p className="text-sm text-[#6A7282] mt-0.5">
            Manage your automatic recurring orders
          </p>
        </div>
        <button
          onClick={() => fetchSubscriptions(activeTab, page)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-sm text-[#364153] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Stat Banner ── */}
      {totalItems > 0 && !loading && (
        <div className="px-6 py-3 bg-violet-50 border-b border-violet-100 flex items-center gap-2">
          <CalendarClock className="w-4 h-4 text-violet-500" />
          <p className="text-sm text-violet-700 font-medium">
            You have <span className="font-bold">{totalItems}</span> recurring plan(s)
            {activeTab ? ` (${STATUS_CONFIG[activeTab]?.label ?? activeTab})` : ' (all)'}
          </p>
        </div>
      )}

      {/* ── Tab Filter ── */}
      <div className="px-6 pt-4 border-b border-[#E5E7EB]">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-0">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-shrink-0 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-violet-600 text-violet-700 bg-violet-50'
                  : 'border-transparent text-[#6A7282] hover:text-[#364153] hover:bg-[#F9FAFB]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── DEV TEST PANEL (only in development build) ── */}
      {import.meta.env.DEV && (
        <div className="border-b border-orange-200 bg-orange-50">
          <button
            onClick={() => setDevOpen(p => !p)}
            className="w-full flex items-center justify-between px-5 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4" />
              🧪 Dev — Test cron job
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${devOpen ? 'rotate-180' : ''}`} />
          </button>

          {devOpen && (
            <div className="px-5 pb-4 space-y-3">
              {/* Instructions */}
              <ol className="text-xs text-orange-700 list-decimal list-inside space-y-0.5 leading-relaxed">
                <li>Click <strong>"Set to Yesterday"</strong> on the plan to test → nextDeliveryDate becomes yesterday</li>
                <li>Click <strong>"🚀 Run cron now"</strong> → backend processes, creates new Order, sends email</li>
                <li>Check <strong>Order History</strong> and your email inbox</li>
              </ol>

              {/* Subscription list for quick set-due */}
              {subscriptions.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Current plans:</p>
                  {subscriptions.map((sub: any) => (
                    <div key={sub._id} className="flex items-center justify-between bg-white rounded-lg border border-orange-200 px-3 py-2 text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#101828]">#{sub._id.slice(-8).toUpperCase()}</span>
                        <span className="ml-2 text-[#6A7282]">
                          {sub.frequency} · delivery {new Date(sub.nextDeliveryDate).toLocaleDateString('en-US')}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDevSetDue(sub._id)}
                        disabled={devLoading === sub._id}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-100 text-orange-700 font-semibold hover:bg-orange-200 transition-colors disabled:opacity-50"
                      >
                        {devLoading === sub._id
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : '📅'}
                        Set to Yesterday
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Trigger button */}
              <button
                onClick={handleDevTrigger}
                disabled={devLoading === 'trigger'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
              >
                {devLoading === 'trigger'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Running cron...</>
                  : <>🚀 Run cron now (processSubscriptionOrders)</>}
              </button>

              {/* Log output */}
              {devLog.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-3 space-y-1 max-h-40 overflow-y-auto">
                  {devLog.map((entry, i) => (
                    <p key={i} className={`text-xs font-mono ${entry.type === 'ok' ? 'text-green-400' : 'text-red-400'}`}>
                      {entry.type === 'ok' ? '✓' : '✗'} {entry.msg}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Content ── */}
      <div className="p-6 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => <SubscriptionCardSkeleton key={i} />)
        ) : subscriptions.length === 0 ? (
          <EmptyState statusFilter={activeTab} />
        ) : (
          subscriptions.map(sub => (
            <SubscriptionCard
              key={sub._id}
              sub={sub}
              onPause={handlePause}
              onResume={handleResume}
              onCancelRequest={setCancelTarget}
              actionLoading={actionLoading}
            />
          ))
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-[#9CA3AF]">
              Page {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-sm rounded-lg border border-[#E5E7EB] text-[#364153] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-sm rounded-lg border border-[#E5E7EB] text-[#364153] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Cancel confirm modal ── */}
      {cancelTarget && (
        <CancelModal
          subId={cancelTarget}
          onCancel={handleCancel}
          onClose={() => setCancelTarget(null)}
        />
      )}
    </div>
  );
}
