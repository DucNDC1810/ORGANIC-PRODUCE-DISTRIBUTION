import { Request, Response, NextFunction } from 'express';
import { Notification } from '../models/Notification.model';

export class NotificationController {
  /** GET /api/notifications — admin: list all notifications (newest first) */
  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(50);
      res.status(200).json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  };

  /** GET /api/notifications/unread-count */
  getUnreadCount = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const count = await Notification.countDocuments({ isRead: false });
      res.status(200).json({ success: true, data: { count } });
    } catch (error) {
      next(error);
    }
  };

  /** PATCH /api/notifications/:id/read — mark one as read */
  markRead = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  /** PATCH /api/notifications/read-all — mark all as read */
  markAllRead = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await Notification.updateMany({ isRead: false }, { isRead: true });
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };

  /** DELETE /api/notifications/:id */
  deleteOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await Notification.findByIdAndDelete(req.params.id);
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  };
}
