import api from './api';

// ===== INTERFACES =====

export interface OrderStats {
  totalOrders: number;
  totalRevenue: number;
  byStatus: Array<{ _id: string; count: number; totalAmount: number }>;
}

export interface ProductStats {
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
}

export interface UserStats {
  totalUsers: number;
  newUsersThisMonth: number;
}

export interface RecentOrderItem {
  productId: { _id: string; name: string; price: number } | null;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface RecentOrder {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  orderDate: string;
  items: RecentOrderItem[];
  totalAmount: number;
  status: string;
  paymentMethod?: string;
  paymentStatus?: string;
}

export interface LowStockProduct {
  _id: string;
  name: string;
  stock: number;
  category: string;
  thumbnail?: string;
}

export interface RevenueDataPoint {
  date: string; // 'YYYY-MM-DD'
  revenue: number;
  orders: number;
}

export interface CategoryWithCount {
  _id: string;
  name: string;
  slug: string;
  productCount: number;
}

export interface DashboardStats {
  orderStats: OrderStats;
  productStats: ProductStats;
  userStats: UserStats;
  recentOrders: RecentOrder[];
  lowStockItems: LowStockProduct[];
  revenueByDay: RevenueDataPoint[];
  categoryProductCounts: CategoryWithCount[];
}

// ===== API CALL =====

export const dashboardService = {
  /**
   * GET /api/dashboard/stats
   * Lấy toàn bộ dữ liệu dashboard trong một request duy nhất
   */
  getStats: async (): Promise<DashboardStats> => {
    const res: any = await api.get('/dashboard/stats');
    return res.data;
  },
};
