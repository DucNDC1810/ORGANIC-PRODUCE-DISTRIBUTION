import { Calendar, Download, DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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

export default function ReportsAnalytics() {
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
            <Tabs defaultValue="6months" className="flex-1">
              <TabsList>
                <TabsTrigger value="7days">7 Days</TabsTrigger>
                <TabsTrigger value="30days">30 Days</TabsTrigger>
                <TabsTrigger value="6months">6 Months</TabsTrigger>
                <TabsTrigger value="1year">1 Year</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Chart</CardTitle>
          <CardDescription>Monthly revenue and orders</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#10b981" radius={[8, 8, 0, 0]} name="Revenue ($)" />
              <Bar dataKey="orders" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
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

        {/* Top Selling Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
            <CardDescription>Products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
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
                    <p className="font-semibold text-green-600">${product.revenue.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
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
            <p className="text-3xl font-bold">$58.42</p>
            <p className="text-xs opacity-75 mt-2">+5.2% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Conversion Rate</p>
              <TrendingUp className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold">3.2%</p>
            <p className="text-xs opacity-75 mt-2">+0.8% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm opacity-90">Highest Order Value</p>
              <ShoppingCart className="w-5 h-5 opacity-90" />
            </div>
            <p className="text-3xl font-bold">$248.90</p>
            <p className="text-xs opacity-75 mt-2">Order #ORD-328</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
