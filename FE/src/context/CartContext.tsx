import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cartService, CartItem as APICartItem } from '../services/cartService';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
}

export interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  loading: boolean;
  addToCart: (product: Product) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Helper function to convert API cart item to local cart item
const convertAPICartItemToLocal = (apiItem: APICartItem): CartItem | null => {
  // Check if product is populated
  if (!apiItem.product || !apiItem.product._id) {
    console.warn('Product not populated in cart item:', apiItem);
    return null;
  }
  
  return {
    id: apiItem.product._id,
    name: apiItem.name || apiItem.product.name,
    description: '',
    price: apiItem.price,
    image: apiItem.image || apiItem.product.images?.[0] || apiItem.product.thumbnail || '',
    category: '',
    quantity: apiItem.quantity
  };
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated } = useAuth();

  // Load cart when user logs in
  useEffect(() => {
    if (isAuthenticated && user) {
      loadCart();
    } else {
      // Load from localStorage if not authenticated
      loadLocalCart();
    }
  }, [isAuthenticated, user]);

  const loadCart = async () => {
    try {
      setLoading(true);
      const apiCart = await cartService.getCart();
      if (apiCart && apiCart.items && Array.isArray(apiCart.items)) {
        const localCart = apiCart.items
          .map(convertAPICartItemToLocal)
          .filter((item): item is CartItem => item !== null);
        console.log('Loaded cart items:', localCart);
        setCart(localCart);
      } else {
        setCart([]);
      }
    } catch (error: any) {
      console.error('Error loading cart:', error);
      // Fallback to local cart
      loadLocalCart();
    } finally {
      setLoading(false);
    }
  };

  const loadLocalCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        setCart(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error('Error loading local cart:', error);
    }
  };

  const saveLocalCart = (cartItems: CartItem[]) => {
    try {
      localStorage.setItem('cart', JSON.stringify(cartItems));
    } catch (error) {
      console.error('Error saving local cart:', error);
    }
  };

  const addToCart = async (product: Product) => {
    try {
      if (isAuthenticated) {
        setLoading(true);
        const apiCart = await cartService.addToCart({
          productId: product.id,
          quantity: 1
        });
        console.log('API Cart response:', apiCart);
        if (apiCart && apiCart.items && Array.isArray(apiCart.items)) {
          const localCart = apiCart.items
            .map(convertAPICartItemToLocal)
            .filter((item): item is CartItem => item !== null);
          console.log('Local cart after mapping:', localCart);
          setCart(localCart);
        }
        toast.success('Đã thêm vào giỏ hàng');
      } else {
        // Add to local cart
        setCart((prevCart) => {
          const existingItem = prevCart.find((item) => item.id === product.id);
          let newCart;
          if (existingItem) {
            newCart = prevCart.map((item) =>
              item.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            newCart = [...prevCart, { ...product, quantity: 1 }];
          }
          saveLocalCart(newCart);
          return newCart;
        });
        toast.success('Đã thêm vào giỏ hàng');
      }
      setIsCartOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi thêm vào giỏ hàng');
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId: string) => {
    try {
      if (isAuthenticated) {
        setLoading(true);
        const apiCart = await cartService.removeFromCart(productId);
        if (apiCart && apiCart.items && Array.isArray(apiCart.items)) {
          const localCart = apiCart.items
            .map(convertAPICartItemToLocal)
            .filter((item): item is CartItem => item !== null);
          setCart(localCart);
        }
        toast.success('Đã xóa khỏi giỏ hàng');
      } else {
        setCart((prevCart) => {
          const newCart = prevCart.filter((item) => item.id !== productId);
          saveLocalCart(newCart);
          return newCart;
        });
        toast.success('Đã xóa khỏi giỏ hàng');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa khỏi giỏ hàng');
      console.error('Error removing from cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      if (isAuthenticated) {
        setLoading(true);
        const apiCart = await cartService.updateCartItem(productId, { quantity });
        if (apiCart && apiCart.items && Array.isArray(apiCart.items)) {
          const localCart = apiCart.items
            .map(convertAPICartItemToLocal)
            .filter((item): item is CartItem => item !== null);
          setCart(localCart);
        }
      } else {
        setCart((prevCart) => {
          const newCart = prevCart.map((item) =>
            item.id === productId ? { ...item, quantity } : item
          );
          saveLocalCart(newCart);
          return newCart;
        });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi cập nhật giỏ hàng');
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      if (isAuthenticated) {
        setLoading(true);
        await cartService.clearCart();
        setCart([]);
        toast.success('Đã xóa toàn bộ giỏ hàng');
      } else {
        setCart([]);
        saveLocalCart([]);
        toast.success('Đã xóa toàn bộ giỏ hàng');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lỗi khi xóa giỏ hàng');
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      await loadCart();
    } else {
      loadLocalCart();
    }
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
        isCartOpen,
        openCart,
        closeCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
