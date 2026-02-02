import { useState } from 'react';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

// Default icon and color mappings based on category slug
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  vegetables: { icon: '🥬', color: '#2D5A27' },
  fruits: { icon: '🍎', color: '#E53935' },
  herbs: { icon: '🌿', color: '#43A047' },
  mushrooms: { icon: '🍄', color: '#8D6E63' },
  'dried-seafood': { icon: '🦐', color: '#0288D1' },
  dairy: { icon: '🥛', color: '#FDD835' },
  meat: { icon: '🥩', color: '#D32F2F' },
  seafood: { icon: '🐟', color: '#0097A7' },
  grains: { icon: '🌾', color: '#FFA000' },
  beverages: { icon: '🍹', color: '#7B1FA2' },
  snacks: { icon: '🍪', color: '#FF7043' },
  organic: { icon: '🌱', color: '#66BB6A' },
};

const DEFAULT_STYLE = { icon: '📦', color: '#2D5A27' };

// Helper function to get category style
const getCategoryStyle = (slug: string) => {
  return CATEGORY_STYLES[slug] || DEFAULT_STYLE;
};

// Type definition
interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  description?: string;
}

// Initial mock data
const initialCategories: Category[] = [
  { id: '1', name: 'Vegetables', slug: 'vegetables', productCount: 45, description: 'Fresh organic vegetables' },
  { id: '2', name: 'Fruits', slug: 'fruits', productCount: 32, description: 'Fresh organic fruits' },
  { id: '3', name: 'Herbs', slug: 'herbs', productCount: 18, description: 'Fresh herbs and spices' },
  { id: '4', name: 'Mushrooms', slug: 'mushrooms', productCount: 12, description: 'Organic mushrooms' },
  { id: '5', name: 'Dried Seafood', slug: 'dried-seafood', productCount: 25, description: 'Dried seafood such as dried shrimp, dried fish, dried squid, seaweed' },
];

export default function AdminCategoryManagement() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
  });

  // Filter categories based on search
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
    });
  };

  // Handle Create
  const handleCreate = () => {
    if (!formData.name.trim()) return;
    
    const newCategory: Category = {
      id: Date.now().toString(),
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      productCount: 0,
      description: formData.description,
    };
    
    setCategories([...categories, newCategory]);
    setIsAddCategoryOpen(false);
    resetForm();
  };

  // Handle Edit - Open dialog
  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    });
    setIsEditCategoryOpen(true);
  };

  // Handle Update
  const handleUpdate = () => {
    if (!selectedCategory || !formData.name.trim()) return;
    
    setCategories(categories.map(cat => 
      cat.id === selectedCategory.id 
        ? {
            ...cat,
            name: formData.name,
            slug: formData.slug || generateSlug(formData.name),
            description: formData.description,
          }
        : cat
    ));
    
    setIsEditCategoryOpen(false);
    setSelectedCategory(null);
    resetForm();
  };

  // Handle Delete - Open dialog
  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Handle Delete - Confirm
  const handleDeleteConfirm = () => {
    if (!selectedCategory) return;
    
    setCategories(categories.filter(cat => cat.id !== selectedCategory.id));
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Category Management</h2>
          <p className="text-muted-foreground mt-1">Organize your product categories</p>
        </div>
        <Dialog open={isAddCategoryOpen} onOpenChange={(open) => {
          setIsAddCategoryOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl">Create New Category</DialogTitle>
              <DialogDescription>Add a new product category</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Category Name *</Label>
                <Input 
                  id="cat-name" 
                  placeholder="e.g., Vegetables" 
                  value={formData.name}
                  onChange={(e) => setFormData({
                    ...formData, 
                    name: e.target.value,
                    slug: generateSlug(e.target.value)
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-slug">URL Slug *</Label>
                <Input 
                  id="cat-slug" 
                  placeholder="e.g., vegetables" 
                  value={formData.slug}
                  onChange={(e) => setFormData({...formData, slug: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-description">Description</Label>
                <Input 
                  id="cat-description" 
                  placeholder="Category description..." 
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsAddCategoryOpen(false);
                resetForm();
              }}>Cancel</Button>
              <Button 
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                onClick={handleCreate}
                disabled={!formData.name.trim()}
              >
                Create Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search categories..."
          className="pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Stats */}
      <div className="flex gap-4 text-sm text-muted-foreground">
        <span>Total Categories: <strong className="text-foreground">{categories.length}</strong></span>
        <span>Total Products: <strong className="text-foreground">{categories.reduce((sum, cat) => sum + cat.productCount, 0)}</strong></span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map((category) => {
          const style = getCategoryStyle(category.slug);
          return (
          <Card key={category.id} className="shadow-sm hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: style.color }}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm" style={{ backgroundColor: `${style.color}15` }}>
                    {style.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    <CardDescription className="text-xs">/{category.slug}</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {category.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
              )}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{category.productCount}</p>
                  <p className="text-sm text-gray-500">Products</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${style.color}20` }}>
                  <Package className="w-6 h-6" style={{ color: style.color }} />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => handleEditClick(category)}
                >
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => handleDeleteClick(category)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No categories found</p>
        </div>
      )}

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={(open) => {
        setIsEditCategoryOpen(open);
        if (!open) {
          setSelectedCategory(null);
          resetForm();
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Category</DialogTitle>
            <DialogDescription>Update category information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cat-name">Category Name *</Label>
              <Input 
                id="edit-cat-name" 
                placeholder="e.g., Vegetables" 
                value={formData.name}
                onChange={(e) => setFormData({
                  ...formData, 
                  name: e.target.value,
                  slug: generateSlug(e.target.value)
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cat-slug">URL Slug *</Label>
              <Input 
                id="edit-cat-slug" 
                placeholder="e.g., vegetables" 
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cat-description">Description</Label>
              <Input 
                id="edit-cat-description" 
                placeholder="Category description..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditCategoryOpen(false);
              setSelectedCategory(null);
              resetForm();
            }}>Cancel</Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              onClick={handleUpdate}
              disabled={!formData.name.trim()}
            >
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the category "{selectedCategory?.name}". 
              {selectedCategory && selectedCategory.productCount > 0 && (
                <span className="text-red-600 font-medium block mt-2">
                  Warning: This category has {selectedCategory.productCount} products associated with it.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCategory(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConfirm}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
