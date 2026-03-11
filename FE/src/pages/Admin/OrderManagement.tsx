import { useState, useEffect, useCallback } from 'react';
import {
  Clock, Truck, XCircle, Eye, Package, PackageCheck,
  Search, ChevronLeft, ChevronRight, MapPin, AlertCircle, ShieldCheck,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Input } from '../../components/ui/input';
import orderService, { Order } from '../../services/orderService';

// ─── Populated field types ─────────────────────────────────────────────────────

interface PopulatedUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

interface PopulatedProduct {
  _id: string;
  name: string;
  price: number;
  thumbnail?: string;
}

interface PopulatedAddress {
  _id: string;
  fullAddress?: string;
  street?: string;
  ward?: string;
  district?: string;
  city?: string;
  province?: string;
}

// An Order where userId / addressId / productId may be populated objects
type DisplayOrder = Omit<Order, 'userId' | 'addressId' | 'items'> & {
  userId: PopulatedUser | string;
  addressId?: PopulatedAddress | string | null;
  items: Array<Omit<Order['items'][number], 'productId'> & { productId: PopulatedProduct | string }>;
};

type StatusKey = Order['status'];

// ─── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StatusKey, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-yellow-500 hover:bg-yellow-600 text-white'  },
  confirmed:  { label: 'Confirmed',  className: 'bg-blue-400 hover:bg-blue-500 text-white'     },
  processing: { label: 'Processing', className: 'bg-orange-500 hover:bg-orange-600 text-white' },
  shipped:    { label: 'Shipped',    className: 'bg-blue-600 hover:bg-blue-700 text-white'     },
  delivered:  { label: 'Delivered',  className: 'bg-green-500 hover:bg-green-600 text-white'   },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-500 hover:bg-red-600 text-white'       },
  refunded:   { label: 'Refunded',   className: 'bg-gray-500 hover:bg-gray-600 text-white'     },
};

const PAYMENT_CONFIG: Record<string, { label: string; className: string }> = {
  paid:    { label: 'Paid',    className: 'bg-green-50 text-green-700 border-green-200'    },
  unpaid:  { label: 'Unpaid',  className: 'bg-red-50 text-red-700 border-red-200'          },
  pending: { label: 'Pending', className: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  failed:  { label: 'Failed',  className: 'bg-red-50 text-red-700 border-red-200'          },
};

const DESTRUCTIVE_STATUSES = new Set<StatusKey>(['cancelled', 'refunded']);

// ─── Helpers ───────────────────────────────────────────────────────────────────

const getPopulatedUser = (order: DisplayOrder): PopulatedUser | null => {
  const u = order.userId;
  return u && typeof u === 'object' ? (u as PopulatedUser) : null;
};

const getAddressString = (order: DisplayOrder): string | null => {
  const a = order.addressId;
  if (!a || typeof a === 'string') return null;
  const addr = a as PopulatedAddress;
  const parts = [addr.street, addr.ward, addr.district, (addr.city ?? addr.province)]
    .filter(Boolean).join(', ');
  return addr.fullAddress ?? parts ?? null;
};

const buildStatsMap = (byStatus: { _id: string; count: number }[]) => {
  const map: Record<string, number> = {};
  byStatus.forEach(s => { map[s._id] = s.count; });
  return {
    pending:    map['pending'] ?? 0,
    confirmed:  map['confirmed'] ?? 0,
    processing: map['processing'] ?? 0,
    shipped:    map['shipped'] ?? 0,
    delivered:  map['delivered'] ?? 0,
    cancelled:  (map['cancelled'] ?? 0) + (map['refunded'] ?? 0),
  };
};

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

// ─── Sub-component ─────────────────────────────────────────────────────────────

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
      {children}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function OrderManagement() {
  const [orders, setOrders]         = useState<DisplayOrder[]>([]);
  const [loading, setLoading]       = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage]             = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [dialogOpen, setDialogOpen]       = useState(false);
  const [detailOrder, setDetailOrder]     = useState<DisplayOrder | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [newStatus, setNewStatus]         = useState('');
  const [updating, setUpdating]           = useState(false);
  const [updateMsg, setUpdateMsg]         = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [stats, setStats] = useState({ 
    pending: 0, 
    confirmed: 0, 
    processing: 0, 
    shipped: 0, 
    delivered: 0, 
    cancelled: 0 
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  const refreshStats = useCallback(() => {
    orderService.getOrderStats()
      .then((res: any) => setStats(buildStatsMap(res.data?.byStatus ?? [])))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setStatsLoading(true);
    orderService.getOrderStats()
      .then((res: any) => setStats(buildStatsMap(res.data?.byStatus ?? [])))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  // ── Orders list ───────────────────────────────────────────────────────────

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setFetchError(null);
    orderService.getAllOrders({
      page, limit: 10,
      search: search || undefined,
      status: statusFilter || undefined,
      sortBy: 'orderDate', sortOrder: 'desc',
    })
      .then((res: any) => {
        setOrders(res.data ?? []);
        setTotalPages(res.pagination?.totalPages ?? 1);
        setTotalItems(res.pagination?.totalItems ?? 0);
      })
      .catch(() => {
        setFetchError('Failed to load orders. Please try again.');
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [page, search, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // ── Search ────────────────────────────────────────────────────────────────

  const handleSearch = () => { setSearch(searchInput.trim()); setPage(1); };
  const clearSearch  = () => { setSearchInput(''); setSearch(''); setPage(1); };

  // ── Detail dialog ─────────────────────────────────────────────────────────

  const openDetails = (order: DisplayOrder) => {
    setDialogOpen(true);
    setDetailOrder(order);
    setNewStatus(order.status);
    setUpdateMsg(null);
    // Fetch full details: populated address, voucher, cancel reason, etc.
    setDetailLoading(true);
    orderService.getOrderById(order._id)
      .then((res: any) => {
        const full = res.data as DisplayOrder;
        setDetailOrder(full);
        setNewStatus(full.status);
      })
      .catch(() => { /* keep list-level data on error */ })
      .finally(() => setDetailLoading(false));
  };

  // ── Update status ─────────────────────────────────────────────────────────

  const handleUpdateStatus = async () => {
    if (!detailOrder || !newStatus || newStatus === detailOrder.status) return;

    if (DESTRUCTIVE_STATUSES.has(newStatus as StatusKey)) {
      const label = STATUS_CONFIG[newStatus as StatusKey]?.label ?? newStatus;
      const ok = window.confirm(
        `Are you sure you want to mark this order as "${label}"? This action may be irreversible.`
      );
      if (!ok) return;
    }

    setUpdating(true);
    setUpdateMsg(null);
    try {
      await orderService.updateOrderStatus(detailOrder._id, newStatus);
      const updated = { ...detailOrder, status: newStatus as Order['status'] };
      setDetailOrder(updated);
      setOrders(prev => prev.map(o => o._id === detailOrder._id ? { ...o, status: newStatus as Order['status'] } : o));
      setUpdateMsg({ type: 'success', text: 'Status updated successfully!' });
      refreshStats();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? 'Failed to update status.';
      setUpdateMsg({ type: 'error', text: msg });
    } finally {
      setUpdating(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Order Management</h2>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      {/* Stats Cards - Order Workflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Pending - Awaiting Confirmation */}
        <Card className="border-l-4 border-l-yellow-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pending</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <span className="animate-pulse">—</span> : stats.pending}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Awaiting confirm</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Confirmed - Ready to Process */}
        <Card className="border-l-4 border-l-blue-400 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Confirmed</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <span className="animate-pulse">—</span> : stats.confirmed}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Ready to pack</p>
              </div>
              <ShieldCheck className="w-8 h-8 text-blue-400 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Processing - Being Prepared */}
        <Card className="border-l-4 border-l-orange-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Processing</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <span className="animate-pulse">—</span> : stats.processing}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Being prepared</p>
              </div>
              <Package className="w-8 h-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Shipped - On Delivery */}
        <Card className="border-l-4 border-l-blue-600 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Shipped</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <span className="animate-pulse">—</span> : stats.shipped}
                </p>
                <p className="text-xs text-muted-foreground mt-1">On the way</p>
              </div>
              <Truck className="w-8 h-8 text-blue-600 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Delivered - Completed */}
        <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Delivered</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <span className="animate-pulse">—</span> : stats.delivered}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Completed</p>
              </div>
              <PackageCheck className="w-8 h-8 text-green-500 opacity-80" />
            </div>
          </CardContent>
        </Card>

        {/* Cancelled/Refunded - Failed Orders */}
        <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Cancelled</p>
                <p className="text-2xl font-bold mt-1">
                  {statsLoading ? <span className="animate-pulse">—</span> : stats.cancelled}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Failed orders</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <CardTitle>
              Order List{' '}
              {!loading && totalItems > 0 && (
                <span className="text-sm font-normal text-muted-foreground">({totalItems} total)</span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {/* Search input */}
              <div className="relative flex items-center">
                <Search className="absolute left-2.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Search customer..."
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  className="pl-8 pr-7 w-48"
                />
                {searchInput && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                    aria-label="Clear search"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleSearch}>Search</Button>

              {/* Status filter */}
              <Select value={statusFilter || 'all'} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(s => (
                    <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {/* Error banner */}
          {fetchError && (
            <div className="flex items-center gap-2 m-4 p-3 rounded-md bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="flex-1">{fetchError}</span>
              <Button variant="ghost" size="sm" className="text-red-700 h-auto py-0" onClick={fetchOrders}>
                Retry
              </Button>
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Skeleton rows
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <TableCell key={j}>
                        <div className="h-4 bg-muted animate-pulse rounded w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => {
                  const user = getPopulatedUser(order);
                  const sc = STATUS_CONFIG[order.status] ?? { label: order.status, className: 'bg-gray-400 text-white' };
                  const pc = PAYMENT_CONFIG[order.paymentStatus ?? ''] ?? { label: order.paymentStatus ?? '—', className: '' };
                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        #{order._id.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium leading-tight">{user?.name ?? '—'}</p>
                          {user?.email && (
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(order.orderDate)}</TableCell>
                      <TableCell className="text-center">{order.items.length}</TableCell>
                      <TableCell className="font-semibold">{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={pc.className}>{pc.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={sc.className}>{sc.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openDetails(order)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{detailOrder?._id.slice(-8).toUpperCase()}</DialogTitle>
            <DialogDescription>Full order details and status management</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3 py-6">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-5 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : detailOrder ? (
            <div className="space-y-5">

              {/* Customer + order info */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoRow label="Customer">
                  <p className="font-medium">{getPopulatedUser(detailOrder)?.name ?? '—'}</p>
                  {getPopulatedUser(detailOrder)?.email && (
                    <p className="text-xs text-muted-foreground">{getPopulatedUser(detailOrder)!.email}</p>
                  )}
                  {getPopulatedUser(detailOrder)?.phone && (
                    <p className="text-xs text-muted-foreground">{getPopulatedUser(detailOrder)!.phone}</p>
                  )}
                </InfoRow>
                <InfoRow label="Order Date">
                  <p className="font-medium">{formatDate(detailOrder.orderDate)}</p>
                </InfoRow>
                <InfoRow label="Total Amount">
                  <p className="font-semibold text-green-700">{formatCurrency(detailOrder.totalAmount)}</p>
                </InfoRow>
                <InfoRow label="Payment Method">
                  <p className="font-medium capitalize">{detailOrder.paymentMethod ?? '—'}</p>
                </InfoRow>
                <InfoRow label="Payment Status">
                  <Badge variant="outline" className={PAYMENT_CONFIG[detailOrder.paymentStatus ?? '']?.className ?? ''}>
                    {PAYMENT_CONFIG[detailOrder.paymentStatus ?? '']?.label ?? detailOrder.paymentStatus ?? '—'}
                  </Badge>
                </InfoRow>
                <InfoRow label="Order Status">
                  <Badge className={STATUS_CONFIG[detailOrder.status]?.className ?? ''}>
                    {STATUS_CONFIG[detailOrder.status]?.label ?? detailOrder.status}
                  </Badge>
                </InfoRow>
              </div>

              {/* Shipping address */}
              {getAddressString(detailOrder) && (
                <div className="flex gap-2 p-3 rounded-md bg-muted/50 text-sm">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
                  <span>{getAddressString(detailOrder)}</span>
                </div>
              )}

              {/* Items */}
              {detailOrder.items.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Items ({detailOrder.items.length})
                  </p>
                  <div className="divide-y border rounded-md max-h-44 overflow-y-auto">
                    {detailOrder.items.map((item, i) => {
                      const prod = typeof item.productId === 'object' ? item.productId as PopulatedProduct : null;
                      return (
                        <div key={i} className="flex items-center justify-between px-3 py-2 text-sm">
                          <div className="flex items-center gap-2">
                            {prod?.thumbnail && (
                              <img src={prod.thumbnail} alt={prod.name} className="w-8 h-8 rounded object-cover shrink-0" />
                            )}
                            <span>{prod?.name ?? String(item.productId)} × {item.quantity}</span>
                          </div>
                          <span className="font-medium shrink-0">{formatCurrency(item.subtotal)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {detailOrder.notes && (
                <div className="p-3 rounded-md bg-muted/50 text-sm">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p>{detailOrder.notes}</p>
                </div>
              )}

              {/* Cancel reason */}
              {detailOrder.cancelReason && (
                <div className="p-3 rounded-md bg-red-50 text-sm text-red-700">
                  <p className="text-xs font-medium mb-1">Cancel Reason</p>
                  <p>{detailOrder.cancelReason}</p>
                </div>
              )}

              {/* Update Status */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Update Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_CONFIG) as StatusKey[]).map(s => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {updateMsg && (
                <p className={`text-sm flex items-center gap-1.5 ${updateMsg.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {updateMsg.text}
                </p>
              )}
            </div>
          ) : null}

          <div className="flex justify-end gap-3 pt-2 border-t">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Close</Button>
            <Button
              disabled={updating || !detailOrder || newStatus === detailOrder.status || detailLoading}
              onClick={handleUpdateStatus}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 min-w-28"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
