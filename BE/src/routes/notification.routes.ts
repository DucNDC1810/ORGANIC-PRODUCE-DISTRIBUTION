import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/permission.middleware';
import { UserRole } from '../constants/roles';

const router = Router();
const ctrl = new NotificationController();

// All routes require admin auth
router.use(authenticate as any, checkRole(UserRole.ADMIN) as any);

router.get('/', ctrl.getAll as any);
router.get('/unread-count', ctrl.getUnreadCount as any);
router.patch('/read-all', ctrl.markAllRead as any);
router.patch('/:id/read', ctrl.markRead as any);
router.delete('/:id', ctrl.deleteOne as any);

export default router;
