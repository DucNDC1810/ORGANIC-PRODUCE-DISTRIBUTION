import { useState } from 'react';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  Search,
  FolderOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogOverlay } from '../../components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';

// Simplified category styles
const CATEGORY_STYLES: Record<string, { icon: string; color: string }> = {
  vegetables: { icon: '🥬', color: 'from-green-500 to-emerald-600' },
  fruits: { icon: '🍎', color: 'from-red-500 to-pink-600' },
  herbs: { icon: '🌿', color: 'from-teal-500 to-green-600' },
  mushrooms: { icon: '🍄', color: 'from-orange-500 to-amber-600' },
  'dried-seafood': { icon: '🦐', color: 'from-blue-500 to-cyan-600' },
  dairy: { icon: '🥛', color: 'from-yellow-500 to-orange-600' },
  'milk-dairy': { icon: '🥛', color: 'from-amber-500 to-yellow-600' },
};

const DEFAULT_STYLE = { icon: '📦', color: 'from-gray-500 to-slate-600' };

const getCategoryStyle = (slug: string) => CATEGORY_STYLES[slug] || DEFAULT_STYLE;

interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
  description?: string;
}

const initialCategories: Category[] = [
  { id: '1', name: 'Vegetables', slug: 'vegetables', productCount: 45, description: 'Fresh organic vegetables' },
  { id: '2', name: 'Fruits', slug: 'fruits', productCount: 32, description: 'Fresh organic fruits' },
  { id: '3', name: 'Herbs', slug: 'herbs', productCount: 18, description: 'Fresh herbs and spices' },
  { id: '4', name: 'Mushrooms', slug: 'mushrooms', productCount: 12, description: 'Organic mushrooms' },
  { id: '5', name: 'Dried Seafood', slug: 'dried-seafood', productCount: 25, description: 'Dried seafood products' },
];

export default function AdminCategoryManagement() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [isEditCategoryOpen, setIsEditCategoryOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const resetForm = () => setFormData({ name: '', slug: '', description: '' });

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

  const handleEditClick = (category: Category) => {
    setSelectedCategory(category);
    setFormData({ name: category.name, slug: category.slug, description: category.description || '' });
    setIsEditCategoryOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedCategory || !formData.name.trim()) return;
    setCategories(categories.map(cat => 
      cat.id === selectedCategory.id 
        ? { ...cat, name: formData.name, slug: formData.slug || generateSlug(formData.name), description: formData.description }
        : cat
    ));
    setIsEditCategoryOpen(false);
    setSelectedCategory(null);
    resetForm();
  };

  const handleDeleteClick = (category: Category) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!selectedCategory) return;
    setCategories(categories.filter(cat => cat.id !== selectedCategory.id));
    setIsDeleteDialogOpen(false);
    setSelectedCategory(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Category Management
            </h2>
            <p className="text-sm text-gray-600 mt-0.5">Organize your product categories</p>
          </div>
          <Dialog open={isAddCategoryOpen} onOpenChange={(open) => { setIsAddCategoryOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">Create New Category</DialogTitle>
                <DialogDescription>Add a new product category</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name *</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g., Organic Vegetables" 
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input 
                    id="slug" 
                    placeholder="e.g., organic-vegetables" 
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    placeholder="Brief description..." 
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddCategoryOpen(false); resetForm(); }}>Cancel</Button>
                <Button className="bg-green-600 hover:bg-green-700" onClick={handleCreate} disabled={!formData.name.trim()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-blue-700">Total Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-900">{categories.length}</div>
              <p className="text-[10px] text-blue-600 mt-0.5">Active collections</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-green-700">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-900">{categories.reduce((sum, cat) => sum + cat.productCount, 0)}</div>
              <p className="text-[10px] text-green-600 mt-0.5">In all categories</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-purple-700">Average</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">
                {categories.length > 0 ? Math.round(categories.reduce((sum, cat) => sum + cat.productCount, 0) / categories.length) : 0}
              </div>
              <p className="text-[10px] text-purple-600 mt-0.5">Per category</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="shadow-md">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search categories..."
                className="pl-10 border-gray-300 focus:border-green-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => {
              const style = getCategoryStyle(category.slug);
              return (
                <Card key={category.id} className="bg-white border shadow-md hover:shadow-lg transition-all hover:-translate-y-1">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${style.color} flex items-center justify-center shadow-sm`}>
                        <span className="text-2xl">{style.icon}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-bold text-gray-900">{category.name}</h3>
                        <code className="text-[10px] text-gray-500 font-mono">/{category.slug}</code>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-3 line-clamp-2">{category.description || 'No description'}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-semibold text-gray-900">{category.productCount}</span>
                      <span className="text-xs text-gray-500">products</span>
                    </div>
                    <Separator className="mb-3" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 text-xs hover:bg-green-50 hover:text-green-700" onClick={() => handleEditClick(category)}>
                        <Edit className="w-3 h-3 mr-1" />Edit
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 text-xs hover:bg-red-50 hover:text-red-700" onClick={() => handleDeleteClick(category)}>
                        <Trash2 className="w-3 h-3 mr-1" />Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-2 border-dashed border-gray-300 bg-gray-50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FolderOpen className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No categories found</h3>
              <p className="text-sm text-gray-500 mb-6">
                {searchTerm ? `No results for "${searchTerm}"` : 'Create your first category'}
              </p>
              {!searchTerm && (
                <Button className="bg-green-600 hover:bg-green-700" onClick={() => setIsAddCategoryOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />Create Category
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={(open) => { setIsEditCategoryOpen(open); if (!open) { setSelectedCategory(null); resetForm(); } }}>
        <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Category</DialogTitle>
            <DialogDescription>Update category information</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name *</Label>
              <Input id="edit-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-slug">URL Slug *</Label>
              <Input id="edit-slug" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea id="edit-description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsEditCategoryOpen(false); setSelectedCategory(null); resetForm(); }}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={handleUpdate} disabled={!formData.name.trim()}>
              <Edit className="w-4 h-4 mr-2" />Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete <strong>{selectedCategory?.name}</strong>?</p>
              {selectedCategory && selectedCategory.productCount > 0 && (
                <p className="text-red-600 text-sm">Warning: This category has {selectedCategory.productCount} products!</p>
              )}
              <p className="text-sm">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCategory(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDeleteConfirm}>
              <Trash2 className="w-4 h-4 mr-2" />Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
