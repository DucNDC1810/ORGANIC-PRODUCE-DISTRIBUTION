import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { AppError } from '../utils/AppError';
import { 
  Permission, 
  UserRole, 
  hasPermission, 
  hasAnyPermission, 
  hasAllPermissions,
  isRoleHigherThan 
} from '../constants/roles';

/**
 * Permission Middleware
 * Kiểm tra xem user có quyền cụ thể không
 * 
 * @param permission - Quyền cần kiểm tra
 * @example checkPermission(Permission.PRODUCT_CREATE)
 */
export const checkPermission = (permission: Permission) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('User not authenticated', 401));
      return;
    }

    if (!hasPermission(req.user.role, permission)) {
      next(new AppError(
        `Access denied. You don't have permission: ${permission}`,
        403
      ));
      return;
    }

    next();
  };
};

/**
 * Check if user has ANY of the specified permissions
 * Kiểm tra user có ít nhất một trong các quyền được chỉ định
 * 
 * @param permissions - Mảng các quyền cần kiểm tra
 * @example checkAnyPermission([Permission.PRODUCT_CREATE, Permission.PRODUCT_UPDATE])
 */
export const checkAnyPermission = (...permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('User not authenticated', 401));
      return;
    }

    if (!hasAnyPermission(req.user.role, permissions)) {
      next(new AppError(
        `Access denied. Required at least one of: ${permissions.join(', ')}`,
        403
      ));
      return;
    }

    next();
  };
};

/**
 * Check if user has ALL of the specified permissions
 * Kiểm tra user có tất cả các quyền được chỉ định
 * 
 * @param permissions - Mảng các quyền cần kiểm tra
 * @example checkAllPermissions([Permission.USER_READ, Permission.USER_UPDATE])
 */
export const checkAllPermissions = (...permissions: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('User not authenticated', 401));
      return;
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      next(new AppError(
        `Access denied. Required all of: ${permissions.join(', ')}`,
        403
      ));
      return;
    }

    next();
  };
};

/**
 * Check if user's role is higher than specified role
 * Kiểm tra role của user có cao hơn role được chỉ định không
 * 
 * @param role - Role để so sánh
 * @example checkRoleHigherThan(UserRole.CUSTOMER)
 */
export const checkRoleHigherThan = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('User not authenticated', 401));
      return;
    }

    if (!isRoleHigherThan(req.user.role, role)) {
      next(new AppError(
        `Access denied. Your role must be higher than: ${role}`,
        403
      ));
      return;
    }

    next();
  };
};

/**
 * Admin Only Middleware
 * Chỉ cho phép admin truy cập
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new AppError('User not authenticated', 401));
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    next(new AppError('Access denied. Admin only.', 403));
    return;
  }

  next();
};

/**
 * Manager or Higher Middleware
 * Cho phép manager hoặc admin truy cập
 */
export const managerOrHigher = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (!req.user) {
    next(new AppError('User not authenticated', 401));
    return;
  }

  const allowedRoles = [UserRole.ADMIN, UserRole.MANAGER];
  
  if (!allowedRoles.includes(req.user.role)) {
    next(new AppError('Access denied. Manager or Admin role required.', 403));
    return;
  }

  next();
};

/**
 * Check Resource Ownership
 * Kiểm tra user có phải là chủ sở hữu resource hoặc có quyền quản lý không
 * 
 * @param getResourceOwnerId - Function để lấy owner ID từ resource
 * @param allowedRoles - Các role được phép truy cập ngoài owner
 */
export const checkResourceOwnership = (
  getResourceOwnerId: (req: AuthRequest) => Promise<string> | string,
  allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.MANAGER]
) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        next(new AppError('User not authenticated', 401));
        return;
      }

      // Check if user has privileged role
      if (allowedRoles.includes(req.user.role)) {
        next();
        return;
      }

      // Check ownership
      const ownerId = await getResourceOwnerId(req);
      
      if (req.user.id !== ownerId) {
        next(new AppError('Access denied. You can only access your own resources.', 403));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate Limit by Role
 * Giới hạn số lượng request theo role
 * Higher roles have more generous limits
 */
export const roleLimits: Record<UserRole, { requests: number; window: number }> = {
  [UserRole.ADMIN]: { requests: 1000, window: 60000 },      // 1000 requests per minute
  [UserRole.MANAGER]: { requests: 500, window: 60000 },     // 500 requests per minute
  [UserRole.FARMER]: { requests: 200, window: 60000 },      // 200 requests per minute
  [UserRole.SHIPPER]: { requests: 200, window: 60000 },     // 200 requests per minute
  [UserRole.CUSTOMER]: { requests: 100, window: 60000 },    // 100 requests per minute
  [UserRole.USER]: { requests: 50, window: 60000 },         // 50 requests per minute
};

/**
 * Validate Resource Access
 * Middleware helper để validate nhiều điều kiện access
 */
export interface AccessValidation {
  requireAuth?: boolean;
  requireEmailVerified?: boolean;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  allowOwner?: boolean;
  ownerIdParam?: string; // Name of param that contains owner ID (e.g., 'userId', 'id')
}

export const validateAccess = (config: AccessValidation) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Check authentication
      if (config.requireAuth && !req.user) {
        next(new AppError('Authentication required', 401));
        return;
      }

      if (!req.user) {
        next();
        return;
      }

      // Check email verification
      if (config.requireEmailVerified && !req.user.isEmailVerified) {
        next(new AppError('Email verification required', 403));
        return;
      }

      // Check ownership
      if (config.allowOwner && config.ownerIdParam) {
        const ownerId = req.params[config.ownerIdParam];
        if (req.user.id === ownerId) {
          next();
          return;
        }
      }

      // Check roles
      if (config.requiredRoles && config.requiredRoles.length > 0) {
        if (!config.requiredRoles.includes(req.user.role)) {
          next(new AppError(
            `Access denied. Required roles: ${config.requiredRoles.join(', ')}`,
            403
          ));
          return;
        }
      }

      // Check permissions
      if (config.requiredPermissions && config.requiredPermissions.length > 0) {
        const hasRequiredPermissions = hasAllPermissions(req.user.role, config.requiredPermissions);
        if (!hasRequiredPermissions) {
          next(new AppError(
            `Access denied. Required permissions: ${config.requiredPermissions.join(', ')}`,
            403
          ));
          return;
        }
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
