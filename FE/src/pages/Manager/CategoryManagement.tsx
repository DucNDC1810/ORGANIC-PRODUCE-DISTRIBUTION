import { useState, useEffect } from 'react';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Badge } from '../../components/ui/badge';
import { useCategories } from '../../hooks/useCategories';
import { Category, CreateCategoryData, UpdateCategoryData } from '../../services/categoryService';

// Default icon and color mappings based on category slug
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  vegetables: { icon: '🥬', color: '#2D5A27' },
  fruits: { icon: '🍎', color: '#E53935' },
  herbs: { icon: '🌿', color: '#43A047' },
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

// Form state type
interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
}

const emptyFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
};

export default function ManagerCategoryManagement() {
  // Use categories hook for API calls
  const {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    selectedCategory,
    setSelectedCategory,
  } = useCategories();

  // Local state
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<CategoryFormData>(emptyFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch categories on mount and when search changes
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCategories({
        search: searchTerm || undefined,
        limit: 50, // Get more categories for grid view
      });
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [fetchCategories, searchTerm]);

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

  const visibleCategories = categories.filter((category) => category.slug !== 'mushrooms');

  // Reset form
  const resetForm = () => {
    setFormData(emptyFormData);
    setSelectedCategory(null);
  };

  // Map category to form data
  const mapCategoryToForm = (category: Category): CategoryFormData => {
    return {
      name: category.name,
      slug: category.slug,
      description: category.description || '',
    };
  };

  // Map form data to API data
  const mapFormToCreateData = (): CreateCategoryData => {
    return {
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description || undefined,
    };
  };

  const mapFormToUpdateData = (): UpdateCategoryData => {
    return {
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      description: formData.description || undefined,
    };
  };

  // Handle Create
  const handleCreate = async () => {
    if (!formData.name.trim()) return;
    
    setIsSubmitting(true);
    const data = mapFormToCreateData();
    const result = await createCategory(data);
    setIsSubmitting(false);
    
    if (result) {
      setIsAddCategoryOpen(false);
      resetForm();
    }
  };

  // Handle Edit - Open dialog
  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setFormData(mapCategoryToForm(category));
    setIsEditCategoryOpen(true);
  };

  // Handle Update
  const handleUpdate = async () => {
    if (!selectedCategory || !formData.name.trim()) return;
    
    setIsSubmitting(true);
    const data = mapFormToUpdateData();
    const result = await updateCategory(selectedCategory._id, data);
    setIsSubmitting(false);
    
    if (result) {
      setIsEditCategoryOpen(false);
      resetForm();
    }
  };

  // Handle Delete - Open dialog
  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  // Handle Delete - Confirm
  const handleDeleteConfirm = async () => {
    if (!selectedCategory) return;
    
    setIsSubmitting(true);
    const hasProducts = selectedCategory.productCount > 0;
    const success = await deleteCategory(selectedCategory._id, hasProducts);
    setIsSubmitting(false);
    
    if (success) {
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  // Handle Refresh
  const handleRefresh = () => {
    fetchCategories({
      search: searchTerm || undefined,
      limit: 50,
    });
  };

  // Calculate totals
  const totalProducts = categories.reduce((sum, cat) => sum + cat.productCount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Category Management</h2>
          <p className="text-muted-foreground mt-1">Organize your product categories</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
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
                disabled={!formData.name.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Category'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        </div>
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
        <span>Total Categories: <strong className="text-foreground">{visibleCategories.length}</strong></span>
        <span>Total Products: <strong className="text-foreground">{totalProducts}</strong></span>
      </div>

      {/* Loading state */}
      {loading && categories.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          <span className="ml-2 text-muted-foreground">Loading categories...</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleCategories.map((category) => {
          const style = getCategoryStyle(category.slug);
          return (
          <Card key={category._id} className="shadow-sm hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: style.color }}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm" style={{ backgroundColor: `${style.color}15` }}>
                    {style.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {category.name}
                      {!category.isActive && (
                        <Badge variant="secondary" className="text-xs">Inactive</Badge>
                      )}
                    </CardTitle>
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

      {!loading && visibleCategories.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No categories found</p>
          <p className="text-sm mt-1">Create your first category to get started</p>
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
              disabled={!formData.name.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Category'
              )}
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
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
