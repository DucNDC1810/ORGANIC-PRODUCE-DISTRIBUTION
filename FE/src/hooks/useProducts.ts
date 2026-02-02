import { useState, useCallback } from 'react';
import { 
  productService, 
  Product, 
  ProductQueryParams, 
  PaginationInfo,
  CreateProductData,
  UpdateProductData,
  UpdateStockData
} from '../services/productService';
import { toast } from 'sonner';

interface UseProductsReturn {
  // State
  products: Product[];
  loading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  selectedProduct: Product | null;
  
  // Actions
  fetchProducts: (params?: ProductQueryParams) => Promise<void>;
  fetchProductById: (id: string) => Promise<Product | null>;
  createProduct: (data: CreateProductData) => Promise<Product | null>;
  updateProduct: (id: string, data: UpdateProductData) => Promise<Product | null>;
  deleteProduct: (id: string, hardDelete?: boolean) => Promise<boolean>;
  toggleProductStatus: (id: string) => Promise<Product | null>;
  toggleFeaturedStatus: (id: string) => Promise<Product | null>;
  updateStock: (id: string, data: UpdateStockData) => Promise<Product | null>;
  setSelectedProduct: (product: Product | null) => void;
  clearError: () => void;
}

export const useProducts = (): UseProductsReturn => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Fetch products with filters
  const fetchProducts = useCallback(async (params: ProductQueryParams = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getAllProducts(params);
      if (response.success) {
        setProducts(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error('Failed to fetch products');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch products';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single product by ID
  const fetchProductById = useCallback(async (id: string): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.getProductById(id);
      if (response.success) {
        setSelectedProduct(response.data);
        return response.data;
      }
      throw new Error('Product not found');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch product';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new product
  const createProduct = useCallback(async (data: CreateProductData): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.createProduct(data);
      if (response.success) {
        setProducts(prev => [response.data, ...prev]);
        toast.success('Product created successfully!');
        return response.data;
      }
      throw new Error('Failed to create product');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create product';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update product
  const updateProduct = useCallback(async (id: string, data: UpdateProductData): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.updateProduct(id, data);
      if (response.success) {
        setProducts(prev => prev.map(p => p._id === id ? response.data : p));
        toast.success('Product updated successfully!');
        return response.data;
      }
      throw new Error('Failed to update product');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update product';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete product
  const deleteProduct = useCallback(async (id: string, hardDelete: boolean = false): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.deleteProduct(id, hardDelete);
      if (response.success) {
        if (hardDelete) {
          setProducts(prev => prev.filter(p => p._id !== id));
        } else {
          // Soft delete - update isActive to false
          setProducts(prev => prev.map(p => p._id === id ? { ...p, isActive: false } : p));
        }
        toast.success(hardDelete ? 'Product permanently deleted!' : 'Product deactivated!');
        return true;
      }
      throw new Error('Failed to delete product');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete product';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle product active status
  const toggleProductStatus = useCallback(async (id: string): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.toggleProductStatus(id);
      if (response.success) {
        setProducts(prev => prev.map(p => p._id === id ? response.data : p));
        toast.success(`Product ${response.data.isActive ? 'activated' : 'deactivated'}!`);
        return response.data;
      }
      throw new Error('Failed to toggle status');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to toggle status';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Toggle featured status
  const toggleFeaturedStatus = useCallback(async (id: string): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.toggleFeaturedStatus(id);
      if (response.success) {
        setProducts(prev => prev.map(p => p._id === id ? response.data : p));
        toast.success(`Product ${response.data.isFeatured ? 'featured' : 'unfeatured'}!`);
        return response.data;
      }
      throw new Error('Failed to toggle featured status');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to toggle featured status';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Update stock
  const updateStock = useCallback(async (id: string, data: UpdateStockData): Promise<Product | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await productService.updateStock(id, data);
      if (response.success) {
        setProducts(prev => prev.map(p => p._id === id ? response.data : p));
        toast.success('Stock updated successfully!');
        return response.data;
      }
      throw new Error('Failed to update stock');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update stock';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    selectedProduct,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    toggleFeaturedStatus,
    updateStock,
    setSelectedProduct,
    clearError,
  };
};

export default useProducts;
