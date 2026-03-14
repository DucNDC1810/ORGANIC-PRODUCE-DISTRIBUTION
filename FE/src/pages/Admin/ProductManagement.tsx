import { useState, useEffect, useMemo } from 'react';
import { 
  Package, 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  ImagePlus,
  Save,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { toast } from 'sonner';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { Product } from '../../services/productService';

// Form validation helper
const validateProductForm = (data: any) => {
  const errors: Record<string, string> = {};
  const price = Number(data.price);
  const stock = Number(data.stock);
  
  if (!data.name?.trim()) errors.name = 'Product name is required';
  if (!data.description?.trim()) errors.description = 'Description is required';
  if (!data.category) errors.category = 'Category is required';
  if (!Number.isFinite(price) || price <= 0) errors.price = 'Valid price is required';
  if (!Number.isFinite(stock) || stock < 0) errors.stock = 'Valid stock quantity is required';
  if (!data.thumbnail?.trim()) errors.thumbnail = 'Product image is required';
  if (!data.unit?.trim()) errors.unit = 'Unit is required';
  if (!data.origin?.trim()) errors.origin = 'Origin is required';
  
  return errors;
};

export default function AdminProductManagement() {
  // Hooks
  const { 
    products, 
    loading, 
    pagination,
    fetchProducts, 
    createProduct, 
    updateProduct, 
    deleteProduct,
    toggleProductStatus 
  } = useProducts();
  
  const { categories, fetchCategories } = useCategories();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    thumbnail: '',
    unit: 'kg',
    origin: '',
    isOrganic: true,
    isFeatured: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load products when query/paging changes
  useEffect(() => {
    loadProducts();
  }, [currentPage, selectedCategory, selectedStatus, searchQuery]);

  // Load categories once
  useEffect(() => {
    fetchCategories({ isActive: true, limit: 1000 });
  }, []);

  // Load products with filters
  const loadProducts = async () => {
    const params: any = {
      page: currentPage,
      limit: 10,
    };
    
    if (searchQuery) params.search = searchQuery;
    if (selectedCategory !== 'all') params.category = selectedCategory;
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'active') params.isActive = true;
      else if (selectedStatus === 'inactive') params.isActive = false;
    }
    
    await fetchProducts(params);
  };

  // Filtered products based on local filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = !searchQuery || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const productCategoryValue =
        typeof product.category === 'object' && product.category !== null
          ? ((product.category as { slug?: string; _id?: string }).slug ||
             (product.category as { slug?: string; _id?: string })._id || '')
          : String(product.category || '');

      const matchedCategory = categories.find(
        (c) => c.slug === productCategoryValue || c._id === productCategoryValue,
      );

      const matchesCategory =
        selectedCategory === 'all' ||
        productCategoryValue === selectedCategory ||
        matchedCategory?.slug === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory, categories]);

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      thumbnail: '',
      unit: 'kg',
      origin: '',
      isOrganic: true,
      isFeatured: false,
    });
    setFormErrors({});
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // CRUD operations
  const handleCreateProduct = async () => {
    const errors = validateProductForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        images: [formData.thumbnail],
      };
      
      const result = await createProduct(productData);
      if (result) {
        setIsAddDialogOpen(false);
        resetForm();
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to create product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProduct = async () => {
    if (!selectedProduct) return;
    
    const errors = validateProductForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Please fix the form errors');
      return;
    }

    setIsSubmitting(true);
    try {
      const updateData = {
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        images: [formData.thumbnail],
      };
      
      const result = await updateProduct(selectedProduct._id, updateData);
      if (result) {
        setIsEditDialogOpen(false);
        setSelectedProduct(null);
        resetForm();
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    try {
      const success = await deleteProduct(selectedProduct._id, true);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      const result = await toggleProductStatus(product._id);
      if (result) {
        loadProducts();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle status');
    }
  };

  // Dialog handlers
  const openEditDialog = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stock: product.stock?.toString() || '0',
      category: getCategoryFormValue(product.category),
      thumbnail: product.thumbnail || product.images?.[0] || '',
      unit: product.unit || 'kg',
      origin: product.origin || '',
      isOrganic: product.isOrganic !== false,
      isFeatured: product.isFeatured || false,
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // Helper functions
  const getStockBadge = (product: Product) => {
    const stock = product.stock || 0;
    
    if (stock === 0) {
      return { label: 'Out of Stock', className: 'bg-red-100 text-red-800 hover:bg-red-100' };
    } else if (stock < 20) {
      return { label: 'Low Stock', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' };
    } else {
      return { label: 'In Stock', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive
      ? { label: 'Active', className: 'bg-blue-100 text-blue-800' }
      : { label: 'Inactive', className: 'bg-gray-100 text-gray-800' };
  };

  const getCategoryName = (categoryValue: unknown) => {
    if (!categoryValue) return 'Unknown';

    if (typeof categoryValue === 'object' && categoryValue !== null) {
      const categoryObj = categoryValue as { name?: string; slug?: string; _id?: string };
      if (categoryObj.name) return categoryObj.name;
      const resolved = categories.find(
        (c) => c.slug === categoryObj.slug || c._id === categoryObj._id,
      );
      return resolved?.name || categoryObj.slug || categoryObj._id || 'Unknown';
    }

    const value = String(categoryValue);
    const resolved = categories.find((c) => c.slug === value || c._id === value);
    return resolved?.name || value || 'Unknown';
  };

  const getCategoryFormValue = (categoryValue: unknown) => {
    if (!categoryValue) return '';

    if (typeof categoryValue === 'object' && categoryValue !== null) {
      const categoryObj = categoryValue as { slug?: string; _id?: string };
      if (categoryObj.slug) return categoryObj.slug;
      if (categoryObj._id) {
        const resolved = categories.find((c) => c._id === categoryObj._id);
        return resolved?.slug || categoryObj._id;
      }
    }

    const value = String(categoryValue);
    const resolved = categories.find((c) => c.slug === value || c._id === value);
    return resolved?.slug || value;
  };

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: products.length,
      inStock: products.filter(p => (p.stock || 0) > 20).length,
      lowStock: products.filter(p => {
        const stock = p.stock || 0;
        return stock > 0 && stock <= 20;
      }).length,
      outOfStock: products.filter(p => (p.stock || 0) === 0).length,
    };
  }, [products]);

  const visiblePageNumbers = useMemo(() => {
    if (!pagination?.totalPages) return [];

    const totalPages = pagination.totalPages;
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + 4);
    const normalizedStart = Math.max(1, end - 4);

    return Array.from(
      { length: end - normalizedStart + 1 },
      (_, i) => normalizedStart + i,
    );
  }, [pagination?.totalPages, currentPage]);

  return (
    <div className="space-y-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            Product Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">Manage your organic produce inventory</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => loadProducts()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">Add New Product</DialogTitle>
                <DialogDescription>Create a new organic product listing</DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-semibold">
                      Product Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      placeholder="e.g., Organic Avocados"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={formErrors.name ? 'border-red-500' : ''}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.name}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-sm font-semibold">
                      Category <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat._id} value={cat.slug}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {formErrors.category && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.category}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price" className="text-sm font-semibold">
                      Price ($) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      placeholder="0.00"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className={formErrors.price ? 'border-red-500' : ''}
                    />
                    {formErrors.price && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.price}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock" className="text-sm font-semibold">
                      Stock <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => handleInputChange('stock', e.target.value)}
                      className={formErrors.stock ? 'border-red-500' : ''}
                    />
                    {formErrors.stock && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {formErrors.stock}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unit" className="text-sm font-semibold">
                      Unit <span className="text-red-500">*</span>
                    </Label>
                    <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="g">Gram (g)</SelectItem>
                        <SelectItem value="lb">Pound (lb)</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                        <SelectItem value="bunch">Bunch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin" className="text-sm font-semibold">
                    Origin <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="origin"
                    placeholder="e.g., California, USA"
                    value={formData.origin}
                    onChange={(e) => handleInputChange('origin', e.target.value)}
                    className={formErrors.origin ? 'border-red-500' : ''}
                  />
                  {formErrors.origin && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.origin}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Product description..."
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thumbnail" className="text-sm font-semibold">
                    Product Image URL <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="thumbnail"
                      placeholder="https://example.com/image.jpg"
                      value={formData.thumbnail}
                      onChange={(e) => handleInputChange('thumbnail', e.target.value)}
                      className={`flex-1 ${formErrors.thumbnail ? 'border-red-500' : ''}`}
                    />
                    <Button variant="outline" size="icon" type="button">
                      <ImagePlus className="w-4 h-4" />
                    </Button>
                  </div>
                  {formErrors.thumbnail && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {formErrors.thumbnail}
                    </p>
                  )}
                  {formData.thumbnail && (
                    <div className="mt-2">
                      <img
                        src={formData.thumbnail}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/128?text=Invalid+Image';
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isOrganic"
                      checked={formData.isOrganic}
                      onChange={(e) => handleInputChange('isOrganic', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isOrganic" className="text-sm font-medium cursor-pointer">
                      Organic Product
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <Label htmlFor="isFeatured" className="text-sm font-medium cursor-pointer">
                      Featured Product
                    </Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddDialogOpen(false); resetForm(); }} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProduct}
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Add Product
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-blue-700">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
            <p className="text-[10px] text-blue-600 mt-0.5">All products</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-green-700">In Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.inStock}</div>
            <p className="text-[10px] text-green-600 mt-0.5">Available</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-yellow-700">Low Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.lowStock}</div>
            <p className="text-[10px] text-yellow-600 mt-0.5">Need restock</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-red-700">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.outOfStock}</div>
            <p className="text-[10px] text-red-600 mt-0.5">Unavailable</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter */}
      <Card className="shadow-md hover:shadow-lg transition-shadow border-gray-200">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products by name or description..."
                className="pl-10 border-gray-300 focus:border-green-500 focus:ring-green-500"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-48 border-gray-300">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat._id} value={cat.slug}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={(value) => { setSelectedStatus(value); setCurrentPage(1); }}>
              <SelectTrigger className="w-full md:w-40 border-gray-300">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-md hover:shadow-lg transition-shadow border-gray-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-16">
              <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-700">Loading products...</p>
              <p className="text-sm text-gray-500 mt-1">Please wait while we fetch your inventory</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No products found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your filters or search query'
                  : 'Get started by adding your first product'}
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table className="table-fixed min-w-[980px]">
                  <TableHeader>
                    <TableRow className="bg-gray-50 hover:bg-gray-50">
                      <TableHead className="w-[42%] text-sm font-semibold">Product</TableHead>
                      <TableHead className="w-[14%] text-sm font-semibold">Category</TableHead>
                      <TableHead className="w-[12%] text-sm font-semibold">Price</TableHead>
                      <TableHead className="w-[14%] text-sm font-semibold">Stock Status</TableHead>
                      <TableHead className="w-[8%] text-sm font-semibold">Status</TableHead>
                      <TableHead className="w-[10%] text-right text-sm font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const stockBadge = getStockBadge(product);
                      const statusBadge = getStatusBadge(product.isActive);
                      const imageUrl = product.thumbnail || product.images?.[0] || 'https://via.placeholder.com/64?text=No+Image';
                      
                      return (
                        <TableRow key={product._id} className="hover:bg-gray-50 transition-colors [&>td]:py-3">
                          <TableCell className="whitespace-normal">
                            <div className="flex items-center gap-2">
                              <div className="relative group flex-shrink-0">
                                <div className="w-14 h-14 rounded-md overflow-hidden border border-gray-200 group-hover:border-green-400 transition-all bg-gray-100">
                                  <img
                                    src={imageUrl}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                    onError={(e) => {
                                      const target = e.currentTarget;
                                      target.onerror = null;
                                      // Use a better fallback with product initial
                                      const canvas = document.createElement('canvas');
                                      canvas.width = 64;
                                      canvas.height = 64;
                                      const ctx = canvas.getContext('2d');
                                      if (ctx) {
                                        ctx.fillStyle = '#f3f4f6';
                                        ctx.fillRect(0, 0, 64, 64);
                                        ctx.fillStyle = '#9ca3af';
                                        ctx.font = 'bold 24px Arial';
                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'middle';
                                        ctx.fillText(product.name.charAt(0).toUpperCase(), 32, 32);
                                      }
                                      target.src = canvas.toDataURL();
                                    }}
                                  />
                                </div>
                                {product.isFeatured && (
                                  <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                                    <TrendingUp className="w-2 h-2 text-yellow-900" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-base font-semibold text-gray-900 hover:text-green-600 transition-colors truncate">
                                  {product.name}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                              {getCategoryName(product.category)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-base font-bold text-gray-900">
                                ${product.price.toFixed(2)}
                              </span>
                              <span className="text-xs text-gray-500">per {product.unit || 'unit'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <Badge className={stockBadge.className + ' text-xs'}>
                                {stockBadge.label}
                              </Badge>
                              <span className="text-sm text-gray-600">
                                ({product.stock || 0})
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={statusBadge.className + ' text-xs'}>
                              {statusBadge.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openViewDialog(product)}
                                className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(product)}
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600 transition-colors"
                                title="Edit Product"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleStatus(product)}
                                className="h-8 w-8 p-0 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                                title={product.isActive ? 'Deactivate' : 'Activate'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(product)}
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 transition-colors"
                                title="Delete Product"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-t bg-gray-50">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold">{((currentPage - 1) * (pagination.limit || 10)) + 1}</span> to{' '}
                    <span className="font-semibold">
                      {Math.min(currentPage * (pagination.limit || 10), pagination.totalProducts || 0)}
                    </span>{' '}
                    of <span className="font-semibold">{pagination.totalProducts || 0}</span> products
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={!pagination.hasPrev || loading}
                      className="gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {visiblePageNumbers.map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className={currentPage === page ? 'bg-green-600 hover:bg-green-700' : ''}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={!pagination.hasNext || loading}
                      className="gap-1"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name" className="text-sm font-semibold">
                  Product Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={formErrors.name ? 'border-red-500' : ''}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-category" className="text-sm font-semibold">
                  Category <span className="text-red-500">*</span>
                </Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger className={formErrors.category ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat._id} value={cat.slug}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-price" className="text-sm font-semibold">
                  Price ($) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className={formErrors.price ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stock" className="text-sm font-semibold">
                  Stock <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  className={formErrors.stock ? 'border-red-500' : ''}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-unit" className="text-sm font-semibold">Unit</Label>
                <Select value={formData.unit} onValueChange={(value) => handleInputChange('unit', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="lb">Pound (lb)</SelectItem>
                    <SelectItem value="piece">Piece</SelectItem>
                    <SelectItem value="bunch">Bunch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-origin">Origin <span className="text-red-500">*</span></Label>
              <Input
                id="edit-origin"
                value={formData.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                className={formErrors.origin ? 'border-red-500' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-thumbnail">Product Image URL</Label>
              <Input
                id="edit-thumbnail"
                value={formData.thumbnail}
                onChange={(e) => handleInputChange('thumbnail', e.target.value)}
              />
              {formData.thumbnail && (
                <img
                  src={formData.thumbnail}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200 mt-2"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/128?text=Invalid+Image';
                  }}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isOrganic"
                  checked={formData.isOrganic}
                  onChange={(e) => handleInputChange('isOrganic', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="edit-isOrganic" className="cursor-pointer">Organic Product</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="edit-isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => handleInputChange('isFeatured', e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <Label htmlFor="edit-isFeatured" className="cursor-pointer">Featured Product</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditDialogOpen(false); resetForm(); }} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdateProduct}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Product
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-6 py-4">
              <div className="flex gap-6">
                <img
                  src={selectedProduct.thumbnail || selectedProduct.images?.[0] || 'https://via.placeholder.com/200'}
                  alt={selectedProduct.name}
                  className="w-48 h-48 object-cover rounded-lg border-2 border-gray-200"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/200?text=No+Image';
                  }}
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">{selectedProduct.name}</h3>
                    <p className="text-gray-600 mt-1">{selectedProduct.description || 'No description available'}</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedProduct.isOrganic && (
                      <Badge className="bg-green-100 text-green-800">🌱 Organic</Badge>
                    )}
                    {selectedProduct.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-800">⭐ Featured</Badge>
                    )}
                    <Badge className={getStatusBadge(selectedProduct.isActive).className}>
                      {getStatusBadge(selectedProduct.isActive).label}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div>
                  <p className="text-sm text-gray-500">Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${selectedProduct.price.toFixed(2)}
                    <span className="text-sm text-gray-500">/{selectedProduct.unit || 'unit'}</span>
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Stock</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {selectedProduct.stock || 0} units
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="text-lg font-medium text-gray-900">
                    {getCategoryName(selectedProduct.category)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Origin</p>
                  <p className="text-lg font-medium text-gray-900">{selectedProduct.origin || 'N/A'}</p>
                </div>
                {selectedProduct.rating !== undefined && (
                  <>
                    <div>
                      <p className="text-sm text-gray-500">Rating</p>
                      <p className="text-lg font-medium text-gray-900">
                        ⭐ {selectedProduct.rating.toFixed(1)} / 5.0
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Reviews</p>
                      <p className="text-lg font-medium text-gray-900">
                        {selectedProduct.reviewCount || 0} reviews
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                setIsViewDialogOpen(false);
                if (selectedProduct) openEditDialog(selectedProduct);
              }}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Product
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this product?</p>
              {selectedProduct && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-3">
                  <p className="font-semibold text-gray-900">{selectedProduct.name}</p>
                  <p className="text-sm text-gray-600">
                    Price: ${selectedProduct.price} • Stock: {selectedProduct.stock || 0}
                  </p>
                </div>
              )}
              <p className="text-red-600 font-medium mt-3">This action cannot be undone!</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
