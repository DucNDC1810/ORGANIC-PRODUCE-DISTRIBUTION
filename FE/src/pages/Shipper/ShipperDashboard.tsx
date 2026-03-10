import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Truck,
    LogOut,
    ChevronDown,
    Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { toast } from 'sonner';
import ShipperSidebar from './ShipperSidebar';
import { cn } from '../../components/ui/utils';

// Lazy load components for better performance
const ShipperOverview = lazy(() => import('./ShipperOverview'));
const ShipperDeliveries = lazy(() => import('./ShipperDeliveries'));
const ShipperZones = lazy(() => import('./ShipperZones'));
const ShipperAddresses = lazy(() => import('./ShipperAddresses'));

export default function ShipperDashboard() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTabState] = useState(() => searchParams.get('tab') || 'overview');
    const setActiveTab = (tab: string) => {
        setActiveTabState(tab);
        setSearchParams({ tab }, { replace: true });
    };
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { user, logout } = useAuth();
    const { clearLocalCart } = useCart();
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
        clearLocalCart();
        logout();
        toast.success('Đăng xuất thành công!');
        navigate('/login');
    };

    // Get tab display name
    const getTabDisplayName = () => {
        const tabNames: Record<string, string> = {
            overview: 'Tổng quan',
            deliveries: 'Danh sách giao hàng',
            zones: 'Khu vực giao hàng',
            addresses: 'Địa chỉ phụ trách',
        };
        return tabNames[activeTab] || 'Dashboard';
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview':
                return <ShipperOverview />;
            case 'deliveries':
                return <ShipperDeliveries />;
            case 'zones':
                return <ShipperZones />;
            case 'addresses':
                return <ShipperAddresses />;
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
                            aria-label={sidebarOpen ? "Đóng menu" : "Mở menu"}
                        >
                            {/* Logo with animation effect */}
                            <div className="relative">
                                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 relative overflow-hidden group-active:scale-95">
                                    {/* Gradient overlay khi hover */}
                                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                                    {/* Sweep effect */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                                    {/* Icon */}
                                    <Truck className={cn(
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
                                    {sidebarOpen ? 'Click để đóng menu' : 'Click để mở menu'}
                                </div>
                            </div>

                            {/* Text */}
                            <div className="group-hover:translate-x-1 transition-transform duration-300">
                                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">
                                    Shipper Portal
                                </h1>
                                <p className="text-xs text-gray-500 font-medium group-hover:text-emerald-600 transition-colors duration-300">
                                    Quản lý giao hàng
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
                            title="Về trang chủ"
                        >
                            <Store className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                            <span className="hidden sm:block">Về trang chủ</span>
                        </button>

                        {/* Divider */}
                        <div className="h-8 w-px bg-gray-200"></div>

                        {/* User Profile */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setDropdownOpen(!dropdownOpen)}
                                className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors group"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {user?.name?.[0]?.toUpperCase() || 'S'}
                                </div>
                                <div className="hidden sm:block text-left">
                                    <p className="text-sm font-medium text-gray-900">{user?.name || 'Shipper'}</p>
                                    <p className="text-xs text-gray-500">Nhân viên giao hàng</p>
                                </div>
                                <ChevronDown className={cn(
                                    "w-4 h-4 text-gray-500 transition-transform duration-200",
                                    dropdownOpen && "rotate-180"
                                )} />
                            </button>

                            {/* Dropdown Menu */}
                            {dropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex max-w-[1920px] mx-auto">
                {/* Sidebar */}
                <ShipperSidebar
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    isOpen={sidebarOpen}
                />

                {/* Main Content Area */}
                <main className={cn(
                    "flex-1 transition-all duration-300 ease-in-out min-h-[calc(100vh-4rem)]",
                    sidebarOpen ? "lg:ml-64" : "ml-0"
                )}>
                    <div className="p-6">
                        {/* Page Header */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">{getTabDisplayName()}</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Xin chào, {user?.name || 'Shipper'}!
                            </p>
                        </div>

                        {/* Content */}
                        <Suspense fallback={
                            <div className="flex items-center justify-center h-96">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                            </div>
                        }>
                            {renderContent()}
                        </Suspense>
                    </div>
                </main>
            </div>
        </div>
    );
}
