import { useState, useMemo } from 'react';
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
import { toast } from 'sonner';

// Product interface - matching database schema
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  certification: string;
  originFarm: string;
  nutritionInfo: string;
  imageUrls: string[];
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  categoryId: number;
  category: string; // For display purposes
  createdAt: string;
  // Computed fields for analytics
  sales?: number;
  revenue?: number;
}

// Category mapping for display
const categoryMap: Record<number, string> = {
  1: 'Fruits',
  2: 'Vegetables',
  3: 'Herbs',
  4: 'Mushrooms',
};

// Initial mock data with all database fields
const initialProducts: Product[] = [
  { 
    id: '1', 
    name: 'Organic Avocados', 
    description: 'Fresh organic avocados from local farms. Rich in healthy fats and nutrients.',
    price: 5.99, 
    stockQuantity: 150, 
    certification: 'USDA Organic',
    originFarm: 'Green Valley Farm',
    nutritionInfo: 'Calories: 160, Fat: 15g, Carbs: 9g, Protein: 2g, Fiber: 7g',
    imageUrls: ['https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100'],
    status: 'In Stock', 
    categoryId: 1,
    category: 'Fruits',
    createdAt: '2025-01-15T10:30:00Z',
    sales: 245,
    revenue: 1467.55
  },
  { 
    id: '2', 
    name: 'Mixed Greens', 
    description: 'Assorted organic greens including spinach, kale, and arugula. Perfect for salads.',
    price: 4.49, 
    stockQuantity: 200, 
    certification: 'Certified Organic',
    originFarm: 'Sunrise Organic Farm',
    nutritionInfo: 'Calories: 20, Fat: 0g, Carbs: 3g, Protein: 2g, Fiber: 2g',
    imageUrls: ['https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100'],
    status: 'In Stock', 
    categoryId: 2,
    category: 'Vegetables',
    createdAt: '2025-01-14T08:00:00Z',
    sales: 198,
    revenue: 889.02
  },
  { 
    id: '3', 
    name: 'Fresh Strawberries', 
    description: 'Sweet and juicy organic strawberries. Hand-picked at peak ripeness.',
    price: 6.99, 
    stockQuantity: 8, 
    certification: 'USDA Organic',
    originFarm: 'Berry Bliss Farm',
    nutritionInfo: 'Calories: 50, Fat: 0g, Carbs: 12g, Protein: 1g, Fiber: 3g',
    imageUrls: ['https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100'],
    status: 'Low Stock', 
    categoryId: 1,
    category: 'Fruits',
    createdAt: '2025-01-13T14:20:00Z',
    sales: 176,
    revenue: 1230.24
  },
  { 
    id: '4', 
    name: 'Organic Tomatoes', 
    description: 'Vine-ripened organic tomatoes. Perfect for cooking or fresh eating.',
    price: 4.99, 
    stockQuantity: 0, 
    certification: 'Non-GMO Project Verified',
    originFarm: 'Red Sun Organics',
    nutritionInfo: 'Calories: 22, Fat: 0g, Carbs: 5g, Protein: 1g, Fiber: 1g',
    imageUrls: ['https://images.unsplash.com/photo-1592921870789-04563d55041c?w=100'],
    status: 'Out of Stock', 
    categoryId: 2,
    category: 'Vegetables',
    createdAt: '2025-01-12T09:45:00Z',
    sales: 165,
    revenue: 823.35
  },
  { 
    id: '5', 
    name: 'Fresh Blueberries', 
    description: 'Premium organic blueberries rich in antioxidants. Great for smoothies and baking.',
    price: 7.99, 
    stockQuantity: 80, 
    certification: 'USDA Organic',
    originFarm: 'Blue Mountain Farms',
    nutritionInfo: 'Calories: 84, Fat: 0g, Carbs: 21g, Protein: 1g, Fiber: 4g',
    imageUrls: ['https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=100'],
    status: 'In Stock', 
    categoryId: 1,
    category: 'Fruits',
    createdAt: '2025-01-10T11:15:00Z',
    sales: 142,
    revenue: 1134.58
  },
];

// Status type for product
type ProductStatus = 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';

// Empty product form with all database fields
const emptyProductForm: {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  certification: string;
  originFarm: string;
  nutritionInfo: string;
  imageUrls: string;
  status: ProductStatus;
  categoryId: string;
} = {
  name: '',
  description: '',
  price: '',
  stockQuantity: '',
  certification: '',
  originFarm: '',
  nutritionInfo: '',
  imageUrls: '',
  status: 'In Stock',
  categoryId: '',
};

export default function ManagerProductManagement() {
  // State for products list
  const [products, setProducts] = useState<Product[]>(initialProducts);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Dialog states
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [isViewProductOpen, setIsViewProductOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form and selected product states
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Calculate stock status based on quantity
  const calculateStatus = (stock: number): 'In Stock' | 'Low Stock' | 'Out of Stock' => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.originFarm.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.certification.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || product.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, categoryFilter, statusFilter]);

  // Reset form
  const resetForm = () => {
    setProductForm(emptyProductForm);
    setSelectedProduct(null);
  };

  // CREATE - Add new product
  const handleAddProduct = () => {
    if (!productForm.name || !productForm.categoryId || !productForm.price || !productForm.stockQuantity) {
      toast.error('Please fill in all required fields!');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const categoryIdNum = parseInt(productForm.categoryId);
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        stockQuantity: parseInt(productForm.stockQuantity),
        certification: productForm.certification,
        originFarm: productForm.originFarm,
        nutritionInfo: productForm.nutritionInfo,
        imageUrls: productForm.imageUrls ? productForm.imageUrls.split(',').map(url => url.trim()) : ['https://images.unsplash.com/photo-1518843875459-f738682238a6?w=100'],
        status: calculateStatus(parseInt(productForm.stockQuantity)),
        categoryId: categoryIdNum,
        category: categoryMap[categoryIdNum] || 'Unknown',
        createdAt: new Date().toISOString(),
        sales: 0,
        revenue: 0,
      };

      setProducts(prev => [newProduct, ...prev]);
      setIsAddProductOpen(false);
      resetForm();
      setIsLoading(false);
      toast.success('Product added successfully!');
    }, 500);
  };

  // READ - View product details
  const handleViewProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsViewProductOpen(true);
  };

  // UPDATE - Open edit dialog with product data
  const handleEditClick = (product: Product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      stockQuantity: product.stockQuantity.toString(),
      certification: product.certification || '',
      originFarm: product.originFarm || '',
      nutritionInfo: product.nutritionInfo || '',
      imageUrls: product.imageUrls?.join(', ') || '',
      status: product.status,
      categoryId: product.categoryId.toString(),
    });
    setIsEditProductOpen(true);
  };

  // UPDATE - Save edited product
  const handleUpdateProduct = () => {
    if (!productForm.name || !productForm.categoryId || !productForm.price || !productForm.stockQuantity) {
      toast.error('Please fill in all required fields!');
      return;
    }

    if (!selectedProduct) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      const categoryIdNum = parseInt(productForm.categoryId);
      setProducts(prev => prev.map(product => {
        if (product.id === selectedProduct.id) {
          return {
            ...product,
            name: productForm.name,
            description: productForm.description,
            price: parseFloat(productForm.price),
            stockQuantity: parseInt(productForm.stockQuantity),
            certification: productForm.certification,
            originFarm: productForm.originFarm,
            nutritionInfo: productForm.nutritionInfo,
            imageUrls: productForm.imageUrls ? productForm.imageUrls.split(',').map(url => url.trim()) : product.imageUrls,
            status: calculateStatus(parseInt(productForm.stockQuantity)),
            categoryId: categoryIdNum,
            category: categoryMap[categoryIdNum] || product.category,
          };
        }
        return product;
      }));

      setIsEditProductOpen(false);
      resetForm();
      setIsLoading(false);
      toast.success('Product updated successfully!');
    }, 500);
  };

  // DELETE - Open delete confirmation
  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  // DELETE - Confirm delete product
  const handleDeleteProduct = () => {
    if (!selectedProduct) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setProducts(prev => prev.filter(product => product.id !== selectedProduct.id));
      setIsDeleteDialogOpen(false);
      setSelectedProduct(null);
      setIsLoading(false);
      toast.success('Product deleted successfully!');
    }, 500);
  };

  const getStockBadge = (status: string) => {
    const statusConfig: any = {
      'In Stock': { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'Low Stock': { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      'Out of Stock': { className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    };
    return statusConfig[status] || { className: 'bg-gray-100 text-gray-800' };
  };

  // Render form fields (inline to avoid re-render issues)
  const renderFormFields = () => (
    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
      {/* Row 1: Name & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <Input 
            id="name" 
            placeholder="e.g., Organic Avocados" 
            value={productForm.name}
            onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoryId">Category *</Label>
          <Select value={productForm.categoryId} onValueChange={(value) => setProductForm(prev => ({ ...prev, categoryId: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Fruits</SelectItem>
              <SelectItem value="2">Vegetables</SelectItem>
              <SelectItem value="3">Herbs</SelectItem>
              <SelectItem value="4">Mushrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Row 2: Price & Stock */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($) *</Label>
          <Input 
            id="price" 
            type="number" 
            placeholder="0.00" 
            step="0.01" 
            min="0"
            value={productForm.price}
            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stockQuantity">Stock Quantity *</Label>
          <Input 
            id="stockQuantity" 
            type="number" 
            placeholder="0" 
            min="0"
            value={productForm.stockQuantity}
            onChange={(e) => setProductForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
          />
        </div>
      </div>

      {/* Row 3: Certification & Origin Farm */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="certification">Certification</Label>
          <Select value={productForm.certification} onValueChange={(value) => setProductForm(prev => ({ ...prev, certification: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select certification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USDA Organic">USDA Organic</SelectItem>
              <SelectItem value="Certified Organic">Certified Organic</SelectItem>
              <SelectItem value="Non-GMO Project Verified">Non-GMO Project Verified</SelectItem>
              <SelectItem value="Fair Trade Certified">Fair Trade Certified</SelectItem>
              <SelectItem value="Rainforest Alliance">Rainforest Alliance</SelectItem>
              <SelectItem value="None">None</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="originFarm">Origin Farm</Label>
          <Input 
            id="originFarm" 
            placeholder="e.g., Green Valley Farm" 
            value={productForm.originFarm}
            onChange={(e) => setProductForm(prev => ({ ...prev, originFarm: e.target.value }))}
          />
        </div>
      </div>

      {/* Row 4: Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea 
          id="description" 
          placeholder="Product description..." 
          rows={3} 
          value={productForm.description}
          onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      {/* Row 5: Nutrition Info */}
      <div className="space-y-2">
        <Label htmlFor="nutritionInfo">Nutrition Information</Label>
        <Textarea 
          id="nutritionInfo" 
          placeholder="e.g., Calories: 160, Fat: 15g, Carbs: 9g, Protein: 2g, Fiber: 7g" 
          rows={2} 
          value={productForm.nutritionInfo}
          onChange={(e) => setProductForm(prev => ({ ...prev, nutritionInfo: e.target.value }))}
        />
      </div>

      {/* Row 6: Product Images */}
      <div className="space-y-2">
        <Label htmlFor="imageUrls">Product Images (comma-separated URLs)</Label>
        <div className="flex gap-2">
          <Input 
            id="imageUrls" 
            placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg" 
            className="flex-1" 
            value={productForm.imageUrls}
            onChange={(e) => setProductForm(prev => ({ ...prev, imageUrls: e.target.value }))}
          />
          <Button type="button" variant="outline" size="icon">
            <ImagePlus className="w-4 h-4" />
          </Button>
        </div>
        {productForm.imageUrls && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {productForm.imageUrls.split(',').map((url, index) => (
              <img 
                key={index}
                src={url.trim()} 
                alt={`Preview ${index + 1}`} 
                className="w-16 h-16 object-cover rounded-lg border"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Row 7: Status (for edit mode) */}
      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={productForm.status} onValueChange={(value: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued') => setProductForm(prev => ({ ...prev, status: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="In Stock">In Stock</SelectItem>
            <SelectItem value="Low Stock">Low Stock</SelectItem>
            <SelectItem value="Out of Stock">Out of Stock</SelectItem>
            <SelectItem value="Discontinued">Discontinued</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Status is auto-calculated based on stock, but can be overridden</p>
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
              <DialogDescription>Create a new organic product listing</DialogDescription>
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
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Add Product
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
            <Button variant="outline" onClick={() => setIsEditProductOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              onClick={handleUpdateProduct}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
                    src={selectedProduct.imageUrls?.[0] || 'https://via.placeholder.com/120'} 
                    alt={selectedProduct.name}
                    className="w-28 h-28 object-cover rounded-xl border-2 border-gray-100 shadow-sm"
                  />
                  {selectedProduct.imageUrls && selectedProduct.imageUrls.length > 1 && (
                    <div className="flex gap-1 mt-2">
                      {selectedProduct.imageUrls.slice(1, 4).map((url, index) => (
                        <img 
                          key={index}
                          src={url} 
                          alt={`${selectedProduct.name} - ${index + 2}`}
                          className="w-8 h-8 object-cover rounded border"
                        />
                      ))}
                      {selectedProduct.imageUrls.length > 4 && (
                        <div className="w-8 h-8 rounded border bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                          +{selectedProduct.imageUrls.length - 4}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-bold text-foreground truncate">{selectedProduct.name}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">{selectedProduct.category}</Badge>
                    {selectedProduct.certification && (
                      <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">
                        {selectedProduct.certification}
                      </Badge>
                    )}
                    <Badge {...getStockBadge(selectedProduct.status)} className="text-xs">
                      {selectedProduct.status}
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
                    <p className="text-lg font-bold text-green-700">${selectedProduct.price}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-100">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">Stock</p>
                    <p className="text-lg font-bold text-blue-700">{selectedProduct.stockQuantity}</p>
                    <p className="text-[10px] text-blue-500">units</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-purple-600 font-medium uppercase tracking-wide">Sold</p>
                    <p className="text-lg font-bold text-purple-700">{selectedProduct.sales || 0}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-100">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Revenue</p>
                    <p className="text-lg font-bold text-amber-700">${(selectedProduct.revenue || 0).toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Origin Farm */}
              {selectedProduct.originFarm && (
                <div className="bg-gray-50 px-4 py-3 rounded-lg border border-gray-100">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Origin Farm</p>
                  <p className="text-sm font-medium text-foreground">{selectedProduct.originFarm}</p>
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
                  <p className="text-sm text-blue-700">{selectedProduct.nutritionInfo}</p>
                </div>
              )}

              {/* Additional Info - Footer */}
              <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                <span>Product ID: <span className="font-medium text-foreground">{selectedProduct.id}</span></span>
                <span>Category ID: <span className="font-medium text-foreground">{selectedProduct.categoryId}</span></span>
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteProduct}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
                <SelectItem value="Fruits">Fruits</SelectItem>
                <SelectItem value="Vegetables">Vegetables</SelectItem>
                <SelectItem value="Herbs">Herbs</SelectItem>
                <SelectItem value="Mushrooms">Mushrooms</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
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
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No products found</h3>
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
                  <TableHead>Origin Farm</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Certification</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.imageUrls?.[0] || 'https://via.placeholder.com/100'} 
                          alt={product.name} 
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200" 
                        />
                        <div>
                          <span className="font-medium text-gray-900 block">{product.name}</span>
                          <span className="text-xs text-muted-foreground">ID: {product.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 text-sm">{product.originFarm || '-'}</TableCell>
                    <TableCell className="font-semibold text-gray-900">${product.price}</TableCell>
                    <TableCell className="text-gray-700">{product.stockQuantity} units</TableCell>
                    <TableCell>
                      {product.certification ? (
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs">
                          {product.certification}
                        </Badge>
                      ) : '-'}
                    </TableCell>
                    <TableCell>
                      <Badge {...getStockBadge(product.status)}>
                        {product.status}
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
            Showing {filteredProducts.length} / {products.length} products
          </span>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              In Stock: {products.filter(p => p.status === 'In Stock').length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
              Low Stock: {products.filter(p => p.status === 'Low Stock').length}
            </span>
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              Out of Stock: {products.filter(p => p.status === 'Out of Stock').length}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
