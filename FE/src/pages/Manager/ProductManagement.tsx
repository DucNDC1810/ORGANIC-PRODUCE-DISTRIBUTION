import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Textarea } from '../../components/ui/textarea';

// Mock data
const mockProducts = [
  { 
    id: '1', 
    name: 'Organic Avocados', 
    category: 'Fruits', 
    price: 5.99, 
    stock: 150, 
    status: 'In Stock', 
    image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=100',
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
    sales: 142,
    revenue: 1134.58
  },
];

export default function ManagerProductManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isLoading, _setIsLoading] = useState(false);

  const getStockBadge = (status: string) => {
    const statusConfig: any = {
      'In Stock': { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'Low Stock': { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      'Out of Stock': { className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    };
    return statusConfig[status] || { className: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Product Management</h2>
          <p className="text-muted-foreground mt-1">Manage your organic produce inventory</p>
        </div>
        <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl">Add New Product</DialogTitle>
              <DialogDescription>Create a new organic product listing</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name *</Label>
                  <Input id="name" placeholder="e.g., Organic Avocados" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fruits">Fruits</SelectItem>
                      <SelectItem value="vegetables">Vegetables</SelectItem>
                      <SelectItem value="herbs">Herbs</SelectItem>
                      <SelectItem value="mushrooms">Mushrooms</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input id="price" type="number" placeholder="0.00" step="0.01" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock Quantity *</Label>
                  <Input id="stock" type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Product description..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image">Product Image</Label>
                <div className="flex gap-2">
                  <Input id="image" placeholder="Image URL or upload" className="flex-1" />
                  <Button variant="outline" size="icon">
                    <ImagePlus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddProductOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Add Product
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
            <Select>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="fruits">Fruits</SelectItem>
                <SelectItem value="vegetables">Vegetables</SelectItem>
                <SelectItem value="herbs">Herbs</SelectItem>
                <SelectItem value="mushrooms">Mushrooms</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-muted-foreground">Loading products...</p>
            </div>
          ) : mockProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-foreground mb-1">No products found</h3>
              <p className="text-sm text-muted-foreground mb-4">Get started by adding your first product</p>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
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
                {mockProducts.map((product) => (
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
                        <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
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
    </div>
  );
}
