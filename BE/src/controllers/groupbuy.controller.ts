import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { GroupBuyEvent } from '../models/GroupBuyEvent.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class GroupBuyEventController {
  /**
   * Create a new group buy event
   * POST /api/group-buy-events
   */
  createGroupBuyEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { productId, voucherId, targetQuantity, startTime, endTime, description, discountPercentage, pricePerUnit } =
        req.body;

      if (!productId || !targetQuantity || !startTime || !endTime) {
        throw new AppError('Product ID, target quantity, start time, and end time are required', 400);
      }

      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        throw new AppError('Start time must be before end time', 400);
      }

      if (start < new Date()) {
        throw new AppError('Start time must be in the future', 400);
      }

      const groupBuyEvent = await GroupBuyEvent.create({
        productId,
        voucherId: voucherId || null,
        targetQuantity,
        startTime: start,
        endTime: end,
        status: 'open',
        description,
        discountPercentage,
        pricePerUnit,
        currentQuantity: 0,
        participantCount: 0
      });

      await groupBuyEvent.populate('productId', 'name price thumbnail');

      res.status(201).json({
        success: true,
        message: 'Group buy event created successfully',
        data: groupBuyEvent
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all group buy events with filters and pagination
   * GET /api/group-buy-events
   */
  getAllGroupBuyEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, status, productId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};

      if (status) {
        filter.status = status;
      }

      if (productId) {
        filter.productId = productId;
      }

      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const events = await GroupBuyEvent.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('productId', 'name price thumbnail')
        .populate('voucherId');

      const total = await GroupBuyEvent.countDocuments(filter);
      const pages = Math.ceil(total / limitNum);

      // Add progress percentage to each event
      const eventsWithProgress = events.map((event) => ({
        ...event.toObject(),
        progress: Math.round((event.currentQuantity / event.targetQuantity) * 100)
      }));

      res.status(200).json({
        success: true,
        data: eventsWithProgress,
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
   * Get active group buy events
   * GET /api/group-buy-events/active
   */
  getActiveGroupBuyEvents = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const now = new Date();

      const events = await GroupBuyEvent.find({
        status: 'open',
        startTime: { $lte: now },
        endTime: { $gt: now }
      })
        .sort({ endTime: 1 })
        .skip(skip)
        .limit(limitNum)
        .populate('productId', 'name price thumbnail')
        .populate('voucherId');

      const total = await GroupBuyEvent.countDocuments({
        status: 'open',
        startTime: { $lte: now },
        endTime: { $gt: now }
      });
      const pages = Math.ceil(total / limitNum);

      // Add progress percentage and time remaining
      const eventsWithInfo = events.map((event) => {
        const timeRemaining = event.endTime.getTime() - now.getTime();
        return {
          ...event.toObject(),
          progress: Math.round((event.currentQuantity / event.targetQuantity) * 100),
          timeRemaining: Math.max(0, timeRemaining),
          timeRemainingText: this.getTimeRemainingText(timeRemaining)
        };
      });

      res.status(200).json({
        success: true,
        data: eventsWithInfo,
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
   * Get group buy event by ID
   * GET /api/group-buy-events/:id
   */
  getGroupBuyEventById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const event = await GroupBuyEvent.findById(id)
        .populate('productId', 'name price description thumbnail stock')
        .populate('voucherId')
        .populate('participants', 'name email phone');

      if (!event) {
        throw new AppError('Group buy event not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          ...event.toObject(),
          progress: Math.round((event.currentQuantity / event.targetQuantity) * 100)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Join group buy event
   * POST /api/group-buy-events/:id/join
   */
  joinGroupBuyEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!quantity || quantity < 1) {
        throw new AppError('Valid quantity is required', 400);
      }

      const event = await GroupBuyEvent.findById(id).populate('productId');

      if (!event) {
        throw new AppError('Group buy event not found', 404);
      }

      const now = new Date();

      // Check if event is still open
      if (event.status !== 'open') {
        throw new AppError(`Group buy event is ${event.status}`, 400);
      }

      if (now < event.startTime) {
        throw new AppError('Group buy event has not started yet', 400);
      }

      if (now > event.endTime) {
        throw new AppError('Group buy event has ended', 400);
      }

      // Check if would exceed target quantity
      if (event.currentQuantity + quantity > event.targetQuantity) {
        throw new AppError(
          `Quantity exceeds target. Available: ${event.targetQuantity - event.currentQuantity}`,
          400
        );
      }

      // Check if user already joined
      const userObjId = new mongoose.Types.ObjectId(userId);
      const hasJoined = event.participants?.some(p => p.toString() === userObjId.toString());

      if (!hasJoined) {
        // Add user to participants array
        if (!event.participants) {
          event.participants = [];
        }
        event.participants.push(userObjId);
        event.participantCount += 1;
      }

      // Update current quantity
      event.currentQuantity += quantity;

      // Check if target reached
      if (event.currentQuantity >= event.targetQuantity) {
        event.status = 'success';
      }

      await event.save();

      const updatedEvent = await GroupBuyEvent.findById(id)
        .populate('productId', 'name price thumbnail')
        .populate('voucherId');

      res.status(200).json({
        success: true,
        message: 'Joined group buy event successfully',
        data: {
          ...updatedEvent?.toObject(),
          progress: Math.round(((updatedEvent?.currentQuantity || 0) / (updatedEvent?.targetQuantity || 1)) * 100)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update participation quantity
   * PATCH /api/group-buy-events/:id/update-quantity
   */
  updateParticipationQuantity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (!quantity || quantity < 1) {
        throw new AppError('Valid quantity is required', 400);
      }

      const event = await GroupBuyEvent.findById(id);

      if (!event) {
        throw new AppError('Group buy event not found', 404);
      }

      const userObjId = new mongoose.Types.ObjectId(userId);
      const hasJoined = event.participants?.some(p => p.toString() === userObjId.toString());

      if (!hasJoined) {
        throw new AppError('You are not a participant in this group buy', 404);
      }

      // Check if would exceed target quantity
      if (event.currentQuantity + quantity > event.targetQuantity) {
        throw new AppError(
          `Quantity exceeds target. Available: ${event.targetQuantity - event.currentQuantity}`,
          400
        );
      }

      // Update event current quantity
      event.currentQuantity = quantity;

      // Check if target reached
      if (event.currentQuantity >= event.targetQuantity) {
        event.status = 'success';
      }

      await event.save();

      const updatedEvent = await GroupBuyEvent.findById(id)
        .populate('productId', 'name price thumbnail')
        .populate('voucherId');

      res.status(200).json({
        success: true,
        message: 'Quantity updated successfully',
        data: {
          ...updatedEvent?.toObject(),
          progress: Math.round(((updatedEvent?.currentQuantity || 0) / (updatedEvent?.targetQuantity || 1)) * 100)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Leave group buy event
   * POST /api/group-buy-events/:id/leave
   */
  leaveGroupBuyEvent = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const event = await GroupBuyEvent.findById(id);

      if (!event) {
        throw new AppError('Group buy event not found', 404);
      }

      const userObjId = new mongoose.Types.ObjectId(userId);
      const hasJoined = event.participants?.some(p => p.toString() === userObjId.toString());

      if (!hasJoined) {
        throw new AppError('You are not a participant in this group buy', 404);
      }

      // Can only leave if event hasn't finished
      if (event.status !== 'open') {
        throw new AppError(`Cannot leave ${event.status} group buy event`, 400);
      }

      // Remove user from participants array
      event.participants = event.participants?.filter((p) => p.toString() !== userObjId.toString()) || [];
      event.participantCount -= 1;

      await event.save();

      const updatedEvent = await GroupBuyEvent.findById(id)
        .populate('productId', 'name price thumbnail')
        .populate('voucherId');

      res.status(200).json({
        success: true,
        message: 'Left group buy event successfully',
        data: {
          ...updatedEvent?.toObject(),
          progress: Math.round(((updatedEvent?.currentQuantity || 0) / (updatedEvent?.targetQuantity || 1)) * 100)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's group buy participations
   * GET /api/group-buy-events/my-participations
   */
  getMyParticipations = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10 } = req.query;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const userObjId = new mongoose.Types.ObjectId(userId);

      const participations = await GroupBuyEvent.find({
        participants: userObjId
      })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('productId', 'name price thumbnail')
        .populate('voucherId');

      const total = await GroupBuyEvent.countDocuments({
        participants: userObjId
      });
      const pages = Math.ceil(total / limitNum);

      const eventsWithProgress = participations.map((event) => ({
        ...event.toObject(),
        progress: Math.round((event.currentQuantity / event.targetQuantity) * 100)
      }));

      res.status(200).json({
        success: true,
        data: eventsWithProgress,
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
   * Update event status manually
   * PATCH /api/group-buy-events/:id/status
   */
  updateEventStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        throw new AppError('Status is required', 400);
      }

      const validStatuses = ['open', 'closed', 'success', 'failed'];
      if (!validStatuses.includes(status)) {
        throw new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400);
      }

      const event = await GroupBuyEvent.findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
        .populate('productId', 'name price thumbnail')
        .populate('voucherId');

      if (!event) {
        throw new AppError('Group buy event not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Event status updated successfully',
        data: {
          ...event.toObject(),
          progress: Math.round((event.currentQuantity / event.targetQuantity) * 100)
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get group buy statistics
   * GET /api/group-buy-events/stats/summary
   */
  getGroupBuyStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await GroupBuyEvent.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgProgress: {
              $avg: {
                $multiply: [{ $divide: ['$currentQuantity', '$targetQuantity'] }, 100]
              }
            }
          }
        }
      ]);

      const totalEvents = await GroupBuyEvent.countDocuments();
      const successfulEvents = await GroupBuyEvent.countDocuments({ status: 'success' });
      const totalParticipants = await GroupBuyEvent.aggregate([
        { $group: { _id: null, count: { $sum: '$participantCount' } } }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalEvents,
          successfulEvents,
          totalParticipants: totalParticipants[0]?.count || 0,
          byStatus: stats
        }
      });
    } catch (error) {
      next(error);
    }
  };

  // Helper method to format time remaining
  private getTimeRemainingText(ms: number): string {
    if (ms <= 0) return 'Ended';

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d remaining`;
    if (hours > 0) return `${hours}h remaining`;
    if (minutes > 0) return `${minutes}m remaining`;
    return `${seconds}s remaining`;
  }
}
