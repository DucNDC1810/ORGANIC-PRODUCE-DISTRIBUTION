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
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
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
  role: string;
  phone?: string;
  address?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
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
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response: any = await api.post('/auth/register', userData);
    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
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
   * Get all users
   * GET /api/users
   */
  getAllUsers: async (): Promise<User[]> => {
    const response: any = await api.get('/users');
    return response.data;
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
// EXPORT DEFAULT API INSTANCE
// ========================

export default api;
