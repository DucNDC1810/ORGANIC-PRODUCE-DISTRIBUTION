import { 
  Package, 
  ShoppingCart, 
  FolderTree, 
  Users,
  LayoutDashboard,
  BarChart3,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { cn } from '../../components/ui/utils';

interface MenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  description?: string;
}

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isOpen: boolean;
  onClose?: () => void;
}

const menuItems: MenuItem[] = [
  { 
    id: 'overview', 
    label: 'Overview', 
    icon: LayoutDashboard,
    description: 'Dashboard và thống kê tổng quan' 
  },
  { 
    id: 'products', 
    label: 'Products', 
    icon: Package,
    description: 'Quản lý sản phẩm' 
  },
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: ShoppingCart,
    description: 'Quản lý đơn hàng' 
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: Users,
    description: 'Quản lý khách hàng' 
  },
  { 
    id: 'categories', 
    label: 'Categories', 
    icon: FolderTree,
    description: 'Quản lý danh mục' 
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: BarChart3,
    description: 'Báo cáo và phân tích' 
  },
];

export default function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  const handleItemClick = (itemId: string) => {
    onTabChange(itemId);
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-gray-50/50",
          "border-r border-gray-200/80 transition-all duration-300 ease-in-out z-30",
          "shadow-[4px_0_24px_-2px_rgba(0,0,0,0.08)] lg:shadow-none w-72",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className="px-6 py-5 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                Navigation
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">Admin Panel</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5 overflow-y-auto h-[calc(100%-80px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => handleItemClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl",
                    "transition-all duration-200 ease-out relative overflow-hidden",
                    "hover:translate-x-1 active:scale-[0.98]",
                    isActive
                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30"
                      : "text-gray-700 hover:bg-gray-100/80 hover:shadow-sm"
                  )}
                >
                  {/* Active indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                  )}

                  {/* Icon with background */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-white/20"
                        : "bg-gray-100 group-hover:bg-white group-hover:shadow-sm"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-transform duration-200",
                        isActive ? "text-white" : "text-gray-600 group-hover:text-green-600",
                        "group-hover:scale-110"
                      )}
                    />
                  </div>

                  {/* Label and description */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          "font-semibold text-sm transition-colors",
                          isActive ? "text-white" : "text-gray-900"
                        )}
                      >
                        {item.label}
                      </span>
                      {item.badge !== undefined && (
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-bold",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-red-100 text-red-600"
                          )}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    {item.description && (
                      <p
                        className={cn(
                          "text-xs mt-0.5 transition-colors",
                          isActive ? "text-white/80" : "text-gray-500"
                        )}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Arrow indicator */}
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-all duration-200",
                      isActive
                        ? "text-white opacity-100"
                        : "text-gray-400 opacity-0 group-hover:opacity-100"
                    )}
                  />
                </button>

                {/* Tooltip for collapsed state (optional for future) */}
                {!isActive && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50 top-1/2 -translate-y-1/2">
                    {item.label}
                    <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900" />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">Admin Panel</p>
              <p className="text-xs text-gray-600">v2.0.0</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
