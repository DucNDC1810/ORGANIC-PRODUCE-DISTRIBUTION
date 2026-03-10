import { useEffect, useState } from 'react';
import {
    Package,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    Phone,
    MapPin,
    User,
    Calendar,
    DollarSign,
    Filter,
} from 'lucide-react';
import { shipperService, Delivery, DeliveryZone } from '../../services/shipperService';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';

export default function ShipperDeliveries() {
    const [loading, setLoading] = useState(true);
    const [deliveries, setDeliveries] = useState<Delivery[]>([]);
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [zoneFilter, setZoneFilter] = useState<string>('all');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    useEffect(() => {
        loadZones();
    }, []);

    useEffect(() => {
        loadDeliveries();
    }, [statusFilter, zoneFilter]);

    const loadZones = async () => {
        try {
            const data = await shipperService.getZones();
            setZones(data);
        } catch (error) {
            console.error('Error loading zones:', error);
        }
    };

    const loadDeliveries = async () => {
        try {
            setLoading(true);
            const status = statusFilter === 'all' ? undefined : statusFilter;
            const zoneId = zoneFilter === 'all' ? undefined : zoneFilter;
            const data = await shipperService.getDeliveries(status, zoneId);
            setDeliveries(data);
        } catch (error) {
            console.error('Error loading deliveries:', error);
            toast.error('Không thể tải danh sách giao hàng');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (
        deliveryId: string,
        newStatus: 'Pending' | 'Delivering' | 'Delivered' | 'Failed' | 'Cancelled'
    ) => {
        try {
            setUpdatingId(deliveryId);
            await shipperService.updateDeliveryStatus(deliveryId, newStatus);
            toast.success('Cập nhật trạng thái thành công');
            await loadDeliveries();
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Không thể cập nhật trạng thái');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, { label: string; color: string; icon: any }> = {
            Pending: { label: 'Chờ giao', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: Clock },
            Delivering: { label: 'Đang giao', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Package },
            Delivered: { label: 'Đã giao', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle },
            Failed: { label: 'Thất bại', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
            Cancelled: { label: 'Đã hủy', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: AlertCircle },
        };
        const badge = badges[status] || badges.Pending;
        const Icon = badge.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                <Icon className="w-3.5 h-3.5" />
                {badge.label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-4">
                {/* Status Filter */}
                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-gray-500" />
                        <span className="text-sm font-semibold text-gray-700">Trạng thái:</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { value: 'all', label: 'Tất cả' },
                            { value: 'Pending', label: 'Chờ giao' },
                            { value: 'Delivering', label: 'Đang giao' },
                            { value: 'Delivered', label: 'Đã giao' },
                            { value: 'Failed', label: 'Thất bại' },
                        ].map((filter) => (
                            <button
                                key={filter.value}
                                onClick={() => setStatusFilter(filter.value)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200",
                                    statusFilter === filter.value
                                        ? "bg-emerald-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                )}
                            >
                                {filter.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Zone Filter */}
                {zones.length > 0 && (
                    <div className="flex items-center gap-3 flex-wrap pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-semibold text-gray-700">Khu vực:</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            <button
                                onClick={() => setZoneFilter('all')}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200",
                                    zoneFilter === 'all'
                                        ? "bg-emerald-600 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                )}
                            >
                                Tất cả khu vực
                            </button>
                            {zones.map((zone) => (
                                <button
                                    key={zone._id}
                                    onClick={() => setZoneFilter(zone._id)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 flex items-center gap-2",
                                        zoneFilter === zone._id
                                            ? "bg-emerald-600 text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                    )}
                                >
                                    <span>{zone.zoneName}</span>
                                    <span className="text-xs opacity-75">({zone.addressCount})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Deliveries Count */}
            {!loading && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <p className="text-sm text-emerald-700">
                        Hiển thị <span className="font-bold">{deliveries.length}</span> đơn hàng
                        {zoneFilter !== 'all' && zones.find(z => z._id === zoneFilter) && (
                            <span> trong khu vực <span className="font-bold">{zones.find(z => z._id === zoneFilter)?.zoneName}</span></span>
                        )}
                    </p>
                </div>
            )}

            {/* Deliveries List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="flex items-center justify-center h-96">
                        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                    </div>
                ) : deliveries.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Không có đơn giao hàng</p>
                    </div>
                ) : (
                    deliveries.map((delivery) => (
                        <div
                            key={delivery._id}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-semibold text-gray-900">
                                            Đơn hàng #{delivery.orderId._id.slice(-8)}
                                        </h3>
                                        {getStatusBadge(delivery.deliveryStatus)}
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <Calendar className="w-4 h-4" />
                                        <span>Dự kiến: {formatDate(delivery.estimatedDeliveryTime)}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-lg font-bold text-gray-900">
                                        <DollarSign className="w-5 h-5" />
                                        {formatCurrency(delivery.orderId.totalAmount)}
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Khách hàng</h4>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">{delivery.orderId.userId.fullName}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Phone className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm">{delivery.orderId.userId.phone}</span>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Địa chỉ giao hàng</h4>
                                    <div className="flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                                        <div className="text-sm">
                                            <p>{delivery.orderId.addressId.addressLine1}</p>
                                            {delivery.orderId.addressId.addressLine2 && (
                                                <p>{delivery.orderId.addressId.addressLine2}</p>
                                            )}
                                            <p className="text-gray-500">
                                                {[
                                                    delivery.orderId.addressId.ward,
                                                    delivery.orderId.addressId.district,
                                                    delivery.orderId.addressId.city,
                                                ].filter(Boolean).join(', ')}
                                            </p>
                                            {delivery.orderId.addressId.deliveryZoneId && (
                                                <p className="text-xs text-emerald-600 mt-1">
                                                    Khu vực: {delivery.orderId.addressId.deliveryZoneId.zoneName}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {delivery.deliveryStatus !== 'Delivered' && delivery.deliveryStatus !== 'Cancelled' && (
                                <div className="flex gap-2 flex-wrap">
                                    {delivery.deliveryStatus === 'Pending' && (
                                        <button
                                            onClick={() => handleUpdateStatus(delivery._id, 'Delivering')}
                                            disabled={updatingId === delivery._id}
                                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                        >
                                            {updatingId === delivery._id ? (
                                                <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                            ) : null}
                                            Bắt đầu giao
                                        </button>
                                    )}
                                    {delivery.deliveryStatus === 'Delivering' && (
                                        <>
                                            <button
                                                onClick={() => handleUpdateStatus(delivery._id, 'Delivered')}
                                                disabled={updatingId === delivery._id}
                                                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                            >
                                                {updatingId === delivery._id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                                                ) : null}
                                                Đã giao
                                            </button>
                                            <button
                                                onClick={() => handleUpdateStatus(delivery._id, 'Failed')}
                                                disabled={updatingId === delivery._id}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-50"
                                            >
                                                Giao thất bại
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            {delivery.notes && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                                    <p className="text-xs font-semibold text-yellow-800 mb-1">Ghi chú:</p>
                                    <p className="text-sm text-yellow-700">{delivery.notes}</p>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
