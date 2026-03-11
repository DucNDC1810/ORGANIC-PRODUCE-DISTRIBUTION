import { useState, useEffect, useCallback } from 'react';
import {
  CalendarClock, Package, RefreshCw, PauseCircle, PlayCircle,
  XCircle, ShoppingBag, ChevronRight, Repeat2, AlertTriangle,
  CreditCard, Tag, Loader2, Clock, FlaskConical, ChevronDown,
  Calendar, CheckCircle2, PauseOctagon, Ban
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subscriptionService, Subscription } from '../../services/subscriptionService';
import api from '../../services/api';
import { toast } from 'sonner';

// ── Helpers ─────────────────────────────────────────────────────

const FREQUENCY_LABEL: Record<string, string> = {
  weekly:      'Weekly',
  'bi-weekly': 'Bi-weekly',
  monthly:     'Monthly',
};

const FREQUENCY_DAYS: Record<string, number> = {
  weekly: 7, 'bi-weekly': 14, monthly: 30,
};

const PAYMENT_LABELS: Record<string, string> = {
  cod:  'COD',
  momo: 'MoMo',
  cash: 'Cash',
};

const STATUS_CONFIG: Record<string, {
  label: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
  timelineDot: string;
}> = {
  active:    { label: 'Active',    bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500',  timelineDot: 'bg-emerald-500 ring-emerald-100' },
  paused:    { label: 'Paused',    bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   dot: 'bg-amber-400',    timelineDot: 'bg-amber-400 ring-amber-100' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     dot: 'bg-red-400',      timelineDot: 'bg-red-400 ring-red-100' },
};

const TABS = [
  { key: '',          label: 'All',       icon: Calendar },
  { key: 'active',    label: 'Active',    icon: CheckCircle2 },
  { key: 'paused',    label: 'Paused',    icon: PauseOctagon },
  { key: 'cancelled', label: 'Cancelled', icon: Ban },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

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

// Group subscriptions by month of nextDeliveryDate
function groupByMonth(subs: any[]): { key: string; label: string; items: any[] }[] {
  const map = new Map<string, any[]>();
  subs.forEach(sub => {
    const d = new Date(sub.nextDeliveryDate);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(sub);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, items]) => {
      const [year, month] = key.split('-').map(Number);
      return { key, label: `${MONTH_NAMES[month]} ${year}`, items };
    });
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
function ScheduleSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* month heading */}
      <div className="h-5 w-40 bg-[#E5E7EB] rounded-full" />
      {[1,2].map(i => (
        <div key={i} className="flex gap-4">
          {/* date column */}
          <div className="flex flex-col items-center gap-1 w-14 flex-shrink-0">
            <div className="w-12 h-14 rounded-2xl bg-[#E5E7EB]" />
          </div>
          {/* card */}
          <div className="flex-1 bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-48 bg-[#E5E7EB] rounded" />
              <div className="h-6 w-20 bg-[#F3F4F6] rounded-full" />
            </div>
            <div className="h-3 w-2/3 bg-[#F3F4F6] rounded" />
            <div className="flex gap-2 pt-1">
              <div className="h-8 w-20 bg-[#F3F4F6] rounded-lg" />
              <div className="h-8 w-24 bg-[#F3F4F6] rounded-lg" />
            </div>
          </div>
        </div>
      ))}
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

// ── Schedule Row (replaces old SubscriptionCard) ─────────────────
function ScheduleRow({
  sub,
  isLast,
  onPause,
  onResume,
  onCancelRequest,
  actionLoading,
}: {
  sub: Subscription & { items: any[] };
  isLast: boolean;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onCancelRequest: (id: string) => void;
  actionLoading: string | null;
}) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const d = new Date(sub.nextDeliveryDate);
  const days = daysUntil(sub.nextDeliveryDate);
  const isLoading = actionLoading === sub._id;
  const isCancelled = sub.status === 'cancelled';

  const items = sub.items ?? [];
  const totalPerCycle = items.reduce((sum: number, item: any) =>
    sum + getProductPrice(item) * (item.quantity ?? 1), 0);
  const discount = totalPerCycle * (sub.discountRate ?? 0);
  const afterDiscount = totalPerCycle - discount;

  const urgencyBg =
    days < 0   ? 'bg-gray-100 text-gray-500' :
    days === 0 ? 'bg-red-500 text-white' :
    days <= 2  ? 'bg-amber-400 text-white' :
                 'bg-violet-600 text-white';

  const cycleDays = FREQUENCY_DAYS[sub.frequency] ?? 30;

  return (
    <div className="flex gap-0">
      {/* ── Date Column ── */}
      <div className="flex flex-col items-center w-16 flex-shrink-0">
        <div className={`w-14 rounded-2xl overflow-hidden border shadow-sm flex-shrink-0 ${isCancelled ? 'opacity-50 border-[#E5E7EB]' : 'border-violet-200'}`}>
          <div className={`text-center py-1 text-[10px] font-bold uppercase tracking-widest ${isCancelled ? 'bg-gray-200 text-gray-500' : 'bg-violet-600 text-white'}`}>
            {MONTH_NAMES[d.getMonth()].slice(0, 3)}
          </div>
          <div className="bg-white text-center py-1.5">
            <p className="text-xl font-black text-[#101828] leading-none">{d.getDate()}</p>
            <p className="text-[9px] text-[#9CA3AF] font-medium">{DAY_NAMES[d.getDay()]}</p>
          </div>
        </div>
        {/* timeline line */}
        {!isLast && <div className="w-0.5 flex-1 mt-1 bg-gradient-to-b from-violet-200 to-transparent min-h-4" />}
      </div>

      {/* ── Card ── */}
      <div className={`flex-1 mb-4 ml-3 bg-white border rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden ${
        isCancelled ? 'border-[#E5E7EB] opacity-70' : 'border-[#E5E7EB] hover:border-violet-200'
      }`}>
        {/* top accent line */}
        <div className={`h-0.5 w-full ${isCancelled ? 'bg-[#E5E7EB]' : sub.status === 'paused' ? 'bg-amber-400' : 'bg-violet-500'}`} />

        {/* Card body */}
        <div className="p-4">
          {/* Row 1: ID + frequency badge + status */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Repeat2 className="w-3.5 h-3.5 text-violet-500" />
                <span className="text-xs font-mono font-bold text-[#101828] tracking-wide">
                  #{sub._id.slice(-8).toUpperCase()}
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200">
                <RefreshCw className="w-2.5 h-2.5" />
                {FREQUENCY_LABEL[sub.frequency] ?? sub.frequency} · every {cycleDays}d
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {!isCancelled && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urgencyBg}`}>
                  {days < 0 ? 'Processing' : days === 0 ? 'Today!' : `${days}d left`}
                </span>
              )}
              <StatusBadge status={sub.status} />
            </div>
          </div>

          {/* Row 2: product thumbnails strip */}
          {items.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="flex -space-x-2">
                {items.slice(0, 4).map((item: any, idx: number) => {
                  const img = getProductImage(item);
                  return (
                    <div key={idx} className="w-9 h-9 rounded-xl border-2 border-white bg-[#F3F4F6] overflow-hidden flex-shrink-0 shadow-sm">
                      {img
                        ? <img src={img} alt={getProductName(item)} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                        : <Package className="w-4 h-4 text-[#9CA3AF] m-auto mt-2" />
                      }
                    </div>
                  );
                })}
                {items.length > 4 && (
                  <div className="w-9 h-9 rounded-xl border-2 border-white bg-violet-50 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <span className="text-[10px] font-bold text-violet-600">+{items.length - 4}</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-[#6A7282]">
                {items.length} item(s)
                {afterDiscount > 0 && (
                  <span className="ml-1.5 font-bold text-[#101828]">· {formatCurrency(afterDiscount)}/cycle</span>
                )}
                {discount > 0 && (
                  <span className="ml-1 text-emerald-600 font-semibold">(-{Math.round(sub.discountRate*100)}%)</span>
                )}
              </div>
            </div>
          )}

          {/* Row 3: Info pills */}
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1 text-[11px] text-[#6A7282] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
              <CreditCard className="w-3 h-3 text-violet-400" />
              {PAYMENT_LABELS[sub.paymentMethod?.toLowerCase()] ?? sub.paymentMethod ?? 'COD'}
            </div>
            {!isCancelled && (
              <div className="flex items-center gap-1 text-[11px] text-[#6A7282] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
                <Clock className="w-3 h-3 text-violet-400" />
                Next: {formatDate(sub.nextDeliveryDate)}
              </div>
            )}
            {sub.discountRate > 0 && (
              <div className="flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-2.5 py-1">
                <Tag className="w-3 h-3" />
                Save {Math.round(sub.discountRate*100)}%
              </div>
            )}
            <div className="flex items-center gap-1 text-[11px] text-[#6A7282] bg-[#F9FAFB] border border-[#E5E7EB] rounded-lg px-2.5 py-1">
              <CalendarClock className="w-3 h-3 text-violet-400" />
              Since {formatDate(sub.createdAt)}
            </div>
          </div>

          {/* Expandable items detail */}
          <div className="border-t border-[#F3F4F6]">
            <button
              onClick={() => setExpanded(p => !p)}
              className="w-full flex items-center justify-between py-2 text-xs text-[#9CA3AF] hover:text-[#6A7282] transition-colors"
            >
              <span>Details</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>

            {expanded && (
              <div className="pb-2 space-y-2">
                {items.map((item: any, idx: number) => {
                  const name  = getProductName(item);
                  const img   = getProductImage(item);
                  const price = getProductPrice(item);
                  const qty   = item.quantity ?? 1;
                  return (
                    <div key={idx} className="flex items-center gap-3 bg-[#FAFAFA] rounded-xl px-3 py-2">
                      <div className="w-9 h-9 rounded-lg bg-[#F3F4F6] flex-shrink-0 overflow-hidden border border-[#E5E7EB]">
                        {img
                          ? <img src={img} alt={name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />
                          : <Package className="w-4 h-4 text-[#9CA3AF] m-auto mt-2" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#101828] truncate">{name}</p>
                        <p className="text-[10px] text-[#9CA3AF]">Qty: {qty}</p>
                      </div>
                      {price > 0 && (
                        <p className="text-xs font-bold text-[#101828] flex-shrink-0">{formatCurrency(price * qty)}</p>
                      )}
                    </div>
                  );
                })}
                {totalPerCycle > 0 && (
                  <div className="px-3 pt-2 border-t border-[#F3F4F6] space-y-1">
                    <div className="flex justify-between text-[11px] text-[#6A7282]">
                      <span>Subtotal / cycle</span><span>{formatCurrency(totalPerCycle)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-[11px] text-emerald-600">
                        <span>Discount (-{Math.round(sub.discountRate*100)}%)</span>
                        <span>-{formatCurrency(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold text-[#101828]">
                      <span>Estimated / cycle</span>
                      <span className="text-emerald-600">{formatCurrency(afterDiscount)}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-[#F3F4F6] mt-1">
            <button
              onClick={() => navigate('/profile?tab=orders')}
              className="flex items-center gap-1 text-xs text-violet-600 font-semibold hover:underline py-1"
            >
              View Orders <ChevronRight className="w-3 h-3" />
            </button>

            {!isCancelled && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {sub.status === 'active' ? (
                  <button
                    onClick={() => onPause(sub._id)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PauseCircle className="w-3 h-3" />}
                    Pause
                  </button>
                ) : sub.status === 'paused' ? (
                  <button
                    onClick={() => onResume(sub._id)}
                    disabled={isLoading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <PlayCircle className="w-3 h-3" />}
                    Resume
                  </button>
                ) : null}
                <button
                  onClick={() => onCancelRequest(sub._id)}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors disabled:opacity-50"
                >
                  <XCircle className="w-3 h-3" />
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
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

  // ── compute summary stats ─────────────────────────────────────
  

  // Sort by nextDeliveryDate ascending
  const sorted = [...subscriptions].sort(
    (a, b) => new Date(a.nextDeliveryDate).getTime() - new Date(b.nextDeliveryDate).getTime()
  );
  const grouped = groupByMonth(sorted);

  return (
    <div className="bg-[#F8F9FB] rounded-2xl border border-[#E5E7EB] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-5 bg-white border-b border-[#E5E7EB]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center shadow-sm">
            <CalendarClock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#101828]">Delivery Schedule</h2>
            <p className="text-xs text-[#9CA3AF] mt-0.5">Your automatic recurring orders</p>
          </div>
        </div>
        <button
          onClick={() => fetchSubscriptions(activeTab, page)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] text-sm text-[#364153] hover:bg-[#F3F4F6] transition-colors disabled:opacity-50 font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* ── Tab Filter ── */}
      <div className="px-6 pt-4 bg-white border-b border-[#E5E7EB]">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide">
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'border-violet-600 text-violet-700 bg-violet-50'
                    : 'border-transparent text-[#6A7282] hover:text-[#364153] hover:bg-[#F9FAFB]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DEV TEST PANEL ── */}
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
              <ol className="text-xs text-orange-700 list-decimal list-inside space-y-0.5 leading-relaxed">
                <li>Click <strong>"Set to Yesterday"</strong> on the plan → nextDeliveryDate becomes yesterday</li>
                <li>Click <strong>"🚀 Run cron now"</strong> → backend processes, creates new Order, sends email</li>
                <li>Check <strong>Order History</strong> and your email inbox</li>
              </ol>
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
                        {devLoading === sub._id ? <Loader2 className="w-3 h-3 animate-spin" /> : '📅'}
                        Set to Yesterday
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={handleDevTrigger}
                disabled={devLoading === 'trigger'}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors disabled:opacity-50 text-sm"
              >
                {devLoading === 'trigger'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Running cron...</>
                  : <>🚀 Run cron now (processSubscriptionOrders)</>}
              </button>
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

      {/* ── Schedule Content ── */}
      <div className="p-6">
        {loading ? (
          <ScheduleSkeleton />
        ) : subscriptions.length === 0 ? (
          <EmptyState statusFilter={activeTab} />
        ) : (
          <div className="space-y-8">
            {grouped.map(group => (
              <div key={group.key}>
                {/* Month heading */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex items-center gap-2 bg-violet-600 text-white px-4 py-1.5 rounded-full shadow-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold uppercase tracking-wider">{group.label}</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-violet-200 to-transparent" />
                  <span className="text-xs text-[#9CA3AF] font-medium">{group.items.length} delivery{group.items.length !== 1 ? 's' : ''}</span>
                </div>

                {/* Timeline rows */}
                <div>
                  {group.items.map((sub, idx) => (
                    <ScheduleRow
                      key={sub._id}
                      sub={sub}
                      isLast={idx === group.items.length - 1}
                      onPause={handlePause}
                      onResume={handleResume}
                      onCancelRequest={setCancelTarget}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 mt-2 border-t border-[#E5E7EB]">
            <p className="text-sm text-[#9CA3AF] font-medium">
              Page {page} of {totalPages}
              <span className="ml-2 text-[#D1D5DB]">·</span>
              <span className="ml-2">{totalItems} plan(s)</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3.5 py-1.5 text-sm rounded-xl border border-[#E5E7EB] text-[#364153] hover:bg-white hover:border-violet-200 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3.5 py-1.5 text-sm rounded-xl border border-[#E5E7EB] text-[#364153] hover:bg-white hover:border-violet-200 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
              >
                Next →
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
