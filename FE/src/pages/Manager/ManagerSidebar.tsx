import { 
  Package, 
  FolderTree, 
  LayoutDashboard,
  Tag,
  Percent,
  LucideIcon,
  LogOut,
  Settings,
  User,
  ShoppingBag,
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

interface ManagerSidebarProps {
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

const MOBILE_BREAKPOINT = 1024;

const menuItems: MenuItem[] = [
  { 
    id: 'dashboard', 
    label: 'Overview', 
    icon: LayoutDashboard,
    description: 'Dashboard & Statistics',
    ariaLabel: 'View overview and statistics'
  },
  { 
    id: 'products', 
    label: 'Products', 
    icon: Package,
    description: 'Product Management',
    ariaLabel: 'Manage products'
  },
  { 
    id: 'categories', 
    label: 'Categories', 
    icon: FolderTree,
    description: 'Category Management',
    ariaLabel: 'Manage categories'
  },
  { 
    id: 'promotions', 
    label: 'Promotions', 
    icon: Tag,
    description: 'Promotion Campaigns',
    ariaLabel: 'Manage promotions'
  },
  { 
    id: 'vouchers', 
    label: 'Vouchers', 
    icon: Percent,
    description: 'Voucher Management',
    ariaLabel: 'Manage vouchers'
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: ShoppingBag,
    description: 'Order Confirmation',
    ariaLabel: 'Manage and confirm orders'
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
      <div className="flex-shrink-0" aria-hidden="true">
        <Icon
          className={cn(
            "w-5 h-5 transition-colors duration-200",
            isActive ? "text-white" : "text-gray-600"
          )}
        />
      </div>
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
      {item.badge !== undefined && item.badge > 0 && (
        <span
          className={cn(
            "flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold",
            isActive ? "bg-white/20 text-white" : "bg-red-500 text-white"
          )}
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

const ManagerSidebar = ({ 
  activeTab, 
  onTabChange, 
  isOpen, 
  onClose,
  userName = 'Manager',
  userRole = 'Manager',
  userAvatar,
  onLogout
}: ManagerSidebarProps) => {
  const handleItemClick = useCallback(
    (itemId: string) => {
      onTabChange(itemId);
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
      {isOpen && (
        <div
          role="presentation"
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20 lg:hidden transition-opacity duration-300"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
      <aside
        role="navigation"
        aria-label="Main navigation"
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed lg:fixed top-16 left-0 h-[calc(100vh-4rem)] bg-gradient-to-b from-white to-gray-50/50",
          "border-r border-gray-200/80 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] z-30",
          "shadow-[4px_0_24px_-2px_rgba(0,0,0,0.08)] w-72",
          isOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
        )}
      >
        <nav 
          className="px-3 py-4 space-y-1 overflow-y-auto h-[calc(100%-7rem)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
          aria-label="Navigation menu"
        >
          {renderedMenuItems}
        </nav>

        <footer className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex-shrink-0">
              {userAvatar ? (
                <img 
                  src={userAvatar} 
                  alt={userName}
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-gray-200"
                  onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                />
              ) : null}
              <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center ${userAvatar ? 'hidden' : ''}`}>
                <User className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-gray-900 truncate">{userName}</div>
              <div className="text-xs text-gray-500 truncate">{userRole}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex-shrink-0 p-1.5 rounded-md hover:bg-red-50 transition-colors group"
              aria-label="Logout"
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-gray-400 group-hover:text-red-500 transition-colors" />
            </button>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">v2.0.0</span>
            <button
              className="text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1"
              aria-label="Settings"
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

export default memo(ManagerSidebar);
