import { useEffect, useMemo, useState } from 'react';
import {
    Package,
    MapPin,
    Phone,
    Mail,
    ShoppingBag,
    Search,
    RefreshCw,
    CheckCircle,
    ChevronDown
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';

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
    orderType?: 'regular' | 'group_buy' | 'subscription' | 'groupby' | 'subscriptions';
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
}

interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    pages: number;
}

const AVAILABLE_ORDERS_LIMIT = 100;

type NormalizedOrderType = 'regular' | 'group_buy';

const ORDER_TYPE_SECTIONS: Array<{
    key: NormalizedOrderType;
    title: string;
    description: string;
}> = [
        {
            key: 'regular',
            title: 'Regular Orders',
            description: 'Standard and subscription orders'
        },
        {
            key: 'group_buy',
            title: 'Group Buy Orders',
            description: 'Orders created from group buying'
        }
    ];

const normalizeOrderType = (orderType?: string): NormalizedOrderType => {
    if (!orderType) return 'regular';

    const normalized = orderType.toLowerCase();
    if (normalized === 'group_buy' || normalized === 'groupby' || normalized === 'group_buy_order') {
        return 'group_buy';
    }
    if (normalized === 'subscription' || normalized === 'subscriptions') {
        return 'regular';
    }
    return 'regular';
};

const isCodPayment = (paymentMethod?: string): boolean => {
    if (!paymentMethod) return false;
    const normalized = paymentMethod.toLowerCase();
    return normalized === 'cod' || normalized === 'cash';
};

export default function ShipperAvailableOrders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: AVAILABLE_ORDERS_LIMIT,
        total: 0,
        pages: 0
    });
    const [acceptingOrderId, setAcceptingOrderId] = useState<string | null>(null);
    const [expandedOrderType, setExpandedOrderType] = useState<NormalizedOrderType | null>(null);

    const confirmedOrders = useMemo(
        () => orders.filter((order) => order.status === 'confirmed'),
        [orders]
    );

    const groupedOrders = useMemo(() => {
        const grouped: Record<NormalizedOrderType, Order[]> = {
            regular: [],
            group_buy: []
        };

        confirmedOrders.forEach((order) => {
            grouped[normalizeOrderType(order.orderType)].push(order);
        });

        return grouped;
    }, [confirmedOrders]);

    const fetchAvailableOrders = async (page = 1, search = '') => {
        try {
            setLoading(true);
            const response: any = await api.get('/shipper/available-orders', {
                params: { page, limit: AVAILABLE_ORDERS_LIMIT, search }
            });
            if (response.success) {
                setOrders(response.data.orders);
                setPagination(response.data.pagination);
            }
        } catch (error: any) {
            console.error('Error fetching available orders:', error);
            toast.error(error.response?.data?.message || 'Failed to load available orders');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAvailableOrders(1, searchTerm);
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchAvailableOrders(1, searchTerm);
    };

    const handleAcceptOrder = async (orderId: string) => {
        try {
            setAcceptingOrderId(orderId);
            const response: any = await api.post(`/shipper/orders/${orderId}/accept`);
            if (response.success) {
                toast.success('Order accepted successfully!');
                // Remove the accepted order from the list
                setOrders(orders.filter(order => order._id !== orderId));
                // Refresh the list
                fetchAvailableOrders(pagination.page, searchTerm);
            }
        } catch (error: any) {
            console.error('Error accepting order:', error);
            toast.error(error.response?.data?.message || 'Failed to accept order');
        } finally {
            setAcceptingOrderId(null);
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

    return (
        <div className="space-y-6">
            {/* Header with Search */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800">Available Orders</h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {pagination.total} confirmed order(s) ready for delivery
                        </p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                        <form onSubmit={handleSearch} className="flex-1 sm:flex-initial">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by name, phone, address..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                            </div>
                        </form>

                        <button
                            onClick={() => fetchAvailableOrders(pagination.page, searchTerm)}
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
            ) : confirmedOrders.length === 0 ? (
                <div className="bg-white rounded-xl p-12 shadow-sm border border-gray-200 text-center">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Available Orders</h3>
                    <p className="text-gray-500">
                        There are currently no confirmed orders available for delivery. Check back later!
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {ORDER_TYPE_SECTIONS.map((section) => {
                        const sectionOrders = groupedOrders[section.key];
                        const isExpanded = expandedOrderType === section.key;

                        return (
                            <div key={section.key} className="space-y-4">
                                <button
                                    type="button"
                                    onClick={() => setExpandedOrderType((prev) => (prev === section.key ? null : section.key))}
                                    className={cn(
                                        "w-full bg-white rounded-xl p-5 shadow-sm border text-left transition-all",
                                        isExpanded
                                            ? "border-emerald-300 ring-2 ring-emerald-100"
                                            : "border-gray-200 hover:border-emerald-200"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <h4 className="text-base font-semibold text-gray-800">{section.title}</h4>
                                            <p className="text-sm text-gray-500">{section.description}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <ChevronDown
                                                className={cn(
                                                    "w-4 h-4 text-gray-500 transition-transform",
                                                    isExpanded ? "rotate-180" : "rotate-0"
                                                )}
                                            />
                                        </div>
                                    </div>
                                </button>

                                {isExpanded && sectionOrders.length === 0 ? (
                                    <div className="bg-white rounded-xl p-6 shadow-sm border border-dashed border-gray-300 text-center text-sm text-gray-500">
                                        No orders in this category.
                                    </div>
                                ) : isExpanded ? (
                                    sectionOrders.map((order) => (
                                        <div
                                            key={order._id}
                                            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex flex-col lg:flex-row gap-6">
                                                {/* Order Info */}
                                                <div className="flex-1 space-y-4">
                                                    {/* Header */}
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <h4 className="text-lg font-semibold text-gray-800">
                                                                Order #{order._id.slice(-8).toUpperCase()}
                                                            </h4>
                                                            <p className="text-sm text-gray-500 mt-1">
                                                                {formatDate(order.createdAt)}
                                                            </p>
                                                        </div>
                                                        <span className={cn(
                                                            "px-3 py-1 rounded-full text-xs font-medium",
                                                            order.status === 'confirmed' ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                                                        )}>
                                                            {order.status === 'confirmed' ? 'Confirmed' : 'Processing'}
                                                        </span>
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
                                                                <span>{order.deliveryInfo?.phone || order.userId.phone}</span>
                                                            </div>
                                                            {order.deliveryInfo?.email && (
                                                                <div className="flex items-center gap-2 text-gray-600 sm:col-span-2">
                                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                                    <span>{order.deliveryInfo.email}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Delivery Address */}
                                                    {order.deliveryInfo?.address && (
                                                        <div className="space-y-2">
                                                            <h5 className="text-sm font-medium text-gray-700">Delivery Address</h5>
                                                            <div className="flex items-start gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                                                                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                                <span>{order.deliveryInfo.address}</span>
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

                                                    <button
                                                        onClick={() => handleAcceptOrder(order._id)}
                                                        disabled={acceptingOrderId === order._id}
                                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {acceptingOrderId === order._id ? (
                                                            <>
                                                                <RefreshCw className="w-5 h-5 animate-spin" />
                                                                <span>Accepting...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CheckCircle className="w-5 h-5" />
                                                                <span>Accept Order</span>
                                                            </>
                                                        )}
                                                    </button>

                                                    <div className="text-xs text-gray-500 text-center">
                                                        Once accepted, this order will appear in "My Deliveries"
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : null}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && confirmedOrders.length > 0 && pagination.pages > 1 && (
                <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                    <div className="flex items-center justify-end">
                        <div className="flex gap-2">
                            <button
                                onClick={() => fetchAvailableOrders(pagination.page - 1, searchTerm)}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => fetchAvailableOrders(pagination.page + 1, searchTerm)}
                                disabled={pagination.page === pagination.pages}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
