import { Plus, FolderTree, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';

// Mock data
const mockCategories = [
  { id: '1', name: 'Rau củ', slug: 'vegetables', productCount: 45, description: 'Rau củ hữu cơ tươi ngon', color: '#10b981' },
  { id: '2', name: 'Trái cây', slug: 'fruits', productCount: 32, description: 'Trái cây hữu cơ ngọt tự nhiên', color: '#f59e0b' },
  { id: '3', name: 'Thảo mộc', slug: 'herbs', productCount: 18, description: 'Thảo mộc và gia vị tươi', color: '#8b5cf6' },
  { id: '4', name: 'Nấm', slug: 'mushrooms', productCount: 12, description: 'Nấm hữu cơ cao cấp', color: '#ef4444' },
];

export default function ProductCategories() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Product Categories</h2>
          <p className="text-muted-foreground">Manage produce categories</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Category</DialogTitle>
              <DialogDescription>Create a new product category</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="cat-name">Category Name</Label>
                <Input id="cat-name" placeholder="e.g. Vegetables" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-slug">Slug</Label>
                <Input id="cat-slug" placeholder="e.g. vegetables" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-desc">Description</Label>
                <Textarea id="cat-desc" placeholder="Category description..." rows={3} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cat-color">Color</Label>
                <Input id="cat-color" type="color" defaultValue="#10b981" />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700">
                Add Category
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockCategories.map((category) => (
          <Card key={category.id} className="border-l-4" style={{ borderLeftColor: category.color }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: category.color }}>
                    <FolderTree className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle>{category.name}</CardTitle>
                    <CardDescription>{category.slug}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="text-lg">
                  {category.productCount}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
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
