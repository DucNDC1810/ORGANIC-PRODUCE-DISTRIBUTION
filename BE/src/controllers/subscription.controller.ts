import { Response, NextFunction } from 'express';
import { Subscription } from '../models/Subscription.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class SubscriptionController {
  /**
   * Create a new subscription
   * POST /api/subscriptions
   */
  createSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        addressId,
        frequency,
        deliveryDay,
        nextDeliveryDate,
        items,
        discountRate,
        paymentMethod,
        notes
      } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!frequency || !nextDeliveryDate || deliveryDay === undefined) {
        throw new AppError('Frequency, deliveryDay and nextDeliveryDate are required', 400);
      }

      if (!['weekly', 'bi-weekly', 'monthly'].includes(frequency)) {
        throw new AppError('Frequency must be weekly, bi-weekly or monthly', 400);
      }

      if (!items || items.length === 0) {
        throw new AppError('At least one product is required', 400);
      }

      const embeddedItems = items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity ?? 1,
        priceAtSubscription: item.priceAtSubscription
      }));

      const subscription = await Subscription.create({
        userId,
        addressId: addressId || null,
        items: embeddedItems,
        frequency,
        deliveryDay,
        nextDeliveryDate: new Date(nextDeliveryDate),
        status: 'active',
        startDate: new Date(),
        discountRate: discountRate ?? 0.05,
        paymentMethod: paymentMethod ?? 'COD',
        notes
      });

      await subscription.populate('userId', 'name email phone');
      await subscription.populate('addressId');
      await subscription.populate('items.productId', 'name price thumbnail');

      res.status(201).json({
        success: true,
        message: 'Subscription created successfully',
        data: subscription
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all subscriptions with filters and pagination
   * GET /api/subscriptions
   */
  getAllSubscriptions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, userId, frequency } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (userId) {
        filter.userId = userId;
      }

      if (frequency) {
        filter.frequency = frequency;
      }

      const subscriptions = await Subscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'name email phone')
        .populate('addressId')
        .populate('items.productId', 'name price thumbnail');

      const total = await Subscription.countDocuments(filter);
      const pages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: subscriptions,
        pagination: {
          currentPage: pageNum,
          totalPages: pages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's subscriptions
   * GET /api/subscriptions/my-subscriptions
   */
  getMySubscriptions = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, status } = req.query;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { userId };

      if (status) {
        filter.status = status;
      }

      const subscriptions = await Subscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('addressId')
        .populate('items.productId', 'name price thumbnail');

      const total = await Subscription.countDocuments(filter);
      const pages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: subscriptions,
        pagination: {
          currentPage: pageNum,
          totalPages: pages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get subscription by ID
   * GET /api/subscriptions/:id
   */
  getSubscriptionById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const subscription = await Subscription.findById(id)
        .populate('userId', 'name email phone')
        .populate('addressId')
        .populate('items.productId', 'name price thumbnail description');

      if (!subscription) {
        throw new AppError('Subscription not found', 404);
      }

      // Check if user is owner or admin
      if (req.user?.role !== 'admin' && req.user?.id !== subscription.userId.toString()) {
        throw new AppError('You do not have permission to view this subscription', 403);
      }

      res.status(200).json({
        success: true,
        data: subscription
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update subscription
   * PATCH /api/subscriptions/:id
   */
  updateSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { addressId, frequency, deliveryDay, nextDeliveryDate, discountRate, paymentMethod, notes } = req.body;

      const subscription = await Subscription.findById(id);

      if (!subscription) {
        throw new AppError('Subscription not found', 404);
      }

      // Check if user is owner
      if (req.user?.id !== subscription.userId.toString()) {
        throw new AppError('You do not have permission to update this subscription', 403);
      }

      // Can only update active subscriptions
      if (subscription.status !== 'active') {
        throw new AppError(`Cannot update ${subscription.status} subscription`, 400);
      }

      const updateData: any = {};

      if (addressId) updateData.addressId = addressId;
      if (frequency && ['weekly', 'bi-weekly', 'monthly'].includes(frequency)) updateData.frequency = frequency;
      if (deliveryDay !== undefined) updateData.deliveryDay = deliveryDay;
      if (nextDeliveryDate) updateData.nextDeliveryDate = new Date(nextDeliveryDate);
      if (discountRate !== undefined) updateData.discountRate = discountRate;
      if (paymentMethod) updateData.paymentMethod = paymentMethod;
      if (notes) updateData.notes = notes;

      const updatedSubscription = await Subscription.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      })
        .populate('userId', 'name email phone')
        .populate('addressId')
        .populate('items.productId', 'name price thumbnail');

      res.status(200).json({
        success: true,
        message: 'Subscription updated successfully',
        data: updatedSubscription
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update subscription items
   * PATCH /api/subscriptions/:id/items
   */
  updateSubscriptionItems = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { items } = req.body;

      const subscription = await Subscription.findById(id);

      if (!subscription) {
        throw new AppError('Subscription not found', 404);
      }

      // Check if user is owner
      if (req.user?.id !== subscription.userId.toString()) {
        throw new AppError('You do not have permission to update this subscription', 403);
      }

      if (!items || items.length === 0) {
        throw new AppError('At least one product is required', 400);
      }

      const embeddedItems = items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity ?? 1,
        priceAtSubscription: item.priceAtSubscription
      }));

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        id,
        { $set: { items: embeddedItems } },
        { new: true, runValidators: true }
      ).populate('items.productId', 'name price thumbnail');

      res.status(200).json({
        success: true,
        message: 'Subscription items updated successfully',
        data: updatedSubscription
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Pause subscription
   * PATCH /api/subscriptions/:id/pause
   */
  pauseSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const subscription = await Subscription.findById(id);

      if (!subscription) {
        throw new AppError('Subscription not found', 404);
      }

      // Check if user is owner
      if (req.user?.id !== subscription.userId.toString()) {
        throw new AppError('You do not have permission to pause this subscription', 403);
      }

      if (subscription.status !== 'active') {
        throw new AppError('Only active subscriptions can be paused', 400);
      }

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        id,
        {
          status: 'paused',
          pausedAt: new Date()
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Subscription paused successfully',
        data: updatedSubscription
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Resume subscription
   * PATCH /api/subscriptions/:id/resume
   */
  resumeSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const subscription = await Subscription.findById(id);

      if (!subscription) {
        throw new AppError('Subscription not found', 404);
      }

      // Check if user is owner
      if (req.user?.id !== subscription.userId.toString()) {
        throw new AppError('You do not have permission to resume this subscription', 403);
      }

      if (subscription.status !== 'paused') {
        throw new AppError('Only paused subscriptions can be resumed', 400);
      }

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        id,
        {
          status: 'active',
          pausedAt: null
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Subscription resumed successfully',
        data: updatedSubscription
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel subscription
   * PATCH /api/subscriptions/:id/cancel
   */
  cancelSubscription = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const subscription = await Subscription.findById(id);

      if (!subscription) {
        throw new AppError('Subscription not found', 404);
      }

      // Check if user is owner
      if (req.user?.id !== subscription.userId.toString()) {
        throw new AppError('You do not have permission to cancel this subscription', 403);
      }

      if (subscription.status === 'cancelled') {
        throw new AppError('Subscription is already cancelled', 400);
      }

      const updatedSubscription = await Subscription.findByIdAndUpdate(
        id,
        {
          status: 'cancelled',
          cancelledAt: new Date(),
          endDate: new Date()
        },
        { new: true }
      );

      res.status(200).json({
        success: true,
        message: 'Subscription cancelled successfully',
        data: updatedSubscription
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get subscriptions that need delivery today
   * GET /api/subscriptions/deliveries/today
   */
  getDeliveriesForToday = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const subscriptions = await Subscription.find({
        status: 'active',
        nextDeliveryDate: {
          $gte: today,
          $lt: tomorrow
        }
      })
        .populate('userId', 'name email phone address')
        .populate('addressId')
        .populate('items.productId', 'name price thumbnail unit');

      res.status(200).json({
        success: true,
        data: subscriptions
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get subscription statistics
   * GET /api/subscriptions/stats/summary
   */
  getSubscriptionStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await Subscription.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      const frequencyStats = await Subscription.aggregate([
        { $match: { status: 'active' } },
        {
          $group: {
            _id: '$frequency',
            count: { $sum: 1 }
          }
        }
      ]);

      const totalSubscriptions = await Subscription.countDocuments();
      const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });

      res.status(200).json({
        success: true,
        data: {
          totalSubscriptions,
          activeSubscriptions,
          byStatus: stats,
          byFrequency: frequencyStats
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
