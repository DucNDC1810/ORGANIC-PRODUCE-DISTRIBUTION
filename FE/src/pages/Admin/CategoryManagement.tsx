import { useState } from 'react';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  Search,
  Grid3x3,
  TrendingUp,
  FolderOpen,
  Sparkles,
  ShoppingBag,
  BarChart3,
  Zap,
  Star,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogOverlay } from '../../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Textarea } from '../../components/ui/textarea';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../../components/ui/alert-dialog';
import { Badge } from '../../components/ui/badge';

// Default icon and color mappings based on category slug
const CATEGORY_STYLES: Record<string, { icon: string; gradient: string; bgGradient: string; ringColor: string; glowColor: string }> = {
  vegetables: { 
    icon: '🥬', 
    gradient: 'from-emerald-400 via-green-500 to-teal-600', 
    bgGradient: 'from-emerald-50 via-green-50 to-teal-50',
    ringColor: 'ring-emerald-400/50',
    glowColor: 'shadow-emerald-500/50'
  },
  fruits: { 
    icon: '🍎', 
    gradient: 'from-rose-400 via-pink-500 to-red-600', 
    bgGradient: 'from-rose-50 via-pink-50 to-red-50',
    ringColor: 'ring-rose-400/50',
    glowColor: 'shadow-rose-500/50'
  },
  herbs: { 
    icon: '🌿', 
    gradient: 'from-teal-400 via-emerald-500 to-green-600', 
    bgGradient: 'from-teal-50 via-emerald-50 to-green-50',
    ringColor: 'ring-teal-400/50',
    glowColor: 'shadow-teal-500/50'
  },
  mushrooms: { 
    icon: '🍄', 
    gradient: 'from-orange-400 via-amber-500 to-yellow-600', 
    bgGradient: 'from-orange-50 via-amber-50 to-yellow-50',
    ringColor: 'ring-orange-400/50',
    glowColor: 'shadow-orange-500/50'
  },
  'dried-seafood': { 
    icon: '🦐', 
    gradient: 'from-blue-400 via-cyan-500 to-sky-600', 
    bgGradient: 'from-blue-50 via-cyan-50 to-sky-50',
    ringColor: 'ring-blue-400/50',
    glowColor: 'shadow-blue-500/50'
  },
  dairy: { 
    icon: '🥛', 
    gradient: 'from-yellow-300 via-amber-400 to-orange-500', 
    bgGradient: 'from-yellow-50 via-amber-50 to-orange-50',
    ringColor: 'ring-yellow-400/50',
    glowColor: 'shadow-yellow-500/50'
  },
  'milk-dairy': { 
    icon: '🥛', 
    gradient: 'from-amber-300 via-orange-400 to-yellow-500', 
    bgGradient: 'from-amber-50 via-orange-50 to-yellow-50',
    ringColor: 'ring-amber-400/50',
    glowColor: 'shadow-amber-500/50'
  },
};

const DEFAULT_STYLE = { 
  icon: '📦', 
  gradient: 'from-slate-400 via-gray-500 to-zinc-600', 
  bgGradient: 'from-slate-50 via-gray-50 to-zinc-50',
  ringColor: 'ring-slate-400/50',
  glowColor: 'shadow-slate-500/50'
};

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
        {/* Header Section với Glass morphism effect */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 p-8 shadow-2xl">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.5))] opacity-20"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-400/20 rounded-full blur-3xl"></div>
          
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-white/40 rounded-2xl blur-md"></div>
                  <div className="relative p-3 bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg ring-2 ring-white/50">
                    <Grid3x3 className="w-7 h-7 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-white drop-shadow-lg">
                    Category Management
                  </h1>
                  <p className="text-emerald-50 text-sm font-medium mt-1">Organize your product categories with style ✨</p>
                </div>
              </div>
            </div>
            <Dialog open={isAddCategoryOpen} onOpenChange={(open) => {
              setIsAddCategoryOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="relative overflow-hidden group bg-white text-emerald-600 hover:text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-bold px-6 py-6 rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                  <Plus className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Add Category</span>
                  <Sparkles className="w-4 h-4 ml-2 relative z-10 animate-pulse" />
                </Button>
              </DialogTrigger>
              <DialogOverlay className="bg-black/80 backdrop-blur-md" />
              <DialogContent className="sm:max-w-[520px] border-2">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    Create New Category
                  </DialogTitle>
                  <DialogDescription className="text-base">Add a new product category to organize your inventory</DialogDescription>
                </DialogHeader>
              <div className="grid gap-5 py-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-name" className="text-sm font-semibold">Category Name *</Label>
                  <Input 
                    id="cat-name" 
                    placeholder="e.g., Organic Vegetables" 
                    value={formData.name}
                    onChange={(e) => setFormData({
                      ...formData, 
                      name: e.target.value,
                      slug: generateSlug(e.target.value)
                    })}
                    className="border-2 focus:border-green-500 transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-slug" className="text-sm font-semibold">URL Slug *</Label>
                  <Input 
                    id="cat-slug" 
                    placeholder="e.g., organic-vegetables" 
                    value={formData.slug}
                    onChange={(e) => setFormData({...formData, slug: e.target.value})}
                    className="border-2 focus:border-green-500 transition-colors font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">Auto-generated from name. Can be customized.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-description" className="text-sm font-semibold">Description</Label>
                  <Textarea 
                    id="cat-description" 
                    placeholder="Brief description of this category..." 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="border-2 focus:border-green-500 transition-colors resize-none"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => {
                  setIsAddCategoryOpen(false);
                  resetForm();
                }} className="border-2">
                  Cancel
                </Button>
                <Button 
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md"
                  onClick={handleCreate}
                  disabled={!formData.name.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Category
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Statistics Cards với glassmorphism và animations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Total Categories Card */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <CardContent className="relative pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-blue-100 uppercase tracking-wider">Categories</p>
                    <Zap className="w-3 h-3 text-yellow-300 animate-pulse" />
                  </div>
                  <p className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">{categories.length}</p>
                  <p className="text-xs text-blue-100 font-medium">Active collections</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md"></div>
                  <div className="relative p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <FolderOpen className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Products Card */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500 via-green-600 to-teal-600 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <CardContent className="relative pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider">Products</p>
                    <ShoppingBag className="w-3 h-3 text-yellow-300" />
                  </div>
                  <p className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">{categories.reduce((sum, cat) => sum + cat.productCount, 0)}</p>
                  <p className="text-xs text-emerald-100 font-medium">Total inventory</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md"></div>
                  <div className="relative p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <Package className="w-8 h-8 text-emerald-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Products Card */}
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-purple-500 via-violet-600 to-fuchsia-600 shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
            <CardContent className="relative pt-6 pb-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-purple-100 uppercase tracking-wider">Average</p>
                    <BarChart3 className="w-3 h-3 text-yellow-300" />
                  </div>
                  <p className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">
                    {categories.length > 0 ? Math.round(categories.reduce((sum, cat) => sum + cat.productCount, 0) / categories.length) : 0}
                  </p>
                  <p className="text-xs text-purple-100 font-medium">Per category</p>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-md"></div>
                  <div className="relative p-4 bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl group-hover:scale-110 transition-transform duration-300">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar với enhanced styling */}
        <Card className="relative overflow-hidden border-2 border-slate-200 bg-white shadow-lg hover:shadow-xl transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-50/50 via-transparent to-blue-50/50"></div>
          <CardContent className="relative pt-6 pb-6">
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <Search className="w-5 h-5 text-emerald-500" />
              </div>
              <Input
                placeholder="🔍 Search categories by name or slug..."
                className="pl-12 pr-4 h-14 text-base border-2 border-slate-200 focus:border-emerald-500 rounded-xl bg-white/80 backdrop-blur-sm font-medium transition-all duration-300 placeholder:text-slate-400"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Categories Grid với enhanced cards */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {filteredCategories.map((category) => {
              const style = getCategoryStyle(category.slug);
              return (
                <Card 
                  key={category.id} 
                  className="group relative overflow-hidden border-0 bg-white shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 rounded-2xl"
                >
                  {/* Gradient border effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl`}></div>
                  <div className="absolute inset-[2px] bg-white rounded-2xl"></div>
                  
                  {/* Top gradient accent bar */}
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${style.gradient} ${style.glowColor} shadow-lg`} />
                  
                  {/* Background decorative elements */}
                  <div className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${style.bgGradient} rounded-full blur-3xl opacity-30 group-hover:opacity-50 transition-opacity duration-500`}></div>
                  
                  <CardHeader className="relative pb-3 pt-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Icon with glow effect */}
                        <div className="relative flex-shrink-0">
                          <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300`}></div>
                          <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-br ${style.gradient} shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 ring-4 ${style.ringColor}`}>
                            <span className="drop-shadow-lg filter">{style.icon}</span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xl font-black text-gray-900 truncate group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:bg-clip-text group-hover:from-gray-900 group-hover:to-gray-600 transition-all duration-300">
                            {category.name}
                          </CardTitle>
                          <CardDescription className="text-xs font-mono mt-1 flex items-center gap-1">
                            <span className="text-slate-400">/{category.slug}</span>
                          </CardDescription>
                        </div>
                      </div>
                      
                      {/* Status badge */}
                      <Badge className={`bg-gradient-to-r ${style.gradient} text-white border-0 shadow-md font-bold px-2 py-1`}>
                        <Star className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                    
                    {category.description && (
                      <div className="relative">
                        <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed font-medium">
                          {category.description}
                        </p>
                      </div>
                    )}
                  </CardHeader>
                  
                  <CardContent className="relative space-y-4 pb-6">
                    {/* Product count display với glassmorphism */}
                    <div className={`relative overflow-hidden flex items-center justify-between p-5 rounded-xl bg-gradient-to-br ${style.bgGradient} border-2 ${style.ringColor} backdrop-blur-sm group-hover:scale-[1.02] transition-transform duration-300`}>
                      <div className="absolute inset-0 bg-white/40"></div>
                      <div className="relative">
                        <p className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                          {category.productCount}
                        </p>
                        <p className="text-xs font-bold text-gray-600 mt-1 uppercase tracking-wide">Products</p>
                      </div>
                      <div className={`relative w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${style.gradient} shadow-lg ${style.glowColor} ring-4 ring-white`}>
                        <Package className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    
                    <Separator className="bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
                    
                    {/* Action buttons */}
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="group/btn relative flex-1 border-2 border-blue-200 hover:border-blue-500 bg-white hover:bg-blue-500 text-blue-600 hover:text-white transition-all duration-300 overflow-hidden font-bold py-5 rounded-lg"
                        onClick={() => handleEditClick(category)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        <Edit className="w-4 h-4 mr-2 relative z-10" />
                        <span className="relative z-10">Edit</span>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="group/btn relative border-2 border-red-200 hover:border-red-500 bg-white hover:bg-red-500 text-red-600 hover:text-white transition-all duration-300 overflow-hidden font-bold py-5 px-4 rounded-lg"
                        onClick={() => handleDeleteClick(category)}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 transform translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                        <Trash2 className="w-4 h-4 relative z-10" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="relative overflow-hidden border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-gray-50 shadow-lg">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(100,181,246,0.1),transparent_50%)]"></div>
            <CardContent className="relative flex flex-col items-center justify-center py-20">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-gray-300 rounded-full blur-2xl opacity-50"></div>
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-gray-200 flex items-center justify-center shadow-xl ring-4 ring-white">
                  <Package className="w-12 h-12 text-slate-400" />
                </div>
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">No categories found</h3>
              <p className="text-base text-gray-500 mb-8 text-center max-w-md leading-relaxed">
                {searchTerm 
                  ? "🔍 Try adjusting your search terms or clear the filter to see all categories."
                  : "🚀 Get started by creating your first product category and organize your inventory!"}
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => setIsAddCategoryOpen(true)}
                  className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 font-bold px-8 py-6 text-base rounded-xl"
                >
                  <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                  <Plus className="w-5 h-5 mr-2 relative z-10" />
                  <span className="relative z-10">Create First Category</span>
                  <Sparkles className="w-4 h-4 ml-2 relative z-10 animate-pulse" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryOpen} onOpenChange={(open) => {
        setIsEditCategoryOpen(open);
        if (!open) {
          setSelectedCategory(null);
          resetForm();
        }
      }}>
        <DialogOverlay className="bg-black/80 backdrop-blur-md" />
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Edit Category
            </DialogTitle>
            <DialogDescription>Update category information and details</DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cat-name" className="text-sm font-semibold">Category Name *</Label>
              <Input 
                id="edit-cat-name" 
                placeholder="e.g., Organic Vegetables" 
                value={formData.name}
                onChange={(e) => setFormData({
                  ...formData, 
                  name: e.target.value,
                  slug: generateSlug(e.target.value)
                })}
                className="border-2 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cat-slug" className="text-sm font-semibold">URL Slug *</Label>
              <Input 
                id="edit-cat-slug" 
                placeholder="e.g., organic-vegetables" 
                value={formData.slug}
                onChange={(e) => setFormData({...formData, slug: e.target.value})}
                className="border-2 focus:border-blue-500 transition-colors font-mono text-sm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cat-description" className="text-sm font-semibold">Description</Label>
              <Textarea 
                id="edit-cat-description" 
                placeholder="Brief description of this category..." 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="border-2 focus:border-blue-500 transition-colors resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              setIsEditCategoryOpen(false);
              setSelectedCategory(null);
              resetForm();
            }} className="border-2">
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-md"
              onClick={handleUpdate}
              disabled={!formData.name.trim()}
            >
              <Edit className="w-4 h-4 mr-2" />
              Update Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="backdrop-blur-sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold">Delete Category?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <strong className="text-gray-900">"{selectedCategory?.name}"</strong>?
              </p>
              {selectedCategory && selectedCategory.productCount > 0 && (
                <Badge variant="destructive" className="text-sm py-1.5 px-3">
                  ⚠️ Warning: {selectedCategory.productCount} products are linked to this category
                </Badge>
              )}
              <p className="text-sm">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedCategory(null)} className="border-2">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-md"
              onClick={handleDeleteConfirm}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Category
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </div>
  );
}
