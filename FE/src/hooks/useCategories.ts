import { useState, useCallback } from 'react';
import { 
  categoryService, 
  Category, 
  CategoryQueryParams, 
  PaginationInfo,
  CreateCategoryData,
  UpdateCategoryData
} from '../services/categoryService';
import { toast } from 'sonner';

interface UseCategoriesReturn {
  // State
  categories: Category[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  selectedCategory: Category | null;
  categoryTree: Category[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    withProducts: number;
    empty: number;
  } | null;
  
  // Actions
  fetchCategories: (params?: CategoryQueryParams) => Promise<void>;
  fetchCategoryById: (id: string) => Promise<Category | null>;
  fetchCategoryBySlug: (slug: string) => Promise<Category | null>;
  fetchCategoryTree: () => Promise<void>;
  fetchRootCategories: () => Promise<void>;
  fetchCategoryStats: () => Promise<void>;
  createCategory: (data: CreateCategoryData) => Promise<Category | null>;
  updateCategory: (id: string, data: UpdateCategoryData) => Promise<Category | null>;
  deleteCategory: (id: string, force?: boolean) => Promise<boolean>;
  toggleCategoryStatus: (id: string) => Promise<Category | null>;
  checkSlugExists: (slug: string, excludeId?: string) => Promise<boolean>;
  reorderCategories: (orderedIds: string[]) => Promise<boolean>;
  updateProductCounts: () => Promise<boolean>;
  setSelectedCategory: (category: Category | null) => void;
  clearError: () => void;
}

export const useCategories = (): UseCategoriesReturn => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categoryTree, setCategoryTree] = useState<Category[]>([]);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    withProducts: number;
    empty: number;
  } | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch categories with filters
  const fetchCategories = useCallback(async (params: CategoryQueryParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getAllCategories(params);
      if (response.success) {
        setCategories(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch categories';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single category by ID
  const fetchCategoryById = useCallback(async (id: string): Promise<Category | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getCategoryById(id);
      if (response.success) {
        setSelectedCategory(response.data);
        return response.data;
      }
      throw new Error('Category not found');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch category';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch category by slug
  const fetchCategoryBySlug = useCallback(async (slug: string): Promise<Category | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getCategoryBySlug(slug);
      if (response.success) {
        setSelectedCategory(response.data);
        return response.data;
      }
      throw new Error('Category not found');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch category';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch category tree
  const fetchCategoryTree = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getCategoryTree();
      if (response.success) {
        setCategoryTree(response.data);
      } else {
        throw new Error('Failed to fetch category tree');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch category tree';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch root categories
  const fetchRootCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.getRootCategories();
      if (response.success) {
        setCategories(response.data);
      } else {
        throw new Error('Failed to fetch root categories');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch root categories';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch category stats
  const fetchCategoryStats = useCallback(async () => {
    try {
      const response = await categoryService.getCategoryStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      // Silently fail for stats - not critical
      console.error('Failed to fetch category stats:', err);
    }
  }, []);

  // Create new category
  const createCategory = useCallback(async (data: CreateCategoryData): Promise<Category | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.createCategory(data);
      if (response.success) {
        setCategories(prev => [response.data, ...prev]);
        toast.success('Category created successfully!');
        return response.data;
      }
      throw new Error('Failed to create category');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create category';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update category
  const updateCategory = useCallback(async (id: string, data: UpdateCategoryData): Promise<Category | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.updateCategory(id, data);
      if (response.success) {
        setCategories(prev => prev.map(c => c._id === id ? response.data : c));
        toast.success('Category updated successfully!');
        return response.data;
      }
      throw new Error('Failed to update category');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update category';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete category
  const deleteCategory = useCallback(async (id: string, force: boolean = false): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.deleteCategory(id, force);
      if (response.success) {
        setCategories(prev => prev.filter(c => c._id !== id));
        toast.success('Category deleted successfully!');
        return true;
      }
      throw new Error('Failed to delete category');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete category';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle category status
  const toggleCategoryStatus = useCallback(async (id: string): Promise<Category | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await categoryService.toggleCategoryStatus(id);
      if (response.success) {
        setCategories(prev => prev.map(c => c._id === id ? response.data : c));
        toast.success(`Category ${response.data.isActive ? 'activated' : 'deactivated'} successfully!`);
        return response.data;
      }
      throw new Error('Failed to toggle category status');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to toggle category status';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check if slug exists
  const checkSlugExists = useCallback(async (slug: string, excludeId?: string): Promise<boolean> => {
    try {
      const response = await categoryService.checkSlugExists(slug, excludeId);
      return response.data.exists;
    } catch (err: any) {
      console.error('Failed to check slug:', err);
      return false;
    }
  }, []);

  // Reorder categories
  const reorderCategories = useCallback(async (orderedIds: string[]): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await categoryService.reorderCategories(orderedIds);
      if (response.success) {
        toast.success('Categories reordered successfully!');
        return true;
      }
      throw new Error('Failed to reorder categories');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reorder categories';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update product counts
  const updateProductCounts = useCallback(async (): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await categoryService.updateProductCounts();
      if (response.success) {
        toast.success(`Updated ${response.data.updated} categories!`);
        return true;
      }
      throw new Error('Failed to update product counts');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update product counts';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // State
    categories,
    loading,
    error,
    pagination,
    selectedCategory,
    categoryTree,
    stats,
    
    // Actions
    fetchCategories,
    fetchCategoryById,
    fetchCategoryBySlug,
    fetchCategoryTree,
    fetchRootCategories,
    fetchCategoryStats,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleCategoryStatus,
    checkSlugExists,
    reorderCategories,
    updateProductCounts,
    setSelectedCategory,
    clearError,
  };
};

export default useCategories;
