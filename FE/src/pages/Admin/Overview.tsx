import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  TrendingUp, 
  Plus,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { categoryService, Category } from '../../services/categoryService';
import api from '../../services/api';

const CHART_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending:    { label: 'Pending',    className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
  confirmed:  { label: 'Confirmed',  className: 'bg-blue-400 hover:bg-blue-500 text-white' },
  processing: { label: 'Processing', className: 'bg-orange-500 hover:bg-orange-600 text-white' },
  shipped:    { label: 'Shipped',    className: 'bg-indigo-500 hover:bg-indigo-600 text-white' },
  delivered:  { label: 'Delivered',  className: 'bg-green-500 hover:bg-green-600 text-white' },
  cancelled:  { label: 'Cancelled',  className: 'bg-red-500 hover:bg-red-600 text-white' },
  refunded:   { label: 'Refunded',   className: 'bg-gray-500 hover:bg-gray-600 text-white' },
};

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface RevenuePoint { month: string; revenue: number; orders: number; }
interface CategoryPoint { name: string; value: number; color: string; [key: string]: unknown; }
interface TopProduct    { name: string; sold: number; revenue: number; }
interface RecentOrder   { _id: string; customerName: string; total: number; status: string; }
interface UserStatsData {
  totalUsers: number;
  usersByRole?: Record<string, number>;
}

const humanizeCategorySlug = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const normalizeSlugToken = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export default function Overview() {
  const [loading, setLoading]           = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders]   = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalProducts, setTotalProducts]   = useState(0);
  const [revenueData, setRevenueData]   = useState<RevenuePoint[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryPoint[]>([]);
  const [topProducts, setTopProducts]   = useState<TopProduct[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    async function fetchAll() {
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const startDate = sixMonthsAgo.toISOString().split('T')[0];

        const fetchAllOrders = async (params: Record<string, unknown> = {}) => {
          const firstPage = await orderService.getAllOrders({ ...params, page: 1, limit: 100 }) as any;
          const orders = [...(firstPage.data ?? [])];
          const totalPages = firstPage.pagination?.totalPages ?? 1;

          if (totalPages > 1) {
            const pageRequests = Array.from({ length: totalPages - 1 }, (_, i) =>
              orderService.getAllOrders({ ...params, page: i + 2, limit: 100 })
            );
            const restPages = await Promise.all(pageRequests);
            restPages.forEach((page: any) => {
              orders.push(...(page.data ?? []));
            });
          }

          return orders;
        };

        const [orderStats, productStats, userStats, recentRes, categoriesRes, monthlyOrders, allOrders] =
          await Promise.all([
            orderService.getOrderStats() as Promise<any>,
            productService.getProductStats(),
            api.get('/users/stats') as Promise<{ success: boolean; data: UserStatsData }>,
            orderService.getAllOrders({ limit: 5 }) as Promise<any>,
            categoryService.getAllCategories({ limit: 1000, isActive: true }),
            fetchAllOrders({ startDate }),
            fetchAllOrders(),
          ]);

        // ── Stats cards ──────────────────────────────────────────
        setTotalRevenue(orderStats.data?.totalRevenue ?? 0);
        setTotalOrders(orderStats.data?.totalOrders ?? 0);
        setTotalCustomers(userStats.data?.usersByRole?.customer ?? 0);
        setTotalProducts(productStats.data?.totalProducts ?? 0);

        // ── Category pie ─────────────────────────────────────────
        const catDist: Record<string, number> = productStats.data?.categoryDistribution ?? {};
        const categories = categoriesRes.data ?? [];
        const resolveCategoryName = (rawSlug: string) => {
          const exactMatch = categories.find((category: Category) => category.slug === rawSlug);
          if (exactMatch) return exactMatch.name;

          const normalizedRawSlug = normalizeSlugToken(rawSlug);
          const fuzzyMatch = categories.find((category: Category) => {
            const normalizedCategorySlug = normalizeSlugToken(category.slug);
            return normalizedRawSlug.includes(normalizedCategorySlug) || normalizedCategorySlug.includes(normalizedRawSlug);
          });

          return fuzzyMatch?.name || humanizeCategorySlug(rawSlug);
        };

        const mergedCategoryDistribution = Object.entries(catDist).reduce<Record<string, number>>((acc, [slug, value]) => {
          const displayName = resolveCategoryName(slug);
          acc[displayName] = (acc[displayName] ?? 0) + value;
          return acc;
        }, {});

        setCategoryData(
          Object.entries(mergedCategoryDistribution)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value], i) => ({
              name,
              value,
              color: CHART_COLORS[i % CHART_COLORS.length],
            }))
        );

        // ── Top products from real order items ──────────────────
        const productSalesMap: Record<string, TopProduct> = {};
        allOrders
          .filter((o: any) => !['cancelled', 'refunded'].includes(o.status))
          .forEach((order: any) => {
            (order.items ?? []).forEach((item: any) => {
              const productObj = item.productId;
              const productId = typeof productObj === 'object' ? productObj?._id : productObj;
              const productName = typeof productObj === 'object' ? productObj?.name : undefined;
              if (!productId) return;

              if (!productSalesMap[productId]) {
                productSalesMap[productId] = {
                  name: productName || 'Unknown Product',
                  sold: 0,
                  revenue: 0,
                };
              }

              productSalesMap[productId].sold += item.quantity ?? 0;
              productSalesMap[productId].revenue += item.subtotal ?? ((item.quantity ?? 0) * (item.price ?? 0));
            });
          });

        setTopProducts(
          Object.values(productSalesMap)
            .sort((a, b) => b.sold - a.sold)
            .slice(0, 5)
        );

        // ── Recent orders ────────────────────────────────────────
        setRecentOrders(
          (recentRes.data ?? []).map((o: any) => ({
            _id: o._id,
            customerName: (o.userId as any)?.name ?? 'Unknown',
            total: o.totalAmount ?? 0,
            status: o.status ?? 'pending',
          }))
        );

        // ── Monthly revenue chart (last 6 months) ────────────────
        const monthlyMap: Record<string, { revenue: number; orders: number }> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthlyMap[`${d.getFullYear()}-${d.getMonth()}`] = { revenue: 0, orders: 0 };
        }
        monthlyOrders.forEach((order: any) => {
          const d = new Date(order.orderDate ?? order.createdAt);
          const key = `${d.getFullYear()}-${d.getMonth()}`;
          if (monthlyMap[key]) {
            monthlyMap[key].revenue += order.totalAmount ?? 0;
            monthlyMap[key].orders  += 1;
          }
        });
        setRevenueData(
          Object.entries(monthlyMap).map(([key, val]) => {
            const month = parseInt(key.split('-')[1]);
            return { month: MONTH_NAMES[month], revenue: Math.round(val.revenue), orders: val.orders };
          })
        );
      } catch (err) {
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

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
            <div className="text-2xl font-bold text-foreground">
              {totalRevenue.toLocaleString('vi-VN')} ₫
            </div>
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              All-time revenue
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Orders</CardTitle>
            <ShoppingCart className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalOrders.toLocaleString()}</div>
            <p className="text-xs text-blue-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Total orders
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
            <Users className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCustomers.toLocaleString()}</div>
            <p className="text-xs text-purple-600 flex items-center gap-1 mt-1">
              <TrendingUp className="w-3 h-3" />
              Customer accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Products</CardTitle>
            <Package className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalProducts.toLocaleString()}</div>
            <p className="text-xs text-orange-600 flex items-center gap-1 mt-1">
              <Plus className="w-3 h-3" />
              Active products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>6-Month Revenue</CardTitle>
            <CardDescription>Revenue and orders over the last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  formatter={(value: number | undefined, name: string | undefined) =>
                    name === 'Revenue (₫)' ? (value ?? 0).toLocaleString('vi-VN') + ' ₫' : value ?? 0
                  }
                />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue (₫)" />
                <Line type="monotone" dataKey="orders"  stroke="#3b82f6" strokeWidth={2} name="Orders" />
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
            {categoryData.length === 0 ? (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground text-sm">
                No category data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name} ${percent !== undefined ? (percent * 100).toFixed(1) : '0'}%`
                    }
                    outerRadius={100}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number | undefined) => [value ?? 0, 'Products']} />
                </PieChart>
              </ResponsiveContainer>
            )}
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
            {recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => {
                  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG['pending'];
                  return (
                    <div key={order._id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium text-foreground font-mono text-sm">
                          #{order._id.slice(-8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted-foreground">{order.customerName}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground text-sm">
                          {order.total.toLocaleString('vi-VN')} ₫
                        </p>
                        <Badge className={`mt-1 text-xs ${cfg.className}`}>
                          {cfg.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Top 5 products by sold count</CardDescription>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No product data yet</p>
            ) : (
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
                    <p className="font-semibold text-green-600 text-sm">
                      {product.revenue.toLocaleString('vi-VN')} ₫
                    </p>
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
