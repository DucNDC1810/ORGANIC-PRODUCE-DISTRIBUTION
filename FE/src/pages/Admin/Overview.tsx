import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  Plus 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data
const revenueData = [
  { month: 'T1', revenue: 12500, orders: 45 },
  { month: 'T2', revenue: 15800, orders: 52 },
  { month: 'T3', revenue: 18200, orders: 68 },
  { month: 'T4', revenue: 22400, orders: 78 },
  { month: 'T5', revenue: 19800, orders: 65 },
  { month: 'T6', revenue: 25600, orders: 85 },
];

const categoryData = [
  { name: 'Rau củ', value: 45, color: '#10b981' },
  { name: 'Trái cây', value: 32, color: '#f59e0b' },
  { name: 'Thảo mộc', value: 18, color: '#8b5cf6' },
  { name: 'Nấm', value: 12, color: '#ef4444' },
];

const topProducts = [
  { name: 'Organic Avocados', sold: 245, revenue: 1467.55 },
  { name: 'Mixed Greens', sold: 198, revenue: 889.02 },
  { name: 'Fresh Strawberries', sold: 176, revenue: 1230.24 },
  { name: 'Organic Tomatoes', sold: 165, revenue: 823.35 },
  { name: 'Fresh Blueberries', sold: 142, revenue: 1134.58 },
];

const mockOrders = [
  { id: '#ORD-001', customer: 'Nguyễn Văn A', date: '2025-01-26', total: 45.90, status: 'Đang giao', items: 3, payment: 'Đã thanh toán' },
  { id: '#ORD-002', customer: 'Trần Thị B', date: '2025-01-26', total: 32.50, status: 'Đang xử lý', items: 2, payment: 'Đã thanh toán' },
  { id: '#ORD-003', customer: 'Lê Văn C', date: '2025-01-25', total: 78.30, status: 'Hoàn thành', items: 5, payment: 'Đã thanh toán' },
  { id: '#ORD-004', customer: 'Phạm Thị D', date: '2025-01-25', total: 55.20, status: 'Đang giao', items: 4, payment: 'Đã thanh toán' },
  { id: '#ORD-005', customer: 'Hoàng Văn E', date: '2025-01-24', total: 29.90, status: 'Đã hủy', items: 2, payment: 'Đã hoàn tiền' },
];

const getStatusBadge = (status: string) => {
  const statusConfig: any = {
    'Đang giao': { variant: 'default', className: 'bg-blue-500 hover:bg-blue-600' },
    'Đang xử lý': { variant: 'secondary', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
    'Hoàn thành': { variant: 'default', className: 'bg-green-500 hover:bg-green-600' },
    'Đã hủy': { variant: 'destructive', className: '' },
  };
  return statusConfig[status] || { variant: 'default', className: '' };
};

export default function Overview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back! Here's your overview report.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">$114,300</div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +12.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
            <ShoppingCart className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">393</div>
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +8.2% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">1,248</div>
            <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              +15.3% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">107</div>
            <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
              <Plus className="w-3 h-3" />
              5 new products this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>6-Month Revenue</CardTitle>
            <CardDescription>Revenue and orders chart</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue ($)" />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
            <CardDescription>Products by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(2) : '0'}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>5 latest orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{order.id}</p>
                    <p className="text-sm text-muted-foreground">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${order.total}</p>
                    <Badge {...getStatusBadge(order.status)} className="mt-1">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Top 5 products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.sold} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-green-600">${product.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
