import { useState } from 'react';
import { ArrowLeft, ChevronDown, Leaf, LifeBuoy, LogOut, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import OrderConfirmation from '../Manager/OrderConfirmation';
import StaffSidebar from './StaffSidebar';
import { cn } from '../../components/ui/utils';

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('returns');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center justify-between h-16 px-6 max-w-[1920px] mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Back to Home</span>
            </button>
            <div className="h-6 w-px bg-gray-200"></div>
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="flex items-center gap-3"
              aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md">
                <Leaf className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Organic Produce
                </h1>
                <p className="text-xs text-gray-500 font-medium">Staff Portal</p>
              </div>
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all duration-200"
            >
              <div className="hidden md:block text-right">
                <p className="text-sm font-semibold text-gray-800">{user?.name || 'Staff'}</p>
                <p className="text-xs text-gray-500">Staff</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold">
                {(user?.name || 'S').charAt(0).toUpperCase()}
              </div>
              <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', dropdownOpen && 'rotate-180')} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-[100]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex">
        <StaffSidebar
          isOpen={sidebarOpen}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
        />

        <main
          className={cn(
            'flex-1 min-h-[calc(100vh-4rem)] overflow-x-hidden transition-all duration-300',
            sidebarOpen ? 'lg:ml-72' : 'lg:ml-0',
          )}
        >
          <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">Staff</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-900 font-medium flex items-center gap-1">
                  <LifeBuoy className="w-4 h-4 text-emerald-600" />
                  Return & Refund Orders
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              <OrderConfirmation staffOnly />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
