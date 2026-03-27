import { LifeBuoy, LogOut } from 'lucide-react';
import { cn } from '../../components/ui/utils';

interface StaffSidebarProps {
  isOpen: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function StaffSidebar({
  isOpen,
  activeTab,
  onTabChange,
  onLogout,
}: StaffSidebarProps) {
  return (
    <aside
      className={cn(
        'fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 bg-gradient-to-b from-white to-gray-50/50 border-r border-gray-200 z-30 transition-transform duration-300',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      <nav className="px-3 py-4">
        <button
          onClick={() => onTabChange('returns')}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
            activeTab === 'returns'
              ? 'bg-emerald-500 text-white'
              : 'text-gray-700 hover:bg-gray-100',
          )}
        >
          <LifeBuoy className="w-5 h-5" />
          <div className="text-left">
            <p className="text-sm font-medium">Order Returns</p>
            <p className={cn('text-xs', activeTab === 'returns' ? 'text-white/80' : 'text-gray-500')}>
              Refund processing queue
            </p>
          </div>
        </button>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
