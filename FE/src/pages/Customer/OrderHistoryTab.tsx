import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShoppingCart, Package, MapPin, ChevronLeft, ChevronRight,
  Eye, RotateCcw, X, FileText, Ban, AlertTriangle, RefreshCw, Tag, CreditCard,
  ShoppingBag, CalendarClock, Repeat2, Store, Navigation2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { cartService } from '../../services/cartService';
import { orderService, Order } from '../../services/orderService';
import { subscriptionService } from '../../services/subscriptionService';
import momoService from '../../services/momoService';
import { toast } from 'sonner';

// ─── Extended Order type (includes populated deliveryInfo) ─────
interface ExtendedOrder extends Order {
  deliveryInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    type?: 'delivery' | 'pickup';
  };
  pickupLocation?: {
    name?: string;
    address?: string;
  };
  // Cron-created subscription orders use 'unpaid' status
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'unpaid';
}

// ─── Status / Tab config ────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; bgColor: string; textColor: string; borderColor: string; dotColor: string }
> = {
  pending:    { label: 'Pending',          bgColor: 'bg-amber-50',   textColor: 'text-amber-700',   borderColor: 'border-amber-200',  dotColor: 'bg-amber-400'   },
  confirmed:  { label: 'To Ship',          bgColor: 'bg-blue-50',    textColor: 'text-blue-700',    borderColor: 'border-blue-200',   dotColor: 'bg-blue-400'    },
  processing: { label: 'Processing',       bgColor: 'bg-violet-50',  textColor: 'text-violet-700',  borderColor: 'border-violet-200', dotColor: 'bg-violet-400'  },
  shipped:    { label: 'Shipping',         bgColor: 'bg-indigo-50',  textColor: 'text-indigo-700',  borderColor: 'border-indigo-200', dotColor: 'bg-indigo-400'  },
  delivered:  { label: 'Delivered',        bgColor: 'bg-green-50',   textColor: 'text-green-700',   borderColor: 'border-green-200',  dotColor: 'bg-green-500'   },
  cancelled:  { label: 'Cancelled',        bgColor: 'bg-red-50',     textColor: 'text-red-700',     borderColor: 'border-red-200',    dotColor: 'bg-red-400'     },
  refunded:   { label: 'Refunded',         bgColor: 'bg-gray-50',    textColor: 'text-gray-700',    borderColor: 'border-gray-200',   dotColor: 'bg-gray-400'    },
};

const TABS = [
  { key: '',           label: 'All' },
  { key: 'pending',    label: 'Pending' },
  { key: 'confirmed',  label: 'To Ship' },
  { key: 'shipped',    label: 'Shipping' },
  { key: 'delivered',  label: 'Delivered' },
  { key: 'cancelled',  label: 'Cancelled' },
];

const PAYMENT_LABELS: Record<string, string> = {
  cod:     'COD',
  momo:    'MoMo',
  vnpay:   'VNPay',
  stripe:  'Credit Card',
  cash:    'Cash',
};

const FREQUENCY_LABEL: Record<string, string> = {
  weekly:      'Weekly',
  'bi-weekly': 'Bi‑Weekly',
  monthly:     'Monthly',
};

// ─── Utility helpers ────────────────────────────────────────────
const getItemName  = (item: any) => item?.name    || item?.productId?.name            || 'Product';
const getItemImage = (item: any) => item?.image || item?.productId?.thumbnail || item?.productId?.imageUrls?.[0] || item?.productId?.image || '';
const getProductId = (item: any) =>
  !item ? null : typeof item.productId === 'object' ? item.productId?._id : item.productId;

function getPaymentLabel(method?: string) {
  if (!method) return 'N/A';
  return PAYMENT_LABELS[method.toLowerCase()] ?? method.replace(/_/g, ' ').toUpperCase();
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatCurrency(amount: number) {
  return amount.toLocaleString('vi-VN') + '₫';
}

// ─── Status Badge ────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border bg-gray-50 text-gray-600 border-gray-200">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        {status}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${cfg.bgColor} ${cfg.textColor} ${cfg.borderColor}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
      {cfg.label}
    </span>
  );
}

// ─── Empty State ─────────────────────────────────────────────────
function EmptyState({ status }: { status: string }) {
  const navigate = useNavigate();
  const config = STATUS_CONFIG[status];
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#EDF2EE] to-[#F3F4F6] flex items-center justify-center">
          <ShoppingCart className="w-16 h-16 text-[#00B207]/30" strokeWidth={1} />
        </div>
        {/* Decorative dots */}
        <div className="absolute top-2 right-0 w-5 h-5 rounded-full bg-[#00B207]/10" />
        <div className="absolute bottom-3 left-1 w-3 h-3 rounded-full bg-[#00B207]/20" />
        <div className="absolute top-0 left-4 w-4 h-4 rounded-full bg-amber-100" />
      </div>
      <h3 className="text-xl font-bold text-[#101828] mb-2">
        {status ? 'No orders found' : 'No orders yet'}
      </h3>
      <p className="text-sm text-[#6A7282] text-center max-w-xs mb-8 leading-relaxed">
        {status && config
          ? `You have no orders with "${config.label}" status.`
          : 'You have not placed any orders yet. Explore our fresh products today!'}
      </p>
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 px-7 py-3 bg-[#00B207] text-white rounded-xl font-semibold hover:bg-[#009906] transition-all shadow-sm hover:shadow-md active:scale-95"
      >
        <ShoppingBag className="w-5 h-5" />
        Continue Shopping
      </button>
    </div>
  );
}

// ─── Skeleton Loader ─────────────────────────────────────────────
function OrderCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden animate-pulse">
      <div className="px-5 py-4 bg-[#FAFAFA] border-b border-[#F3F4F6] flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#E5E7EB]" />
          <div className="space-y-1.5">
            <div className="h-4 w-36 bg-[#E5E7EB] rounded" />
            <div className="h-3 w-24 bg-[#F3F4F6] rounded" />
          </div>
        </div>
        <div className="h-6 w-28 bg-[#E5E7EB] rounded-full" />
      </div>
      <div className="px-5 py-4 border-b border-[#F3F4F6] flex gap-4">
        <div className="w-16 h-16 bg-[#F3F4F6] rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 w-3/4 bg-[#E5E7EB] rounded" />
          <div className="h-3 w-1/2 bg-[#F3F4F6] rounded" />
        </div>
      </div>
      <div className="px-5 py-4 flex justify-between items-end">
        <div className="space-y-1.5">
          <div className="h-3 w-24 bg-[#F3F4F6] rounded" />
          <div className="h-7 w-32 bg-[#E5E7EB] rounded-lg" />
          <div className="h-3 w-20 bg-[#F3F4F6] rounded" />
        </div>
        <div className="flex flex-col gap-2 items-end">
          <div className="h-9 w-28 bg-[#F3F4F6] rounded-lg" />
          <div className="flex gap-2">
            <div className="h-7 w-20 bg-[#F3F4F6] rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Card ───────────────────────────────────────────────────
function OrderCard({
  order,
  onViewDetail,
  onReorder,
  onCancel,
  reordering,
}: {
  order: ExtendedOrder;
  onViewDetail: (order: ExtendedOrder) => void;
  onReorder: (order: ExtendedOrder) => void;
  onCancel: (order: ExtendedOrder) => void;
  reordering: boolean;
}) {
  const navigate = useNavigate();
  const hasItems = order.items && order.items.length > 0;
  const firstItem = hasItems ? (order.items as any[])[0] : null;
  const extraCount = hasItems ? Math.max(0, (order.items ?? []).length - 1) : 0;
  const thumbnail = firstItem ? getItemImage(firstItem) : '';
  const firstName = firstItem ? getItemName(firstItem) : '';

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">

      {/* ── Recurring Order Banner (manual first order) ── */}
      {order.isRecurring && (
        <div className="px-5 py-2 bg-gradient-to-r from-[#00B207] to-[#16a34a] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">🔄</span>
            <span className="text-xs font-bold text-white tracking-wide">Recurring Order</span>
          </div>
          {order.subscriptionFrequency && (
            <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full">
              {FREQUENCY_LABEL[order.subscriptionFrequency] ?? order.subscriptionFrequency}
            </span>
          )}
        </div>
      )}

      {/* ── Row 1: ID + Date + Status ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${order.isRecurring ? 'bg-[#EDF2EE]' : 'bg-[#EDF2EE]'}`}>
            {order.isRecurring
              ? <Repeat2 className="w-4 h-4 text-[#00B207]" />
              : <Package className="w-4 h-4 text-[#00B207]" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-[#101828] font-mono tracking-wide">
                #{order._id.slice(-10).toUpperCase()}
              </p>
              {order.subscriptionId && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 select-none"
                  title="Belongs to a recurring subscription"
                >
                  <CalendarClock className="w-3 h-3" />
                  🔁 Recurring
                </span>
              )}
            </div>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* ── Row 2: Product Preview ── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6]">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-[#F9FAFB] flex-shrink-0 overflow-hidden border border-[#E5E7EB]">
          {hasItems && thumbnail ? (
            <img
              src={thumbnail}
              alt={firstName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F9FAFB] to-[#F3F4F6]">
              <Package className="w-7 h-7 text-[#D1D5DB]" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {hasItems ? (
            <>
              <p className="text-sm font-semibold text-[#101828] truncate">{firstName}</p>
              <p className="text-xs text-[#6A7282] mt-1">
                Qty:&nbsp;
                <span className="font-semibold text-[#364153]">{firstItem?.quantity}</span>
                {extraCount > 0 && (
                  <span className="ml-1.5 text-[#00B207] font-semibold">
                    ...and {extraCount} more item(s)
                  </span>
                )}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#9CA3AF] flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5" />
              Product
            </p>
          )}
          {order.notes && (
            <p className="text-xs text-[#9CA3AF] mt-1.5 italic truncate flex items-center gap-1">
              <FileText className="w-3 h-3 flex-shrink-0" />
              {order.notes}
            </p>
          )}
        </div>
      </div>

      {/* ── Row 3: Total + Payment + Actions ── */}
      <div className="flex items-end justify-between px-5 py-4">
        {/* Left: Financials */}
        <div>
          <p className="text-xs text-[#9CA3AF] mb-0.5 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-extrabold text-[#00B207] leading-none">
            {formatCurrency(order.totalAmount)}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1.5 flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            {getPaymentLabel(order.paymentMethod)}
          </p>
          {(order as any).deliveryInfo?.type === 'pickup' && (
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Store className="w-3 h-3" />
              Store Pickup
            </span>
          )}
          {((order as any).deliveryInfo?.type === 'delivery' ||
            ((order as any).deliveryInfo && (order as any).deliveryInfo.type !== 'pickup')) && (
            <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              <MapPin className="w-3 h-3" />
              Home Delivery
            </span>
          )}
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={() => onViewDetail(order)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#00B207] border-2 border-[#00B207] rounded-xl hover:bg-[#EDF2EE] active:scale-95 transition-all"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => onReorder(order)}
              disabled={reordering}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#00B207] rounded-xl hover:bg-[#009906] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reordering ? (
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <RotateCcw className="w-3.5 h-3.5" />
              )}
              Reorder
            </button>
            {order.isRecurring && (
              <button
                onClick={() => navigate('/profile?tab=subscriptions')}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-[#00B207] border-2 border-[#00B207]/40 bg-[#EDF2EE] rounded-xl hover:bg-[#00B207] hover:text-white active:scale-95 transition-all"
              >
                <CalendarClock className="w-3.5 h-3.5" />
                Manage Plan
              </button>
            )}
            {order.status === 'pending' && (
              <button
                onClick={() => onCancel(order)}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 active:scale-95 transition-all"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Order Detail Modal / Drawer ──────────────────────────────────
function OrderDetailModal({
  order,
  onClose,
}: {
  order: ExtendedOrder;
  onClose: () => void;
}) {
  const [fullOrder, setFullOrder] = useState<ExtendedOrder>(order);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const fetchFull = async () => {
      try {
        const res: any = await orderService.getOrderById(order._id);
        if (!cancelled) setFullOrder((res.data ?? res) as ExtendedOrder);
      } catch {
        // fall back to list data silently
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    };
    fetchFull();
    return () => { cancelled = true; };
  }, [order._id]);

  // Fetch the linked subscription for isRecurring orders
  useEffect(() => {
    if (!order.isRecurring) return;
    let cancelled = false;
    const fetchSub = async () => {
      setLoadingSub(true);
      try {
        const res: any = await subscriptionService.getMySubscriptions(1, 5);
        if (!cancelled) {
          const list: any[] = res?.data?.data ?? res?.data ?? [];
          // Pick the most recently created active/paused subscription
          const found = list.find((s: any) => s.status !== 'cancelled') ?? list[0] ?? null;
          setSubscription(found);
        }
      } catch {
        // non-fatal
      } finally {
        if (!cancelled) setLoadingSub(false);
      }
    };
    fetchSub();
    return () => { cancelled = true; };
  }, [order._id, order.isRecurring]);

  const delivery = fullOrder.deliveryInfo as any;
  const isPickup = delivery?.type === 'pickup';
  const pickup = fullOrder.pickupLocation as any;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">

        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#E5E7EB]" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h3 className="text-lg font-bold text-[#101828]">Order Details</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <p className="text-xs text-[#9CA3AF] font-mono">
                #{order._id.toUpperCase()}
              </p>
              {order.subscriptionId && (
                <span
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-200 select-none"
                  title="Belongs to a recurring subscription"
                >
                  <CalendarClock className="w-3 h-3" />
                  🔁 Recurring
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-0.5">
            <StatusBadge status={order.status} />
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
            >
              <X className="w-4 h-4 text-[#6A7282]" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 divide-y divide-[#F3F4F6]">

          {/* ── Full-order loading skeleton ── */}
          {loadingDetail && (
            <div className="px-6 py-6 space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="h-14 bg-[#F3F4F6] rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {/* ── Delivery Info ── */}
          {!loadingDetail && delivery && (delivery.fullName || delivery.phone || delivery.address || isPickup) && (
            <div className="px-6 py-5">
              <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-4">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${isPickup ? 'bg-emerald-50' : 'bg-[#EDF2EE]'}`}>
                  {isPickup
                    ? <Store className="w-3.5 h-3.5 text-emerald-600" />
                    : <MapPin className="w-3.5 h-3.5 text-[#00B207]" />}
                </div>
                {isPickup ? 'Store Pickup Info' : 'Delivery Info'}
              </h4>

              {isPickup ? (
                /* ─── PICKUP LAYOUT ─── */
                <div className="space-y-3">
                  {/* Recipient */}
                  {(delivery.fullName || delivery.phone || delivery.email) && (
                    <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] px-4 py-3 space-y-2.5">
                      <p className="text-xs font-semibold text-[#6A7282] uppercase tracking-wide mb-1">Recipient</p>
                      {delivery.fullName && <InfoRow label="Full Name" value={delivery.fullName} bold />}
                      {delivery.phone && <InfoRow label="Phone" value={delivery.phone} />}
                      {delivery.email && <InfoRow label="Email" value={delivery.email} />}
                    </div>
                  )}

                  {/* Store details */}
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 space-y-2.5">
                    <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-1">Store</p>
                    {pickup?.name && <InfoRow label="Name" value={pickup.name} bold />}
                    {pickup?.address && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="text-[#9CA3AF] w-24 flex-shrink-0">Address</span>
                        <div>
                          <span className="font-medium text-[#101828] leading-relaxed">{pickup.address}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickup.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-[#00B207] hover:underline w-fit"
                          >
                            <Navigation2 className="w-3.5 h-3.5" />
                            Get Directions
                          </a>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pickup instruction */}
                  <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <span className="text-xl leading-none">🏪</span>
                    <div>
                      <p className="text-xs font-bold text-amber-800 mb-0.5">Note</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Please show your order ID{' '}
                        <span className="font-bold text-amber-900 font-mono">#{order._id.slice(-10).toUpperCase()}</span>{' '}
                        to the staff at the counter to collect your order.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* ─── HOME DELIVERY LAYOUT ─── */
                <div className="space-y-3">
                  {/* Recipient card */}
                  {(delivery.fullName || delivery.phone || delivery.email) && (
                    <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] px-4 py-3 space-y-2.5">
                      <p className="text-xs font-semibold text-[#6A7282] uppercase tracking-wide mb-1">Recipient</p>
                      {delivery.fullName && <InfoRow label="Full Name" value={delivery.fullName} bold />}
                      {delivery.phone && <InfoRow label="Phone" value={delivery.phone} />}
                      {delivery.email && <InfoRow label="Email" value={delivery.email} />}
                    </div>
                  )}

                  {/* Address card */}
                  {delivery.address && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 space-y-2.5">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-1">Delivery Address</p>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-[#101828] leading-relaxed">{delivery.address}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-blue-600 hover:underline w-fit"
                          >
                            <Navigation2 className="w-3.5 h-3.5" />
                            View on Map
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Subscription Summary (for isRecurring manual orders) ── */}
          {!loadingDetail && fullOrder.isRecurring && (
            <div className="px-6 py-5">
              <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-green-50 flex items-center justify-center">
                  <RefreshCw className="w-3.5 h-3.5 text-[#00B207]" />
                </div>
                Subscription Summary
              </h4>
              {loadingSub ? (
                <div className="h-28 bg-[#F3F4F6] rounded-xl animate-pulse" />
              ) : subscription ? (
                <div className="bg-green-50 border border-green-200 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 space-y-2.5">
                    <InfoRow
                      label="Frequency"
                      value={FREQUENCY_LABEL[subscription.frequency] ?? subscription.frequency}
                      bold
                    />
                    <InfoRow label="Start Date"    value={formatDate(subscription.startDate)} />
                    <InfoRow label="Next Delivery" value={formatDate(subscription.nextDeliveryDate)} />
                    <InfoRow
                      label="Plan Status"
                      value={subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                    />
                  </div>
                  <div className="flex justify-end px-4 py-2.5 border-t border-green-100">
                    <button
                      onClick={() => { onClose(); navigate('/profile?tab=subscriptions'); }}
                      className="flex items-center gap-1.5 text-xs font-bold text-[#00B207] hover:underline"
                    >
                      <CalendarClock className="w-3.5 h-3.5" />
                      Manage this plan →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#9CA3AF] text-center">
                  No subscription plan found.
                </div>
              )}
            </div>
          )}

          {/* ── Notes ── */}
          {!loadingDetail && fullOrder.notes && (
            <div className="px-6 py-5">
              <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                </div>
                Notes
              </h4>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-800 leading-relaxed">{fullOrder.notes}</p>
              </div>
            </div>
          )}

          {/* ── Items ── */}
          {!loadingDetail && (
          <div className="px-6 py-5">
            <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#EDF2EE] flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-[#00B207]" />
              </div>
              Products
              <span className="ml-1 px-1.5 py-0.5 bg-[#F3F4F6] text-[#6A7282] text-xs rounded-md font-medium">
                {fullOrder.items.length}
              </span>
            </h4>
            <div className="space-y-2.5">
              {fullOrder.items.map((item: any, idx: number) => {
                const img  = getItemImage(item);
                const name = getItemName(item);
                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#F3F4F6] bg-white hover:border-[#E5E7EB] transition-colors"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex-shrink-0 overflow-hidden">
                      {img ? (
                        <img
                          src={img}
                          alt={name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-5 h-5 text-[#D1D5DB]" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#101828] truncate">{name}</p>
                      <p className="text-xs text-[#6A7282] mt-0.5">
                        {formatCurrency(item.price)} &times; {item.quantity}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-[#101828] flex-shrink-0">
                      {formatCurrency(item.subtotal)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          )}

          {/* ── Payment Summary ── */}
          {!loadingDetail && (
          <div className="px-6 py-5">
            <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#EDF2EE] flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-[#00B207]" />
              </div>
              Payment Summary
            </h4>
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-4 py-3 space-y-2.5">
                {(fullOrder.shippingCost ?? 0) > 0 && (
                  <SummaryRow label="Shipping Fee" value={formatCurrency(fullOrder.shippingCost!)} />
                )}
                {(fullOrder.discountAmount ?? 0) > 0 && (
                  <SummaryRow
                    label={<span className="flex items-center gap-1"><Tag className="w-3 h-3" />Discount</span>}
                    value={`-${formatCurrency(fullOrder.discountAmount!)}`}
                    valueClass="text-[#00B207]"
                  />
                )}
                {(fullOrder.taxAmount ?? 0) > 0 && (
                  <SummaryRow label="Tax" value={formatCurrency(fullOrder.taxAmount!)} />
                )}
                <SummaryRow label="Payment Method" value={getPaymentLabel(fullOrder.paymentMethod)} />
                <SummaryRow
                  label="Payment Status"
                  value={
                    fullOrder.paymentStatus === 'paid' ? 'Paid' :
                    fullOrder.paymentStatus === 'failed' ? 'Failed' : 'Awaiting Payment'
                  }
                  valueClass={
                    fullOrder.paymentStatus === 'paid' ? 'text-green-600' :
                    fullOrder.paymentStatus === 'failed' ? 'text-red-600' : 'text-amber-600'
                  }
                />
              </div>
              {/* Total */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#EDF2EE] border-t border-[#E5E7EB]">
                <span className="font-bold text-[#101828]">Total</span>
                <span className="text-xl font-extrabold text-[#00B207]">
                  {formatCurrency(fullOrder.totalAmount)}
                </span>
              </div>
            </div>
          </div>
          )}

          {/* ── Cancel reason (if cancelled) ── */}
          {!loadingDetail && fullOrder.status === 'cancelled' && (fullOrder as any).cancelReason && (
            <div className="px-6 py-4">
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <Ban className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Cancellation Reason</p>
                  <p className="text-sm text-red-600">{(fullOrder as any).cancelReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom spacing */}
          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}

// ─── Tiny helper sub-components ──────────────────────────────────
function InfoRow({
  label,
  value,
  bold,
  multiline,
}: {
  label: string;
  value: string;
  bold?: boolean;
  multiline?: boolean;
}) {
  return (
    <div className={`flex ${multiline ? 'items-start' : 'items-center'} gap-2 text-sm`}>
      <span className="text-[#9CA3AF] w-24 flex-shrink-0">{label}</span>
      <span className={`${bold ? 'font-bold' : 'font-medium'} text-[#101828] ${multiline ? 'leading-relaxed' : ''}`}>
        {value}
      </span>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClass = 'text-[#101828]',
}: {
  label: React.ReactNode;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[#6A7282]">{label}</span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  );
}

// ─── Cancel Confirmation Modal ────────────────────────────────────
function CancelModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95">
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-[#101828] mb-2">Cancel Order</h3>
          <p className="text-sm text-[#6A7282] mb-1">
            Are you sure you want to cancel this order?
          </p>
          <p className="text-xs text-[#9CA3AF] mb-6">
            This action cannot be undone once confirmed.
          </p>
          <div className="flex gap-3 w-full">
            <button
              disabled={loading}
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-[#364153] bg-[#F3F4F6] rounded-xl hover:bg-[#E5E7EB] transition-colors disabled:opacity-50"
            >
              Keep Order
            </button>
            <button
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Confirm Cancel'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription Payment Modal ──────────────────────────────────
function SubscriptionPaymentModal({
  order,
  onClose,
}: {
  order: ExtendedOrder;
  onClose: () => void;
}) {
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const method = (order.paymentMethod ?? '').toLowerCase();
  const items = order.items ?? [];

  const handleMomo = async () => {
    setPaying(true);
    setError('');
    try {
      const res = await momoService.createPayment({
        orderId: order._id,
        amount: order.totalAmount,
        description: `Pay recurring order #${order._id.slice(-8).toUpperCase()}`,
      }) as any;
      const data = res?.data?.data ?? res?.data;
      if (data?.payUrl) {
        sessionStorage.setItem('pendingMoMoOrder', JSON.stringify({
          orderData: { orderId: order._id, amount: order.totalAmount, paymentMethod: 'momo' },
          orderId: data.orderId,
          paymentId: data.paymentId,
          momoOrderId: data.momoOrderId,
          requestId: data.requestId,
          fromMoMo: true,
          subscriptionConfig: null,
        }));
        window.location.href = data.payUrl;
      } else {
        setError('Failed to get MoMo payment link.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to initiate MoMo payment.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={paying ? undefined : onClose} />
      <div className="relative bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-3xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300">
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-0 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#E5E7EB]" />
        </div>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center">
                <CalendarClock className="w-4 h-4 text-violet-600" />
              </div>
              <h3 className="text-base font-bold text-[#101828]">Pay Recurring Order</h3>
            </div>
            <p className="text-xs text-violet-500 font-mono mt-1 ml-9">
              #{order._id.slice(-10).toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={paying}
            className="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center hover:bg-[#E5E7EB] transition-colors"
          >
            <X className="w-4 h-4 text-[#6A7282]" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Items */}
          <div>
            <p className="text-xs font-semibold text-[#9CA3AF] uppercase tracking-wide mb-2">
              Items ({items.length})
            </p>
            <div className="space-y-2">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-[#F9FAFB] border border-[#F3F4F6]">
                  <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E7EB] flex-shrink-0 overflow-hidden">
                    {getItemImage(item) ? (
                      <img src={getItemImage(item)} alt={getItemName(item)} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-4 h-4 text-[#D1D5DB]" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#101828] truncate">{getItemName(item)}</p>
                    <p className="text-xs text-[#9CA3AF]">x{item.quantity} · {formatCurrency(item.price)}</p>
                  </div>
                  <p className="text-sm font-bold text-[#101828] flex-shrink-0">
                    {formatCurrency(item.subtotal ?? item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between bg-violet-50 border border-violet-100 rounded-xl px-4 py-3">
            <span className="font-bold text-[#101828]">Total</span>
            <span className="text-xl font-extrabold text-violet-600">{formatCurrency(order.totalAmount)}</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Payment Buttons */}
        <div className="px-6 py-4 border-t border-[#E5E7EB] space-y-2.5">
          {method === 'momo' && (
            <button
              onClick={handleMomo}
              disabled={paying}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-white text-sm bg-[#AE2070] hover:bg-[#8f1a5c] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {paying
                ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" className="w-5 h-5 rounded-full object-cover" alt="MoMo" />
              }
              {paying ? 'Processing...' : 'Pay with MoMo'}
            </button>
          )}
          {method !== 'momo' && (
            <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-center">
              <p className="text-sm font-semibold text-green-700">✅ This order is paid on delivery (COD)</p>
              <p className="text-xs text-green-600 mt-0.5">No prepayment required.</p>
            </div>
          )}
          <button
            onClick={onClose}
            disabled={paying}
            className="w-full py-2.5 text-sm font-semibold text-[#6A7282] bg-[#F3F4F6] rounded-xl hover:bg-[#E5E7EB] transition-colors disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Subscription Order Card ──────────────────────────────────────
function SubscriptionOrderCard({
  order,
  onViewDetail,
  onPay,
  isHighlighted,
  cardRef,
}: {
  order: ExtendedOrder;
  onViewDetail: (order: ExtendedOrder) => void;
  onPay: (order: ExtendedOrder) => void;
  isHighlighted: boolean;
  cardRef?: (el: HTMLDivElement | null) => void;
}) {
  const firstItem = (order.items ?? [])[0] as any;
  const extraCount = Math.max(0, (order.items ?? []).length - 1);
  const thumbnail = firstItem ? getItemImage(firstItem) : '';
  const firstName = firstItem ? getItemName(firstItem) : 'Product';
  const isUnpaid = order.paymentStatus === 'unpaid';

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border-2 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group
        ${isHighlighted
          ? 'border-violet-500 ring-4 ring-violet-100'
          : 'border-violet-200 hover:border-violet-400'
        }`}
    >
      {/* ── Subscription Banner ── */}
      <div className="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Repeat2 className="w-4 h-4 text-white" />
          <span className="text-xs font-bold text-white tracking-wide">Recurring Order</span>
        </div>
        {isUnpaid && (
          <span className="text-[10px] font-bold text-amber-900 bg-amber-300 px-2 py-0.5 rounded-full">
            ⚠️ Unpaid
          </span>
        )}
      </div>

      {/* ── Row 1: ID + Date + Status ── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-violet-50 bg-violet-50/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center flex-shrink-0">
            <CalendarClock className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#101828] font-mono tracking-wide">
              #{order._id.slice(-10).toUpperCase()}
            </p>
            <p className="text-xs text-[#9CA3AF] mt-0.5">{formatDate(order.createdAt)}</p>
          </div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* ── Unpaid Warning Bar ── */}
      {isUnpaid && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border-b border-amber-100">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            Please pay before the delivery date to ensure the order is processed.
          </p>
        </div>
      )}

      {/* ── Row 2: Product Preview ── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6] bg-white">
        <div className="w-16 h-16 rounded-xl bg-[#F9FAFB] flex-shrink-0 overflow-hidden border border-[#E5E7EB]">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={firstName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-50 to-purple-50">
              <Package className="w-7 h-7 text-violet-200" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#101828] truncate">{firstName}</p>
          <p className="text-xs text-[#6A7282] mt-1">
            Qty:&nbsp;
            <span className="font-semibold text-[#364153]">{firstItem?.quantity}</span>
            {extraCount > 0 && (
              <span className="ml-1.5 text-violet-600 font-semibold">...and {extraCount} more item(s)</span>
            )}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1 flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            {getPaymentLabel(order.paymentMethod)}
          </p>
        </div>
      </div>

      {/* ── Row 3: Total + Actions ── */}
      <div className="flex items-end justify-between px-5 py-4 bg-white">
        <div>
          <p className="text-xs text-[#9CA3AF] mb-0.5 uppercase tracking-wide">Total</p>
          <p className="text-2xl font-extrabold text-violet-600 leading-none">
            {formatCurrency(order.totalAmount)}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {isUnpaid && (
            <button
              onClick={() => onPay(order)}
              className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-violet-600 rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-sm shadow-violet-200"
            >
              <CreditCard className="w-4 h-4" />
              Pay Now
            </button>
          )}
          <button
            onClick={() => onViewDetail(order)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-violet-600 border-2 border-violet-200 rounded-xl hover:bg-violet-50 active:scale-95 transition-all"
          >
            <Eye className="w-4 h-4" />
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export: OrderHistoryTab ─────────────────────────────────
export default function OrderHistoryTab({ highlightOrderId }: { highlightOrderId?: string } = {}) {
  const { refreshCart, openCart } = useCart();

  const [activeStatus, setActiveStatus]   = useState('');
  const [orders, setOrders]               = useState<ExtendedOrder[]>([]);
  const [loading, setLoading]             = useState(false);
  const [page, setPage]                   = useState(1);
  const [totalPages, setTotalPages]       = useState(1);
  const [detailOrder, setDetailOrder]     = useState<ExtendedOrder | null>(null);
  const [paymentOrder, setPaymentOrder]   = useState<ExtendedOrder | null>(null);
  const [cancelState, setCancelState]     = useState<{
    order: ExtendedOrder | null;
    cancelling: boolean;
  }>({ order: null, cancelling: false });
  const [reordering, setReordering]       = useState(false);

  // Refs for auto-scroll to highlighted card
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await orderService.getMyOrders(page, 8, activeStatus || undefined);
      setOrders(res.data ?? []);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Auto-scroll and open payment modal for highlighted subscription order
  useEffect(() => {
    if (!highlightOrderId || loading || orders.length === 0) return;
    const el = cardRefs.current[highlightOrderId];
    if (el) {
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // If the order is a subscription with unpaid status, auto-open payment modal
        const order = orders.find(o => o._id === highlightOrderId);
        if (order && (order as any).subscriptionId && order.paymentStatus === 'unpaid') {
          setTimeout(() => setPaymentOrder(order), 600);
        }
      }, 300);
    }
  }, [highlightOrderId, loading, orders]);

  const handleTabChange = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

  // When a highlight link arrives, reset to page 1 so the order is visible
  useEffect(() => {
    if (highlightOrderId) {
      setActiveStatus('');
      setPage(1);
    }
  }, [highlightOrderId]);

  const handleReorder = async (order: ExtendedOrder) => {
    if (reordering) return;
    try {
      setReordering(true);
      for (const item of order.items as any[]) {
        const productId = getProductId(item);
        if (productId) {
          await cartService.addToCart({ productId, quantity: item.quantity ?? 1 });
        }
      }
      await refreshCart();
      openCart();
      toast.success(`Added ${order.items.length} item(s) to cart!`);
    } catch {
      toast.error('Could not add to cart. Some products may be unavailable.');
    } finally {
      setReordering(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelState.order) return;
    setCancelState(prev => ({ ...prev, cancelling: true }));
    try {
      await orderService.cancelOrder(cancelState.order._id, 'Cancelled by customer');
      toast.success('Order cancelled successfully');
      setCancelState({ order: null, cancelling: false });
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel order');
      setCancelState(prev => ({ ...prev, cancelling: false }));
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#101828]">Order History</h2>
          <p className="text-sm text-[#6A7282] mt-0.5">Track and manage your orders</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          title="Refresh"
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#E5E7EB] text-[#6A7282] hover:bg-[#EDF2EE] hover:text-[#00B207] hover:border-[#00B207] transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Status Tab Bar ── */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="flex min-w-max border-b border-[#F3F4F6]">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => handleTabChange(tab.key)}
                className={`relative px-5 py-3.5 text-sm font-semibold whitespace-nowrap transition-all ${
                  activeStatus === tab.key
                    ? 'text-[#00B207]'
                    : 'text-[#6A7282] hover:text-[#364153] hover:bg-[#FAFAFA]'
                }`}
              >
                {tab.label}
                {activeStatus === tab.key && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-[#00B207] rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content Area ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <OrderCardSkeleton key={i} />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm">
          <EmptyState status={activeStatus} />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Order Cards */}
          {orders.map(order => (
            (order as any).subscriptionId ? (
              <SubscriptionOrderCard
                key={order._id}
                order={order}
                onViewDetail={setDetailOrder}
                onPay={setPaymentOrder}
                isHighlighted={highlightOrderId === order._id}
                cardRef={(el) => { cardRefs.current[order._id] = el; }}
              />
            ) : (
              <div key={order._id} ref={(el) => { cardRefs.current[order._id] = el; }}>
                <OrderCard
                  order={order}
                  onViewDetail={setDetailOrder}
                  onReorder={handleReorder}
                  onCancel={o => setCancelState({ order: o, cancelling: false })}
                  reordering={reordering}
                />
              </div>
            )
          ))}

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#E5E7EB] text-[#6A7282] hover:bg-[#EDF2EE] hover:border-[#00B207] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
                    p === page
                      ? 'bg-[#00B207] text-white shadow-sm'
                      : 'bg-white border border-[#E5E7EB] text-[#364153] hover:bg-[#EDF2EE] hover:border-[#00B207]'
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#E5E7EB] text-[#6A7282] hover:bg-[#EDF2EE] hover:border-[#00B207] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Order Detail Modal ── */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
        />
      )}

      {/* ── Subscription Payment Modal ── */}
      {paymentOrder && (
        <SubscriptionPaymentModal
          order={paymentOrder}
          onClose={() => setPaymentOrder(null)}
        />
      )}

      {/* ── Cancel Confirmation Modal ── */}
      {cancelState.order && (
        <CancelModal
          loading={cancelState.cancelling}
          onConfirm={handleCancelConfirm}
          onClose={() =>
            !cancelState.cancelling &&
            setCancelState({ order: null, cancelling: false })
          }
        />
      )}
    </div>
  );
}
