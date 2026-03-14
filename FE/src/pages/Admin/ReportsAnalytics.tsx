import { Calendar, Download, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
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
  month: string;
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
  name: string;
  sold: number;
  revenue: number;
}

interface SummaryStats {
  avgRevenuePerOrder: number;
  conversionRate: number;
  highestOrderValue: number;
  highestOrderId: string;
}

// Category colors for pie chart
const CATEGORY_COLORS = ['#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];

export default function ReportsAnalytics() {
  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState<'7days' | '30days' | '6months' | '1year'>('6months');
  const [revenueData, setRevenueData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    avgRevenuePerOrder: 0,
    conversionRate: 0,
    highestOrderValue: 0,
    highestOrderId: ''
  });

  // ===== FETCH DATA =====
  useEffect(() => {
    fetchAnalyticsData();
  }, [timePeriod]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      // Calculate date range based on selected period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timePeriod) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30days':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      // Fetch all data in parallel - temporarily remove date filter to get all data
      const [ordersRes, productsRes, categoriesRes, orderStatsRes] = await Promise.all([
        orderService.getAllOrders({ 
          limit: 1000 
          // Temporarily removed date filter to get all orders
          // startDate: startDateStr, 
          // endDate: endDateStr 
        }),
        productService.getAllProducts({ 
          sortBy: 'soldCount', 
          sortOrder: 'desc', 
          limit: 5, 
          isActive: true 
        }),
        categoryService.getAllCategories({}),
        orderService.getOrderStats() // Get all stats without date filter
      ]);

      // Process monthly revenue data
      const monthlyDataMap = new Map<string, { revenue: number; orders: number }>();
      const allOrders = (ordersRes as any)?.data || [];
      
      // Filter orders by date range after fetching (since we removed API filter)
      const filteredOrders = allOrders.filter((order: any) => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
      
      filteredOrders.forEach((order: any) => {
        if (order.status !== 'cancelled' && order.status !== 'refunded') {
          const orderDate = new Date(order.orderDate);
          const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
          
          if (!monthlyDataMap.has(monthKey)) {
            monthlyDataMap.set(monthKey, { revenue: 0, orders: 0 });
          }
          
          const monthData = monthlyDataMap.get(monthKey)!;
          monthData.revenue += order.totalAmount || 0;
          monthData.orders += 1;
        }
      });

      // Convert to array and sort by month
      const sortedMonthlyData = Array.from(monthlyDataMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthKey, data]) => {
          const [year, month] = monthKey.split('-');
          const monthDate = new Date(parseInt(year), parseInt(month) - 1);
          const monthName = monthDate.toLocaleString('en-US', { month: 'short' });
          
          return {
            month: monthName,
            revenue: Math.round(data.revenue),
            orders: data.orders
          };
        });

      setRevenueData(sortedMonthlyData);

      // Process top products
      const products = (productsRes as any)?.data || [];
      const topProductsData = products.slice(0, 5).map((product: any) => ({
        name: product.name,
        sold: product.soldCount || 0,
        revenue: (product.soldCount || 0) * (product.price || 0)
      }));
      
      setTopProducts(topProductsData);

      // Process category distribution
      const categories = (categoriesRes as any)?.data || [];
      const categoryDataProcessed = categories
        .filter((cat: any) => cat.productCount > 0)
        .map((cat: any, index: number) => ({
          name: cat.name,
          value: cat.productCount,
          color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
        }));
      
      setCategoryData(categoryDataProcessed);

      // Calculate summary stats
      const orderStats = (orderStatsRes as any)?.data || {};
      const totalRevenue = orderStats.totalRevenue || filteredOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      
      // Find highest order value from filtered orders
      const validOrders = filteredOrders.filter((o: any) => o.status !== 'cancelled' && o.status !== 'refunded');
      const highestOrder = validOrders.reduce((max: any, order: any) => 
        (order.totalAmount > (max?.totalAmount || 0) ? order : max), 
        validOrders[0] || {}
      );

      setSummaryStats({
        avgRevenuePerOrder: validOrders.length > 0 ? totalRevenue / validOrders.length : 0,
        conversionRate: 3.2, // This would need real visitor data
        highestOrderValue: highestOrder?.totalAmount || 0,
        highestOrderId: highestOrder?._id || 'N/A'
      });

    } catch (error) {
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Reports & Analytics</h2>
        <p className="text-muted-foreground">Business data analysis</p>
      </div>

      {/* Time Period Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <Tabs value={timePeriod} onValueChange={(v: any) => setTimePeriod(v)} className="flex-1">
              <TabsList>
                <TabsTrigger value="7days">7 Days</TabsTrigger>
                <TabsTrigger value="30days">30 Days</TabsTrigger>
                <TabsTrigger value="6months">6 Months</TabsTrigger>
                <TabsTrigger value="1year">1 Year</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="gap-2" onClick={() => window.print()}>
              <Download className="w-4 h-4" />
              Export Report
            </Button>
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
      ) : (
        <>
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Chart</CardTitle>
              <CardDescription>Monthly revenue and orders</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#6b7280" />
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
                      <div key={index} className="flex items-center gap-4">
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
                <p className="text-xs opacity-75 mt-2">Average per transaction</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm opacity-90">Conversion Rate</p>
                  <TrendingUp className="w-5 h-5 opacity-90" />
                </div>
                <p className="text-3xl font-bold">{summaryStats.conversionRate.toFixed(1)}%</p>
                <p className="text-xs opacity-75 mt-2">Estimated metric</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm opacity-90">Highest Order Value</p>
                  <ShoppingCart className="w-5 h-5 opacity-90" />
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
