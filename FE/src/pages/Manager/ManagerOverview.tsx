import { useState, useEffect } from 'react';
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
  Loader2,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  dashboardService,
  type OrderStats,
  type ProductStats,
  type UserStats,
  type RecentOrder,
  type LowStockProduct,
  type RevenueDataPoint,
  type CategoryWithCount,
} from '../../services/dashboardService';

export default function ManagerOverview() {
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [productStats, setProductStats] = useState<ProductStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const stats = await dashboardService.getStats();
        setOrderStats(stats.orderStats);
        setProductStats(stats.productStats);
        setUserStats(stats.userStats);
        setRecentOrders(stats.recentOrders ?? []);
        setLowStockItems(stats.lowStockItems ?? []);
        setRevenueData(stats.revenueByDay ?? []);
        setCategories(stats.categoryProductCounts ?? []);
      } catch (err) {
        console.error('[Dashboard] Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  // Map categories to chart-friendly format (top 6 by productCount)
  const categorySalesData = categories
    .filter((c) => c.productCount > 0)
    .sort((a, b) => b.productCount - a.productCount)
    .slice(0, 6)
    .map((c) => ({ category: c.name, products: c.productCount }));

  // Format YYYY-MM-DD → "Mar 9" for revenue chart x-axis
  const revenueChartData = revenueData.map((d) => ({
    ...d,
    date: new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }),
  }));

  const getStatusBadge = (status: string) => {
    const normalised = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    const statusConfig: Record<string, { className: string }> = {
      Completed:  { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      Delivered:  { className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      Processing: { className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' },
      Confirmed:  { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      Shipped:    { className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      Pending:    { className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
      Cancelled:  { className: 'bg-red-100 text-red-800 hover:bg-red-100' },
      Refunded:   { className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
    };
    return statusConfig[normalised] ?? { className: 'bg-gray-100 text-gray-800' };
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
      </div>
    );
  }

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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <h3 className="text-3xl font-bold text-foreground mt-1">
                  {orderStats ? formatCurrency(orderStats.totalRevenue) : '—'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-green-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                All time
              </span>
              <span className="text-gray-500">total revenue</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                  {orderStats ? orderStats.totalOrders.toLocaleString() : '—'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                All time
              </span>
              <span className="text-gray-500">total orders</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                  {productStats ? productStats.activeProducts.toLocaleString() : '—'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-purple-600 font-medium">
                <Plus className="w-4 h-4" />
                {productStats ? productStats.lowStockProducts : 0} low stock
              </span>
              <span className="text-gray-500">need restock</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-1">
                  {userStats ? userStats.totalUsers.toLocaleString() : '—'}
                </h3>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="flex items-center gap-1 text-orange-600 font-medium">
                <TrendingUp className="w-4 h-4" />
                +{userStats?.newUsersThisMonth ?? 0}
              </span>
              <span className="text-gray-500">new this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Category */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Products by Category</CardTitle>
            <CardDescription>Number of products per category</CardDescription>
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
                <Bar dataKey="products" fill="#2D5A27" radius={[8, 8, 0, 0]} />
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
              <AreaChart data={revenueChartData}>
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

      {/* AI Insights Widget — driven by real low-stock data */}
      <Card className="border-l-4 border-l-purple-500 shadow-sm bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg font-semibold text-gray-900">Low Stock Insights</CardTitle>
          </div>
          <CardDescription>Products that need your attention soon</CardDescription>
        </CardHeader>
        <CardContent>
          {lowStockItems.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-gray-500">All products are well-stocked!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockItems.slice(0, 5).map((item) => (
                <div key={item._id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-purple-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">Only {item.stock} units remaining</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                      {item.category}
                    </Badge>
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                      Restock needed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                  <div key={order._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-semibold text-gray-900">
                        #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {order.userId?.name ?? 'Unknown'} • {order.items.length} items
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatCurrency(order.totalAmount)}</p>
                      <Badge {...getStatusBadge(order.status)} className="mt-1">
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
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
                {lowStockItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
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
                      <p className="text-xs text-gray-500">Min: 10</p>
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
