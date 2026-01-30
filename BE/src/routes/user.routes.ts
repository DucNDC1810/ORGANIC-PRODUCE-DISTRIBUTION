import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkPermission, checkRole } from '../middlewares/permission.middleware';
import { Permission, UserRole } from '../constants/roles';

const router = Router();
const userController = new UserController();

// ===== PUBLIC ROUTES =====

// Check if email/username exists (for registration validation)
router.get('/check-email', userController.checkEmailExists as any);
router.get('/check-username', userController.checkUsernameExists as any);

// ===== PROTECTED ROUTES (Requires Authentication) =====

// Get current user profile
router.get('/me', authenticate as any, userController.getCurrentUser as any);

// ===== ADMIN/MANAGER ROUTES (Requires specific permissions) =====

// User statistics (Admin/Manager only)
router.get(
  '/stats',
  authenticate as any,
  checkPermission(Permission.USER_MANAGE_ALL) as any,
  userController.getUserStats as any
);

// Search users (Admin/Manager only)
router.get(
  '/search',
  authenticate as any,
  checkPermission(Permission.USER_READ) as any,
  userController.searchUsers as any
);

// Bulk operations (Admin only)
router.post(
  '/bulk-update-status',
  authenticate as any,
  checkPermission(Permission.USER_MANAGE_ALL) as any,
  userController.bulkUpdateStatus as any
);

router.post(
  '/bulk-delete',
  authenticate as any,
  checkPermission(Permission.USER_MANAGE_ALL) as any,
  userController.bulkDeleteUsers as any
);

// ===== USER CRUD ROUTES =====

// Get all users (with pagination, search, filter)
router.get(
  '/',
  authenticate as any,
  checkPermission(Permission.USER_READ) as any,
  userController.getAllUsers as any
);

// Create new user (Admin only)
router.post(
  '/',
  authenticate as any,
  checkPermission(Permission.USER_CREATE) as any,
  userController.createUser as any
);

// Get user by ID
router.get(
  '/:id',
  authenticate as any,
  checkPermission(Permission.USER_READ) as any,
  userController.getUserById as any
);

// Update user
router.put(
  '/:id',
  authenticate as any,
  checkPermission(Permission.USER_UPDATE) as any,
  userController.updateUser as any
);

// Delete user (Admin only)
router.delete(
  '/:id',
  authenticate as any,
  checkPermission(Permission.USER_DELETE) as any,
  userController.deleteUser as any
);

// ===== USER STATUS MANAGEMENT =====

// Toggle user status
router.patch(
  '/:id/toggle-status',
  authenticate as any,
  checkPermission(Permission.USER_MANAGE_ALL) as any,
  userController.toggleUserStatus as any
);

// Activate user
router.patch(
  '/:id/activate',
  authenticate as any,
  checkPermission(Permission.USER_MANAGE_ALL) as any,
  userController.activateUser as any
);

// Deactivate user
router.patch(
  '/:id/deactivate',
  authenticate as any,
  checkPermission(Permission.USER_MANAGE_ALL) as any,
  userController.deactivateUser as any
);

// ===== USER ROLE MANAGEMENT =====

// Change user role (Admin only)
router.patch(
  '/:id/role',
  authenticate as any,
  checkRole(UserRole.ADMIN) as any,
  userController.changeUserRole as any
);

// ===== ADMIN ACTIONS =====

// Admin reset user password
router.patch(
  '/:id/reset-password',
  authenticate as any,
  checkRole(UserRole.ADMIN) as any,
  userController.adminResetPassword as any
);

// Admin verify user email
router.patch(
  '/:id/verify-email',
  authenticate as any,
  checkRole(UserRole.ADMIN) as any,
  userController.adminVerifyEmail as any
);

export default router;
