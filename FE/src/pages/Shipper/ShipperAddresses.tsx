import { useEffect, useState } from 'react';
import {
    Home,
    User,
    Phone,
    MapPin,
    Mail,
    Loader2,
    Calendar,
} from 'lucide-react';
import { shipperService, Address } from '../../services/shipperService';
import { toast } from 'sonner';

export default function ShipperAddresses() {
    const [loading, setLoading] = useState(true);
    const [addresses, setAddresses] = useState<Address[]>([]);

    useEffect(() => {
        loadAddresses();
    }, []);

    const loadAddresses = async () => {
        try {
            setLoading(true);
            const data = await shipperService.getAddresses();
            setAddresses(data);
        } catch (error) {
            console.error('Error loading addresses:', error);
            toast.error('Không thể tải danh sách địa chỉ');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
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
            {/* Stats Summary */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-2">Tổng quan địa chỉ</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <Home className="w-6 h-6 mb-2" />
                        <p className="text-2xl font-bold">{addresses.length}</p>
                        <p className="text-sm text-white/80">Tổng địa chỉ</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <User className="w-6 h-6 mb-2" />
                        <p className="text-2xl font-bold">
                            {new Set(addresses.map(a => a.userId._id)).size}
                        </p>
                        <p className="text-sm text-white/80">Khách hàng</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                        <MapPin className="w-6 h-6 mb-2" />
                        <p className="text-2xl font-bold">
                            {new Set(addresses.map(a => a.city)).size}
                        </p>
                        <p className="text-sm text-white/80">Thành phố</p>
                    </div>
                </div>
            </div>

            {/* Addresses List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {addresses.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
                        <Home className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Chưa có địa chỉ nào được gán</p>
                    </div>
                ) : (
                    addresses.map((address) => (
                        <div
                            key={address._id}
                            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200"
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-purple-50 rounded-xl">
                                        <Home className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {address.fullName || address.userId.fullName}
                                        </h3>
                                        {address.isDefault && (
                                            <span className="inline-block px-2 py-1 mt-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                                                Địa chỉ mặc định
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-3">Thông tin khách hàng</h4>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{address.userId.fullName}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{address.phone || address.userId.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm">{address.userId.email}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Address Details */}
                            <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Địa chỉ</h4>
                                <div className="flex items-start gap-2">
                                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                    <div className="text-sm text-gray-700">
                                        {address.addressLine1 && <p>{address.addressLine1}</p>}
                                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                                        <p className="text-gray-500">
                                            {[
                                                address.ward,
                                                address.district,
                                                address.city,
                                                address.province,
                                            ].filter(Boolean).join(', ')}
                                        </p>
                                        {address.postalCode && (
                                            <p className="text-gray-500">Mã bưu điện: {address.postalCode}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Zone Info */}
                            {address.deliveryZoneId && (
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <div className="flex items-center gap-2 mb-1">
                                        <MapPin className="w-4 h-4 text-emerald-600" />
                                        <span className="text-xs font-semibold text-emerald-800">Khu vực giao hàng</span>
                                    </div>
                                    <p className="text-sm text-emerald-700">{address.deliveryZoneId.zoneName}</p>
                                    <p className="text-xs text-emerald-600 mt-1">
                                        Phí ship: {new Intl.NumberFormat('vi-VN', {
                                            style: 'currency',
                                            currency: 'VND',
                                        }).format(address.deliveryZoneId.shippingRate)}
                                    </p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <span>Tạo ngày: {formatDate(address.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
