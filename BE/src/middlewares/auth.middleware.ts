import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.model';
import { AppError } from '../utils/AppError';
import { UserRole } from '../constants/roles';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: UserRole;
    email: string;
    isEmailVerified: boolean;
  };
}

/**
 * Authentication Middleware
 * Xác thực token JWT và gắn thông tin user vào request
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided. Please login to continue.', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Invalid token format', 401);
    }

    // Verify token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, jwtSecret) as {
      id: string;
    };

    if (!decoded.id) {
      throw new AppError('Invalid token payload', 401);
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      throw new AppError('User not found. Token may be invalid.', 401);
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AppError('Your account has been deactivated. Please contact support.', 403);
    }

    // Attach user info to request
    req.user = {
      id: user._id.toString(),
      role: user.role as UserRole,
      email: user.email,
      isEmailVerified: user.isEmailVerified
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Token has expired. Please login again.', 401));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Invalid token. Please login again.', 401));
    } else if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError('Authentication failed', 401));
    }
  }
};

/**
 * Authorization Middleware - Check if user has required role
 * Kiểm tra xem user có role phù hợp không
 * 
 * @param roles - Mảng các role được phép truy cập
 * @example authorize(UserRole.ADMIN, UserRole.MANAGER)
 */
export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError('User not authenticated', 401));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(new AppError(
        `Access denied. Required roles: ${roles.join(', ')}. Your role: ${req.user.role}`,
        403
      ));
      return;
    }

    next();
  };
};

/**
 * Require Email Verification Middleware
 * Yêu cầu user phải xác thực email
 */
export const requireEmailVerified = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new AppError('User not authenticated', 401));
    return;
  }

  if (!req.user.isEmailVerified) {
    next(new AppError(
      'Please verify your email address to access this resource. Check your inbox for verification email.',
      403
    ));
    return;
  }

  next();
};

/**
 * Optional Authentication Middleware
 * Xác thực token nếu có, nhưng không bắt buộc
 * Hữu ích cho các endpoint có thể truy cập cả khi đã login và chưa login
 */
export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token, continue without user info
      next();
      return;
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, jwtSecret) as { id: string };
    const user = await User.findById(decoded.id).select('-password');
    
    if (user && user.isActive) {
      req.user = {
        id: user._id.toString(),
        role: user.role as UserRole,
        email: user.email,
        isEmailVerified: user.isEmailVerified
      };
    }

    next();
  } catch (error) {
    // If there's an error, just continue without user info
    next();
  }
};

/**
 * Check if user is account owner or has admin role
 * Kiểm tra user có phải là chủ tài khoản hoặc admin không
 */
export const isOwnerOrAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new AppError('User not authenticated', 401));
    return;
  }

  const userId = req.params.id || req.params.userId;
  
  if (req.user.id === userId || req.user.role === UserRole.ADMIN) {
    next();
  } else {
    next(new AppError('You can only access your own resources', 403));
  }
};
