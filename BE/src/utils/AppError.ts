/**
 * Custom Application Error Class
 * Extended Error class với thêm thông tin về HTTP status code và errors chi tiết
 */

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  errors?: any[];
  errorType?: string;

  constructor(
    message: string, 
    statusCode: number = 500, 
    errors?: any[],
    errorType?: string
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    this.errorType = errorType;

    // Maintain proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Create a BadRequest error (400)
   */
  static badRequest(message: string, errors?: any[]): AppError {
    return new AppError(message, 400, errors, 'BAD_REQUEST');
  }

  /**
   * Create an Unauthorized error (401)
   */
  static unauthorized(message: string = 'Authentication required'): AppError {
    return new AppError(message, 401, undefined, 'UNAUTHORIZED');
  }

  /**
   * Create a Forbidden error (403)
   */
  static forbidden(message: string = 'Access denied'): AppError {
    return new AppError(message, 403, undefined, 'FORBIDDEN');
  }

  /**
   * Create a NotFound error (404)
   */
  static notFound(resource: string = 'Resource'): AppError {
    return new AppError(`${resource} not found`, 404, undefined, 'NOT_FOUND');
  }

  /**
   * Create a Conflict error (409)
   */
  static conflict(message: string): AppError {
    return new AppError(message, 409, undefined, 'CONFLICT');
  }

  /**
   * Create a Validation error (422)
   */
  static validation(message: string, errors?: any[]): AppError {
    return new AppError(message, 422, errors, 'VALIDATION_ERROR');
  }

  /**
   * Create an Internal Server error (500)
   */
  static internal(message: string = 'Internal server error'): AppError {
    return new AppError(message, 500, undefined, 'INTERNAL_ERROR');
  }

  /**
   * Create a Service Unavailable error (503)
   */
  static serviceUnavailable(message: string = 'Service temporarily unavailable'): AppError {
    return new AppError(message, 503, undefined, 'SERVICE_UNAVAILABLE');
  }
}

/**
 * Common Error Messages
 */
export const ErrorMessages = {
  // Authentication
  AUTH_REQUIRED: 'Authentication required. Please login to continue.',
  AUTH_INVALID_TOKEN: 'Invalid or expired token. Please login again.',
  AUTH_TOKEN_EXPIRED: 'Your session has expired. Please login again.',
  AUTH_INVALID_CREDENTIALS: 'Invalid email or password.',
  AUTH_EMAIL_NOT_VERIFIED: 'Please verify your email address to continue.',
  AUTH_ACCOUNT_INACTIVE: 'Your account has been deactivated.',
  
  // Authorization
  ACCESS_DENIED: 'Access denied. You do not have permission to perform this action.',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to access this resource.',
  ADMIN_ONLY: 'This action requires administrator privileges.',
  OWNER_ONLY: 'You can only access your own resources.',
  
  // Validation
  VALIDATION_FAILED: 'Validation failed. Please check your input.',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please provide a valid email address.',
  INVALID_PASSWORD: 'Password must be at least 6 characters long.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  
  // Resources
  USER_NOT_FOUND: 'User not found.',
  RESOURCE_NOT_FOUND: 'Requested resource not found.',
  
  // Database
  DB_CONNECTION_ERROR: 'Database connection error. Please try again later.',
  DUPLICATE_ENTRY: 'This entry already exists.',
  
  // General
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service is temporarily unavailable. Please try again later.',
  INVALID_REQUEST: 'Invalid request format.',
};
