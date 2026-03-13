import { Response, NextFunction } from 'express';
import { Order } from '../models/Order.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';
import { createNotification } from '../models/Notification.model';
import { getIO } from '../socket';

export class ShipperController {
    /**
     * Get shipper dashboard statistics
     * GET /api/shipper/dashboard
     */
    getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const shipperId = req.user?.id;

            if (!shipperId) {
                throw new AppError('Shipper not authenticated', 401);
            }

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Count orders by status
            const [
                totalOrders,
                deliveringOrders,
                deliveredOrders,
                todayDelivered,
                totalEarnings
            ] = await Promise.all([
                Order.countDocuments({ shipperId }),
                Order.countDocuments({ shipperId, status: 'shipped' }),
                Order.countDocuments({ shipperId, status: 'delivered' }),
                Order.countDocuments({
                    shipperId,
                    status: 'delivered',
                    deliveredAt: { $gte: today }
                }),
                Order.aggregate([
                    {
                        $match: {
                            shipperId: shipperId as any,
                            status: 'delivered'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$shippingCost' }
                        }
                    }
                ])
            ]);

            res.json({
                success: true,
                data: {
                    totalOrders,
                    deliveringOrders,
                    deliveredOrders,
                    todayDelivered,
                    totalEarnings: totalEarnings[0]?.total || 0
                }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get available orders for shipper to pick
     * GET /api/shipper/available-orders
     */
    getAvailableOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const shipperId = req.user?.id;
            const { page = 1, limit = 20, search } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            if (!shipperId) {
                throw new AppError('Shipper not authenticated', 401);
            }

            // Get confirmed orders available for pickup:
            // - not assigned yet (shipperId is null or missing), or
            // - explicitly reopened for shipping after cancellation
            const baseQuery: any = {
                status: 'confirmed',
                $or: [
                    { shipperId: null },
                    { shipperId: { $exists: false } },
                    { reopenedForShipping: true }
                ],
                rejectedByShippers: { $ne: shipperId }
            };

            if (search && typeof search === 'string') {
                baseQuery.$and = [
                    {
                        $or: [
                            { 'deliveryInfo.fullName': { $regex: search, $options: 'i' } },
                            { 'deliveryInfo.address': { $regex: search, $options: 'i' } },
                            { 'deliveryInfo.phone': { $regex: search, $options: 'i' } }
                        ]
                    }
                ];
            }

            const [orders, total] = await Promise.all([
                Order.find(baseQuery)
                    .populate('userId', 'name email phone')
                    .populate('items.productId', 'name price images')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                Order.countDocuments(baseQuery)
            ]);

            res.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get shipper's assigned orders
     * GET /api/shipper/my-orders
     */
    getMyOrders = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const shipperId = req.user?.id;
            const { page = 1, limit = 20, status } = req.query;
            const skip = (Number(page) - 1) * Number(limit);

            if (!shipperId) {
                throw new AppError('Shipper not authenticated', 401);
            }

            // Handle different query cases
            let query: any;

            if (status === 'cancelled') {
                // Special case: Show only cancelled orders by this shipper
                query = {
                    cancelledByShipperId: shipperId
                };
            } else if (status && typeof status === 'string') {
                // Filter by status and active assignments only
                query = {
                    shipperId,
                    status
                };
            } else {
                // No filter: Show all orders (both active and cancelled)
                query = {
                    $or: [
                        { shipperId },
                        { cancelledByShipperId: shipperId }
                    ]
                };
            }

            const [orders, total] = await Promise.all([
                Order.find(query)
                    .populate('userId', 'name email phone')
                    .populate('items.productId', 'name price images')
                    .sort({ createdAt: -1 })
                    .skip(skip)
                    .limit(Number(limit))
                    .lean(),
                Order.countDocuments(query)
            ]);

            res.json({
                success: true,
                data: {
                    orders,
                    pagination: {
                        page: Number(page),
                        limit: Number(limit),
                        total,
                        pages: Math.ceil(total / Number(limit))
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    };

    /**
     * Accept an order
     * POST /api/shipper/orders/:id/accept
     */
    acceptOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const shipperId = req.user?.id;

            if (!shipperId) {
                throw new AppError('Shipper not authenticated', 401);
            }

            const order = await Order.findById(id);

            if (!order) {
                throw new AppError('Order not found', 404);
            }

            // Check if this shipper has rejected this order before
            if (order.rejectedByShippers && order.rejectedByShippers.includes(shipperId as any)) {
                throw new AppError('You have cancelled this order before and cannot accept it again', 403);
            }

            // Check if order is available (no shipper OR reopened after cancellation)
            if (order.shipperId && !order.reopenedForShipping) {
                throw new AppError('Order already assigned to a shipper', 400);
            }

            // Check if order is in valid status for shipping
            if (!['confirmed', 'processing'].includes(order.status)) {
                throw new AppError('Order is not available for shipping', 400);
            }

            // Assign to new shipper
            order.shipperId = shipperId as any;
            order.status = 'shipped';
            order.shippingAcceptedAt = new Date();
            order.reopenedForShipping = false; // Reset reopened flag
            await order.save();

            await order.populate('userId', 'name email phone');
            await order.populate('items.productId', 'name price images');

            res.json({
                success: true,
                message: 'Order accepted successfully',
                data: order
            });

            // Notify customer
            const customerName = (order as any).userId?.name || 'Khách hàng';
            createNotification(
                'order_update',
                'Đơn hàng đang giao',
                `Đơn hàng #${order._id?.toString().slice(-6).toUpperCase()} đang được giao đến bạn`,
                {
                    link: `/orders/${order._id}`,
                    metadata: { orderId: order._id },
                    userId: order.userId as any
                }
            );
        } catch (error) {
            next(error);
        }
    };

    /**
     * Update order status by shipper
     * PATCH /api/shipper/orders/:id/status
     */
    updateOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const { status, cancelReason } = req.body;
            const shipperId = req.user?.id;

            if (!shipperId) {
                throw new AppError('Shipper not authenticated', 401);
            }

            if (!['shipped', 'delivered', 'cancelled'].includes(status)) {
                throw new AppError('Invalid status', 400);
            }

            const order = await Order.findById(id);

            if (!order) {
                throw new AppError('Order not found', 404);
            }

            if (order.shipperId?.toString() !== shipperId.toString()) {
                throw new AppError('You are not assigned to this order', 403);
            }

            // Validate status transitions
            if (status === 'cancelled' && !cancelReason) {
                throw new AppError('Cancel reason is required', 400);
            }

            // When shipper cancels, return order to available pool for other shippers
            if (status === 'cancelled') {
                order.status = 'confirmed'; // Set back to confirmed so other shippers can see it
                order.cancelledByShipperId = shipperId as any; // Track which shipper cancelled (keeps it in their My Deliveries)
                order.shipperCancelledAt = new Date(); // Track when cancelled
                order.shipperId = undefined; // Remove shipper assignment so other shippers can accept
                order.shippingAcceptedAt = undefined; // Reset acceptance timestamp
                order.reopenedForShipping = true; // Mark as reopened for other shippers

                // Add this shipper to rejected list so they can't pick it again
                if (!order.rejectedByShippers) {
                    order.rejectedByShippers = [];
                }
                if (!order.rejectedByShippers.includes(shipperId as any)) {
                    order.rejectedByShippers.push(shipperId as any);
                }

                // Add cancel history note
                if (!order.notes) {
                    order.notes = '';
                }
                const cancelNote = `[${new Date().toLocaleString('vi-VN')}] Shipper hủy đơn: ${cancelReason}`;
                order.notes = order.notes ? `${order.notes}\n${cancelNote}` : cancelNote;
            } else {
                order.status = status as any;
            }

            if (status === 'delivered') {
                if (order.orderType === 'subscription') {
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const deliveryDate = new Date(order.orderDate);
                    deliveryDate.setHours(0, 0, 0, 0);

                    if (today.getTime() < deliveryDate.getTime()) {
                        const deliveryDateText = deliveryDate.toLocaleDateString('vi-VN');
                        throw new AppError(
                            `Subscription order can only be marked as delivered on ${deliveryDateText} or later`,
                            400
                        );
                    }
                }

                order.deliveredAt = new Date();
                if (order.paymentMethod === 'cod') {
                    order.paymentStatus = 'paid';
                }

                // Cascade: mark all member sub-orders as delivered too
                if (order.groupId) {
                    await Order.updateMany(
                        { groupId: order.groupId, _id: { $ne: order._id }, status: { $ne: 'delivered' } },
                        { $set: { status: 'delivered', deliveredAt: new Date() } }
                    );
                }
            }

            await order.save();

            await order.populate('userId', 'name email phone');
            await order.populate('items.productId', 'name price images');

            res.json({
                success: true,
                message: 'Order status updated successfully',
                data: order
            });

            // Notify customer
            let notificationTitle = '';
            let notificationMessage = '';

            if (status === 'delivered') {
                notificationTitle = 'Đơn hàng đã giao';
                notificationMessage = `Đơn hàng #${order._id?.toString().slice(-6).toUpperCase()} đã được giao thành công`;

                // For group orders, broadcast delivery notification to all group members via socket
                if (order.groupId) {
                    try {
                        const deliveryAddr = (order.deliveryInfo as any)?.address || '';
                        const ownerUserName = (order as any).userId?.name || 'chủ nhóm';
                        getIO().to(`group:${order.groupId}`).emit('group:order_delivered', {
                            groupId: order.groupId.toString(),
                            orderId: order._id,
                            address: deliveryAddr,
                            ownerName: ownerUserName,
                        });
                    } catch (_) { }
                }
            } else if (status === 'cancelled') {
                notificationTitle = 'Shipper hủy đơn';
                notificationMessage = `Shipper đã hủy giao đơn hàng #${order._id?.toString().slice(-6).toUpperCase()}. Lý do: ${cancelReason}. Chúng tôi đang tìm shipper khác cho đơn hàng của bạn.`;
            }

            if (notificationTitle) {
                createNotification(
                    'order_update',
                    notificationTitle,
                    notificationMessage,
                    {
                        link: `/orders/${order._id}`,
                        metadata: { orderId: order._id },
                        userId: order.userId as any
                    }
                );
            }
        } catch (error) {
            next(error);
        }
    };

    /**
     * Get order details
     * GET /api/shipper/orders/:id
     */
    getOrderDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { id } = req.params;
            const shipperId = req.user?.id;

            if (!shipperId) {
                throw new AppError('Shipper not authenticated', 401);
            }

            const order = await Order.findById(id)
                .populate('userId', 'name email phone')
                .populate('items.productId', 'name price images')
                .populate('shipperId', 'name phone')
                .lean();

            if (!order) {
                throw new AppError('Order not found', 404);
            }

            // Shipper can only view their own orders
            if (order.shipperId?.toString() !== shipperId.toString()) {
                throw new AppError('You do not have access to this order', 403);
            }

            res.json({
                success: true,
                data: order
            });
        } catch (error) {
            next(error);
        }
    };
}

export default new ShipperController();
