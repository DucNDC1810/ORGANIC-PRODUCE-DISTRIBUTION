import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Error as MongooseError } from 'mongoose';

/**
 * Custom Error Handler Middleware
 * Xử lý tất cả các loại lỗi trong ứng dụng
 */

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging (in production, use proper logging service)
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // AppError - Custom application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
    return;
  }

  // JWT Errors
  if (err instanceof TokenExpiredError) {
    res.status(401).json({
      success: false,
      message: 'Your session has expired. Please login again.',
      statusCode: 401,
      errorType: 'TOKEN_EXPIRED'
    });
    return;
  }

  if (err instanceof JsonWebTokenError) {
    res.status(401).json({
      success: false,
      message: 'Invalid authentication token. Please login again.',
      statusCode: 401,
      errorType: 'INVALID_TOKEN'
    });
    return;
  }

  // Mongoose Validation Error
  if (err instanceof MongooseError.ValidationError) {
    const errors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));

    res.status(400).json({
      success: false,
      message: 'Validation failed',
      statusCode: 400,
      errorType: 'VALIDATION_ERROR',
      errors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
    return;
  }

  // Mongoose Cast Error (Invalid ID)
  if (err instanceof MongooseError.CastError) {
    res.status(400).json({
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      statusCode: 400,
      errorType: 'INVALID_ID'
    });
    return;
  }

  // Mongoose Duplicate Key Error
  if (err.name === 'MongoServerError' && (err as any).code === 11000) {
    const field = Object.keys((err as any).keyPattern)[0];
    res.status(409).json({
      success: false,
      message: `${field} already exists. Please use a different value.`,
      statusCode: 409,
      errorType: 'DUPLICATE_KEY',
      field
    });
    return;
  }

  // Database Connection Error
  if (err.name === 'MongoNetworkError' || err.name === 'MongooseServerSelectionError') {
    res.status(503).json({
      success: false,
      message: 'Database connection error. Please try again later.',
      statusCode: 503,
      errorType: 'DATABASE_ERROR'
    });
    return;
  }

  // Syntax Error (usually from malformed JSON)
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body',
      statusCode: 400,
      errorType: 'SYNTAX_ERROR'
    });
    return;
  }

  // Default Error (500 Internal Server Error)
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.'
      : err.message || 'Internal Server Error',
    statusCode: 500,
    errorType: 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    })
  });
};

/**
 * 404 Not Found Handler
 * Xử lý khi không tìm thấy route
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    `Cannot ${req.method} ${req.originalUrl} - Route not found`,
    404
  );
  next(error);
};

/**
 * Async Handler Wrapper
 * Bọc async function để tự động catch errors
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validation Error Handler
 * Xử lý lỗi validation từ express-validator hoặc custom validation
 */
export const handleValidationErrors = (errors: any[]): never => {
  const formattedErrors = errors.map(err => ({
    field: err.param || err.field,
    message: err.msg || err.message,
    value: err.value
  }));

  throw new AppError('Validation failed', 400, formattedErrors);
};

/**
 * Authorization Error
 * Helper để throw lỗi authorization
 */
export const throwAuthorizationError = (message: string = 'Access denied'): never => {
  throw new AppError(message, 403);
};

/**
 * Authentication Error
 * Helper để throw lỗi authentication
 */
export const throwAuthenticationError = (message: string = 'Authentication required'): never => {
  throw new AppError(message, 401);
};

/**
 * Not Found Error
 * Helper để throw lỗi not found
 */
export const throwNotFoundError = (resource: string = 'Resource'): never => {
  throw new AppError(`${resource} not found`, 404);
};

/**
 * Bad Request Error
 * Helper để throw lỗi bad request
 */
export const throwBadRequestError = (message: string): never => {
  throw new AppError(message, 400);
};
