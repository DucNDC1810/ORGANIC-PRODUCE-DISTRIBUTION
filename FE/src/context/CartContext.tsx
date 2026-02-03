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
  clearCart: (silent?: boolean) => Promise<void>;
  clearLocalCart: () => void;
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
      // Clear cart when user logs out
      setCart([]);
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
        toast.success('Added to cart');
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
        toast.success('Added to cart');
      }
      setIsCartOpen(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
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
        toast.success('Removed from cart');
      } else {
        setCart((prevCart) => {
          const newCart = prevCart.filter((item) => item.id !== productId);
          saveLocalCart(newCart);
          return newCart;
        });
        toast.success('Removed from cart');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove from cart');
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
      toast.error(error.response?.data?.message || 'Failed to update cart');
      console.error('Error updating quantity:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async (silent: boolean = false) => {
    try {
      if (isAuthenticated) {
        setLoading(true);
        await cartService.clearCart();
        setCart([]);
        if (!silent) {
          toast.success('Cart cleared successfully');
        }
      } else {
        setCart([]);
        saveLocalCart([]);
        if (!silent) {
          toast.success('Cart cleared successfully');
        }
      }
    } catch (error: any) {
      if (!silent) {
        toast.error(error.response?.data?.message || 'Failed to clear cart');
      }
      console.error('Error clearing cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Clear only local cart without calling API (used for logout)
  const clearLocalCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
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
        clearLocalCart,
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
