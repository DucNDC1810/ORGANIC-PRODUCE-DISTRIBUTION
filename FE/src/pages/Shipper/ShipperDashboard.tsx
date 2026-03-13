import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Leaf,
    Settings,
    User,
    LogOut,
    ChevronDown,
    Bell
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import ShipperSidebar from './ShipperSidebar';
import ShipperOverview from './ShipperOverview';
import ShipperAvailableOrders from './ShipperAvailableOrders';
import ShipperMyOrders from './ShipperMyOrders';
import { cn } from '../../components/ui/utils';

export default function ShipperDashboard() {
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
        navigate(`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`);
    };

    const getTabDisplayName = () => {
        const tabNames: Record<string, string> = {
            dashboard: 'Dashboard Overview',
            available: 'Available Orders',
            myorders: 'My Deliveries',
        };
        return tabNames[activeTab] || 'Dashboard';
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return <ShipperOverview />;
            case 'available':
                return <ShipperAvailableOrders />;
            case 'myorders':
                return <ShipperMyOrders />;
            default:
                return <ShipperOverview />;
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
                                    Shipper Portal
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
                                className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all duration-200"
                                aria-label="Notifications"
                            >
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            {notificationOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                                    <div className="p-4 border-b border-gray-100">
                                        <h3 className="font-semibold text-gray-800">Notifications</h3>
                                    </div>
                                    <div className="max-h-96 overflow-y-auto">
                                        <div className="p-4 text-center text-gray-500 text-sm">
                                            No new notifications
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-medium shadow-md">
                                    {user?.name?.charAt(0) || user?.email?.charAt(0) || 'S'}
                                </div>
                                <div className="hidden md:block text-left">
                                    <p className="text-sm font-medium text-gray-700">{user?.name || 'Shipper'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role || 'Shipper'}</p>
                                </div>
                                <ChevronDown className={cn(
                                    "w-4 h-4 text-gray-400 transition-transform duration-200",
                                    dropdownOpen && "rotate-180"
                                )} />
                            </button>

                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50">
                                    <div className="p-2">
                                        <button
                                            onClick={() => navigate('/profile')}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            My Profile
                                        </button>
                                        <button
                                            onClick={() => navigate('/settings')}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-lg transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </button>
                                    </div>
                                    <div className="border-t border-gray-100 p-2">
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex">
                {/* Sidebar */}
                <ShipperSidebar
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    userName={user?.name || 'Shipper'}
                    userRole={user?.role || 'Shipper'}
                    onLogout={handleLogout}
                />

                {/* Main Content */}
                <main className={cn(
                    "flex-1 min-h-[calc(100vh-4rem)] overflow-x-hidden transition-all duration-500",
                    sidebarOpen ? "lg:ml-72" : "lg:ml-0"
                )}>
                    <div className="p-6 lg:p-8">
                        {/* Page Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">{getTabDisplayName()}</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Manage your delivery orders and track your performance
                            </p>
                        </div>

                        {/* Content */}
                        <div className="animate-fadeIn">
                            {renderContent()}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
