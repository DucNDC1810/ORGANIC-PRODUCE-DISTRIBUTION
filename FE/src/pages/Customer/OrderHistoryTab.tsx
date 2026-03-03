import { useState, useEffect, useCallback } from 'react';
import {
  ShoppingCart, Package, MapPin, ChevronLeft, ChevronRight,
  Eye, RotateCcw, X, FileText, Ban, AlertTriangle, RefreshCw, Tag, CreditCard,
  ShoppingBag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { cartService } from '../../services/cartService';
import { orderService, Order } from '../../services/orderService';
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
}

// ─── Status / Tab config ────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { label: string; bgColor: string; textColor: string; borderColor: string; dotColor: string }
> = {
  pending:    { label: 'Chờ thanh toán', bgColor: 'bg-amber-50',   textColor: 'text-amber-700',   borderColor: 'border-amber-200',  dotColor: 'bg-amber-400'   },
  confirmed:  { label: 'Đã xác nhận',   bgColor: 'bg-blue-50',    textColor: 'text-blue-700',    borderColor: 'border-blue-200',   dotColor: 'bg-blue-400'    },
  processing: { label: 'Đang xử lý',    bgColor: 'bg-violet-50',  textColor: 'text-violet-700',  borderColor: 'border-violet-200', dotColor: 'bg-violet-400'  },
  shipped:    { label: 'Đang giao',     bgColor: 'bg-indigo-50',  textColor: 'text-indigo-700',  borderColor: 'border-indigo-200', dotColor: 'bg-indigo-400'  },
  delivered:  { label: 'Đã giao',       bgColor: 'bg-green-50',   textColor: 'text-green-700',   borderColor: 'border-green-200',  dotColor: 'bg-green-500'   },
  cancelled:  { label: 'Đã hủy',        bgColor: 'bg-red-50',     textColor: 'text-red-700',     borderColor: 'border-red-200',    dotColor: 'bg-red-400'     },
  refunded:   { label: 'Đã hoàn tiền',  bgColor: 'bg-gray-50',    textColor: 'text-gray-700',    borderColor: 'border-gray-200',   dotColor: 'bg-gray-400'    },
};

const TABS = [
  { key: '',           label: 'Tất cả' },
  { key: 'pending',    label: 'Chờ thanh toán' },
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'shipped',    label: 'Đang giao' },
  { key: 'delivered',  label: 'Đã giao' },
  { key: 'cancelled',  label: 'Đã hủy' },
];

const PAYMENT_LABELS: Record<string, string> = {
  cod:     'COD',
  momo:    'MoMo',
  zalopay: 'ZaloPay',
  vnpay:   'VNPay',
  stripe:  'Thẻ tín dụng',
  cash:    'Tiền mặt',
};

// ─── Utility helpers ────────────────────────────────────────────
const getItemName  = (item: any) => item?.name    || item?.productId?.name            || 'Sản phẩm';
const getItemImage = (item: any) => item?.image   || item?.productId?.imageUrls?.[0] || item?.productId?.image || '';
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
        {status ? 'Không tìm thấy đơn hàng' : 'Giỏ hàng trống'}
      </h3>
      <p className="text-sm text-[#6A7282] text-center max-w-xs mb-8 leading-relaxed">
        {status && config
          ? `Bạn chưa có đơn hàng nào ở trạng thái "${config.label}".`
          : 'Bạn chưa đặt đơn hàng nào. Hãy khám phá các sản phẩm tươi ngon ngay hôm nay!'}
      </p>
      <button
        onClick={() => navigate('/products')}
        className="flex items-center gap-2 px-7 py-3 bg-[#00B207] text-white rounded-xl font-semibold hover:bg-[#009906] transition-all shadow-sm hover:shadow-md active:scale-95"
      >
        <ShoppingBag className="w-5 h-5" />
        Tiếp tục mua sắm
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
  const firstItem = (order.items ?? [])[0] as any;
  const extraCount = Math.max(0, (order.items ?? []).length - 1);
  const thumbnail = firstItem ? getItemImage(firstItem) : '';
  const firstName = firstItem ? getItemName(firstItem) : 'Sản phẩm';

  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group">

      {/* ── Row 1: ID + Date + Status ── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#F3F4F6] bg-[#FAFAFA]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#EDF2EE] flex items-center justify-center flex-shrink-0">
            <Package className="w-4 h-4 text-[#00B207]" />
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

      {/* ── Row 2: Product Preview ── */}
      <div className="flex items-center gap-4 px-5 py-4 border-b border-[#F3F4F6]">
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-xl bg-[#F9FAFB] flex-shrink-0 overflow-hidden border border-[#E5E7EB]">
          {thumbnail ? (
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
          <p className="text-sm font-semibold text-[#101828] truncate">{firstName}</p>
          <p className="text-xs text-[#6A7282] mt-1">
            Số lượng:&nbsp;
            <span className="font-semibold text-[#364153]">{firstItem?.quantity}</span>
            {extraCount > 0 && (
              <span className="ml-1.5 text-[#00B207] font-semibold">
                ...và {extraCount} sản phẩm khác
              </span>
            )}
          </p>
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
          <p className="text-xs text-[#9CA3AF] mb-0.5 uppercase tracking-wide">Tổng thanh toán</p>
          <p className="text-2xl font-extrabold text-[#00B207] leading-none">
            {formatCurrency(order.totalAmount)}
          </p>
          <p className="text-xs text-[#9CA3AF] mt-1.5 flex items-center gap-1">
            <CreditCard className="w-3 h-3" />
            {getPaymentLabel(order.paymentMethod)}
          </p>
        </div>

        {/* Right: Action Buttons */}
        <div className="flex flex-col gap-2 items-end">
          <button
            onClick={() => onViewDetail(order)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#00B207] border-2 border-[#00B207] rounded-xl hover:bg-[#EDF2EE] active:scale-95 transition-all"
          >
            <Eye className="w-4 h-4" />
            Xem chi tiết
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
              Mua lại
            </button>
            {order.status === 'pending' && (
              <button
                onClick={() => onCancel(order)}
                className="flex items-center gap-1 px-3.5 py-2 text-xs font-bold text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-50 active:scale-95 transition-all"
              >
                <Ban className="w-3.5 h-3.5" />
                Hủy đơn
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
  const delivery = order.deliveryInfo as any;

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
            <h3 className="text-lg font-bold text-[#101828]">Chi tiết đơn hàng</h3>
            <p className="text-xs text-[#9CA3AF] font-mono mt-0.5">
              #{order._id.toUpperCase()}
            </p>
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

          {/* ── Delivery Info ── */}
          {delivery && (delivery.fullName || delivery.phone || delivery.address) && (
            <div className="px-6 py-5">
              <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-4">
                <div className="w-6 h-6 rounded-lg bg-[#EDF2EE] flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-[#00B207]" />
                </div>
                Thông tin giao hàng
              </h4>
              <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] px-4 py-3 space-y-2.5">
                {delivery.fullName && (
                  <InfoRow label="Người nhận" value={delivery.fullName} bold />
                )}
                {delivery.phone && (
                  <InfoRow label="Điện thoại" value={delivery.phone} />
                )}
                {delivery.email && (
                  <InfoRow label="Email" value={delivery.email} />
                )}
                {delivery.address && (
                  <InfoRow label="Địa chỉ" value={delivery.address} multiline />
                )}
                {delivery.type && (
                  <InfoRow
                    label="Hình thức"
                    value={delivery.type === 'pickup' ? 'Tự lấy hàng' : 'Giao tận nơi'}
                  />
                )}
              </div>
            </div>
          )}

          {/* ── Notes ── */}
          {order.notes && (
            <div className="px-6 py-5">
              <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-amber-50 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-amber-600" />
                </div>
                Ghi chú
              </h4>
              <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                <p className="text-sm text-amber-800 leading-relaxed">{order.notes}</p>
              </div>
            </div>
          )}

          {/* ── Items ── */}
          <div className="px-6 py-5">
            <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#EDF2EE] flex items-center justify-center">
                <Package className="w-3.5 h-3.5 text-[#00B207]" />
              </div>
              Sản phẩm
              <span className="ml-1 px-1.5 py-0.5 bg-[#F3F4F6] text-[#6A7282] text-xs rounded-md font-medium">
                {order.items.length}
              </span>
            </h4>
            <div className="space-y-2.5">
              {order.items.map((item: any, idx: number) => {
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

          {/* ── Payment Summary ── */}
          <div className="px-6 py-5">
            <h4 className="text-sm font-bold text-[#364153] flex items-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-[#EDF2EE] flex items-center justify-center">
                <CreditCard className="w-3.5 h-3.5 text-[#00B207]" />
              </div>
              Tóm tắt thanh toán
            </h4>
            <div className="bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] overflow-hidden">
              <div className="px-4 py-3 space-y-2.5">
                {(order.shippingCost ?? 0) > 0 && (
                  <SummaryRow label="Phí vận chuyển" value={formatCurrency(order.shippingCost!)} />
                )}
                {(order.discountAmount ?? 0) > 0 && (
                  <SummaryRow
                    label={<span className="flex items-center gap-1"><Tag className="w-3 h-3" />Giảm giá</span>}
                    value={`-${formatCurrency(order.discountAmount!)}`}
                    valueClass="text-[#00B207]"
                  />
                )}
                {(order.taxAmount ?? 0) > 0 && (
                  <SummaryRow label="Thuế" value={formatCurrency(order.taxAmount!)} />
                )}
                <SummaryRow label="Phương thức TT" value={getPaymentLabel(order.paymentMethod)} />
                <SummaryRow
                  label="Trạng thái TT"
                  value={
                    order.paymentStatus === 'paid' ? 'Đã thanh toán' :
                    order.paymentStatus === 'failed' ? 'Thất bại' : 'Chờ thanh toán'
                  }
                  valueClass={
                    order.paymentStatus === 'paid' ? 'text-green-600' :
                    order.paymentStatus === 'failed' ? 'text-red-600' : 'text-amber-600'
                  }
                />
              </div>
              {/* Total */}
              <div className="flex items-center justify-between px-4 py-3 bg-[#EDF2EE] border-t border-[#E5E7EB]">
                <span className="font-bold text-[#101828]">Tổng cộng</span>
                <span className="text-xl font-extrabold text-[#00B207]">
                  {formatCurrency(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Cancel reason (if cancelled) ── */}
          {order.status === 'cancelled' && order.cancelReason && (
            <div className="px-6 py-4">
              <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                <Ban className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Lý do hủy</p>
                  <p className="text-sm text-red-600">{order.cancelReason}</p>
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
          <h3 className="text-lg font-bold text-[#101828] mb-2">Hủy đơn hàng</h3>
          <p className="text-sm text-[#6A7282] mb-1">
            Bạn có chắc muốn hủy đơn hàng này không?
          </p>
          <p className="text-xs text-[#9CA3AF] mb-6">
            Hành động này không thể hoàn tác sau khi xác nhận.
          </p>
          <div className="flex gap-3 w-full">
            <button
              disabled={loading}
              onClick={onClose}
              className="flex-1 py-2.5 text-sm font-semibold text-[#364153] bg-[#F3F4F6] rounded-xl hover:bg-[#E5E7EB] transition-colors disabled:opacity-50"
            >
              Giữ đơn
            </button>
            <button
              disabled={loading}
              onClick={onConfirm}
              className="flex-1 py-2.5 text-sm font-semibold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang hủy...
                </>
              ) : (
                'Xác nhận hủy'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Export: OrderHistoryTab ─────────────────────────────────
export default function OrderHistoryTab() {
  const { refreshCart, openCart } = useCart();

  const [activeStatus, setActiveStatus] = useState('');
  const [orders, setOrders]             = useState<ExtendedOrder[]>([]);
  const [loading, setLoading]           = useState(false);
  const [page, setPage]                 = useState(1);
  const [totalPages, setTotalPages]     = useState(1);
  const [detailOrder, setDetailOrder]   = useState<ExtendedOrder | null>(null);
  const [cancelState, setCancelState]   = useState<{
    order: ExtendedOrder | null;
    cancelling: boolean;
  }>({ order: null, cancelling: false });
  const [reordering, setReordering]     = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await orderService.getMyOrders(page, 8, activeStatus || undefined);
      setOrders(res.data ?? []);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể tải đơn hàng');
    } finally {
      setLoading(false);
    }
  }, [page, activeStatus]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleTabChange = (status: string) => {
    setActiveStatus(status);
    setPage(1);
  };

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
      toast.success(`Đã thêm ${order.items.length} sản phẩm vào giỏ hàng!`);
    } catch {
      toast.error('Không thể thêm vào giỏ hàng. Một số sản phẩm có thể không còn khả dụng.');
    } finally {
      setReordering(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (!cancelState.order) return;
    setCancelState(prev => ({ ...prev, cancelling: true }));
    try {
      await orderService.cancelOrder(cancelState.order._id, 'Cancelled by customer');
      toast.success('Đã hủy đơn hàng thành công');
      setCancelState({ order: null, cancelling: false });
      fetchOrders();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể hủy đơn hàng');
      setCancelState(prev => ({ ...prev, cancelling: false }));
    }
  };

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#101828]">Lịch sử đơn hàng</h2>
          <p className="text-sm text-[#6A7282] mt-0.5">Theo dõi và quản lý các đơn hàng của bạn</p>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          title="Làm mới"
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
            <OrderCard
              key={order._id}
              order={order}
              onViewDetail={setDetailOrder}
              onReorder={handleReorder}
              onCancel={o => setCancelState({ order: o, cancelling: false })}
              reordering={reordering}
            />
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
