import api from './api';

export interface CartItem {
  product: {
    _id: string;
    name: string;
    price: number;
    images?: string[];
    thumbnail?: string;
    stock: number;
    isActive: boolean;
  };
  quantity: number;
  price: number;
  name: string;
  image: string;
}

export interface Cart {
  _id: string;
  user: string;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartData {
  productId: string;
  quantity?: number;
}

export interface UpdateCartItemData {
  quantity: number;
}

export interface SyncCartData {
  items: {
    product: string;
    quantity: number;
    price: number;
    name: string;
    image: string;
  }[];
}

class CartService {
  /**
   * Get current user's cart
   */
  async getCart(): Promise<Cart> {
    const response: any = await api.get('/cart');
    return response.data;
  }

  /**
   * Add item to cart
   */
  async addToCart(data: AddToCartData): Promise<Cart> {
    const response: any = await api.post('/cart/add', data);
    return response.data;
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(productId: string, data: UpdateCartItemData): Promise<Cart> {
    const response: any = await api.put(`/cart/item/${productId}`, data);
    return response.data;
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(productId: string): Promise<Cart> {
    const response: any = await api.delete(`/cart/item/${productId}`);
    return response.data;
  }

  /**
   * Clear entire cart
   */
  async clearCart(): Promise<Cart> {
    const response: any = await api.delete('/cart/clear');
    return response.data;
  }

  /**
   * Sync local cart with database
   */
  async syncCart(data: SyncCartData): Promise<Cart> {
    const response: any = await api.post('/cart/sync', data);
    return response.data;
  }
}

export const cartService = new CartService();
export default cartService;
