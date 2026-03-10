import {
    Package,
    MapPin,
    LayoutDashboard,
    LucideIcon,
    Home,
    Truck,
} from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import { cn } from '../../components/ui/utils';

// ============================================
// TYPES & INTERFACES
// ============================================

interface MenuItem {
    id: string;
    label: string;
    icon: LucideIcon;
    badge?: number;
    description?: string;
    ariaLabel?: string;
}

interface SidebarProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    isOpen: boolean;
}

interface MenuItemButtonProps {
    item: MenuItem;
    isActive: boolean;
    onClick: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const menuItems: MenuItem[] = [
    {
        id: 'overview',
        label: 'Tổng quan',
        icon: LayoutDashboard,
        description: 'Dashboard và thống kê',
        ariaLabel: 'Xem tổng quan và thống kê'
    },
    {
        id: 'deliveries',
        label: 'Giao hàng',
        icon: Truck,
        description: 'Quản lý giao hàng',
        ariaLabel: 'Quản lý danh sách giao hàng'
    },
    {
        id: 'zones',
        label: 'Khu vực',
        icon: MapPin,
        description: 'Khu vực phụ trách',
        ariaLabel: 'Xem khu vực phụ trách'
    },
    {
        id: 'addresses',
        label: 'Địa chỉ',
        icon: Home,
        description: 'Địa chỉ giao hàng',
        ariaLabel: 'Xem danh sách địa chỉ'
    },
];

// ============================================
// SUB-COMPONENTS
// ============================================

const MenuItemButton = memo(function MenuItemButton({ item, isActive, onClick }: MenuItemButtonProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
            )}
            aria-label={item.ariaLabel}
            aria-current={isActive ? 'page' : undefined}
        >
            {/* Active indicator */}
            {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/20 to-teal-500/20 animate-pulse" />
            )}

            {/* Icon */}
            <div className={cn(
                "relative z-10 transition-transform duration-200",
                isActive ? "scale-110" : "group-hover:scale-110"
            )}>
                <item.icon className="w-5 h-5" />
            </div>

            {/* Label & Badge */}
            <div className="flex-1 flex items-center justify-between relative z-10">
                <span className="font-medium text-sm">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                    <span className={cn(
                        "px-2 py-0.5 text-xs font-bold rounded-full",
                        isActive
                            ? "bg-white/20 text-white"
                            : "bg-emerald-100 text-emerald-700"
                    )}>
                        {item.badge}
                    </span>
                )}
            </div>

            {/* Hover effect */}
            {!isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
            )}
        </button>
    );
});

// ============================================
// MAIN COMPONENT
// ============================================

const ShipperSidebar = memo(function ShipperSidebar({ activeTab, onTabChange, isOpen }: SidebarProps) {
    const handleTabChange = useCallback((tabId: string) => {
        onTabChange(tabId);
    }, [onTabChange]);

    const menuItemsComponents = useMemo(() => {
        return menuItems.map((item) => (
            <MenuItemButton
                key={item.id}
                item={item}
                isActive={activeTab === item.id}
                onClick={() => handleTabChange(item.id)}
            />
        ));
    }, [activeTab, handleTabChange]);

    return (
        <>
            {/* Overlay for mobile */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => { }}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 z-30 transition-all duration-300 ease-in-out",
                    isOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0 lg:w-0"
                )}
                aria-label="Shipper Dashboard Navigation"
            >
                <nav className="p-4 space-y-2 overflow-y-auto h-full">
                    {/* Navigation Header */}
                    <div className="mb-6">
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-3">
                            Menu
                        </h3>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-1">
                        {menuItemsComponents}
                    </div>

                    {/* Footer Info */}
                    <div className="absolute bottom-4 left-4 right-4">
                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                            <div className="flex items-center gap-2 mb-2">
                                <Package className="w-4 h-4 text-emerald-600" />
                                <span className="text-xs font-semibold text-emerald-900">Shipper Portal</span>
                            </div>
                            <p className="text-[10px] text-gray-600 leading-relaxed">
                                Quản lý giao hàng hiệu quả và nhanh chóng
                            </p>
                        </div>
                    </div>
                </nav>
            </aside>
        </>
    );
});

export default ShipperSidebar;
