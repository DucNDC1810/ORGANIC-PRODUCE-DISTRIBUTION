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

// Product interface
interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: string;
  image: string;
  description?: string;
  sales: number;
  revenue: number;
}

// Initial mock data
const initialProducts: Product[] = [
  { 
    id: '1', 
    name: 'Organic Avocados', 
    category: 'Fruits', 
    price: 5.99, 
    stock: 150, 
    status: 'In Stock', 
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100',
    description: 'Fresh organic avocados from local farms',
    sales: 245,
    revenue: 1467.55
  },
  { 
    id: '2', 
    name: 'Mixed Greens', 
    category: 'Vegetables', 
    price: 4.49, 
    stock: 200, 
    status: 'In Stock', 
    image: 'https://images.unsplash.com/photo-1622206151226-18ca2c9ab4a1?w=100',
    description: 'Assorted organic greens including spinach, kale, and arugula',
    sales: 198,
    revenue: 889.02
  },
  { 
    id: '3', 
    name: 'Fresh Strawberries', 
    category: 'Fruits', 
    price: 6.99, 
    stock: 8, 
    status: 'Low Stock', 
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=100',
    description: 'Sweet and juicy organic strawberries',
    sales: 176,
    revenue: 1230.24
  },
  { 
    id: '4', 
    name: 'Organic Tomatoes', 
    category: 'Vegetables', 
    price: 4.99, 
    stock: 0, 
    status: 'Out of Stock', 
    image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=100',
    description: 'Vine-ripened organic tomatoes',
    sales: 165,
    revenue: 823.35
  },
  { 
    id: '5', 
    name: 'Fresh Blueberries', 
    category: 'Fruits', 
    price: 7.99, 
    stock: 80, 
    status: 'In Stock', 
    image: 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=100',
    description: 'Premium organic blueberries rich in antioxidants',
    sales: 142,
    revenue: 1134.58
  },
];

// Empty product form
const emptyProductForm = {
  name: '',
  category: '',
  price: '',
  stock: '',
  description: '',
  image: '',
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
  const calculateStatus = (stock: number): string => {
    if (stock === 0) return 'Out of Stock';
    if (stock <= 10) return 'Low Stock';
    return 'In Stock';
  };

  // Filter products based on search and filters
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.category.toLowerCase().includes(searchQuery.toLowerCase());
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
    if (!productForm.name || !productForm.category || !productForm.price || !productForm.stock) {
      toast.error('Please fill in all required fields!');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productForm.name,
        category: productForm.category,
        price: parseFloat(productForm.price),
        stock: parseInt(productForm.stock),
        status: calculateStatus(parseInt(productForm.stock)),
        image: productForm.image || 'https://images.unsplash.com/photo-1518843875459-f738682238a6?w=100',
        description: productForm.description,
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
      category: product.category,
      price: product.price.toString(),
      stock: product.stock.toString(),
      description: product.description || '',
      image: product.image,
    });
    setIsEditProductOpen(true);
  };

  // UPDATE - Save edited product
  const handleUpdateProduct = () => {
    if (!productForm.name || !productForm.category || !productForm.price || !productForm.stock) {
      toast.error('Please fill in all required fields!');
      return;
    }

    if (!selectedProduct) return;

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setProducts(prev => prev.map(product => {
        if (product.id === selectedProduct.id) {
          return {
            ...product,
            name: productForm.name,
            category: productForm.category,
            price: parseFloat(productForm.price),
            stock: parseInt(productForm.stock),
            status: calculateStatus(parseInt(productForm.stock)),
            image: productForm.image || product.image,
            description: productForm.description,
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
    <div className="grid gap-4 py-4">
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
          <Label htmlFor="category">Category *</Label>
          <Select value={productForm.category} onValueChange={(value) => setProductForm(prev => ({ ...prev, category: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Fruits">Fruits</SelectItem>
              <SelectItem value="Vegetables">Vegetables</SelectItem>
              <SelectItem value="Herbs">Herbs</SelectItem>
              <SelectItem value="Mushrooms">Mushrooms</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">Price ($) *</Label>
          <Input 
            id="price" 
            type="number" 
            placeholder="0.00" 
            step="0.01" 
            value={productForm.price}
            onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock">Stock Quantity *</Label>
          <Input 
            id="stock" 
            type="number" 
            placeholder="0" 
            value={productForm.stock}
            onChange={(e) => setProductForm(prev => ({ ...prev, stock: e.target.value }))}
          />
        </div>
      </div>
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
      <div className="space-y-2">
        <Label htmlFor="image">Product Image</Label>
        <div className="flex gap-2">
          <Input 
            id="image" 
            placeholder="Image URL" 
            className="flex-1" 
            value={productForm.image}
            onChange={(e) => setProductForm(prev => ({ ...prev, image: e.target.value }))}
          />
          <Button type="button" variant="outline" size="icon">
            <ImagePlus className="w-4 h-4" />
          </Button>
        </div>
        {productForm.image && (
          <div className="mt-2">
            <img 
              src={productForm.image} 
              alt="Preview" 
              className="w-20 h-20 object-cover rounded-lg border"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Product Details</DialogTitle>
            <DialogDescription>View detailed product information</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="py-4">
              <div className="flex gap-6">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-32 h-32 object-cover rounded-xl border shadow-sm"
                />
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground">{selectedProduct.name}</h3>
                    <Badge variant="outline" className="mt-1">{selectedProduct.category}</Badge>
                  </div>
                  <Badge {...getStockBadge(selectedProduct.status)}>{selectedProduct.status}</Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-green-600 font-medium">Price</p>
                    <p className="text-2xl font-bold text-green-700">${selectedProduct.price}</p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-blue-600 font-medium">Stock</p>
                    <p className="text-2xl font-bold text-blue-700">{selectedProduct.stock} units</p>
                  </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-purple-600 font-medium">Sold</p>
                    <p className="text-2xl font-bold text-purple-700">{selectedProduct.sales}</p>
                  </CardContent>
                </Card>
                <Card className="bg-amber-50 border-amber-200">
                  <CardContent className="pt-4">
                    <p className="text-sm text-amber-600 font-medium">Revenue</p>
                    <p className="text-2xl font-bold text-amber-700">${selectedProduct.revenue.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>

              {selectedProduct.description && (
                <div className="mt-6">
                  <h4 className="font-semibold text-foreground mb-2">Description</h4>
                  <p className="text-muted-foreground">{selectedProduct.description}</p>
                </div>
              )}
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
                  <TableHead className="w-[300px]">Product</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
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
                          src={product.image} 
                          alt={product.name} 
                          className="w-12 h-12 rounded-lg object-cover border border-gray-200" 
                        />
                        <span className="font-medium text-gray-900">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-gray-50 text-gray-700">
                        {product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-semibold text-gray-900">${product.price}</TableCell>
                    <TableCell className="text-gray-700">{product.stock} units</TableCell>
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
