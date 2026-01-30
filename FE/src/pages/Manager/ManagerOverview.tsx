import { 
  Package, 
  ShoppingCart, 
  Users,
  TrendingUp,
  DollarSign,
  Plus,
  BarChart3,
  Download,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

// Mock data
const recentOrders = [
  { id: '#ORD-001', customer: 'John Smith', date: '2025-01-30', items: 3, total: 45.90, status: 'Completed' },
  { id: '#ORD-002', customer: 'Emma Wilson', date: '2025-01-30', items: 2, total: 32.50, status: 'Processing' },
  { id: '#ORD-003', customer: 'Michael Brown', date: '2025-01-29', items: 5, total: 78.30, status: 'Shipped' },
  { id: '#ORD-004', customer: 'Sarah Davis', date: '2025-01-29', items: 4, total: 55.20, status: 'Processing' },
  { id: '#ORD-005', customer: 'James Johnson', date: '2025-01-28', items: 2, total: 29.90, status: 'Completed' },
];

const lowStockItems = [
  { name: 'Fresh Strawberries', stock: 8, threshold: 20, category: 'Fruits' },
  { name: 'Organic Kale', stock: 12, threshold: 25, category: 'Vegetables' },
  { name: 'Cherry Tomatoes', stock: 15, threshold: 30, category: 'Vegetables' },
  { name: 'Fresh Raspberries', stock: 6, threshold: 20, category: 'Fruits' },
];

const categorySalesData = [
  { category: 'Fruits', sales: 45280, color: '#ff6b6b' },
  { category: 'Vegetables', sales: 38450, color: '#2D5A27' },
  { category: 'Herbs', sales: 18920, color: '#51cf66' },
  { category: 'Mushrooms', sales: 12340, color: '#ffd43b' },
];

const revenueData = [
  { date: 'Jan 24', revenue: 12500, orders: 45 },
  { date: 'Jan 25', revenue: 15800, orders: 52 },
  { date: 'Jan 26', revenue: 14200, orders: 48 },
  { date: 'Jan 27', revenue: 18400, orders: 58 },
  { date: 'Jan 28', revenue: 19800, orders: 65 },
  { date: 'Jan 29', revenue: 22400, orders: 71 },
  { date: 'Jan 30', revenue: 25600, orders: 78 },
];

const aiInsights = [
  { product: 'Fresh Strawberries', prediction: 'Stock depleting in 3 days', confidence: 92, action: 'Reorder now' },
  { product: 'Organic Kale', prediction: 'High demand expected', confidence: 85, action: 'Increase stock' },
  { product: 'Cherry Tomatoes', prediction: 'Running low', confidence: 88, action: 'Order 50 units' },
];

export default function ManagerOverview() {
  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      'Completed': { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      'Processing': { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      'Shipped': { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      'Cancelled': { className: 'bg-red-100 text-red-800 hover:bg-red-100' },
    };
    return statusConfig[status] || { className: 'bg-gray-100 text-gray-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Dashboard Overview</h2>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
        </div>
        <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-md">
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards with Trend Lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sales</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">$124,580</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                +12.5%
              </span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">417</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                +8.2%
              </span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">107</h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-purple-600 font-medium">
                <Plus className="w-4 h-4" />
                5 new
              </span>
              <span className="text-gray-500">this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">1,248</h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                +15.3%
              </span>
              <span className="text-gray-500">vs last month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Sales by Category */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Product Sales by Category</CardTitle>
            <CardDescription>Revenue distribution across categories</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categorySalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="category" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Bar dataKey="sales" fill="#2D5A27" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Trends */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Revenue Trends</CardTitle>
            <CardDescription>7-day revenue and order trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2D5A27" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#2D5A27" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#2D5A27" fillOpacity={1} fill="url(#colorRevenue)" />
                <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Widget */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">AI Insights</CardTitle>
          </div>
          <CardDescription>Predictive analytics for inventory management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {aiInsights.map((insight, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{insight.product}</p>
                    <p className="text-sm text-gray-600">{insight.prediction}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {insight.confidence}% confidence
                  </Badge>
                  <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white">
                    {insight.action}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Orders & Low Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Recent Orders</CardTitle>
                <CardDescription>Latest customer orders</CardDescription>
              </div>
              <Button variant="outline" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No orders yet</h3>
                <p className="text-sm text-gray-500">Orders will appear here once customers start purchasing</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer} • {order.items} items</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${order.total}</p>
                      <Badge {...getStatusBadge(order.status)} className="mt-1">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-sm border-l-4 border-l-red-500">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Low Stock Alerts</CardTitle>
                <CardDescription>Products requiring restock</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">All stocked up!</h3>
                <p className="text-sm text-gray-500">No low stock alerts at the moment</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">
                        <Badge variant="outline" className="bg-white text-gray-700 text-xs">
                          {item.category}
                        </Badge>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-600">{item.stock}</p>
                      <p className="text-xs text-gray-500">Min: {item.threshold}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
