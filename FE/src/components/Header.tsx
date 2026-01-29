import { useState } from 'react';
import { Search, ShoppingCart, Leaf, Apple, Carrot, Beef, Nut, BookOpen, Lightbulb, Gift, User, LogOut, Settings } from 'lucide-react';
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
  { icon: <Carrot className="w-5 h-5" />, label: 'Fresh Vegetables', href: '/products/vegetables' },
  { icon: <Apple className="w-5 h-5" />, label: 'Seasonal Fruits', href: '/products/fruits' },
  { icon: <Beef className="w-5 h-5" />, label: 'Meat & Seafood', href: '/products/meat-seafood' },
  { icon: <Nut className="w-5 h-5" />, label: 'Nuts & Pantry', href: '/products/nuts-pantry' },
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
  const { getTotalItems } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [productsOpen, setProductsOpen] = useState(false);
  const [blogsOpen, setBlogsOpen] = useState(false);

  const handleLogout = () => {
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
              <button className="text-foreground hover:text-emerald-600 transition-colors font-medium">
                Products
              </button>
              <DropdownMenu items={productsDropdown} isOpen={productsOpen} />
            </div>

            {/* Blogs with Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setBlogsOpen(true)}
              onMouseLeave={() => setBlogsOpen(false)}
            >
              <button className="text-foreground hover:text-emerald-600 transition-colors font-medium">
                Blogs
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
            <button className="p-2 hover:bg-muted rounded-lg transition-colors">
              <Search className="w-5 h-5 text-muted-foreground" />
            </button>
            <Link 
              to="/cart" 
              className="relative p-2 hover:bg-muted rounded-lg transition-colors group"
            >
              <ShoppingCart className="w-5 h-5 text-muted-foreground group-hover:text-emerald-600 transition-colors" />
              {getTotalItems() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white text-xs font-semibold rounded-full flex items-center justify-center shadow-md">
                  {getTotalItems()}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}