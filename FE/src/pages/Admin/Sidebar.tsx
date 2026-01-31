import { 
  Package, 
  ShoppingCart, 
  FolderTree, 
  Users,
  LayoutDashboard,
  BarChart3,
  ChevronRight,
  LucideIcon,
  Leaf,
  LogOut,
  Settings,
  User,
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
  onClose?: () => void;
  userName?: string;
  userRole?: string;
  userAvatar?: string;
  onLogout?: () => void;
}

interface MenuItemButtonProps {
  item: MenuItem;
  isActive: boolean;
  onClick: () => void;
}

// ============================================
// CONSTANTS
// ============================================

const SIDEBAR_WIDTH = 288; // 72 * 4px = 288px (w-72)
const MOBILE_BREAKPOINT = 1024; // lg breakpoint

const menuItems: MenuItem[] = [
  { 
    id: 'overview', 
    label: 'Overview', 
    icon: LayoutDashboard,
    description: 'Dashboard và thống kê',
    ariaLabel: 'Xem tổng quan và thống kê'
  },
  { 
    id: 'products', 
    label: 'Products', 
    icon: Package,
    description: 'Quản lý sản phẩm',
    ariaLabel: 'Quản lý sản phẩm'
  },
  { 
    id: 'orders', 
    label: 'Orders', 
    icon: ShoppingCart,
    description: 'Quản lý đơn hàng',
    ariaLabel: 'Quản lý đơn hàng'
  },
  { 
    id: 'customers', 
    label: 'Customers', 
    icon: Users,
    description: 'Quản lý khách hàng',
    ariaLabel: 'Quản lý khách hàng'
  },
  { 
    id: 'categories', 
    label: 'Categories', 
    icon: FolderTree,
    description: 'Quản lý danh mục',
    ariaLabel: 'Quản lý danh mục sản phẩm'
  },
  { 
    id: 'reports', 
    label: 'Reports', 
    icon: BarChart3,
    description: 'Báo cáo và phân tích',
    ariaLabel: 'Xem báo cáo và phân tích'
  },
] as const;

// ============================================
// SUB-COMPONENTS
// ============================================

const MenuItemButton = memo<MenuItemButtonProps>(({ item, isActive, onClick }) => {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      aria-label={item.ariaLabel || item.label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg",
        "transition-all duration-200 ease-out relative",
        "hover:translate-x-0.5 active:scale-[0.98]",
        "focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1",
        isActive
          ? "bg-green-500 text-white shadow-md"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0" aria-hidden="true">
        <Icon
          className={cn(
            "w-5 h-5 transition-colors duration-200",
            isActive ? "text-white" : "text-gray-600"
          )}
        />
      </div>

      {/* Label */}
      <div className="flex-1 text-left min-w-0">
        <div className={cn(
          "font-medium text-sm transition-colors",
          isActive ? "text-white" : "text-gray-900"
        )}>
          {item.label}
        </div>
        {item.description && (
          <div className={cn(
            "text-xs mt-0.5 transition-colors truncate",
            isActive ? "text-white/75" : "text-gray-500"
          )}>
            {item.description}
          </div>
        )}
      </div>

      {/* Badge */}
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className={cn(
            "flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold",
            isActive
              ? "bg-white/20 text-white"
              : "bg-red-500 text-white"
          )}
          aria-label={`${item.badge} mục mới`}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
});

MenuItemButton.displayName = 'MenuItemButton';

// ============================================
// MAIN COMPONENT
// ============================================

const Sidebar = ({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  onClose,
  userName = 'Admin User',
  userRole = 'Administrator',
  userAvatar,
  onLogout
}: SidebarProps) => {
  // Memoized handlers
  const handleItemClick = useCallback(
    (itemId: string) => {
      onTabChange(itemId);
      // Auto-close on mobile after selection
      if (window.innerWidth < MOBILE_BREAKPOINT && onClose) {
        onClose();
      }
    },
    [onTabChange, onClose]
  );

  const handleOverlayClick = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && onClose) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  const handleLogout = useCallback(() => {
    onLogout?.();
  }, [onLogout]);

  // Memoized menu items render
  const renderedMenuItems = useMemo(
    () =>
      menuItems.map((item) => {
        const isActive = activeTab === item.id;
        
        return (
          <div key={item.id} className="relative group">
            <MenuItemButton
              item={item}
              isActive={isActive}
              onClick={() => handleItemClick(item.id)}
            />
          </div>
        );
      }),
    [activeTab, handleItemClick]
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        role="navigation"
        aria-label="Điều hướng chính"
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-gray-50/50",
          "border-r border-gray-200/80 transition-all duration-300 ease-in-out z-30",
          "shadow-[4px_0_24px_-2px_rgba(0,0,0,0.08)] lg:shadow-none w-72",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Navigation Menu */}
        <nav 
          className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-7rem)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          aria-label="Menu điều hướng chính"
        >
          {renderedMenuItems}
        </nav>

        {/* Sidebar Footer */}
        <footer className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
          {/* User Profile */}
          <div className="flex items-center gap-2.5 mb-3">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-200"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{userName}</div>
              <div className="text-xs text-gray-500 truncate">{userRole}</div>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex-shrink-0 p-1.5 rounded-md hover:bg-red-50 transition-colors group"
              aria-label="Đăng xuất"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
          
          {/* Footer Actions */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">v2.0.0</span>
            <button
              className="text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1"
              aria-label="Cài đặt"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          </div>
        </footer>
      </aside>
    </>
  );
};

// Memoize the entire sidebar to prevent unnecessary re-renders
export default memo(Sidebar);
