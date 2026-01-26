/**
 * Middleware Index
 * Export tất cả các middleware để dễ dàng import
 */

// Authentication & Authorization
export {
  authenticate,
  authorize,
  requireEmailVerified,
  optionalAuth,
  isOwnerOrAdmin,
  AuthRequest
} from './auth.middleware';

// Permission-based Access Control
export {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkRoleHigherThan,
  adminOnly,
  managerOrHigher,
  checkResourceOwnership,
  validateAccess,
  roleLimits
} from './permission.middleware';

// Error Handling
export {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  handleValidationErrors,
  throwAuthorizationError,
  throwAuthenticationError,
  throwNotFoundError,
  throwBadRequestError
} from './errorHandler';
