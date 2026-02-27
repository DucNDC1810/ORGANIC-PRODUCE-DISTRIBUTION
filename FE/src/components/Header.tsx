import { useState, useRef, useEffect } from 'react';
import { Search, ShoppingCart, Leaf, Apple, Carrot, Wheat, Milk, BookOpen, Lightbulb, Gift, User, LogOut, Settings, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu as DropdownMenuUI,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

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
  { icon: <BookOpen className="w-5 h-5" />, label: 'Cooking Tips', href: '/blogs/cooking-tips' },
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

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
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-semibold text-foreground">FreshMarket</span>
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
              <DropdownMenuUI>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar className="w-9 h-9 border-2 border-green-500 shadow-sm">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-600 text-white text-sm font-semibold">
                        {user?.name ? getInitials(user.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenuUI>
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