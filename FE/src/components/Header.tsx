import { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Leaf, Apple, Carrot, Wheat, Milk, Lightbulb, Gift, User, LogOut, Settings, X, Bell, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { cn } from './ui/utils';

interface DropdownItem {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const productsDropdown: DropdownItem[] = [
  { icon: <Carrot className="w-5 h-5" />, label: 'Vegetables', href: '/products?category=vegetables' },
  { icon: <Apple className="w-5 h-5" />, label: 'Fruits', href: '/products?category=fruits' },
  { icon: <Wheat className="w-5 h-5" />, label: 'Grains', href: '/products?category=grains' },
  { icon: <Milk className="w-5 h-5" />, label: 'Dairy', href: '/products?category=dairy' },
];

const blogsDropdown: DropdownItem[] = [
  { icon: <Lightbulb className="w-5 h-5" />, label: 'Green Living', href: '/blogs/green-living' },
  { icon: <Gift className="w-5 h-5" />, label: 'News & Offers', href: '/blogs/news-offers' },
];

interface DropdownMenuProps {
  items: DropdownItem[];
  isOpen: boolean;
}

function DropdownMenu({ items, isOpen }: DropdownMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 pt-2 z-50">
      <div className="bg-white rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.12)] border border-gray-100 p-4 min-w-[240px] animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="flex flex-col gap-1">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[#333333] hover:bg-emerald-50 hover:text-emerald-600 transition-colors group"
            >
              <span className="text-muted-foreground group-hover:text-emerald-600 transition-colors">
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const { getTotalItems, openCart, clearLocalCart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [productsOpen, setProductsOpen] = useState(false);
  const [blogsOpen, setBlogsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
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
    navigate('/');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300 relative overflow-hidden group-active:scale-95">
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Leaf className="w-6 h-6 text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent group-hover:from-emerald-500 group-hover:to-teal-500 transition-all duration-300">FreshMarket</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-foreground hover:text-emerald-600 transition-colors font-medium">
              Home
            </Link>
            
            {/* Products with Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setProductsOpen(true)}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <Link to="/products" className="text-foreground hover:text-emerald-600 transition-colors font-medium">
                Products
              </Link>
              <DropdownMenu items={productsDropdown} isOpen={productsOpen} />
            </div>

            {/* Blogs with Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setBlogsOpen(true)}
              onMouseLeave={() => setBlogsOpen(false)}
            >
              <button className="text-foreground hover:text-emerald-600 transition-colors font-medium">
                News
              </button>
              <DropdownMenu items={blogsDropdown} isOpen={blogsOpen} />
            </div>

            <Link to="/about" className="text-foreground hover:text-emerald-600 transition-colors font-medium">
              About
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {!isAuthenticated ? (
              <Link 
                to="/login"
                className="px-5 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm hover:shadow-md"
              >
                Login
              </Link>
            ) : (
              <>
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
                        <p className="text-xs text-gray-500 mt-0.5">You have 1 unread message</p>
                      </div>
                      <div className="py-2">
                        {[
                          { title: 'Order shipped successfully', time: '2 hours ago', unread: true },
                          { title: 'Welcome to FreshMarket!', time: '1 day ago', unread: false },
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
                <div className="relative" ref={userDropdownRef}>
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-3 hover:bg-gray-100 px-3 py-2 rounded-xl transition-all duration-200 group"
                    aria-label="User menu"
                  >
                    <div className="flex items-center gap-3">
                      <div className="hidden md:block text-right">
                        <p className="text-sm font-semibold text-gray-800">{user?.name || 'User'}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role || 'Customer'}</p>
                      </div>
                      <div className="relative">
                        {user?.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user?.name || 'User'}
                            className="w-10 h-10 rounded-full object-cover shadow-md ring-2 ring-white"
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                          />
                        ) : null}
                        <div className={cn(
                          "w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md ring-2 ring-white",
                          user?.avatar ? 'hidden' : ''
                        )}>
                          {user?.name ? getInitials(user.name) : 'U'}
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                      </div>
                    </div>
                    <ChevronDown className={cn("w-4 h-4 text-gray-500 transition-transform duration-200", userDropdownOpen && 'rotate-180')} />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-3 w-64 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-[100] animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                          {user?.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user?.name || 'User'}
                              className="w-12 h-12 rounded-full object-cover shadow-md"
                              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling?.classList.remove('hidden'); }}
                            />
                          ) : null}
                          <div className={cn(
                            "w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-md",
                            user?.avatar ? 'hidden' : ''
                          )}>
                            {user?.name ? getInitials(user.name) : 'U'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-gray-900 truncate">{user?.name || 'User'}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
                          onClick={() => { setUserDropdownOpen(false); navigate('/profile'); }}
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
                          onClick={() => { setUserDropdownOpen(false); navigate('/profile'); setUserDropdownOpen(false); }}
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
              </>
            )}
            <div className="relative flex items-center">
              {searchOpen && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (searchQuery.trim()) {
                      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
                      setSearchOpen(false);
                      setSearchQuery('');
                    }
                  }}
                  className="absolute right-0 flex items-center animate-in slide-in-from-right-4 duration-200"
                >
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-56 pl-4 pr-8 py-2 text-sm border border-gray-200 rounded-lg bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setSearchOpen(false);
                        setSearchQuery('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="absolute right-2 p-0.5 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </form>
              )}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Search className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <button 
              onClick={openCart}
              className="relative p-2 hover:bg-muted rounded-lg transition-colors group"
            >
              <ShoppingCart className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-full flex items-center justify-center shadow-md">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}