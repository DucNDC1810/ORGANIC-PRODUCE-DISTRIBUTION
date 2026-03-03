import { useState, useRef, useEffect, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  Settings,
  User,
  LogOut,
  ChevronDown,
  Bell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import ManagerSidebar from './ManagerSidebar';
import ManagerOverview from './ManagerOverview';
import ManagerProductManagement from './ProductManagement';
import ManagerCategoryManagement from './CategoryManagement';
import ManagerPromotions from './ManagerPromotions';
import ManagerVouchers from './ManagerVouchers';
import { cn } from '../../components/ui/utils';

export default function ManagerDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const { clearLocalCart } = useCart();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
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
    navigate('/login');
  };

  const getTabDisplayName = () => {
    const tabNames: Record<string, string> = {
      dashboard: 'Dashboard Overview',
      products: 'Product Management',
      categories: 'Category Management',
      promotions: 'Promotions',
      vouchers: 'Voucher Management',
    };
    return tabNames[activeTab] || 'Dashboard';
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <ManagerOverview />;
      case 'products':
        return <ManagerProductManagement />;
      case 'categories':
        return <ManagerCategoryManagement />;
      case 'promotions':
        return <ManagerPromotions />;
      case 'vouchers':
        return <ManagerVouchers />;
      default:
        return <ManagerOverview />;
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
              {/* Logo */}
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 relative overflow-hidden group-active:scale-95">
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                  <Leaf className={cn(
                    "w-7 h-7 text-white relative z-10 transition-all duration-700 ease-in-out",
                    "group-hover:scale-110",
                    sidebarOpen ? "rotate-[360deg]" : "rotate-0"
                  )} />
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
                  Manager Portal
                </p>
              </div>
            </button>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-600" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
              </button>

              {notificationOpen && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-[100] max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                    <p className="text-xs text-gray-500 mt-0.5">You have 2 unread messages</p>
                  </div>
                  <div className="py-2">
                    {[
                      { title: 'Product stock low', time: '1 hour ago', unread: true },
                      { title: 'New promotion activated', time: '3 hours ago', unread: true },
                    ].map((notif, idx) => (
                      <button
                        key={idx}
                        className="w-full px-4 py-3 hover:bg-gray-50 transition-colors text-left flex items-start gap-3"
                      >
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${notif.unread ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                          <p className="text-xs text-gray-500">{notif.time}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="border-t border-gray-100 p-2">
                    <button className="w-full text-sm text-emerald-600 hover:text-emerald-700 font-medium py-2">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-200"></div>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all duration-200 group"
                aria-label="User menu"
              >
                <div className="flex items-center gap-3">
                  <div className="hidden md:block text-right">
                    <p className="text-sm font-semibold text-gray-800">{user?.name || 'Manager'}</p>
                    <p className="text-xs text-gray-500">Manager</p>
                  </div>
                  <div className="relative">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user?.name || 'Manager'}
                        className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-white"
                        onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                      />
                    ) : null}
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white ${user?.avatar ? 'hidden' : ''}`}>
                      {user?.name?.charAt(0).toUpperCase() || 'M'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3 mb-2">
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user?.name || 'Manager'}
                          className="w-12 h-12 rounded-full object-cover shadow-md"
                          onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                        />
                      ) : null}
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md ${user?.avatar ? 'hidden' : ''}`}>
                        {user?.name?.charAt(0).toUpperCase() || 'M'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'Manager'}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email || 'manager@example.com'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-md">
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                      <span className="text-xs font-medium text-emerald-700">Active Now</span>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                        <User className="w-4 h-4 text-gray-600 group-hover:text-emerald-600 transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Profile</p>
                        <p className="text-xs text-gray-500">View and edit profile</p>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <Settings className="w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Settings</p>
                        <p className="text-xs text-gray-500">Preferences and config</p>
                      </div>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-gray-100 pt-2 mt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                        <LogOut className="w-4 h-4 text-red-600" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Logout</p>
                        <p className="text-xs text-red-400">Sign out of account</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <ManagerSidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userName={user?.name || 'Manager'}
          userRole={user?.role || 'Manager'}
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
                <span className="text-gray-500">Manager</span>
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
