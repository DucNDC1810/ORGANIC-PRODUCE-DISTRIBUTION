import { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Leaf, 

  Bell,
  Store,
  Package,
  Lock,
  Unlock,
  ShoppingCart,
  Star,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import api from '../../services/api';
import Sidebar from './Sidebar';
import { cn } from '../../components/ui/utils';

interface AdminNotification {
  _id: string;
  type: 'new_order' | 'account_locked' | 'unlock_request' | 'new_review' | 'stock_low' | 'system';
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Lazy load components for better performance
const Overview = lazy(() => import('./Overview'));
const ProductManagement = lazy(() => import('./ProductManagement'));
const OrderManagement = lazy(() => import('./OrderManagement'));
const CustomerManagement = lazy(() => import('./CustomerManagement'));
const ProductCategories = lazy(() => import('./CategoryManagement'));
const ReportsAnalytics = lazy(() => import('./ReportsAnalytics'));
const BlogManagement = lazy(() => import('./BlogManagement'));
const AdminSettings = lazy(() => import('./AdminSettings'));

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTabState] = useState(() => searchParams.get('tab') || 'overview');
  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setSearchParams({ tab }, { replace: true });
  };
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { clearLocalCart } = useCart();
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count') as any;
      setUnreadCount(res.data?.count ?? 0);
    } catch { /* ignore */ }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get('/notifications') as any;
      setNotifications(res.data ?? []);
      setUnreadCount((res.data ?? []).filter((n: AdminNotification) => !n.isRead).length);
    } catch { /* ignore */ }
  }, []);

  const handleMarkRead = async (notif: AdminNotification) => {
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch { /* ignore */ }
    }
    if (notif.link) {
      const tab = new URLSearchParams(notif.link.replace('?', '')).get('tab');
      if (tab) setActiveTab(tab);
    }
    setNotificationOpen(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  // Auto-poll unread count every 30s
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearLocalCart();
    logout();
    toast.success('Logged out successfully!');
    navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
  };

  // Get tab display name
  const getTabDisplayName = () => {
    const tabNames: Record<string, string> = {
      overview: 'Dashboard Overview',
      products: 'Product Management',
      orders: 'Order Management',
      customers: 'Customer Management',
      categories: 'Category Management',
      blogs: 'Blog Management',
      reports: 'Reports & Analytics',
      settings: 'Account Settings',
    };
    return tabNames[activeTab] || 'Dashboard';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview />;
      case 'products':
        return <ProductManagement />;
      case 'orders':
        return <OrderManagement />;
      case 'customers':
        return <CustomerManagement />;
      case 'categories':
        return <ProductCategories />;
      case 'blogs':
        return <BlogManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'settings':
        return <AdminSettings />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Top Navigation */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6 max-w-[1920px] mx-auto">
          {/* Left Section */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="flex items-center gap-3 cursor-pointer group relative"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {/* Logo with animation effect */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 relative overflow-hidden group-active:scale-95">
                  {/* Gradient overlay khi hover */}
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  {/* Sweep effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  {/* Icon */}
                  <Leaf className={cn(
                    "w-7 h-7 text-white relative z-10 transition-all duration-700 ease-in-out",
                    "group-hover:scale-110",
                    sidebarOpen ? "rotate-[360deg]" : "rotate-0"
                  )} />
                  {/* Indicator dots - shows sidebar state */}
                  <div className="absolute -bottom-1 -right-1 flex gap-0.5">
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      sidebarOpen ? "bg-white scale-100" : "bg-white/50 scale-75"
                    )} />
                    <div className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all duration-300",
                      sidebarOpen ? "bg-white scale-100" : "bg-white/50 scale-75"
                    )} />
                  </div>
                </div>
                {/* Tooltip */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none whitespace-nowrap shadow-lg z-50">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                  {sidebarOpen ? 'Click to close menu' : 'Click to open menu'}
                </div>
              </div>
              
              {/* Text */}
              <div className="group-hover:translate-x-1 transition-transform duration-300">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                  Organic Produce
                </h1>
                <p className="text-xs text-gray-500 font-medium group-hover:text-emerald-600 transition-colors duration-300">
                  Admin Portal
                </p>
              </div>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Back to Store */}
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 rounded-xl text-sm font-medium transition-all duration-200 border border-emerald-200 hover:border-emerald-300 group"
              title="Back to Store"
            >
              <Store className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="hidden sm:block">Visit Store</span>
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setNotificationOpen(!notificationOpen);
                  if (!notificationOpen) fetchNotifications();
                }}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full ring-2 ring-white flex items-center justify-center">
                    <span className="text-[9px] font-bold text-white px-0.5">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 mt-3 w-96 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-[100] max-h-[480px] flex flex-col">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                    <div>
                      <h3 className="font-semibold text-gray-900">Thông báo</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {unreadCount > 0 ? `${unreadCount} chưa đọc` : 'Tất cả đã đọc'}
                      </p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Đọc tất cả
                      </button>
                    )}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifications.length === 0 ? (
                      <div className="py-10 text-center text-sm text-gray-400">Không có thông báo</div>
                    ) : (
                      notifications.map((notif) => {
                        const Icon =
                          notif.type === 'new_order' ? ShoppingCart :
                          notif.type === 'account_locked' ? Lock :
                          notif.type === 'unlock_request' ? Unlock :
                          notif.type === 'new_review' ? Star :
                          notif.type === 'stock_low' ? AlertTriangle :
                          Package;
                        const iconColor =
                          notif.type === 'new_order' ? 'text-emerald-600 bg-emerald-50' :
                          notif.type === 'account_locked' ? 'text-red-600 bg-red-50' :
                          notif.type === 'unlock_request' ? 'text-orange-600 bg-orange-50' :
                          notif.type === 'new_review' ? 'text-yellow-600 bg-yellow-50' :
                          notif.type === 'stock_low' ? 'text-red-500 bg-red-50' :
                          'text-blue-600 bg-blue-50';
                        const timeAgo = (() => {
                          const diff = Date.now() - new Date(notif.createdAt).getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 1) return 'Vừa xong';
                          if (mins < 60) return `${mins} phút trước`;
                          const hrs = Math.floor(mins / 60);
                          if (hrs < 24) return `${hrs} giờ trước`;
                          return `${Math.floor(hrs / 24)} ngày trước`;
                        })();
                        return (
                          <button
                            key={notif._id}
                            onClick={() => handleMarkRead(notif)}
                            className={`w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-3 ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${!notif.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 whitespace-normal">{notif.message}</p>
                              <p className="text-xs text-gray-400 mt-1">{timeAgo}</p>
                            </div>
                            {!notif.isRead && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5"></div>}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* User Info */}
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-800">{user?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <div className="relative">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user?.name || 'Admin'}
                    className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-white"
                    onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                  />
                ) : null}
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white ${user?.avatar ? 'hidden' : ''}`}>
                  {user?.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <Sidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={user?.name || 'Admin User'}
          userRole={user?.role || 'Administrator'}
          userAvatar={user?.avatar}
          onLogout={handleLogout}
        />

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-[calc(100vh-4rem)] overflow-x-hidden transition-all duration-500",
          sidebarOpen ? "lg:ml-72" : "lg:ml-0"
        )}>
          {/* Breadcrumb */}
          <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Admin</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium">{getTabDisplayName()}</span>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <Suspense 
                fallback={
                  <div className="flex items-center justify-center h-64">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                      <p className="text-sm text-gray-500">Loading...</p>
                    </div>
                  </div>
                }
              >
                {renderContent()}
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
