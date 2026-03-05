import axios from 'axios';

// ========================
// AXIOS INSTANCE & CONFIG
// ========================

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request Interceptor - Add token to headers
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor - Handle responses and errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle token expiration or authentication errors
    if (error.response?.status === 401) {
      const errorMessage = error.response?.data?.message || 'Authentication failed';
      
      // Check if it's a token expiration error
      if (errorMessage.includes('expired') || errorMessage.includes('Invalid token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Show toast notification before redirect
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          // Import toast dynamically to avoid circular dependency
          import('sonner').then(({ toast }) => {
            toast.error('Your session has expired. Please login again.');
          });
          
          // Delay redirect to show toast
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      } else if (window.location.pathname !== '/login') {
        // For other 401 errors (wrong credentials, etc.)
        window.location.href = '/login';
      }
    }
    
    // Handle forbidden errors (403)
    if (error.response?.status === 403) {
      import('sonner').then(({ toast }) => {
        toast.error(error.response?.data?.message || 'Access denied');
      });
    }
    
    return Promise.reject(error);
  }
);

// ========================
// TYPES & INTERFACES
// ========================

export interface User {
  _id: string;
  email: string;
  name: string;
  username: string;
  role: 'admin' | 'manager' | 'customer' | 'user' | 'shipper' | 'farmer';
  phone?: string;
  address?: string;
  avatar?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other';
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalUsers: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface UsersResponse {
  success: boolean;
  data: User[];
  pagination: PaginationInfo;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  usersByRole: Record<string, number>;
  newUsersThisMonth: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  username: string;
  password: string;
  role?: 'customer' | 'farmer' | 'admin';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token: string;
  };
}

// ========================
// AUTH API ENDPOINTS
// ========================

export const authAPI = {
  /**
   * Login user
   * POST /api/auth/login
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response: any = await api.post('/auth/login', credentials);
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response;
  },

  /**
   * Register new user
   * POST /api/auth/register
   * Note: Token is not stored - user must verify email before logging in
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response: any = await api.post('/auth/register', userData);
    // Don't store token or user - they need to verify email first
    return response;
  },

  /**
   * Logout user
   */
  logout: (): void => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get current logged in user
   */
  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Get authentication token
   */
  getToken: (): string | null => {
    return localStorage.getItem('token');
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

// ========================
// USER API ENDPOINTS
// ========================

export const userAPI = {
  /**
   * Get all users with pagination, search and filters
   * GET /api/users
   */
  getAllUsers: async (params?: UserQueryParams): Promise<UsersResponse> => {
    const queryParams = new URLSearchParams();
    if (params) {
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.role) queryParams.append('role', params.role);
      if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params.isEmailVerified !== undefined) queryParams.append('isEmailVerified', params.isEmailVerified.toString());
      if (params.sortBy) queryParams.append('sortBy', params.sortBy);
      if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    }
    const response: any = await api.get(`/users?${queryParams.toString()}`);
    return response;
  },

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById: async (id: string): Promise<User> => {
    const response: any = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   * POST /api/users
   */
  createUser: async (data: Partial<User> & { password?: string }): Promise<User> => {
    const response: any = await api.post('/users', data);
    return response.data;
  },

  /**
   * Update user
   * PUT /api/users/:id
   */
  updateUser: async (id: string, data: Partial<User>): Promise<User> => {
    const response: any = await api.put(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  /**
   * Get user statistics
   * GET /api/users/stats
   */
  getUserStats: async (): Promise<UserStats> => {
    const response: any = await api.get('/users/stats');
    return response.data;
  },

  /**
   * Search users
   * GET /api/users/search
   */
  searchUsers: async (keyword: string, limit?: number): Promise<User[]> => {
    const params = new URLSearchParams({ keyword });
    if (limit) params.append('limit', limit.toString());
    const response: any = await api.get(`/users/search?${params.toString()}`);
    return response.data;
  },

  /**
   * Toggle user active status
   * PATCH /api/users/:id/toggle-status
   */
  toggleUserStatus: async (id: string): Promise<User> => {
    const response: any = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
  },

  /**
   * Activate user
   * PATCH /api/users/:id/activate
   */
  activateUser: async (id: string): Promise<User> => {
    const response: any = await api.patch(`/users/${id}/activate`);
    return response.data;
  },

  /**
   * Deactivate user
   * PATCH /api/users/:id/deactivate
   */
  deactivateUser: async (id: string): Promise<User> => {
    const response: any = await api.patch(`/users/${id}/deactivate`);
    return response.data;
  },

  /**
   * Change user role
   * PATCH /api/users/:id/role
   */
  changeUserRole: async (id: string, role: string): Promise<User> => {
    const response: any = await api.patch(`/users/${id}/role`, { role });
    return response.data;
  },

  /**
   * Admin reset user password
   * PATCH /api/users/:id/reset-password
   */
  adminResetPassword: async (id: string, newPassword: string): Promise<User> => {
    const response: any = await api.patch(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  /**
   * Admin verify user email
   * PATCH /api/users/:id/verify-email
   */
  adminVerifyEmail: async (id: string): Promise<User> => {
    const response: any = await api.patch(`/users/${id}/verify-email`);
    return response.data;
  },

  /**
   * Bulk update users status
   * POST /api/users/bulk-update-status
   */
  bulkUpdateStatus: async (userIds: string[], isActive: boolean): Promise<{ modifiedCount: number }> => {
    const response: any = await api.post('/users/bulk-update-status', { userIds, isActive });
    return response.data;
  },

  /**
   * Bulk delete users
   * POST /api/users/bulk-delete
   */
  bulkDeleteUsers: async (userIds: string[]): Promise<{ deletedCount: number }> => {
    const response: any = await api.post('/users/bulk-delete', { userIds });
    return response.data;
  },

  /**
   * Check if email exists
   * GET /api/users/check-email
   */
  checkEmailExists: async (email: string): Promise<boolean> => {
    const response: any = await api.get(`/users/check-email?email=${encodeURIComponent(email)}`);
    return response.data.exists;
  },

  /**
   * Check if username exists
   * GET /api/users/check-username
   */
  checkUsernameExists: async (username: string): Promise<boolean> => {
    const response: any = await api.get(`/users/check-username?username=${encodeURIComponent(username)}`);
    return response.data.exists;
  },
};

// ========================
// PRODUCT API ENDPOINTS (Example)
// ========================

export const productAPI = {
  /**
   * Get all products
   * GET /api/products
   */
  getAllProducts: async (): Promise<any[]> => {
    const response = await api.get('/products');
    return response.data;
  },

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  getProductById: async (id: string): Promise<any> => {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  /**
   * Create product
   * POST /api/products
   */
  createProduct: async (data: any): Promise<any> => {
    const response = await api.post('/products', data);
    return response.data;
  },

  /**
   * Update product
   * PUT /api/products/:id
   */
  updateProduct: async (id: string, data: any): Promise<any> => {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  /**
   * Delete product
   * DELETE /api/products/:id
   */
  deleteProduct: async (id: string): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// ========================
// CART API ENDPOINTS
// ========================

export interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    thumbnail?: string;
    stock: number;
    isActive: boolean;
  };
  quantity: number;
  price: number;
  name: string;
  image: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartData {
  productId: string;
  quantity?: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export interface SyncCartData {
  items: {
    product: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
  }[];
}

export const cartAPI = {
  /**
   * Get current user's cart
   * GET /api/cart
   */
  getCart: async (): Promise<Cart> => {
    const response: any = await api.get('/cart');
    return response.data;
  },

  /**
   * Add item to cart
   * POST /api/cart/add
   */
  addToCart: async (data: AddToCartData): Promise<Cart> => {
    const response: any = await api.post('/cart/add', data);
    return response.data;
  },

  /**
   * Update cart item quantity
   * PUT /api/cart/item/:productId
   */
  updateCartItem: async (productId: string, data: UpdateCartItemData): Promise<Cart> => {
    const response: any = await api.put(`/cart/item/${productId}`, data);
    return response.data;
  },

  /**
   * Remove item from cart
   * DELETE /api/cart/item/:productId
   */
  removeFromCart: async (productId: string): Promise<Cart> => {
    const response: any = await api.delete(`/cart/item/${productId}`);
    return response.data;
  },

  /**
   * Clear entire cart
   * DELETE /api/cart/clear
   */
  clearCart: async (): Promise<Cart> => {
    const response: any = await api.delete('/cart/clear');
    return response.data;
  },

  /**
   * Sync local cart with database
   * POST /api/cart/sync
   */
  syncCart: async (data: SyncCartData): Promise<Cart> => {
    const response: any = await api.post('/cart/sync', data);
    return response.data;
  },
};

// ========================
// ORDER API ENDPOINTS
// ========================

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  userId: string | { _id: string; name: string; email: string; phone?: string; avatar?: string };
  addressId?: string | Record<string, any>;
  voucherId?: string;
  groupBuyId?: string;
  subscriptionId?: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: OrderItem[];
  deliveryInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    type?: 'delivery' | 'pickup';
  };
  pickupLocation?: { name?: string; address?: string };
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'unpaid';
  shippingCost?: number;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: string;
  confirmedAt?: string;
  confirmedBy?: string | { _id: string; name: string; email: string };
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

export interface GetAllOrdersParams {
  page?: number;
  limit?: number;
  status?: string;
  paymentStatus?: string;
  userId?: string;
  /** Search by customer name or email */
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkConfirmResult {
  success: boolean;
  message: string;
  data: { requested: number; confirmed: number; skipped: number };
}

export interface PendingSummary {
  success: boolean;
  data: { totalPending: number; pendingToday: number };
}

export const orderAPI = {
  /**
   * Get all orders with filters (manager/admin)
   * GET /api/orders
   */
  getAllOrders: async (params: GetAllOrdersParams = {}): Promise<OrdersResponse> => {
    const response: any = await api.get('/orders', { params });
    return response;
  },

  /**
   * Get my orders (authenticated user)
   * GET /api/orders/my-orders
   */
  getMyOrders: async (page = 1, limit = 10, status?: string): Promise<OrdersResponse> => {
    const response: any = await api.get('/orders/my-orders', {
      params: { page, limit, status },
    });
    return response;
  },

  /**
   * Get single order by ID
   * GET /api/orders/:id
   */
  getOrderById: async (id: string): Promise<OrderResponse> => {
    const response: any = await api.get(`/orders/${id}`);
    return response;
  },

  /**
   * Confirm a pending order (manager/admin)
   * PATCH /api/orders/:id/confirm
   */
  confirmOrder: async (id: string): Promise<OrderResponse> => {
    const response: any = await api.patch(`/orders/${id}/confirm`);
    return response;
  },

  /**
   * Cancel order by manager (bypasses owner check)
   * PATCH /api/orders/:id/manager-cancel
   */
  managerCancelOrder: async (id: string, cancelReason?: string): Promise<OrderResponse> => {
    const response: any = await api.patch(`/orders/${id}/manager-cancel`, { cancelReason });
    return response;
  },

  /**
   * Cancel order (owner or manager)
   * PATCH /api/orders/:id/cancel
   */
  cancelOrder: async (id: string, cancelReason?: string): Promise<OrderResponse> => {
    const response: any = await api.patch(`/orders/${id}/cancel`, { cancelReason });
    return response;
  },

  /**
   * Bulk confirm multiple pending orders
   * POST /api/orders/bulk-confirm
   */
  bulkConfirmOrders: async (orderIds: string[]): Promise<BulkConfirmResult> => {
    const response: any = await api.post('/orders/bulk-confirm', { orderIds });
    return response;
  },

  /**
   * Get pending orders badge summary (totalPending, pendingToday)
   * GET /api/orders/pending-summary
   */
  getPendingSummary: async (): Promise<PendingSummary> => {
    const response: any = await api.get('/orders/pending-summary');
    return response;
  },

  /**
   * Update order status (admin/manager)
   * PATCH /api/orders/:id/status
   */
  updateOrderStatus: async (id: string, status: string): Promise<OrderResponse> => {
    const response: any = await api.patch(`/orders/${id}/status`, { status });
    return response;
  },

  /**
   * Update payment status (admin)
   * PATCH /api/orders/:id/payment-status
   */
  updatePaymentStatus: async (id: string, paymentStatus: string): Promise<OrderResponse> => {
    const response: any = await api.patch(`/orders/${id}/payment-status`, { paymentStatus });
    return response;
  },

  /**
   * Get order statistics
   * GET /api/orders/stats/summary
   */
  getOrderStats: async (startDate?: string, endDate?: string): Promise<any> => {
    const response: any = await api.get('/orders/stats/summary', {
      params: { startDate, endDate },
    });
    return response;
  },

  /**
   * Create order
   * POST /api/orders
   */
  createOrder: async (payload: {
    addressId: string;
    voucherId?: string;
    items: OrderItem[];
    paymentMethod?: string;
    notes?: string;
  }): Promise<OrderResponse> => {
    const response: any = await api.post('/orders', payload);
    return response;
  },

  /**
   * Delete order (admin)
   * DELETE /api/orders/:id
   */
  deleteOrder: async (id: string): Promise<void> => {
    await api.delete(`/orders/${id}`);
  },
};

// ========================
// EXPORT DEFAULT API INSTANCE
// ========================

export default api;
