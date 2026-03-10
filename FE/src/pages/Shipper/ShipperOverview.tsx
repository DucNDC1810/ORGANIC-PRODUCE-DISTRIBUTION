import { useEffect, useState } from 'react';
import {
    MapPin,
    Home,
    Package,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { shipperService, ShipperOverview as OverviewData } from '../../services/shipperService';
import { toast } from 'sonner';

export default function ShipperOverview() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<OverviewData | null>(null);

    useEffect(() => {
        loadOverview();
    }, []);

    const loadOverview = async () => {
        try {
            setLoading(true);
            const overview = await shipperService.getDashboardOverview();
            setData(overview);
        } catch (error) {
            console.error('Error loading overview:', error);
            toast.error('Không thể tải dữ liệu tổng quan');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-gray-500">Không có dữ liệu</p>
            </div>
        );
    }

    const stats = [
        {
            label: 'Khu vực quản lý',
            value: data.totalZones,
            icon: MapPin,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600',
        },
        {
            label: 'Địa chỉ phụ trách',
            value: data.totalAddresses,
            icon: Home,
            color: 'from-teal-500 to-teal-600',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600',
        },
        {
            label: 'Giao hôm nay',
            value: data.todayDeliveries,
            icon: Clock,
            color: 'from-orange-500 to-orange-600',
            bgColor: 'bg-orange-50',
            textColor: 'text-orange-600',
        },
        {
            label: 'Sắp tới (7 ngày)',
            value: data.upcomingDeliveries,
            icon: TrendingUp,
            color: 'from-emerald-500 to-emerald-600',
            bgColor: 'bg-emerald-50',
            textColor: 'text-emerald-600',
        },
    ];

    const statusStats = [
        {
            label: 'Chờ giao',
            value: data.deliveriesByStatus.Pending,
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
        },
        {
            label: 'Đang giao',
            value: data.deliveriesByStatus.Delivering,
            icon: Package,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
        },
        {
            label: 'Đã giao',
            value: data.deliveriesByStatus.Delivered,
            icon: CheckCircle,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
        },
        {
            label: 'Thất bại',
            value: data.deliveriesByStatus.Failed,
            icon: XCircle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
        },
        {
            label: 'Đã hủy',
            value: data.deliveriesByStatus.Cancelled,
            icon: AlertCircle,
            color: 'text-gray-600',
            bgColor: 'bg-gray-50',
        },
    ];

    return (
        <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 ${stat.textColor}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                            <p className="text-sm text-gray-500">{stat.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Status Breakdown */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Trạng thái giao hàng</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {statusStats.map((stat, index) => (
                        <div
                            key={index}
                            className={`${stat.bgColor} rounded-xl p-4 border border-gray-100`}
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                <span className={`text-xs font-medium ${stat.color}`}>
                                    {stat.label}
                                </span>
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Bắt đầu làm việc</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-left transition-colors duration-200">
                        <Package className="w-6 h-6 mb-2" />
                        <p className="font-medium">Xem đơn cần giao</p>
                        <p className="text-sm text-white/80 mt-1">
                            {data.todayDeliveries} đơn hôm nay
                        </p>
                    </button>
                    <button className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl p-4 text-left transition-colors duration-200">
                        <MapPin className="w-6 h-6 mb-2" />
                        <p className="font-medium">Xem khu vực</p>
                        <p className="text-sm text-white/80 mt-1">
                            {data.totalZones} khu vực quản lý
                        </p>
                    </button>
                </div>
            </div>
        </div>
    );
}
