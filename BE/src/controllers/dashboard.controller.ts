import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { Order } from '../models/Order.model';
import { Product } from '../models/Product.model';
import { User } from '../models/User.model';
import { Category } from '../models/Category.model';

export class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Tổng hợp tất cả dữ liệu cho trang Dashboard (Admin/Manager)
   */
  getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);

      // Last 7 days start (midnight UTC)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);
      sevenDaysAgo.setUTCHours(0, 0, 0, 0);

      const [
        totalOrders,
        totalRevenueAgg,
        byStatusAgg,
        activeProducts,
        lowStockCount,
        outOfStockCount,
        totalProducts,
        totalUsers,
        newUsersThisMonth,
        recentOrders,
        lowStockItems,
        revenueRaw,
        categories,
      ] = await Promise.all([
        Order.countDocuments(),

        Order.aggregate([
          { $group: { _id: null, total: { $sum: '$totalAmount' } } },
        ]),

        Order.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } },
        ]),

        Product.countDocuments({ isActive: true }),

        Product.countDocuments({ stock: { $gt: 0, $lte: 10 }, isActive: true }),

        Product.countDocuments({ stock: 0 }),

        Product.countDocuments(),

        User.countDocuments(),

        User.countDocuments({ createdAt: { $gte: startOfMonth } }),

        Order.find()
          .sort({ orderDate: -1 })
          .limit(5)
          .populate('userId', 'name email')
          .populate('items.productId', 'name price thumbnail')
          .lean(),

        Product.find({ stock: { $gt: 0, $lte: 10 }, isActive: true })
          .select('name stock category thumbnail')
          .sort({ stock: 1 })
          .limit(10)
          .lean(),

        Order.aggregate([
          { $match: { orderDate: { $gte: sevenDaysAgo } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$orderDate' } },
              revenue: { $sum: '$totalAmount' },
              orders: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),

        Category.find({ isActive: true })
          .select('name slug productCount')
          .sort({ productCount: -1 })
          .limit(10)
          .lean(),
      ]);

      // Build complete 7-day revenue array (fill missing days with 0)
      const revenueMap: Record<string, { revenue: number; orders: number }> = {};
      revenueRaw.forEach((item: any) => {
        revenueMap[item._id] = { revenue: item.revenue, orders: item.orders };
      });

      const revenueByDay = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setUTCDate(d.getUTCDate() - i);
        d.setUTCHours(0, 0, 0, 0);
        const key = d.toISOString().split('T')[0]; // 'YYYY-MM-DD'
        revenueByDay.push({
          date: key,
          revenue: revenueMap[key]?.revenue || 0,
          orders: revenueMap[key]?.orders || 0,
        });
      }

      res.status(200).json({
        success: true,
        data: {
          orderStats: {
            totalOrders,
            totalRevenue: totalRevenueAgg[0]?.total || 0,
            byStatus: byStatusAgg,
          },
          productStats: {
            totalProducts,
            activeProducts,
            lowStockProducts: lowStockCount,
            outOfStockProducts: outOfStockCount,
          },
          userStats: {
            totalUsers,
            newUsersThisMonth,
          },
          recentOrders,
          lowStockItems,
          revenueByDay,
          categoryProductCounts: categories,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
