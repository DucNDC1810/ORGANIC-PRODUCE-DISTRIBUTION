import { Calendar, Download, DollarSign, TrendingUp, RefreshCw, Package } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useEffect, useState } from 'react';
import orderService from '../../services/orderService';
import productService from '../../services/productService';
import { categoryService } from '../../services/categoryService';

// ===== INTERFACES =====

interface MonthlyData {
  label: string;
  key: string;
  revenue: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

interface TopProduct {
  id: string;
  name: string;
  sold: number;
  revenue: number;
}

interface SummaryStats {
  totalRevenue: number;
  totalOrders: number;
  validOrders: number;
  fulfilledOrders: number;
  avgRevenuePerOrder: number;
  fulfillmentRate: number;
  highestOrderValue: number;
  highestOrderId: string;
}

type TimePeriod = '7days' | '30days' | '6months' | '1year';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

// Category colors for pie chart
const CATEGORY_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

export default function ReportsAnalytics() {
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('6months');
  const [revenueData, setRevenueData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    totalRevenue: 0,
    totalOrders: 0,
    validOrders: 0,
    fulfilledOrders: 0,
    avgRevenuePerOrder: 0,
    fulfillmentRate: 0,
    highestOrderValue: 0,
    highestOrderId: ''
  });

  // ===== FETCH DATA =====
  useEffect(() => {
    void fetchAnalyticsData();
  }, [timePeriod]);

  const getDateRange = (period: TimePeriod): DateRange => {
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 6);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 29);
        break;
      case '6months':
        startDate.setMonth(endDate.getMonth() - 5);
        startDate.setDate(1);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        startDate.setDate(1);
        break;
    }

    return { startDate, endDate };
  };

  const getBucketKey = (date: Date, period: TimePeriod): string => {
    if (period === '7days' || period === '30days') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  };

  const getBucketLabel = (date: Date, period: TimePeriod): string => {
    if (period === '7days' || period === '30days') {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { startDate, endDate } = getDateRange(timePeriod);
      const startDateStr = startDate.toISOString();
      const endDateStr = endDate.toISOString();

      // Fetch all data in parallel within selected date range
      const [ordersRes, productsRes, categoriesRes, orderStatsRes] = await Promise.all([
        orderService.getAllOrders({ 
          limit: 1000,
          startDate: startDateStr,
          endDate: endDateStr,
          sortBy: 'orderDate',
          sortOrder: 'asc'
        }),
        productService.getAllProducts({ 
          sortBy: 'soldCount', 
          sortOrder: 'desc', 
          limit: 5, 
          isActive: true 
        }),
        categoryService.getAllCategories({}),
        orderService.getOrderStats(startDateStr, endDateStr)
      ]);

      const allOrders = Array.isArray((ordersRes as any)?.data) ? (ordersRes as any).data : [];
      const validOrders = allOrders.filter((order: any) => order.status !== 'cancelled' && order.status !== 'refunded');
      const fulfilledOrders = validOrders.filter((order: any) => order.status === 'delivered').length;

      // Process revenue/order trend chart
      const bucketMap = new Map<string, { revenue: number; orders: number; date: Date }>();
      validOrders.forEach((order: any) => {
        const orderDateValue = order.orderDate || order.createdAt;
        const orderDate = new Date(orderDateValue);

        if (Number.isNaN(orderDate.getTime())) {
          return;
        }

        const key = getBucketKey(orderDate, timePeriod);
        if (!bucketMap.has(key)) {
          bucketMap.set(key, { revenue: 0, orders: 0, date: orderDate });
        }

        const bucket = bucketMap.get(key)!;
        bucket.revenue += order.totalAmount || 0;
        bucket.orders += 1;
      });

      const sortedMonthlyData = Array.from(bucketMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, data]) => {
          return {
            key,
            label: getBucketLabel(data.date, timePeriod),
            revenue: Math.round(data.revenue),
            orders: data.orders
          };
        });

      setRevenueData(sortedMonthlyData);

      // Process top products from actual order items in selected period
      const products = Array.isArray((productsRes as any)?.data) ? (productsRes as any).data : [];
      const productNameMap = new Map<string, { name: string; price: number }>();
      products.forEach((product: any) => {
        productNameMap.set(product._id, {
          name: product.name,
          price: product.price || 0,
        });
      });

      const topProductsMap = new Map<string, TopProduct>();

      validOrders.forEach((order: any) => {
        const items = Array.isArray(order.items) ? order.items : [];

        items.forEach((item: any) => {
          const rawProduct = item.productId;
          const productId = typeof rawProduct === 'string' ? rawProduct : rawProduct?._id;

          if (!productId) {
            return;
          }

          const fallbackProduct = productNameMap.get(productId);
          const productName = typeof rawProduct === 'object' && rawProduct?.name
            ? rawProduct.name
            : fallbackProduct?.name || 'Unknown Product';
          const unitPrice = item.price || fallbackProduct?.price || 0;
          const quantity = item.quantity || 0;

          if (!topProductsMap.has(productId)) {
            topProductsMap.set(productId, {
              id: productId,
              name: productName,
              sold: 0,
              revenue: 0,
            });
          }

          const currentProduct = topProductsMap.get(productId)!;
          currentProduct.sold += quantity;
          currentProduct.revenue += quantity * unitPrice;
        });
      });

      const topProductsData = Array.from(topProductsMap.values())
        .sort((a, b) => {
          if (b.sold !== a.sold) {
            return b.sold - a.sold;
          }

          return b.revenue - a.revenue;
        })
        .slice(0, 5);
      
      setTopProducts(topProductsData);

      // Process category distribution
      const categories = (categoriesRes as any)?.data || [];
      const categoryDataProcessed = categories
        .filter((cat: any) => (cat.productCount || 0) > 0)
        .map((cat: any, index: number) => ({
          name: cat.name,
          value: cat.productCount,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        }));
      
      setCategoryData(categoryDataProcessed);

      // Calculate summary stats
      const orderStats = (orderStatsRes as any)?.data || {};
      const computedRevenue = validOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      const totalRevenue = typeof orderStats.totalRevenue === 'number' ? orderStats.totalRevenue : computedRevenue;

      const highestOrder = validOrders.reduce((max: any, order: any) => 
        (order.totalAmount > (max?.totalAmount || 0) ? order : max), 
        validOrders[0] || {}
      );

      setSummaryStats({
        totalRevenue,
        totalOrders: allOrders.length,
        validOrders: validOrders.length,
        fulfilledOrders,
        avgRevenuePerOrder: validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
        fulfillmentRate: validOrders.length > 0 ? (fulfilledOrders / validOrders.length) * 100 : 0,
        highestOrderValue: highestOrder?.totalAmount || 0,
        highestOrderId: highestOrder?._id || 'N/A'
      });

    } catch {
      setError('Unable to load analytics data. Please try again.');
      setRevenueData([]);
      setCategoryData([]);
      setTopProducts([]);
      setSummaryStats({
        totalRevenue: 0,
        totalOrders: 0,
        validOrders: 0,
        fulfilledOrders: 0,
        avgRevenuePerOrder: 0,
        fulfillmentRate: 0,
        highestOrderValue: 0,
        highestOrderId: 'N/A'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h2>
          <p className="text-muted-foreground">Business data analysis</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2" onClick={() => void fetchAnalyticsData()}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => window.print()}>
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Tabs value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)} className="flex-1">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                <TabsTrigger value="7days">7 Days</TabsTrigger>
                <TabsTrigger value="30days">30 Days</TabsTrigger>
                <TabsTrigger value="6months">6 Months</TabsTrigger>
                <TabsTrigger value="1year">1 Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-red-600 font-semibold mb-3">{error}</p>
            <Button onClick={() => void fetchAnalyticsData()} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Quick KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-foreground">
                  {summaryStats.totalRevenue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold text-foreground">{summaryStats.totalOrders}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Valid Orders</p>
                <p className="text-2xl font-bold text-foreground">{summaryStats.validOrders}</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-cyan-500">
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Delivered</p>
                <p className="text-2xl font-bold text-foreground">{summaryStats.fulfilledOrders}</p>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue & Orders Trend</CardTitle>
              <CardDescription>
                {timePeriod === '7days' || timePeriod === '30days' ? 'Daily' : 'Monthly'} revenue and order volume for selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="label" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      formatter={(value: any, name?: string) => {
                        if (name === 'Revenue (₫)') return `${Number(value).toLocaleString('vi-VN')} ₫`;
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} name="Revenue (₫)" />
                    <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No data available for selected period
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Category Distribution</CardTitle>
                <CardDescription>Products by category</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${percent !== undefined ? (percent * 100).toFixed(1) : '0'}%`}
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
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No category data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
                <CardDescription>Products by sales volume</CardDescription>
              </CardHeader>
              <CardContent>
                {topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{product.name}</p>
                          <p className="text-sm text-muted-foreground">{product.sold} units sold</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">
                            {product.revenue.toLocaleString('vi-VN')} ₫
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                    No product data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm opacity-90">Avg Revenue/Order</p>
                  <DollarSign className="w-5 h-5 opacity-90" />
                </div>
                <p className="text-3xl font-bold">
                  {summaryStats.avgRevenuePerOrder.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                </p>
                <p className="text-xs opacity-75 mt-2">Average per valid order</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm opacity-90">Fulfillment Rate</p>
                  <TrendingUp className="w-5 h-5 opacity-90" />
                </div>
                <p className="text-3xl font-bold">{summaryStats.fulfillmentRate.toFixed(1)}%</p>
                <p className="text-xs opacity-75 mt-2">Delivered / valid orders</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm opacity-90">Highest Order Value</p>
                  <Package className="w-5 h-5 opacity-90" />
                </div>
                <p className="text-3xl font-bold">
                  {summaryStats.highestOrderValue.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} ₫
                </p>
                <p className="text-xs opacity-75 mt-2">
                  {summaryStats.highestOrderId !== 'N/A' 
                    ? `Order #${summaryStats.highestOrderId.slice(-6)}` 
                    : 'No orders yet'}
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
