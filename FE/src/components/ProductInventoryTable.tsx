import { Edit2, Trash2, Plus } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}

const mockProducts: Product[] = [
  { id: '1', name: 'Organic Tomatoes', category: 'Vegetables', price: '$4.99', stock: 150, status: 'In Stock' },
  { id: '2', name: 'Fresh Carrots', category: 'Vegetables', price: '$3.49', stock: 220, status: 'In Stock' },
  { id: '3', name: 'Green Lettuce', category: 'Vegetables', price: '$2.99', stock: 45, status: 'Low Stock' },
  { id: '4', name: 'Bell Peppers', category: 'Vegetables', price: '$5.49', stock: 180, status: 'In Stock' },
  { id: '5', name: 'Fresh Apples', category: 'Fruits', price: '$3.99', stock: 200, status: 'In Stock' },
  { id: '6', name: 'Organic Bananas', category: 'Fruits', price: '$2.49', stock: 0, status: 'Out of Stock' },
  { id: '7', name: 'Sweet Oranges', category: 'Fruits', price: '$4.49', stock: 165, status: 'In Stock' },
  { id: '8', name: 'Fresh Berries', category: 'Fruits', price: '$6.99', stock: 80, status: 'In Stock' },
  { id: '9', name: 'Organic Cucumbers', category: 'Vegetables', price: '$3.29', stock: 120, status: 'In Stock' },
  { id: '10', name: 'Fresh Spinach', category: 'Vegetables', price: '$4.29', stock: 35, status: 'Low Stock' },
];

export default function ProductInventoryTable() {
  const getStatusColor = (status: Product['status']) => {
    switch (status) {
      case 'In Stock':
        return 'bg-green-100 text-green-800';
      case 'Low Stock':
        return 'bg-yellow-100 text-yellow-800';
      case 'Out of Stock':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search products..."
            className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <select className="px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">All Categories</option>
            <option value="vegetables">Vegetables</option>
            <option value="fruits">Fruits</option>
          </select>
        </div>
        <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity">
          <Plus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-secondary">
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground">Product Name</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground">Category</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground">Price</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground">Stock</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground">Status</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockProducts.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{product.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">{product.category}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-primary">{product.price}</td>
                  <td className="px-6 py-4 text-sm text-foreground">{product.stock} units</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Edit">
                        <Edit2 className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </button>
                      <button className="p-2 hover:bg-secondary rounded-lg transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">1-10</span> of <span className="font-medium text-foreground">10</span> products
          </p>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Previous
            </button>
            <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm">
              1
            </button>
            <button className="px-4 py-2 border border-border rounded-lg text-sm hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed" disabled>
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Products</p>
          <p className="text-2xl font-bold text-foreground">10</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">In Stock</p>
          <p className="text-2xl font-bold text-green-600">7</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">2</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground mb-1">Out of Stock</p>
          <p className="text-2xl font-bold text-red-600">1</p>
        </div>
      </div>
    </div>
  );
}
