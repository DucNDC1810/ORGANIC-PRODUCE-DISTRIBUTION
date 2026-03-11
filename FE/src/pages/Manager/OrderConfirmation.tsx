import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  Package,
  MapPin,
  CreditCard,
  User,
  CalendarDays,
  Phone,
  Mail,
  Truck,
  CircleDollarSign,
  StickyNote,
  Filter,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { toast } from 'sonner';
import { orderAPI, Order } from '../Axios/Axios';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending:    { label: 'Pending',    className: 'bg-amber-100 text-amber-800 border-amber-200' },
  confirmed:  { label: 'Confirmed',  className: 'bg-blue-100  text-blue-800  border-blue-200'  },
  processing: { label: 'Processing', className: 'bg-purple-100 text-purple-800 border-purple-200' },
  shipped:    { label: 'Shipped',    className: 'bg-cyan-100  text-cyan-800  border-cyan-200'  },
  delivered:  { label: 'Delivered',  className: 'bg-green-100 text-green-800 border-green-200' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-100   text-red-800   border-red-200'   },
  refunded:   { label: 'Refunded',   className: 'bg-gray-100  text-gray-800  border-gray-200'  },
};

const PAYMENT_STATUS_CONFIG: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: 'Pending',  className: 'bg-amber-100 text-amber-800' },
  paid:    { label: 'Paid',     className: 'bg-green-100 text-green-800' },
  failed:  { label: 'Failed',   className: 'bg-red-100   text-red-800'   },
  unpaid:  { label: 'Unpaid',   className: 'bg-gray-100  text-gray-700'  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(iso));

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cfg.className}`}
    >
      {cfg.label}
    </span>
  );
};

const PaymentBadge = ({ status }: { status?: string }) => {
  if (!status) return null;
  const cfg = PAYMENT_STATUS_CONFIG[status] ?? { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};

// Summary stat card
const StatCard = ({
  title,
  value,
  icon: Icon,
  accent,
  sub,
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  sub?: string;
}) => (
  <Card className={`border-l-4 ${accent} shadow-sm hover:shadow-md transition-shadow`}>
    <CardContent className="pt-5 pb-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-full flex items-center justify-center ${accent.replace('border-l-', 'bg-').replace('-500', '-100')}`}>
          <Icon className={`w-5 h-5 ${accent.replace('border-l-', 'text-').replace('border-', 'text-')}`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

// ─────────────────────────────────────────────
// Order Detail Modal
// ─────────────────────────────────────────────

interface OrderDetailModalProps {
  order: Order | null;
  open: boolean;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  loading: boolean;
}

const OrderDetailModal = ({
  order,
  open,
  onClose,
  onConfirm,
  onCancel,
  loading,
}: OrderDetailModalProps) => {
  if (!order) return null;

  const isPending = order.status === 'pending';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            Order Details
          </DialogTitle>
          <DialogDescription>
            Review all order information before confirming or cancelling.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Header row */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-gray-50 rounded-xl border">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Order ID</p>
              <p className="text-sm font-mono font-bold text-gray-900">{order._id}</p>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={order.status} />
              <PaymentBadge status={order.paymentStatus} />
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-white">
              <CalendarDays className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Order Date</p>
                <p className="text-sm text-gray-900 font-semibold">{formatDate(order.orderDate)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-lg border bg-white">
              <CreditCard className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Payment Method</p>
                <p className="text-sm text-gray-900 font-semibold capitalize">
                  {order.paymentMethod?.replace(/_/g, ' ') ?? '—'}
                </p>
              </div>
            </div>
            {/* <div className="flex items-start gap-3 p-3 rounded-lg border bg-white">
              <User className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500 font-medium">Customer</p>
                {typeof order.userId === 'object' && order.userId !== null ? (
                  <>
                    <p className="text-sm text-gray-900 font-semibold">{(order.userId as any).name}</p>
                    <p className="text-xs text-gray-500">{(order.userId as any).email}</p>
                  </>
                ) : (
                  <p className="text-sm text-gray-900 font-mono">{order.userId as string}</p>
                )}
              </div>
            </div> */}
          </div>

          {/* Delivery Info */}
          {(order.deliveryInfo || order.notes) && (
            <div className="rounded-xl border bg-blue-50 border-blue-100 p-4 space-y-3">
              <h4 className="text-sm font-semibold text-blue-800 flex items-center gap-1.5">
                <Truck className="w-4 h-4" />
                Delivery Info
              </h4>
              {order.deliveryInfo && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {order.deliveryInfo.fullName && (
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Recipient</p>
                        <p className="text-sm text-gray-900 font-semibold">{order.deliveryInfo.fullName}</p>
                      </div>
                    </div>
                  )}
                  {order.deliveryInfo.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Phone</p>
                        <p className="text-sm text-gray-900 font-semibold">{order.deliveryInfo.phone}</p>
                      </div>
                    </div>
                  )}
                  {order.deliveryInfo.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Email</p>
                        <p className="text-sm text-gray-900 font-semibold">{order.deliveryInfo.email}</p>
                      </div>
                    </div>
                  )}
                  {order.deliveryInfo.type && (
                    <div className="flex items-center gap-2">
                      <Truck className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Type</p>
                        <p className="text-sm text-gray-900 font-semibold capitalize">{order.deliveryInfo.type}</p>
                      </div>
                    </div>
                  )}
                  {order.deliveryInfo.address && (
                    <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Address</p>
                        <p className="text-sm text-gray-900">{order.deliveryInfo.address}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {order.notes && (
                <div className="flex items-start gap-2 pt-2 border-t border-blue-200">
                  <StickyNote className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">Notes</p>
                    <p className="text-sm text-gray-700 italic">{order.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Type */}
          {(order.orderType || order.deliveryInfo?.type) && (
            <div className="rounded-xl border bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5 mb-3">
                <Truck className="w-4 h-4 text-gray-500" />
                Order Type
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                {/* Order type badge */}
                {order.orderType && (() => {
                  const typeConfig: Record<string, { label: string; className: string }> = {
                    regular:      { label: 'Regular Order',    className: 'bg-gray-100 text-gray-800 border-gray-300' },
                    group_buy:    { label: 'Group Buy',        className: 'bg-purple-100 text-purple-800 border-purple-200' },
                    subscription: { label: 'Subscription',     className: 'bg-amber-100 text-amber-800 border-amber-200' },
                  };
                  const cfg = typeConfig[order.orderType] ?? { label: order.orderType, className: 'bg-gray-100 text-gray-700 border-gray-200' };
                  return (
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold border ${cfg.className}`}>
                      <Package className="w-3.5 h-3.5" />
                      {cfg.label}
                    </span>
                  );
                })()}
                {/* Delivery method badge */}
                {order.deliveryInfo?.type === 'delivery' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 text-sm font-semibold border border-blue-200">
                    <Truck className="w-3.5 h-3.5" />
                    Delivery
                  </span>
                ) : order.deliveryInfo?.type === 'pickup' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-sm font-semibold border border-emerald-200">
                    <Package className="w-3.5 h-3.5" />
                    Pickup
                  </span>
                ) : null}
                {order.deliveryInfo?.type === 'pickup' && order.pickupLocation && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-700">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span>
                      {order.pickupLocation.name && <strong>{order.pickupLocation.name}</strong>}
                      {order.pickupLocation.name && order.pickupLocation.address && ' — '}
                      {order.pickupLocation.address}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order items */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-emerald-600" />
              Items ({order.items.length})
            </h4>
            <div className="border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-xs">Product</TableHead>
                    <TableHead className="text-xs text-center">Qty</TableHead>
                    <TableHead className="text-xs text-right">Unit Price</TableHead>
                    <TableHead className="text-xs text-right">Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="text-xs text-gray-800 font-medium">
                        {typeof item.productId === 'object' && item.productId !== null
                          ? (item.productId as any).name ?? (item.productId as any)._id
                          : item.productId}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">{item.quantity}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(item.price)}</TableCell>
                      <TableCell className="text-right text-sm font-semibold">{formatCurrency(item.subtotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pricing breakdown */}
          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2">
            <h4 className="text-sm font-semibold text-emerald-800 flex items-center gap-1.5">
              <CircleDollarSign className="w-4 h-4" />
              Pricing Breakdown
            </h4>
            <div className="space-y-1.5 text-sm">
              {order.shippingCost !== undefined && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{formatCurrency(order.shippingCost)}</span>
                </div>
              )}
              {order.discountAmount !== undefined && order.discountAmount > 0 && (
                <div className="flex justify-between text-green-700">
                  <span>Discount</span>
                  <span>- {formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              {order.taxAmount !== undefined && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>{formatCurrency(order.taxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 border-t border-emerald-200 pt-2 mt-1">
                <span>Total Amount</span>
                <span className="text-emerald-700 text-base">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <StickyNote className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-semibold text-amber-700">Customer Note</p>
                <p className="text-sm text-amber-900 mt-0.5">{order.notes}</p>
              </div>
            </div>
          )}
        </div>

        {isPending && (
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => onCancel(order._id)}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
              Cancel Order
            </Button>
            <Button
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md"
              onClick={() => onConfirm(order._id)}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirm Order
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

const ITEMS_PER_PAGE = 10;

export default function OrderConfirmation() {
  // Data state
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pendingSummary, setPendingSummary] = useState({ totalPending: 0, pendingToday: 0 });

  // Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog state
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  // ── Search debounce ───────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedSearch(value);
      setCurrentPage(1);
    }, 400);
  };

  // ── Fetch orders ──────────────────────────────────────────

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await orderAPI.getAllOrders({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: debouncedSearch.trim() || undefined,
      });
      // api interceptor already unwraps response.data → res IS the body
      const { data, pagination } = res ?? {};
      setOrders(Array.isArray(data) ? data : []);
      setTotalItems(pagination?.totalItems ?? 0);
      setTotalPages(pagination?.totalPages ?? 1);
    } catch {
      toast.error('Failed to load orders. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, debouncedSearch]);

  // ── Fetch pending summary for stat cards ──────────────────

  const fetchPendingSummary = useCallback(async () => {
    try {
      const res = await orderAPI.getPendingSummary();
      // res IS the body: { success, data: { totalPending, pendingToday } }
      if (res?.data) setPendingSummary(res.data);
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { fetchPendingSummary(); }, [fetchPendingSummary]);

  // ── Actions ───────────────────────────────────────────────

  const handleConfirm = async (id: string) => {
    try {
      setActionLoading(true);
      await orderAPI.confirmOrder(id);
      toast.success('Order confirmed successfully!');
      setIsDetailOpen(false);
      fetchOrders();
      fetchPendingSummary();
    } catch {
      toast.error('Failed to confirm order.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelTarget) return;
    try {
      setActionLoading(true);
      await orderAPI.managerCancelOrder(cancelTarget, cancelReason || undefined);
      toast.success('Order cancelled.');
      setCancelTarget(null);
      setCancelReason('');
      setIsDetailOpen(false);
      fetchOrders();
      fetchPendingSummary();
    } catch {
      toast.error('Failed to cancel order.');
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  };

  // ── Derived data ──────────────────────────────────────────

  const safeOrders = useMemo(() => (Array.isArray(orders) ? orders : []), [orders]);
  const displayedOrders = safeOrders;

  const stats = useMemo(() => ({
    total:        totalItems,
    pending:      pendingSummary.totalPending,
    pendingToday: pendingSummary.pendingToday,
    confirmed:    safeOrders.filter((o) => o.status === 'confirmed').length,
    cancelled:    safeOrders.filter((o) => o.status === 'cancelled').length,
  }), [totalItems, pendingSummary, safeOrders]);

  // ─────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            Order Confirmation
          </h2>
          <p className="text-muted-foreground mt-1">
            Review, confirm, or cancel incoming customer orders.
          </p>
        </div>
        <Button
          onClick={fetchOrders}
          disabled={loading}
          variant="outline"
          className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Orders"
          value={totalItems}
          icon={ShoppingBag}
          accent="border-l-emerald-500"
          sub="This page filter"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pending}
          icon={Clock}
          accent="border-l-amber-500"
          sub={`${stats.pendingToday} new today`}
        />
        <StatCard
          title="Confirmed"
          value={stats.confirmed}
          icon={CheckCircle2}
          accent="border-l-blue-500"
          sub="Ready to process"
        />
        <StatCard
          title="Cancelled"
          value={stats.cancelled}
          icon={XCircle}
          accent="border-l-red-500"
          sub="On current page"
        />
      </div>

      {/* Filters & Search */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            Filter Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by customer name, email or Order ID…"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Status filter */}
            <div className="w-full sm:w-52">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Table */}
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" />
              Orders
              <Badge variant="secondary" className="ml-1 text-xs">
                {totalItems}
              </Badge>
            </CardTitle>
            <span className="text-xs text-gray-500">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              <span className="text-sm text-gray-500">Loading orders…</span>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
              <AlertCircle className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-medium">No orders found.</p>
              <p className="text-xs">Try adjusting your filters or refreshing.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 hover:bg-gray-50">
                    <TableHead className="text-xs font-semibold text-gray-600">Customer</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 w-[160px]">Order ID</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Date</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Items</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Payment</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-right">Total</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600">Status</TableHead>
                    <TableHead className="text-xs font-semibold text-gray-600 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedOrders.map((order) => (
                    <TableRow
                      key={order._id}
                      className="hover:bg-gray-50/70 transition-colors group"
                    >
                      {/* Customer */}
                      <TableCell>
                        {typeof order.userId === 'object' && order.userId !== null ? (
                          <div className="flex items-center gap-2">
                            {(order.userId as any).avatar ? (
                              <img
                                src={(order.userId as any).avatar}
                                alt={(order.userId as any).name}
                                className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                {(order.userId as any).name?.charAt(0).toUpperCase() ?? '?'}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate max-w-[130px]">
                                {(order.userId as any).name}
                              </p>
                              <p className="text-xs text-gray-500 truncate max-w-[130px]">
                                {(order.userId as any).email}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <span className="font-mono text-xs text-gray-500">{order.userId as string}</span>
                        )}
                      </TableCell>

                      {/* Order ID */}
                      <TableCell className="font-mono text-xs text-gray-500 max-w-[160px] truncate">
                        {order._id}
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-gray-700 whitespace-nowrap">
                        {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(
                          new Date(order.orderDate)
                        )}
                      </TableCell>

                      {/* Items count */}
                      <TableCell className="text-center">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                          {order.items.length}
                        </span>
                      </TableCell>

                      {/* Payment */}
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-gray-600 capitalize">
                            {order.paymentMethod?.replace(/_/g, ' ') ?? '—'}
                          </span>
                          <PaymentBadge status={order.paymentStatus} />
                        </div>
                      </TableCell>

                      {/* Total */}
                      <TableCell className="text-right font-semibold text-gray-900">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={order.status} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => openDetail(order)}
                            title="View details"
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick-confirm (only for pending) */}
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleConfirm(order._id)}
                                title="Confirm order"
                                disabled={actionLoading}
                                className="p-1.5 rounded-md hover:bg-green-100 text-emerald-600 hover:text-emerald-800 transition-colors disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCancelTarget(order._id)}
                                title="Cancel order"
                                disabled={actionLoading}
                                className="p-1.5 rounded-md hover:bg-red-100 text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing page <span className="font-medium">{currentPage}</span> of{' '}
            <span className="font-medium">{totalPages}</span> &mdash;{' '}
            <span className="font-medium">{totalItems}</span> total orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <span className="px-3 py-1 text-sm font-medium bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">
              {currentPage}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ─────────────────────────── */}
      <OrderDetailModal
        order={selectedOrder}
        open={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onConfirm={handleConfirm}
        onCancel={(id) => {
          setIsDetailOpen(false);
          setCancelTarget(id);
        }}
        loading={actionLoading}
      />

      {/* ── Cancel Alert Dialog ──────────────────── */}
      <AlertDialog
        open={!!cancelTarget}
        onOpenChange={(open) => {
          if (!open) {
            setCancelTarget(null);
            setCancelReason('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="w-5 h-5" />
              Cancel Order
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="py-2">
            <Label htmlFor="cancelReason" className="text-sm font-medium text-gray-700">
              Cancellation Reason{' '}
              <span className="text-gray-400 font-normal">(optional)</span>
            </Label>
            <Textarea
              id="cancelReason"
              placeholder="e.g. Out of stock, customer request, payment failed…"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="mt-1.5 resize-none"
              rows={3}
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Yes, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
