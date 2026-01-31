import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Filter,
  ImagePlus,
  Save,
  X,
  AlertTriangle,
  Loader2,
  Star,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Switch } from '../../components/ui/switch';
import { useProducts } from '../../hooks/useProducts';
import { Product, CreateProductData, UpdateProductData } from '../../services/productService';

// Category options matching BE enum
const CATEGORIES = [
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'grains', label: 'Grains' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'meat', label: 'Meat' },
  { value: 'seafood', label: 'Seafood' },
  { value: 'herbs', label: 'Herbs' },
  { value: 'nuts', label: 'Nuts' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'processed', label: 'Processed' },
  { value: 'other', label: 'Other' },
];

// Unit options matching BE enum
const UNITS = [
  { value: 'kg', label: 'Kg' },
  { value: 'g', label: 'Gram' },
  { value: 'piece', label: 'Piece' },
  { value: 'bunch', label: 'Bunch' },
  { value: 'pack', label: 'Pack' },
  { value: 'box', label: 'Box' },
  { value: 'bottle', label: 'Bottle' },
  { value: 'liter', label: 'Liter' },
  { value: 'ml', label: 'ml' },
];

// Certification options
const CERTIFICATIONS = [
  'VietGAP',
  'GlobalGAP',
  'Organic',
  'USDA Organic',
  'EU Organic',
  'Non-GMO',
];

// Empty product form matching BE schema
const emptyProductForm = {
  name: '',
  description: '',
  price: '',
  originalPrice: '',
  category: '',
  thumbnail: '',
  images: '',
  stock: '',
  unit: 'kg',
  origin: '',
  isOrganic: true,
  certifications: [] as string[],
  nutritionInfo: {
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    fiber: '',
  },
  tags: '',
  isFeatured: false,
};

type ProductFormType = typeof emptyProductForm;

export default function ManagerProductManagement() {
  // Custom hook for products API
  const {
    products,
    loading,
    error,
    pagination,
    selectedProduct,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    setSelectedProduct,
  } = useProducts();

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Computed filtered products (client-side filtering for immediate UI feedback)
  // Note: API already handles filtering, this is for local search refinement
  const filteredProducts = products.filter(product => {
    // Search filter
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.origin?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    
    // Status filter based on stock
    let matchesStatus = true;
    if (statusFilter === 'In Stock') {
      matchesStatus = product.stock > 10;
    } else if (statusFilter === 'Low Stock') {
      matchesStatus = product.stock > 0 && product.stock <= 10;
    } else if (statusFilter === 'Out of Stock') {
      matchesStatus = product.stock === 0;
    }
    
    return matchesSearch && matchesCategory && matchesStatus;
  });
  
  // Dialog states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isViewProductOpen, setIsViewProductOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form state
  const [productForm, setProductForm] = useState<ProductFormType>(emptyProductForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch products on mount and when filters change
  useEffect(() => {
    const params: any = {
      page: currentPage,
      limit: 10,
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    if (categoryFilter !== 'all') {
      params.category = categoryFilter;
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        params.isActive = true;
      } else if (statusFilter === 'inactive') {
        params.isActive = false;
      } else if (statusFilter === 'out_of_stock') {
        params.stockStatus = 'out_of_stock';
      } else if (statusFilter === 'low_stock') {
        params.stockStatus = 'low_stock';
      }
    }

    fetchProducts(params);
  }, [fetchProducts, currentPage, searchQuery, categoryFilter, statusFilter]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Get stock status badge
  const getStockBadge = (product: Product) => {
    if (product.stock === 0) {
      return { className: 'bg-red-100 text-red-800 hover:bg-red-100', text: 'Out of Stock' };
    }
    if (product.stock <= 10) {
      return { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100', text: 'Low Stock' };
    }
    return { className: 'bg-green-100 text-green-800 hover:bg-green-100', text: 'In Stock' };
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Reset form
  const resetForm = () => {
    setProductForm(emptyProductForm);
    setSelectedProduct(null);
  };

  // Map product to form
  const mapProductToForm = (product: Product): ProductFormType => {
    return {
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category,
      thumbnail: product.thumbnail,
      images: product.images?.join(', ') || '',
      stock: product.stock.toString(),
      unit: product.unit,
      origin: product.origin,
      isOrganic: product.isOrganic,
      certifications: product.certifications || [],
      nutritionInfo: {
        calories: product.nutritionInfo?.calories?.toString() || '',
        protein: product.nutritionInfo?.protein?.toString() || '',
        carbs: product.nutritionInfo?.carbs?.toString() || '',
        fat: product.nutritionInfo?.fat?.toString() || '',
        fiber: product.nutritionInfo?.fiber?.toString() || '',
      },
      tags: product.tags?.join(', ') || '',
      isFeatured: product.isFeatured,
    };
  };

  // Map form to API data
  const mapFormToData = (): CreateProductData | UpdateProductData => {
    const data: any = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      category: productForm.category,
      thumbnail: productForm.thumbnail || 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=400',
      stock: parseInt(productForm.stock),
      unit: productForm.unit,
      origin: productForm.origin,
      isOrganic: productForm.isOrganic,
      isFeatured: productForm.isFeatured,
    };

    if (productForm.originalPrice) {
      data.originalPrice = parseFloat(productForm.originalPrice);
    }

    if (productForm.images) {
      data.images = productForm.images.split(',').map(url => url.trim()).filter(Boolean);
    }

    if (productForm.certifications.length > 0) {
      data.certifications = productForm.certifications;
    }

    // Nutrition info
    const nutritionInfo: any = {};
    if (productForm.nutritionInfo.calories) nutritionInfo.calories = parseFloat(productForm.nutritionInfo.calories);
    if (productForm.nutritionInfo.protein) nutritionInfo.protein = parseFloat(productForm.nutritionInfo.protein);
    if (productForm.nutritionInfo.carbs) nutritionInfo.carbs = parseFloat(productForm.nutritionInfo.carbs);
    if (productForm.nutritionInfo.fat) nutritionInfo.fat = parseFloat(productForm.nutritionInfo.fat);
    if (productForm.nutritionInfo.fiber) nutritionInfo.fiber = parseFloat(productForm.nutritionInfo.fiber);
    if (Object.keys(nutritionInfo).length > 0) {
      data.nutritionInfo = nutritionInfo;
    }

    if (productForm.tags) {
      data.tags = productForm.tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }

    return data;
  };

  // Validate form
  const validateForm = (): boolean => {
    return !!(productForm.name && productForm.category && productForm.price && productForm.stock && productForm.origin);
  };

  // CREATE - Add new product
  const handleAddProduct = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    const data = mapFormToData() as CreateProductData;
    const result = await createProduct(data);
    setIsSubmitting(false);

    if (result) {
      setIsAddProductOpen(false);
      resetForm();
    }
  };

  // READ - View product details
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewProductOpen(true);
  };

  // UPDATE - Open edit dialog with product data
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setProductForm(mapProductToForm(product));
    setIsEditProductOpen(true);
  };

  // UPDATE - Save edited product
  const handleUpdateProduct = async () => {
    if (!validateForm() || !selectedProduct) {
      return;
    }

    setIsSubmitting(true);
    const data = mapFormToData() as UpdateProductData;
    const result = await updateProduct(selectedProduct._id, data);
    setIsSubmitting(false);

    if (result) {
      setIsEditProductOpen(false);
      resetForm();
    }
  };

  // DELETE - Open delete confirmation
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // DELETE - Confirm delete product
  const handleDeleteProduct = async () => {
    if (!selectedProduct) return;

    setIsSubmitting(true);
    const success = await deleteProduct(selectedProduct._id, true);
    setIsSubmitting(false);

    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
    }
  };

  // Render form fields
  const renderFormFields = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Row 1: Name & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input 
            id="name" 
            placeholder="e.g. Organic Cabbage" 
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category">Category *</Label>
          <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(cat => (
                <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Price & Original Price */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Selling Price *</Label>
          <Input 
            id="price" 
            type="number" 
            placeholder="0" 
            min="0"
            value={productForm.price}
            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="originalPrice">Original Price</Label>
          <Input 
            id="originalPrice" 
            type="number" 
            placeholder="0" 
            min="0"
            value={productForm.originalPrice}
            onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: e.target.value }))}
          />
        </div>
      </div>

      {/* Row 3: Stock & Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input 
            id="stock" 
            type="number" 
            placeholder="0" 
            min="0"
            value={productForm.stock}
            onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">Unit *</Label>
          <Select value={productForm.unit} onValueChange={(value) => setProductForm(prev => ({ ...prev, unit: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select unit" />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map(unit => (
                <SelectItem key={unit.value} value={unit.value}>{unit.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 4: Origin */}
      <div className="space-y-2">
        <Label htmlFor="origin">Origin *</Label>
        <Input 
          id="origin" 
          placeholder="e.g. Da Lat, Vietnam" 
          value={productForm.origin}
          onChange={(e) => setProductForm(prev => ({ ...prev, origin: e.target.value }))}
        />
      </div>

      {/* Row 5: Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea 
          id="description" 
          placeholder="Detailed product description..." 
          rows={3} 
          value={productForm.description}
          onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      {/* Row 6: Thumbnail */}
      <div className="space-y-2">
        <Label htmlFor="thumbnail">Thumbnail Image (URL)</Label>
        <div className="flex gap-2">
          <Input 
            id="thumbnail" 
            placeholder="https://example.com/image.jpg" 
            className="flex-1" 
            value={productForm.thumbnail}
            onChange={(e) => setProductForm(prev => ({ ...prev, thumbnail: e.target.value }))}
          />
          <Button type="button" variant="outline" size="icon">
            <ImagePlus className="w-4 h-4" />
          </Button>
        </div>
        {productForm.thumbnail && (
          <img 
            src={productForm.thumbnail} 
            alt="Preview" 
            className="w-20 h-20 object-cover rounded-lg border mt-2"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}
      </div>

      {/* Row 7: Additional Images */}
      <div className="space-y-2">
        <Label htmlFor="images">Additional Images (URLs, comma-separated)</Label>
        <Input 
          id="images" 
          placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" 
          value={productForm.images}
          onChange={(e) => setProductForm(prev => ({ ...prev, images: e.target.value }))}
        />
      </div>

      {/* Row 8: Certifications */}
      <div className="space-y-2">
        <Label>Certifications</Label>
        <div className="flex flex-wrap gap-2">
          {CERTIFICATIONS.map(cert => (
            <Badge
              key={cert}
              variant={productForm.certifications.includes(cert) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => {
                setProductForm(prev => ({
                  ...prev,
                  certifications: prev.certifications.includes(cert)
                    ? prev.certifications.filter(c => c !== cert)
                    : [...prev.certifications, cert]
                }));
              }}
            >
              {cert}
            </Badge>
          ))}
        </div>
      </div>

      {/* Row 9: Nutrition Info */}
      <div className="space-y-2">
        <Label>Nutrition Information (per 100g)</Label>
        <div className="grid grid-cols-5 gap-2">
          <Input 
            placeholder="Calories" 
            type="number"
            value={productForm.nutritionInfo.calories}
            onChange={(e) => setProductForm(prev => ({ 
              ...prev, 
              nutritionInfo: { ...prev.nutritionInfo, calories: e.target.value }
            }))}
          />
          <Input 
            placeholder="Protein (g)" 
            type="number"
            value={productForm.nutritionInfo.protein}
            onChange={(e) => setProductForm(prev => ({ 
              ...prev, 
              nutritionInfo: { ...prev.nutritionInfo, protein: e.target.value }
            }))}
          />
          <Input 
            placeholder="Carbs (g)" 
            type="number"
            value={productForm.nutritionInfo.carbs}
            onChange={(e) => setProductForm(prev => ({ 
              ...prev, 
              nutritionInfo: { ...prev.nutritionInfo, carbs: e.target.value }
            }))}
          />
          <Input 
            placeholder="Fat (g)" 
            type="number"
            value={productForm.nutritionInfo.fat}
            onChange={(e) => setProductForm(prev => ({ 
              ...prev, 
              nutritionInfo: { ...prev.nutritionInfo, fat: e.target.value }
            }))}
          />
          <Input 
            placeholder="Fiber (g)" 
            type="number"
            value={productForm.nutritionInfo.fiber}
            onChange={(e) => setProductForm(prev => ({ 
              ...prev, 
              nutritionInfo: { ...prev.nutritionInfo, fiber: e.target.value }
            }))}
          />
        </div>
      </div>

      {/* Row 10: Tags */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input 
          id="tags" 
          placeholder="organic, fresh, vegetables" 
          value={productForm.tags}
          onChange={(e) => setProductForm(prev => ({ ...prev, tags: e.target.value }))}
        />
      </div>

      {/* Row 11: Switches */}
      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Switch
            id="isOrganic"
            checked={productForm.isOrganic}
            onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isOrganic: checked }))}
          />
          <Label htmlFor="isOrganic">Organic Product</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id="isFeatured"
            checked={productForm.isFeatured}
            onCheckedChange={(checked) => setProductForm(prev => ({ ...prev, isFeatured: checked }))}
          />
          <Label htmlFor="isFeatured">Featured Product</Label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Product Management</h2>
          <p className="text-muted-foreground mt-1">Manage your organic produce inventory</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* REFRESH BUTTON */}
          <Button 
            variant="outline" 
            onClick={() => {
              const params: any = { page: currentPage, limit: 10 };
              if (searchQuery) params.search = searchQuery;
              if (categoryFilter !== 'all') params.category = categoryFilter;
              if (statusFilter !== 'all') {
                if (statusFilter === 'active') params.isActive = true;
                else if (statusFilter === 'inactive') params.isActive = false;
                else if (statusFilter === 'out_of_stock') params.stockStatus = 'out_of_stock';
                else if (statusFilter === 'low_stock') params.stockStatus = 'low_stock';
              }
              fetchProducts(params);
            }}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {/* ADD PRODUCT DIALOG */}
          <Dialog open={isAddProductOpen} onOpenChange={(open) => {
          setIsAddProductOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Product</DialogTitle>
              <DialogDescription>Create a new organic produce product</DialogDescription>
            </DialogHeader>
            {renderFormFields()}
            <DialogFooter className="gap-3">
              <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                onClick={handleAddProduct}
                disabled={isSubmitting || !validateForm()}
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Add Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* EDIT PRODUCT DIALOG */}
      <Dialog open={isEditProductOpen} onOpenChange={(open) => {
        setIsEditProductOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Product</DialogTitle>
            <DialogDescription>Update product information</DialogDescription>
          </DialogHeader>
          {renderFormFields()}
          <DialogFooter className="gap-3">
            <Button variant="outline" onClick={() => setIsEditProductOpen(false)} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              onClick={handleUpdateProduct}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* VIEW PRODUCT DIALOG */}
      <Dialog open={isViewProductOpen} onOpenChange={setIsViewProductOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Product Details</DialogTitle>
            <DialogDescription className="text-sm">View detailed product information</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4 space-y-5">
              {/* Header with image and basic info */}
              <div className="flex gap-5 items-start">
                {/* Product Image */}
                <div className="shrink-0">
                  <img 
                    src={selectedProduct.thumbnail || selectedProduct.images?.[0] || 'https://via.placeholder.com/120'} 
                    alt={selectedProduct.name}
                    className="w-28 h-28 object-cover rounded-xl border-2 border-gray-100 shadow-sm"
                  />
                  {selectedProduct.images && selectedProduct.images.length > 1 && (
                    <div className="flex gap-1 mt-2">
                      {selectedProduct.images.slice(1, 4).map((url, index) => (
                        <img 
                          key={index}
                          src={url} 
                          alt={`${selectedProduct.name} - ${index + 2}`}
                          className="w-8 h-8 object-cover rounded border"
                        />
                      ))}
                      {selectedProduct.images.length > 4 && (
                        <div className="w-8 h-8 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          +{selectedProduct.images.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground truncate">{selectedProduct.name}</h3>
                    {selectedProduct.isOrganic && (
                      <Badge className="bg-green-100 text-green-700 text-xs">Organic</Badge>
                    )}
                    {selectedProduct.isFeatured && (
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{selectedProduct.category}</Badge>
                    {selectedProduct.certifications && selectedProduct.certifications.length > 0 && (
                      selectedProduct.certifications.map((cert, idx) => (
                        <Badge key={idx} className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                          {cert}
                        </Badge>
                      ))
                    )}
                    <Badge {...getStockBadge(selectedProduct)} className="text-xs">
                      {selectedProduct.stock > 10 ? 'In Stock' : selectedProduct.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {formatDate(selectedProduct.createdAt)}
                  </p>
                </div>
              </div>
              
              {/* Stats Cards - 2x2 Grid */}
              <div className="grid grid-cols-4 gap-2">
                <Card className="bg-green-50 border-green-100">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-green-600 font-medium uppercase tracking-wide">Price</p>
                    <p className="text-lg font-bold text-green-700">${selectedProduct.price?.toLocaleString()}</p>
                    {selectedProduct.originalPrice && selectedProduct.originalPrice > selectedProduct.price && (
                      <p className="text-[10px] text-gray-400 line-through">${selectedProduct.originalPrice?.toLocaleString()}</p>
                    )}
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">Stock</p>
                    <p className="text-lg font-bold text-blue-700">{selectedProduct.stock}</p>
                    <p className="text-[10px] text-blue-500">{selectedProduct.unit}</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-purple-600 font-medium uppercase tracking-wide">Sold</p>
                    <p className="text-lg font-bold text-purple-700">{selectedProduct.soldCount || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Rating</p>
                    <p className="text-lg font-bold text-amber-700">{selectedProduct.rating?.toFixed(1) || 'N/A'}</p>
                    <p className="text-[10px] text-amber-500">({selectedProduct.reviewCount || 0} reviews)</p>
                  </CardContent>
                </Card>
              </div>

              {/* Origin */}
              {selectedProduct.origin && (
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Origin</p>
                  <p className="text-sm font-medium text-foreground">{selectedProduct.origin}</p>
                </div>
              )}

              {/* Description */}
              {selectedProduct.description && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-1.5">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedProduct.description}</p>
                </div>
              )}

              {/* Nutrition Info */}
              {selectedProduct.nutritionInfo && (
                <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-100">
                  <h4 className="text-sm font-semibold text-blue-800 mb-1">Nutrition Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
                    {selectedProduct.nutritionInfo.calories && <span>Calories: {selectedProduct.nutritionInfo.calories}</span>}
                    {selectedProduct.nutritionInfo.protein && <span>Protein: {selectedProduct.nutritionInfo.protein}</span>}
                    {selectedProduct.nutritionInfo.carbs && <span>Carbs: {selectedProduct.nutritionInfo.carbs}</span>}
                    {selectedProduct.nutritionInfo.fat && <span>Fat: {selectedProduct.nutritionInfo.fat}</span>}
                    {selectedProduct.nutritionInfo.fiber && <span>Fiber: {selectedProduct.nutritionInfo.fiber}</span>}
                  </div>
                </div>
              )}

              {/* Additional Info - Footer */}
              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <span>SKU: <span className="font-medium text-foreground">{selectedProduct.sku || 'N/A'}</span></span>
                <span>Status: <span className="font-medium text-foreground">{selectedProduct.isActive ? 'Active' : 'Inactive'}</span></span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewProductOpen(false)}>
              Close
            </Button>
            <Button 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              onClick={() => {
                setIsViewProductOpen(false);
                if (selectedProduct) handleEditClick(selectedProduct);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirm Delete Product
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{selectedProduct?.name}"</strong>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteProduct}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Search & Filter */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products by name or category..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="In Stock">In Stock</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Out of Stock">Out of Stock</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={() => {
              setSearchQuery('');
              setCategoryFilter('all');
              setStatusFilter('all');
            }}>
              <Filter className="w-4 h-4" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600" />
              <span className="ml-2 text-muted-foreground">Loading products...</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">Error Loading Data</h3>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchProducts()} variant="outline">
                Retry
              </Button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No Products Found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {products.length === 0 
                  ? 'Get started by adding your first product' 
                  : 'Try changing filters or search keywords'}
              </p>
              {products.length === 0 && (
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  onClick={() => setIsAddProductOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Certifications</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product._id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.thumbnail || product.images?.[0] || 'https://via.placeholder.com/100'} 
                          alt={product.name} 
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200" 
                        />
                        <div>
                          <div className="flex items-center gap-1">
                            <span className="font-medium text-gray-900 block">{product.name}</span>
                            {product.isOrganic && (
                              <Badge className="bg-green-100 text-green-700 text-[10px] px-1">Organic</Badge>
                            )}
                            {product.isFeatured && (
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">SKU: {product.sku || 'N/A'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm">{product.origin || '-'}</TableCell>
                    <TableCell className="font-semibold text-gray-900">${product.price?.toLocaleString()}</TableCell>
                    <TableCell className="text-gray-700">{product.stock} {product.unit}</TableCell>
                    <TableCell>
                      {product.certifications && product.certifications.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.certifications.slice(0, 2).map((cert, idx) => (
                            <Badge key={idx} variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">
                              {cert}
                            </Badge>
                          ))}
                          {product.certifications.length > 2 && (
                            <Badge variant="secondary" className="text-xs">+{product.certifications.length - 2}</Badge>
                          )}
                        </div>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge {...getStockBadge(product)}>
                        {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-blue-50 hover:text-blue-600"
                          onClick={() => handleViewProduct(product)}
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="hover:bg-amber-50 hover:text-amber-600"
                          onClick={() => handleEditClick(product)}
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleDeleteClick(product)}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {products.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {filteredProducts.length} of {pagination?.totalProducts || products.length} products
            {pagination && ` (Page ${pagination.currentPage} of ${pagination.totalPages})`}
          </span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              In Stock: {products.filter(p => p.stock > 10).length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              Low Stock: {products.filter(p => p.stock > 0 && p.stock <= 10).length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Out of Stock: {products.filter(p => p.stock === 0).length}
            </span>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={!pagination.hasPrev}
            className="hidden sm:flex"
          >
            First
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={!pagination.hasPrev}
          >
            Previous
          </Button>
          
          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {(() => {
              const pages: (number | string)[] = [];
              const totalPages = pagination.totalPages;
              const current = pagination.currentPage;
              
              if (totalPages <= 7) {
                // Show all pages if 7 or less
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Always show first page
                pages.push(1);
                
                if (current > 3) {
                  pages.push('...');
                }
                
                // Show pages around current
                const start = Math.max(2, current - 1);
                const end = Math.min(totalPages - 1, current + 1);
                
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }
                
                if (current < totalPages - 2) {
                  pages.push('...');
                }
                
                // Always show last page
                pages.push(totalPages);
              }
              
              return pages.map((page, index) => (
                typeof page === 'number' ? (
                  <Button
                    key={index}
                    variant={page === current ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={page === current ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={index} className="px-2 text-muted-foreground">...</span>
                )
              ));
            })()}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
            disabled={!pagination.hasNext}
          >
            Next
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(pagination.totalPages)}
            disabled={!pagination.hasNext}
            className="hidden sm:flex"
          >
            Last
          </Button>
        </div>
      )}
    </div>
  );
}
