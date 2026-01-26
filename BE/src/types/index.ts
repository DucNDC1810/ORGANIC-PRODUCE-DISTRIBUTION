import { UserRole } from '../constants/roles';

/**
 * Express Request type augmentation
 * Merge custom user property with Express Request type
 */
declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
      email: string;
      isEmailVerified: boolean;
    }
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
