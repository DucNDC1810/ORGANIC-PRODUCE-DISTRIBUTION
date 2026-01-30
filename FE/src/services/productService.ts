import api from './api';

// ===== INTERFACES =====

export interface NutritionInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface ProductDimensions {
  length?: number;
  width?: number;
  height?: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images: string[];
  thumbnail: string;
  stock: number;
  unit: string;
  origin: string;
  isOrganic: boolean;
  certifications?: string[];
  nutritionInfo?: NutritionInfo;
  farmer?: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
  };
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  tags?: string[];
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  expiryDate?: string;
  harvestDate?: string;
  createdAt: string;
  updatedAt: string;
  // Virtual fields
  discountPercentage?: number;
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isOrganic?: boolean;
  farmer?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalProducts: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ProductListResponse {
  success: boolean;
  data: Product[];
  pagination: PaginationInfo;
}

export interface ProductResponse {
  success: boolean;
  data: Product;
  message?: string;
}

export interface ProductStatsResponse {
  success: boolean;
  data: {
    totalProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    featuredProducts: number;
    outOfStockProducts: number;
    lowStockProducts: number;
    organicProducts: number;
    averagePrice: number;
    categoryDistribution: Record<string, number>;
  };
}

export interface CreateProductData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images?: string[];
  thumbnail: string;
  stock: number;
  unit: string;
  origin: string;
  isOrganic?: boolean;
  certifications?: string[];
  nutritionInfo?: NutritionInfo;
  farmer?: string;
  isFeatured?: boolean;
  tags?: string[];
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  expiryDate?: string;
  harvestDate?: string;
}

export interface UpdateProductData extends Partial<CreateProductData> {
  isActive?: boolean;
}

export interface UpdateStockData {
  quantity: number;
  operation: 'add' | 'subtract' | 'set';
}

export interface BulkUpdateData {
  ids: string[];
  updateData: UpdateProductData;
}

export interface BulkDeleteData {
  ids: string[];
  hardDelete?: boolean;
}

// ===== PRODUCT SERVICE =====

export const productService = {
  // ===== READ OPERATIONS =====

  /**
   * Get all products with pagination, search, and filters
   */
  getAllProducts: async (params: ProductQueryParams = {}): Promise<ProductListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => queryParams.append(key, v));
        } else {
          queryParams.append(key, String(value));
        }
      }
    });

    const response = await api.get(`/products?${queryParams.toString()}`);
    return response as unknown as ProductListResponse;
  },

  /**
   * Get product by ID
   */
  getProductById: async (id: string): Promise<ProductResponse> => {
    const response = await api.get(`/products/${id}`);
    return response as unknown as ProductResponse;
  },

  /**
   * Get product by SKU
   */
  getProductBySku: async (sku: string): Promise<ProductResponse> => {
    const response = await api.get(`/products/sku/${sku}`);
    return response as unknown as ProductResponse;
  },

  /**
   * Get featured products
   */
  getFeaturedProducts: async (limit: number = 10): Promise<ProductListResponse> => {
    const response = await api.get(`/products/featured?limit=${limit}`);
    return response as unknown as ProductListResponse;
  },

  /**
   * Get products by category
   */
  getProductsByCategory: async (category: string, limit: number = 20): Promise<ProductListResponse> => {
    const response = await api.get(`/products/category/${category}?limit=${limit}`);
    return response as unknown as ProductListResponse;
  },

  /**
   * Get products by farmer
   */
  getProductsByFarmer: async (farmerId: string, params: ProductQueryParams = {}): Promise<ProductListResponse> => {
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    const response = await api.get(`/products/farmer/${farmerId}?${queryParams.toString()}`);
    return response as unknown as ProductListResponse;
  },

  /**
   * Search products
   */
  searchProducts: async (query: string, limit: number = 20): Promise<ProductListResponse> => {
    const response = await api.get(`/products/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response as unknown as ProductListResponse;
  },

  /**
   * Get related products
   */
  getRelatedProducts: async (productId: string, limit: number = 6): Promise<ProductListResponse> => {
    const response = await api.get(`/products/${productId}/related?limit=${limit}`);
    return response as unknown as ProductListResponse;
  },

  /**
   * Get product statistics (Admin/Manager only)
   */
  getProductStats: async (): Promise<ProductStatsResponse> => {
    const response = await api.get('/products/admin/stats');
    return response as unknown as ProductStatsResponse;
  },

  /**
   * Check if SKU exists
   */
  checkSkuExists: async (sku: string, excludeId?: string): Promise<{ success: boolean; data: { exists: boolean } }> => {
    const params = excludeId ? `?sku=${sku}&excludeId=${excludeId}` : `?sku=${sku}`;
    const response = await api.get(`/products/check-sku${params}`);
    return response as unknown as { success: boolean; data: { exists: boolean } };
  },

  // ===== CREATE OPERATIONS =====

  /**
   * Create new product
   */
  createProduct: async (data: CreateProductData): Promise<ProductResponse> => {
    const response = await api.post('/products', data);
    return response as unknown as ProductResponse;
  },

  // ===== UPDATE OPERATIONS =====

  /**
   * Update product
   */
  updateProduct: async (id: string, data: UpdateProductData): Promise<ProductResponse> => {
    const response = await api.put(`/products/${id}`, data);
    return response as unknown as ProductResponse;
  },

  /**
   * Toggle product active status
   */
  toggleProductStatus: async (id: string): Promise<ProductResponse> => {
    const response = await api.patch(`/products/${id}/toggle-status`);
    return response as unknown as ProductResponse;
  },

  /**
   * Toggle product featured status
   */
  toggleFeaturedStatus: async (id: string): Promise<ProductResponse> => {
    const response = await api.patch(`/products/${id}/toggle-featured`);
    return response as unknown as ProductResponse;
  },

  /**
   * Update product stock
   */
  updateStock: async (id: string, data: UpdateStockData): Promise<ProductResponse> => {
    const response = await api.patch(`/products/${id}/stock`, data);
    return response as unknown as ProductResponse;
  },

  /**
   * Bulk update products
   */
  bulkUpdateProducts: async (data: BulkUpdateData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/products/bulk-update', data);
    return response as unknown as { success: boolean; message: string };
  },

  // ===== DELETE OPERATIONS =====

  /**
   * Delete product (soft delete by default)
   */
  deleteProduct: async (id: string, hardDelete: boolean = false): Promise<ProductResponse> => {
    const response = await api.delete(`/products/${id}${hardDelete ? '?hardDelete=true' : ''}`);
    return response as unknown as ProductResponse;
  },

  /**
   * Bulk delete products
   */
  bulkDeleteProducts: async (data: BulkDeleteData): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/products/bulk-delete', data);
    return response as unknown as { success: boolean; message: string };
  },
};

export default productService;
