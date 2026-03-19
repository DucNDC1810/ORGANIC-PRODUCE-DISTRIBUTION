import { useEffect, useState } from 'react';
import {
    Package,
    MapPin,
    Map,
    Phone,
    Mail,
    ShoppingBag,
    RefreshCw,
    CheckCircle,
    XCircle,
    Truck,
    RotateCcw,
    PhoneOff
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';
import ShipperMap from '../../components/ShipperMap';

interface OrderItem {
    productId: {
        _id: string;
        name: string;
        price: number;
        images?: string[];
    };
    quantity: number;
    price: number;
    subtotal: number;
}

interface Order {
    _id: string;
    userId: {
        name: string;
        email: string;
        phone: string;
    };
    items: OrderItem[];
    totalAmount: number;
    status: string;
    deliveryInfo?: {
        fullName?: string;
        phone?: string;
        email?: string;
        address?: string;
        type?: 'delivery' | 'pickup';
    };
    createdAt: string;
    paymentMethod?: string;
    shippingCost?: number;
    shippingAcceptedAt?: string;
    deliveredAt?: string;
    cancelledByShipperId?: string;
    shipperCancelledAt?: string;
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const isCodPayment = (paymentMethod?: string): boolean => {
    if (!paymentMethod) return false;
    const normalized = paymentMethod.toLowerCase();
    return normalized === 'cod' || normalized === 'cash';
};

export default function ShipperMyOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 10,
        total: 0,
        pages: 0
    });
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [cancelReason, setCancelReason] = useState('');
    const [showMapModal, setShowMapModal] = useState(false);
    const [selectedMapOrder, setSelectedMapOrder] = useState<Order | null>(null);

    // Returned (customer refused) modal state
    const [showReturnedModal, setShowReturnedModal] = useState(false);
    const [returnedOrderId, setReturnedOrderId] = useState<string | null>(null);
    const [returnedReason, setReturnedReason] = useState('');
    const [returnedReasonType, setReturnedReasonType] = useState<string>('');

    const fetchMyOrders = async (page = 1, status = '') => {
        try {
            setLoading(true);
            const response: any = await api.get('/shipper/my-orders', {
                params: { page, limit: 10, status: status || undefined }
            });
            if (response.success) {
                setOrders(response.data.orders);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            console.error('Error fetching my orders:', error);
            toast.error(error.response?.data?.message || 'Failed to load your orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyOrders(1, statusFilter);
    }, [statusFilter]);

    const handleUpdateStatus = async (orderId: string, status: string) => {
        if (status === 'cancelled') {
            setSelectedOrderId(orderId);
            setShowCancelModal(true);
            return;
        }

        try {
            setUpdatingOrderId(orderId);
            const response: any = await api.patch(`/shipper/orders/${orderId}/status`, {
                status
            });
            if (response.success) {
                toast.success(`Order status updated to ${status}!`);
                // Update the order in the list
                setOrders(orders.map(order =>
                    order._id === orderId ? response.data : order
                ));
            }
        } catch (error: any) {
            console.error('Error updating order status:', error);
            toast.error(error.response?.data?.message || 'Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleCancelOrder = async () => {
        if (!selectedOrderId || !cancelReason.trim()) {
            toast.error('Please provide a cancel reason');
            return;
        }

        try {
            setUpdatingOrderId(selectedOrderId);
            const response: any = await api.patch(`/shipper/orders/${selectedOrderId}/status`, {
                status: 'cancelled',
                cancelReason
            });
            if (response.success) {
                toast.success('Order cancelled successfully');
                setOrders(orders.map(order =>
                    order._id === selectedOrderId ? response.data : order
                ));
                setShowCancelModal(false);
                setCancelReason('');
                setSelectedOrderId(null);
            }
        } catch (error: any) {
            console.error('Error cancelling order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const handleReturnedOrder = async () => {
        const finalReason = returnedReasonType === 'other'
            ? returnedReason.trim()
            : returnedReasonType;

        if (!returnedOrderId || !finalReason) {
            toast.error('Vui lòng chọn hoặc nhập lý do');
            return;
        }

        try {
            setUpdatingOrderId(returnedOrderId);
            const response: any = await api.patch(`/shipper/orders/${returnedOrderId}/status`, {
                status: 'returned',
                cancelReason: finalReason
            });
            if (response.success) {
                toast.success('Đã ghi nhận — Manager sẽ xử lý hàng trả', {
                    description: 'Đơn hàng đã được chuyển về trạng thái "Returned"'
                });
                setOrders(orders.map(order =>
                    order._id === returnedOrderId ? response.data : order
                ));
                setShowReturnedModal(false);
                setReturnedReason('');
                setReturnedReasonType('');
                setReturnedOrderId(null);
            }
        } catch (error: any) {
            console.error('Error marking order as returned:', error);
            toast.error(error.response?.data?.message || 'Failed to mark order as returned');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (order: Order) => {
        // Check if order was cancelled by this shipper
        if (order.cancelledByShipperId) {
            return (
                <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit", 'bg-red-100', 'text-red-700')}>
                    <XCircle className="w-3 h-3" />
                    Cancelled
                </span>
            );
        }

        const statusConfig: Record<string, { bg: string; text: string; label: string; icon: any }> = {
            shipped: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Delivering', icon: Truck },
            delivered: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Delivered', icon: CheckCircle },
            returned: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Returned', icon: RotateCcw }
        };

        const config = statusConfig[order.status] || { bg: 'bg-gray-100', text: 'text-gray-700', label: order.status, icon: Package };
        const Icon = config.icon;

        return (
            <span className={cn("px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit", config.bg, config.text)}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    const openMapModal = (order: Order) => {
        setSelectedMapOrder(order);
        setShowMapModal(true);
    };

    return (
        <div className="space-y-6">
            {/* Header with Filters */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">My Deliveries</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {pagination.total} order(s) in your delivery list
                        </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        >
                            <option value="">All Status</option>
                            <option value="shipped">Delivering</option>
                            <option value="delivered">Delivered</option>
                            <option value="returned">Returned</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <button
                            onClick={() => fetchMyOrders(pagination.page, statusFilter)}
                            className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            aria-label="Refresh"
                        >
                            <RefreshCw className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Orders List */}
            {loading ? (
                <div className="grid grid-cols-1 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500">
                        You haven't accepted any orders yet. Check available orders to start delivering!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {orders.map((order) => (
                        <div
                            key={order._id}
                            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                        >
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Order Info */}
                                <div className="flex-1 space-y-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h4 className="text-lg font-semibold text-gray-800">
                                                Order #{order._id.slice(-8).toUpperCase()}
                                            </h4>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Accepted: {order.shippingAcceptedAt ? formatDate(order.shippingAcceptedAt) : 'N/A'}
                                            </p>
                                            {order.deliveredAt && (
                                                <p className="text-sm text-emerald-600 mt-1 flex items-center gap-1">
                                                    <CheckCircle className="w-3 h-3" />
                                                    Delivered: {formatDate(order.deliveredAt)}
                                                </p>
                                            )}
                                        </div>
                                        {getStatusBadge(order)}
                                    </div>

                                    {/* Customer Info */}
                                    <div className="space-y-2">
                                        <h5 className="text-sm font-medium text-gray-700">Customer Information</h5>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Package className="w-4 h-4 text-gray-400" />
                                                <span>{order.deliveryInfo?.fullName || order.userId.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                <a href={`tel:${order.deliveryInfo?.phone || order.userId.phone}`} className="hover:text-emerald-600">
                                                    {order.deliveryInfo?.phone || order.userId.phone}
                                                </a>
                                            </div>
                                            {order.deliveryInfo?.email && (
                                                <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <a href={`mailto:${order.deliveryInfo.email}`} className="hover:text-emerald-600">
                                                        {order.deliveryInfo.email}
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Delivery Address */}
                                    {order.deliveryInfo?.address && (
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h5 className="text-sm font-medium text-gray-700">Delivery Address</h5>
                                                <button
                                                    type="button"
                                                    onClick={() => openMapModal(order)}
                                                    className="inline-flex items-center justify-center p-1.5 rounded-md border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                    title="Open map"
                                                    aria-label="Open map"
                                                >
                                                    <Map className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryInfo.address)}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="hover:text-emerald-600 transition-colors"
                                                >
                                                    {order.deliveryInfo.address}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {/* Order Items */}
                                    <div className="space-y-2">
                                        <h5 className="text-sm font-medium text-gray-700">Order Items</h5>
                                        <div className="space-y-2">
                                            {order.items.slice(0, 3).map((item, index) => (
                                                <div key={index} className="flex items-center gap-3 text-sm">
                                                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                                                    <span className="text-gray-600">
                                                        {item.quantity}x {item.productId.name}
                                                    </span>
                                                    <span className="text-gray-500 ml-auto">
                                                        {item.subtotal.toLocaleString('vi-VN')}₫
                                                    </span>
                                                </div>
                                            ))}
                                            {order.items.length > 3 && (
                                                <p className="text-sm text-gray-500 ml-7">
                                                    +{order.items.length - 3} more item(s)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="lg:w-64 flex flex-col gap-4">
                                    <div className="bg-emerald-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                                        <p className="text-2xl font-bold text-emerald-600">
                                            {order.totalAmount.toLocaleString('vi-VN')}₫
                                        </p>
                                        {isCodPayment(order.paymentMethod) && (
                                            <div className="mt-3 pt-3 border-t border-emerald-200">
                                                <p className="text-xs text-amber-700 font-semibold">COD - Shipper needs to collect</p>
                                                <p className="text-lg font-bold text-amber-700">
                                                    {order.totalAmount.toLocaleString('vi-VN')}₫
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {order.status === 'shipped' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(order._id, 'delivered')}
                                                disabled={updatingOrderId === order._id}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <CheckCircle className="w-5 h-5" />
                                                <span>Mark as Delivered</span>
                                            </button>

                                            {/* Customer refused — triggers returned flow */}
                                            <button
                                                onClick={() => {
                                                    setReturnedOrderId(order._id);
                                                    setReturnedReasonType('');
                                                    setReturnedReason('');
                                                    setShowReturnedModal(true);
                                                }}
                                                disabled={updatingOrderId === order._id}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <RotateCcw className="w-4 h-4" />
                                                <span>Khách không nhận</span>
                                            </button>

                                            <button
                                                onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                                                disabled={updatingOrderId === order._id}
                                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <XCircle className="w-5 h-5" />
                                                <span>Cancel Order</span>
                                            </button>
                                        </>
                                    )}

                                    {order.cancelledByShipperId ? (
                                        <div className="text-center p-4 bg-red-50 rounded-lg">
                                            <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-red-700">Order Cancelled</p>
                                            {order.shipperCancelledAt && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                    {formatDate(order.shipperCancelledAt)}
                                                </p>
                                            )}
                                        </div>
                                    ) : order.status === 'returned' ? (
                                        <div className="text-center p-4 bg-amber-50 rounded-lg border border-amber-200">
                                            <RotateCcw className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-amber-700">Khách không nhận</p>
                                            <p className="text-xs text-gray-500 mt-1">Đang chờ Manager xử lý hàng trả</p>
                                        </div>
                                    ) : order.status === 'delivered' && (
                                        <div className="text-center p-4 bg-emerald-50 rounded-lg">
                                            <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-emerald-700">Successfully Delivered</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && orders.length > 0 && pagination.pages > 1 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                            {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchMyOrders(pagination.page - 1, statusFilter)}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => fetchMyOrders(pagination.page + 1, statusFilter)}
                                disabled={pagination.page === pagination.pages}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cancel Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Cancel Order</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Please provide a reason for cancelling this order:
                        </p>
                        <textarea
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            placeholder="Enter cancel reason..."
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        />
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowCancelModal(false);
                                    setCancelReason('');
                                    setSelectedOrderId(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCancelOrder}
                                disabled={!cancelReason.trim() || updatingOrderId !== null}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirm Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Returned (Customer Refused) Modal */}
            {showReturnedModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-1">
                            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <RotateCcw className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Khách không nhận hàng</h3>
                                <p className="text-xs text-gray-500">Hàng sẽ được trả về — Manager sẽ xử lý</p>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
                            <p className="text-xs text-amber-700 leading-relaxed">
                                <strong>Lưu ý:</strong> Chức năng này dành cho trường hợp khách từ chối nhận hàng hoặc không liên lạc được.
                                Hàng sẽ <strong>không</strong> tự động hoàn kho — Manager sẽ kiểm tra và xử lý.
                            </p>
                        </div>

                        {/* Preset reason chips */}
                        <p className="text-sm font-medium text-gray-700 mb-2">Lý do:</p>
                        <div className="grid grid-cols-1 gap-2 mb-3">
                            {[
                                { value: 'Khách không nghe máy sau nhiều lần gọi', icon: <PhoneOff className="w-3.5 h-3.5" /> },
                                { value: 'Khách từ chối nhận hàng', icon: <XCircle className="w-3.5 h-3.5" /> },
                                { value: 'Khách yêu cầu hủy khi shipper đến nơi', icon: <RotateCcw className="w-3.5 h-3.5" /> },
                                { value: 'Địa chỉ giao hàng không tìm thấy', icon: <MapPin className="w-3.5 h-3.5" /> },
                                { value: 'other', icon: null },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setReturnedReasonType(opt.value)}
                                    className={`flex items-center gap-2 w-full text-left px-3 py-2.5 rounded-lg border text-sm transition-all
                                        ${returnedReasonType === opt.value
                                            ? 'border-amber-500 bg-amber-50 text-amber-800 font-medium'
                                            : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    {opt.icon && <span className="text-gray-400">{opt.icon}</span>}
                                    {opt.value === 'other' ? 'Lý do khác...' : opt.value}
                                </button>
                            ))}
                        </div>

                        {/* Free text for "other" */}
                        {returnedReasonType === 'other' && (
                            <textarea
                                value={returnedReason}
                                onChange={(e) => setReturnedReason(e.target.value)}
                                placeholder="Mô tả lý do cụ thể..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none text-sm mb-3"
                                autoFocus
                            />
                        )}

                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => {
                                    setShowReturnedModal(false);
                                    setReturnedReason('');
                                    setReturnedReasonType('');
                                    setReturnedOrderId(null);
                                }}
                                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                onClick={handleReturnedOrder}
                                disabled={
                                    !returnedReasonType ||
                                    (returnedReasonType === 'other' && !returnedReason.trim()) ||
                                    updatingOrderId !== null
                                }
                                className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {updatingOrderId ? (
                                    <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <RotateCcw className="w-4 h-4" />
                                )}
                                Xác nhận trả hàng
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Modal */}
            {showMapModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-4 md:p-6 max-w-3xl w-full shadow-2xl">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-800">Delivery Map</h3>
                                {selectedMapOrder && (
                                    <p className="text-sm text-gray-500 mt-1">
                                        Order #{selectedMapOrder._id.slice(-8).toUpperCase()}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowMapModal(false);
                                    setSelectedMapOrder(null);
                                }}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                            >
                                Close
                            </button>
                        </div>

                        <ShipperMap customerAddress={selectedMapOrder?.deliveryInfo?.address} />
                    </div>
                </div>
            )}
        </div>
    );
}
