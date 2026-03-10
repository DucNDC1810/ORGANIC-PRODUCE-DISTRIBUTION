import { useEffect, useState } from 'react';
import { 
  Package, 
  CheckCircle, 
  Truck,
  Clock,
  RefreshCw
} from 'lucide-react';
import api from '../../services/api';
import { toast } from 'sonner';
import { cn } from '../../components/ui/utils';

interface DashboardStats {
  totalOrders: number;
  deliveringOrders: number;
  deliveredOrders: number;
  todayDelivered: number;
}

export default function ShipperOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const response: any = await api.get('/shipper/dashboard');
      if (response.success) {
        setStats(response.data);
      }
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      toast.error(error.response?.data?.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      title: 'Total Deliveries',
      value: stats?.totalOrders || 0,
      icon: Package,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      borderColor: 'border-emerald-500',
      description: 'All assigned orders'
    },
    {
      title: 'Delivering Now',
      value: stats?.deliveringOrders || 0,
      icon: Truck,
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      borderColor: 'border-yellow-500',
      description: 'Currently in transit'
    },
    {
      title: 'Completed',
      value: stats?.deliveredOrders || 0,
      icon: CheckCircle,
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      borderColor: 'border-blue-500',
      description: 'Successfully delivered'
    },
    {
      title: 'Today\'s Deliveries',
      value: stats?.todayDelivered || 0,
      icon: Clock,
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      borderColor: 'border-red-500',
      description: 'Delivered today'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading Header */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>

        {/* Loading Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border-l-4 border-gray-200 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                  <div className="h-10 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-emerald-100 p-2 rounded-lg">
                <Truck className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Delivery Dashboard</h2>
            </div>
            <p className="text-gray-600">
              Manage your deliveries and track your performance.
            </p>
          </div>
          <button
            onClick={fetchDashboardStats}
            className="flex items-center gap-2 px-4 py-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-emerald-200"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div
              key={index}
              className={cn(
                "bg-white rounded-xl p-6 shadow-sm border-l-4 hover:shadow-md transition-all duration-200",
                card.borderColor
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{card.title}</h3>
                  <p className="text-4xl font-bold text-gray-900 mb-2">{card.value}</p>
                  <p className="text-xs text-gray-500">{card.description}</p>
                </div>
                <div className={cn("p-3 rounded-full", card.iconBg)}>
                  <Icon className={cn("w-6 h-6", card.iconColor)} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
