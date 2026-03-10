import { useEffect, useState } from 'react';
import {
    MapPin,
    Home,
    DollarSign,
    Loader2,
    Navigation,
    ArrowUpDown,
} from 'lucide-react';
import { shipperService, DeliveryZone } from '../../services/shipperService';
import { toast } from 'sonner';

type SortOption = 'name' | 'distance';

export default function ShipperZones() {
    const [loading, setLoading] = useState(true);
    const [zones, setZones] = useState<DeliveryZone[]>([]);
    const [sortBy, setSortBy] = useState<SortOption>('name');
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lon: number } | null>(null);
    const [gettingLocation, setGettingLocation] = useState(false);

    useEffect(() => {
        loadZones();
    }, [sortBy, currentLocation]);

    const loadZones = async () => {
        try {
            setLoading(true);
            const data = await shipperService.getZones(
                currentLocation?.lat,
                currentLocation?.lon,
                sortBy
            );
            setZones(data);
        } catch (error) {
            console.error('Error loading zones:', error);
            toast.error('Không thể tải danh sách khu vực');
        } finally {
            setLoading(false);
        }
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Trình duyệt không hỗ trợ định vị GPS');
            return;
        }

        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
                setSortBy('distance');
                toast.success('Đã lấy vị trí hiện tại');
                setGettingLocation(false);
            },
            (error) => {
                console.error('Error getting location:', error);
                toast.error('Không thể lấy vị trí hiện tại. Vui lòng cho phép truy cập GPS.');
                setGettingLocation(false);
            }
        );
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
            {/* Stats Summary & Sort Controls */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Tổng quan khu vực</h3>

                    {/* Sort & Location Controls */}
                    <div className="flex items-center gap-3">
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as SortOption)}
                                className="appearance-none bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 pr-10 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-white/50 cursor-pointer"
                            >
                                <option value="name" className="text-gray-900">Sắp xếp theo tên</option>
                                <option value="distance" className="text-gray-900">Sắp xếp theo khoảng cách</option>
                            </select>
                            <ArrowUpDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" />
                        </div>

                        {/* Get Location Button */}
                        <button
                            onClick={getCurrentLocation}
                            disabled={gettingLocation}
                            className="flex items-center gap-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 text-sm font-medium hover:bg-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {gettingLocation ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Navigation className="w-4 h-4" />
                            )}
                            <span>Lấy vị trí</span>
                        </button>
                    </div>
                </div>

                {currentLocation && (
                    <div className="mb-4 p-3 bg-white/10 backdrop-blur-sm rounded-xl text-sm">
                        <p className="flex items-center gap-2">
                            <Navigation className="w-4 h-4" />
                            Vị trí của bạn: {currentLocation.lat.toFixed(6)}, {currentLocation.lon.toFixed(6)}
                        </p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <MapPin className="w-6 h-6 mb-2" />
                        <p className="text-2xl font-bold">{zones.length}</p>
                        <p className="text-sm text-white/80">Khu vực quản lý</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <Home className="w-6 h-6 mb-2" />
                        <p className="text-2xl font-bold">
                            {zones.reduce((sum, zone) => sum + zone.addressCount, 0)}
                        </p>
                        <p className="text-sm text-white/80">Tổng địa chỉ</p>
                    </div>
                </div>
            </div>

            {/* Zones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {zones.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Chưa có khu vực nào được gán</p>
                    </div>
                ) : (
                    zones.map((zone, index) => (
                        <div
                            key={zone._id}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-200 relative overflow-hidden group"
                        >
                            {/* Priority Badge (for distance sorting) */}
                            {sortBy === 'distance' && zone.distance !== undefined && (
                                <div className="absolute top-4 right-4 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                                    #{index + 1}
                                </div>
                            )}

                            {/* Zone Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-emerald-50 rounded-xl group-hover:bg-emerald-100 transition-colors">
                                        <MapPin className="w-6 h-6 text-emerald-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{zone.zoneName}</h3>
                                        <div className="flex items-center gap-1 text-sm text-emerald-600 mt-1">
                                            <DollarSign className="w-4 h-4" />
                                            <span className="font-medium">{formatCurrency(zone.shippingRate)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Distance Info */}
                            {zone.distance !== undefined && zone.distance !== Infinity && (
                                <div className="mb-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <div className="flex items-center gap-2 text-emerald-700">
                                        <Navigation className="w-4 h-4" />
                                        <span className="text-sm font-semibold">
                                            {zone.distance.toFixed(2)} km
                                        </span>
                                        <span className="text-xs text-emerald-600">từ vị trí của bạn</span>
                                    </div>
                                </div>
                            )}

                            {/* Zone Info */}
                            {zone.description && (
                                <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                                    <p className="text-sm text-gray-600">{zone.description}</p>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Số địa chỉ:</span>
                                    <span className="font-semibold text-gray-900">{zone.addressCount}</span>
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="mt-4">
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min((zone.addressCount / 50) * 100, 100)}%` }}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {zone.addressCount} / 50 địa chỉ
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
