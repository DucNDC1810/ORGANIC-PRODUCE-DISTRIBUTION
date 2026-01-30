import { useState } from 'react';
import { 
  Package, 
  Plus,
  Edit,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';

// Mock data
const mockCategories = [
  { id: '1', name: 'Vegetables', slug: 'vegetables', productCount: 45, icon: '🥬', color: '#2D5A27' },
  { id: '2', name: 'Fruits', slug: 'fruits', productCount: 32, icon: '🍎', color: '#ff6b6b' },
  { id: '3', name: 'Herbs', slug: 'herbs', productCount: 18, icon: '🌿', color: '#51cf66' },
  { id: '4', name: 'Mushrooms', slug: 'mushrooms', productCount: 12, icon: '🍄', color: '#ffd43b' },
];

export default function ManagerCategoryManagement() {
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Category Management</h2>
          <p className="text-muted-foreground mt-1">Organize your product categories</p>
        </div>
        <Dialog open={isAddCategoryOpen} onOpenChange={setIsAddCategoryOpen}>
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
                <Input id="cat-name" placeholder="e.g., Vegetables" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-slug">URL Slug *</Label>
                <Input id="cat-slug" placeholder="e.g., vegetables" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-icon">Icon (Emoji)</Label>
                <Input id="cat-icon" placeholder="🥬" maxLength={2} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-color">Brand Color</Label>
                <div className="flex gap-2">
                  <Input id="cat-color" type="color" defaultValue="#2D5A27" className="w-20" />
                  <Input placeholder="#2D5A27" className="flex-1" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsAddCategoryOpen(false)}>Cancel</Button>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                Create Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCategories.map((category) => (
          <Card key={category.id} className="shadow-sm hover:shadow-md transition-all border-l-4" style={{ borderLeftColor: category.color }}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl shadow-sm" style={{ backgroundColor: `${category.color}15` }}>
                    {category.icon}
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
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{category.productCount}</p>
                  <p className="text-sm text-gray-500">Products</p>
                </div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${category.color}20` }}>
                  <Package className="w-6 h-6" style={{ color: category.color }} />
                </div>
              </div>
              <Separator className="my-4" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
