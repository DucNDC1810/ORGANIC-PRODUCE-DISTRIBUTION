import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/permission.middleware';
import { UserRole } from '../constants/roles';

const router = Router();
const dashboardController = new DashboardController();

// GET /api/dashboard/stats — Admin & Manager only
router.get(
  '/stats',
  authenticate as any,
  checkRole(UserRole.ADMIN, UserRole.MANAGER) as any,
  dashboardController.getDashboardStats as any
);

export default router;
