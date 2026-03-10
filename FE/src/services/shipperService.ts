import api from './api';

export interface ShipperOverview {
    totalZones: number;
    totalAddresses: number;
    todayDeliveries: number;
    upcomingDeliveries: number;
    deliveriesByStatus: {
        Pending: number;
        Delivering: number;
        Delivered: number;
        Failed: number;
        Cancelled: number;
    };
}

export interface DeliveryZone {
    _id: string;
    zoneName: string;
    shippingRate: number;
    description?: string;
    addressCount: number;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    distance?: number;
    createdAt: string;
}

export interface Address {
    _id: string;
    userId: {
        _id: string;
        fullName: string;
        email: string;
        phone: string;
    };
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    district?: string;
    ward?: string;
    province?: string;
    postalCode?: string;
    deliveryZoneId?: {
        _id: string;
        zoneName: string;
        shippingRate: number;
    };
    isDefault: boolean;
    createdAt: string;
}

export interface Delivery {
    _id: string;
    orderId: {
        _id: string;
        orderDate: string;
        totalAmount: number;
        status: string;
        userId: {
            _id: string;
            fullName: string;
            email: string;
            phone: string;
        };
        addressId: {
            _id: string;
            fullName?: string;
            phone?: string;
            addressLine1?: string;
            addressLine2?: string;
            city?: string;
            district?: string;
            ward?: string;
            province?: string;
            deliveryZoneId?: {
                _id: string;
                zoneName: string;
                shippingRate: number;
            };
        };
    };
    deliveryStatus: 'Pending' | 'Delivering' | 'Delivered' | 'Failed' | 'Cancelled';
    estimatedDeliveryTime: string;
    actualDeliveryTime?: string;
    notes?: string;
    failureReason?: string;
    createdAt: string;
}

class ShipperService {
    /**
     * Get dashboard overview statistics
     */
    async getDashboardOverview(): Promise<ShipperOverview> {
        const response = await api.get('/shipper/dashboard/overview') as any;
        return response.data;
    }

    /**
     * Get all zones managed by shipper
     * @param lat - Current latitude (optional)
     * @param lon - Current longitude (optional)
     * @param sortBy - Sort option: 'name' | 'distance' (optional)
     */
    async getZones(lat?: number, lon?: number, sortBy?: 'name' | 'distance'): Promise<DeliveryZone[]> {
        const params: any = {};
        if (lat !== undefined) params.lat = lat;
        if (lon !== undefined) params.lon = lon;
        if (sortBy) params.sortBy = sortBy;

        const response = await api.get('/shipper/zones', { params }) as any;
        return response.data;
    }

    /**
     * Get all addresses under shipper's responsibility
     */
    async getAddresses(): Promise<Address[]> {
        const response = await api.get('/shipper/addresses') as any;
        return response.data;
    }

    /**
     * Get all deliveries for shipper
     * @param status - Optional status filter
     * @param zoneId - Optional zone filter
     */
    async getDeliveries(status?: string, zoneId?: string): Promise<Delivery[]> {
        const params: any = {};
        if (status) params.status = status;
        if (zoneId) params.zoneId = zoneId;

        const response = await api.get('/shipper/deliveries', { params }) as any;
        return response.data;
    }

    /**
     * Update delivery status
     * @param deliveryId - The ID of the delivery
     * @param status - New status
     * @param notes - Optional notes
     */
    async updateDeliveryStatus(
        deliveryId: string,
        status: 'Pending' | 'Delivering' | 'Delivered' | 'Failed' | 'Cancelled',
        notes?: string
    ): Promise<Delivery> {
        const response = await api.patch(`/shipper/deliveries/${deliveryId}/status`, {
            status,
            notes
        }) as any;
        return response.data;
    }
}

export const shipperService = new ShipperService();
