import mongoose from 'mongoose';
import { Shipper } from '../models/Shipper.model';
import { DeliveryZone } from '../models/DeliveryZone.model';
import { Address } from '../models/Address.model';
import { Delivery } from '../models/Delivery.model';
import { Order } from '../models/Order.model';
import { sortByDistance } from '../utils/distance.util';

export class ShipperService {
    /**
     * Get dashboard overview statistics for a shipper
     * @param shipperId - The ID of the shipper
     */
    async getDashboardOverview(shipperId: string) {
        try {
            const shipperObjectId = new mongoose.Types.ObjectId(shipperId);

            // Get all delivery zones managed by this shipper
            const zones = await DeliveryZone.find({ shipperId: shipperObjectId, isActive: true });
            const zoneIds = zones.map(z => z._id);

            // Get all addresses under shipper's responsibility
            // Condition: address.shipperId = shipperId OR address.deliveryZoneId in zoneIds
            const addresses = await Address.find({
                $or: [
                    { shipperId: shipperObjectId },
                    { deliveryZoneId: { $in: zoneIds } }
                ]
            });
            const addressIds = addresses.map(a => a._id);

            // Get date ranges
            const now = new Date();
            const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
            const next7DaysEnd = new Date(now);
            next7DaysEnd.setDate(next7DaysEnd.getDate() + 7);

            // Get all orders with these addresses that are confirmed by manager
            // Only show orders with status: 'confirmed', 'processing', 'shipped', 'delivered'
            const orders = await Order.find({
                addressId: { $in: addressIds },
                status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
            }).select('_id');
            const orderIds = orders.map(o => o._id);

            // Aggregate delivery statistics
            const deliveryStats = await Delivery.aggregate([
                {
                    $match: {
                        orderId: { $in: orderIds }
                    }
                },
                {
                    $facet: {
                        // Count by status
                        byStatus: [
                            {
                                $group: {
                                    _id: '$deliveryStatus',
                                    count: { $sum: 1 }
                                }
                            }
                        ],
                        // Count today's deliveries
                        today: [
                            {
                                $match: {
                                    estimatedDeliveryTime: { $gte: todayStart, $lte: todayEnd }
                                }
                            },
                            {
                                $count: 'count'
                            }
                        ],
                        // Count upcoming deliveries (next 7 days)
                        upcoming: [
                            {
                                $match: {
                                    estimatedDeliveryTime: { $gt: todayEnd, $lte: next7DaysEnd }
                                }
                            },
                            {
                                $count: 'count'
                            }
                        ]
                    }
                }
            ]);

            const stats = deliveryStats[0] || { byStatus: [], today: [], upcoming: [] };

            // Format status counts
            const statusCounts: Record<string, number> = {};
            stats.byStatus.forEach((item: any) => {
                statusCounts[item._id] = item.count;
            });

            return {
                totalZones: zones.length,
                totalAddresses: addresses.length,
                todayDeliveries: stats.today[0]?.count || 0,
                upcomingDeliveries: stats.upcoming[0]?.count || 0,
                deliveriesByStatus: {
                    Pending: statusCounts['Pending'] || 0,
                    Delivering: statusCounts['Delivering'] || 0,
                    Delivered: statusCounts['Delivered'] || 0,
                    Failed: statusCounts['Failed'] || 0,
                    Cancelled: statusCounts['Cancelled'] || 0
                }
            };
        } catch (error) {
            console.error('[ShipperService] Error getting dashboard overview:', error);
            throw error;
        }
    }

    /**
     * Get all zones managed by a shipper with address counts
     * @param shipperId - The ID of the shipper
     * @param currentLat - Current latitude (optional, for distance sorting)
     * @param currentLon - Current longitude (optional, for distance sorting)
     * @param sortBy - Sort option: 'name' | 'distance' (default: 'name')
     */
    async getZones(
        shipperId: string,
        currentLat?: number,
        currentLon?: number,
        sortBy: 'name' | 'distance' = 'name'
    ) {
        try {
            const shipperObjectId = new mongoose.Types.ObjectId(shipperId);

            const zones = await DeliveryZone.aggregate([
                {
                    $match: {
                        shipperId: shipperObjectId,
                        isActive: true
                    }
                },
                {
                    $lookup: {
                        from: 'addresses',
                        localField: '_id',
                        foreignField: 'deliveryZoneId',
                        as: 'addresses'
                    }
                },
                {
                    $project: {
                        _id: 1,
                        zoneName: 1,
                        shippingRate: 1,
                        description: 1,
                        coordinates: 1,
                        addressCount: { $size: '$addresses' },
                        createdAt: 1
                    }
                }
            ]);

            // Convert to plain objects
            const plainZones = zones.map(z => ({
                _id: z._id.toString(),
                zoneName: z.zoneName,
                shippingRate: z.shippingRate,
                description: z.description,
                coordinates: z.coordinates,
                addressCount: z.addressCount
            }));

            // Sort by distance if coordinates are provided
            if (sortBy === 'distance' && currentLat !== undefined && currentLon !== undefined) {
                return sortByDistance(plainZones, currentLat, currentLon);
            }

            // Default: sort by name
            return plainZones.sort((a, b) => a.zoneName.localeCompare(b.zoneName));
        } catch (error) {
            console.error('[ShipperService] Error getting zones:', error);
            throw error;
        }
    }

    /**
     * Get all addresses under shipper's responsibility
     * @param shipperId - The ID of the shipper
     */
    async getAddresses(shipperId: string) {
        try {
            const shipperObjectId = new mongoose.Types.ObjectId(shipperId);

            // Get zones managed by this shipper
            const zones = await DeliveryZone.find({ shipperId: shipperObjectId, isActive: true });
            const zoneIds = zones.map(z => z._id);

            // Get addresses: either directly assigned to shipper OR in shipper's zones
            const addresses = await Address.find({
                $or: [
                    { shipperId: shipperObjectId },
                    { deliveryZoneId: { $in: zoneIds } }
                ]
            })
                .populate('userId', 'fullName email phone')
                .populate('deliveryZoneId', 'zoneName shippingRate')
                .sort({ createdAt: -1 });

            return addresses;
        } catch (error) {
            console.error('[ShipperService] Error getting addresses:', error);
            throw error;
        }
    }

    /**
     * Get all deliveries for a shipper
     * @param shipperId - The ID of the shipper
     * @param status - Optional status filter
     * @param zoneId - Optional zone filter
     */
    async getDeliveries(shipperId: string, status?: string, zoneId?: string) {
        try {
            const shipperObjectId = new mongoose.Types.ObjectId(shipperId);

            // Get zones managed by this shipper
            const zones = await DeliveryZone.find({ shipperId: shipperObjectId, isActive: true });
            const zoneIds = zones.map(z => z._id);

            // Build address filter
            const addressFilter: any = {
                $or: [
                    { shipperId: shipperObjectId },
                    { deliveryZoneId: { $in: zoneIds } }
                ]
            };

            // If zoneId is specified, filter addresses by that zone only
            if (zoneId) {
                addressFilter.deliveryZoneId = new mongoose.Types.ObjectId(zoneId);
            }

            // Get all addresses under shipper's responsibility (filtered by zone if specified)
            const addresses = await Address.find(addressFilter);
            const addressIds = addresses.map(a => a._id);

            // Get orders with these addresses that are confirmed by manager
            // Only show orders with status: 'confirmed', 'processing', 'shipped', 'delivered'
            const orders = await Order.find({
                addressId: { $in: addressIds },
                status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
            }).select('_id');
            const orderIds = orders.map(o => o._id);

            // Build delivery query
            const deliveryQuery: any = {
                orderId: { $in: orderIds }
            };

            if (status) {
                deliveryQuery.deliveryStatus = status;
            }

            // Get deliveries with populated order and address info
            const deliveries = await Delivery.find(deliveryQuery)
                .populate({
                    path: 'orderId',
                    populate: [
                        {
                            path: 'userId',
                            select: 'fullName email phone'
                        },
                        {
                            path: 'addressId',
                            populate: {
                                path: 'deliveryZoneId',
                                select: 'zoneName shippingRate'
                            }
                        }
                    ]
                })
                .sort({ estimatedDeliveryTime: 1 });

            return deliveries;
        } catch (error) {
            console.error('[ShipperService] Error getting deliveries:', error);
            throw error;
        }
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
    ) {
        try {
            const delivery = await Delivery.findById(deliveryId);
            if (!delivery) {
                throw new Error('Delivery not found');
            }

            delivery.deliveryStatus = status;
            if (notes) {
                delivery.notes = notes;
            }

            // Set actual delivery time if delivered
            if (status === 'Delivered' && !delivery.actualDeliveryTime) {
                delivery.actualDeliveryTime = new Date();
            }

            await delivery.save();

            // Update order status accordingly
            if (status === 'Delivered') {
                await Order.findByIdAndUpdate(delivery.orderId, {
                    status: 'delivered',
                    deliveredAt: new Date()
                });
            } else if (status === 'Delivering') {
                await Order.findByIdAndUpdate(delivery.orderId, {
                    status: 'shipped'
                });
            }

            return delivery;
        } catch (error) {
            console.error('[ShipperService] Error updating delivery status:', error);
            throw error;
        }
    }
}

export const shipperService = new ShipperService();
