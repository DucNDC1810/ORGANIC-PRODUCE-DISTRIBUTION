import api from './api';

// ===== INTERFACES =====

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentCategory?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  isActive: boolean;
  sortOrder: number;
  productCount: number;
  subcategories?: Category[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentCategory?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeSubcategories?: boolean;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCategories: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface CategoryListResponse {
  success: boolean;
  data: Category[];
  pagination: PaginationInfo;
}

export interface CategoryResponse {
  success: boolean;
  data: Category;
  message?: string;
}

export interface CategoryStatsResponse {
  success: boolean;
  data: {
    total: number;
    active: number;
    inactive: number;
    withProducts: number;
    empty: number;
  };
}

export interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  image?: string;
  parentCategory?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCategoryData extends Partial<CreateCategoryData> {
  productCount?: number;
}

export interface BulkUpdateCategoryData {
  ids: string[];
  data: Partial<UpdateCategoryData>;
}

export interface BulkDeleteCategoryData {
  ids: string[];
}

export interface MessageResponse {
  success: boolean;
  message: string;
}

export interface SlugCheckResponse {
  success: boolean;
  data: {
    exists: boolean;
  };
}

// ===== CATEGORY SERVICE =====

export const categoryService = {
  // ===== READ OPERATIONS =====

  /**
   * Get all categories with pagination, search, and filters
   */
  getAllCategories: async (params: CategoryQueryParams = {}): Promise<CategoryListResponse> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const response = await api.get(`/categories?${queryParams.toString()}`);
    return response as unknown as CategoryListResponse;
  },

  /**
   * Get category by ID
   */
  getCategoryById: async (id: string): Promise<CategoryResponse> => {
    const response = await api.get(`/categories/${id}`);
    return response as unknown as CategoryResponse;
  },

  /**
   * Get category by slug
   */
  getCategoryBySlug: async (slug: string): Promise<CategoryResponse> => {
    const response = await api.get(`/categories/slug/${slug}`);
    return response as unknown as CategoryResponse;
  },

  /**
   * Get root categories (no parent)
   */
  getRootCategories: async (): Promise<{ success: boolean; data: Category[] }> => {
    const response = await api.get('/categories/root');
    return response as unknown as { success: boolean; data: Category[] };
  },

  /**
   * Get category tree (hierarchical structure)
   */
  getCategoryTree: async (): Promise<{ success: boolean; data: Category[] }> => {
    const response = await api.get('/categories/tree');
    return response as unknown as { success: boolean; data: Category[] };
  },

  /**
   * Check if slug exists
   */
  checkSlugExists: async (slug: string, excludeId?: string): Promise<SlugCheckResponse> => {
    const params = new URLSearchParams({ slug });
    if (excludeId) {
      params.append('excludeId', excludeId);
    }
    const response = await api.get(`/categories/check-slug?${params.toString()}`);
    return response as unknown as SlugCheckResponse;
  },

  /**
   * Get category statistics (Admin/Manager only)
   */
  getCategoryStats: async (): Promise<CategoryStatsResponse> => {
    const response = await api.get('/categories/admin/stats');
    return response as unknown as CategoryStatsResponse;
  },

  // ===== WRITE OPERATIONS =====

  /**
   * Create a new category
   */
  createCategory: async (data: CreateCategoryData): Promise<CategoryResponse> => {
    const response = await api.post('/categories', data);
    return response as unknown as CategoryResponse;
  },

  /**
   * Update a category
   */
  updateCategory: async (id: string, data: UpdateCategoryData): Promise<CategoryResponse> => {
    const response = await api.put(`/categories/${id}`, data);
    return response as unknown as CategoryResponse;
  },

  /**
   * Delete a category
   */
  deleteCategory: async (id: string): Promise<MessageResponse> => {
    const response = await api.delete(`/categories/${id}`);
    return response as unknown as MessageResponse;
  },

  /**
   * Toggle category active status
   */
  toggleCategoryStatus: async (id: string): Promise<CategoryResponse> => {
    const response = await api.patch(`/categories/${id}/toggle-status`);
    return response as unknown as CategoryResponse;
  },

  // ===== ADMIN/MANAGER UTILITIES =====

  /**
   * Update product counts for all categories
   */
  updateProductCounts: async (): Promise<{ success: boolean; message: string; data: { updated: number } }> => {
    const response = await api.post('/categories/update-counts');
    return response as unknown as { success: boolean; message: string; data: { updated: number } };
  },

  /**
   * Reorder categories
   */
  reorderCategories: async (orderedIds: string[]): Promise<MessageResponse> => {
    const response = await api.post('/categories/reorder', { orderedIds });
    return response as unknown as MessageResponse;
  },

  /**
   * Bulk update categories
   */
  bulkUpdateCategories: async (data: BulkUpdateCategoryData): Promise<{ success: boolean; message: string; data: { modifiedCount: number } }> => {
    const response = await api.post('/categories/bulk-update', data);
    return response as unknown as { success: boolean; message: string; data: { modifiedCount: number } };
  },

  /**
   * Bulk delete categories
   */
  bulkDeleteCategories: async (data: BulkDeleteCategoryData): Promise<{ success: boolean; message: string; data: { deletedCount: number } }> => {
    const response = await api.post('/categories/bulk-delete', data);
    return response as unknown as { success: boolean; message: string; data: { deletedCount: number } };
  },
};

export default categoryService;
