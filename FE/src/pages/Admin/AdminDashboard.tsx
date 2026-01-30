import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Leaf, 
  Menu,
  X,
  ShoppingCart,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import Overview from './Overview';
import ProductManagement from '../Manager/ProductManagement';
import OrderManagement from './OrderManagement';
import CustomerManagement from './CustomerManagement';
import ProductCategories from '../Manager/CategoryManagement';
import ReportsAnalytics from './ReportsAnalytics';
import Sidebar from './Sidebar';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success('Đăng xuất thành công!');
    navigate('/login');
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
      case 'reports':
        return <ReportsAnalytics />;
      default:
        return <Overview />;
    }
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Top Navigation */}
      <header className="bg-white border-b border-border sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-secondary rounded-lg transition-colors"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-lg font-semibold text-foreground">Organic Produce Admin</h1>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <ShoppingCart className="w-4 h-4" />
              Back to Store
            </Link>
            
            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:bg-secondary px-3 py-2 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase() || 'AD'}
                </div>
                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-[0_8px_30px_rgba(0,0,0,0.12)] py-2 z-[100] backdrop-blur-sm">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-200 bg-white">
                    <p className="text-sm font-semibold text-foreground">{user?.name || 'Admin User'}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email || 'admin@example.com'}</p>
                  </div>

                  {/* Menu Items */}
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        navigate('/profile');
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setDropdownOpen(false);
                        // Add settings navigation if needed
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-border pt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
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
        <Sidebar 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}
