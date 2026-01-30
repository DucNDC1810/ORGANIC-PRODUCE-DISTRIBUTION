import { Cart, ICart, ICartItem } from '../models/Cart.model';
import { Product } from '../models/Product.model';
import { AppError } from '../utils/AppError';
import { Types } from 'mongoose';

interface AddToCartData {
  productId: string;
  quantity?: number;
}

interface UpdateCartItemData {
  productId: string;
  quantity: number;
}

export class CartService {
  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<ICart> {
    try {
      let cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price images thumbnail stock isActive');
      
      if (!cart) {
        // Create new cart if doesn't exist
        cart = await Cart.create({
          user: userId,
          items: [],
          totalItems: 0,
          totalPrice: 0
        });
      }
      
      return cart;
    } catch (error: any) {
      throw new AppError(error.message || 'Error fetching cart', 500);
    }
  }

  /**
   * Add item to cart
   */
  async addToCart(userId: string, data: AddToCartData): Promise<ICart> {
    try {
      const { productId, quantity = 1 } = data;

      // Validate product exists and is available
      const product = await Product.findById(productId);
      if (!product) {
        throw new AppError('Product not found', 404);
      }

      if (!product.isActive) {
        throw new AppError('Product is not available', 400);
      }

      if (product.stock < quantity) {
        throw new AppError(`Only ${product.stock} items available in stock`, 400);
      }

      // Get or create cart
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: []
        });
      }

      // Check if product already in cart
      const existingItemIndex = cart.items.findIndex(
        (item: any) => item.product.toString() === productId
      );

      if (existingItemIndex > -1) {
        // Update quantity
        const newQuantity = cart.items[existingItemIndex].quantity + quantity;
        
        if (product.stock < newQuantity) {
          throw new AppError(`Only ${product.stock} items available in stock`, 400);
        }
        
        cart.items[existingItemIndex].quantity = newQuantity;
        cart.items[existingItemIndex].price = product.price;
        cart.items[existingItemIndex].name = product.name;
        cart.items[existingItemIndex].image = product.images?.[0] || product.thumbnail || '';
      } else {
        // Add new item
        const cartItem: any = {
          product: new Types.ObjectId(productId),
          quantity,
          price: product.price,
          name: product.name,
          image: product.images?.[0] || product.thumbnail || ''
        };
        cart.items.push(cartItem);
      }

      await cart.save();
      await cart.populate('items.product', 'name price images thumbnail stock isActive');
      
      return cart;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Error adding to cart', 500);
    }
  }

  /**
   * Update cart item quantity
   */
  async updateCartItem(userId: string, data: UpdateCartItemData): Promise<ICart> {
    try {
      const { productId, quantity } = data;

      if (quantity < 0) {
        throw new AppError('Quantity must be positive', 400);
      }

      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      const itemIndex = cart.items.findIndex(
        (item: any) => item.product.toString() === productId
      );

      if (itemIndex === -1) {
        throw new AppError('Item not found in cart', 404);
      }

      if (quantity === 0) {
        // Remove item if quantity is 0
        cart.items.splice(itemIndex, 1);
      } else {
        // Validate stock
        const product = await Product.findById(productId);
        if (!product) {
          throw new AppError('Product not found', 404);
        }

        if (!product.isActive) {
          throw new AppError('Product is not available', 400);
        }

        if (product.stock < quantity) {
          throw new AppError(`Only ${product.stock} items available in stock`, 400);
        }

        cart.items[itemIndex].quantity = quantity;
        cart.items[itemIndex].price = product.price;
        cart.items[itemIndex].name = product.name;
        cart.items[itemIndex].image = product.images?.[0] || product.thumbnail || '';
      }

      await cart.save();
      await cart.populate('items.product', 'name price images thumbnail stock isActive');
      
      return cart;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Error updating cart', 500);
    }
  }

  /**
   * Remove item from cart
   */
  async removeFromCart(userId: string, productId: string): Promise<ICart> {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      const initialLength = cart.items.length;
      cart.items = cart.items.filter(
        (item: any) => item.product.toString() !== productId
      ) as any;

      if (cart.items.length === initialLength) {
        throw new AppError('Item not found in cart', 404);
      }

      await cart.save();
      await cart.populate('items.product', 'name price images thumbnail stock isActive');
      
      return cart;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Error removing from cart', 500);
    }
  }

  /**
   * Clear cart
   */
  async clearCart(userId: string): Promise<ICart> {
    try {
      const cart = await Cart.findOne({ user: userId });
      if (!cart) {
        throw new AppError('Cart not found', 404);
      }

      cart.items = [] as any;
      await cart.save();
      
      return cart;
    } catch (error: any) {
      if (error instanceof AppError) throw error;
      throw new AppError(error.message || 'Error clearing cart', 500);
    }
  }

  /**
   * Sync local cart with database (for when user logs in)
   */
  async syncCart(userId: string, localCartItems: any[]): Promise<ICart> {
    try {
      let cart = await Cart.findOne({ user: userId });
      
      if (!cart) {
        cart = new Cart({
          user: userId,
          items: []
        });
      }

      // Merge local cart with database cart
      for (const localItem of localCartItems) {
        // Verify product still exists and is active
        const productId = localItem.product || localItem.productId;
        const product = await Product.findById(productId);
        if (!product || !product.isActive) {
          continue; // Skip inactive/deleted products
        }

        const existingItemIndex = cart.items.findIndex(
          (item: any) => item.product.toString() === productId.toString()
        );

        if (existingItemIndex > -1) {
          // Update quantity (add local quantity to existing)
          const newQuantity = cart.items[existingItemIndex].quantity + localItem.quantity;
          
          // Check stock availability
          if (product.stock >= newQuantity) {
            cart.items[existingItemIndex].quantity = newQuantity;
            cart.items[existingItemIndex].price = product.price;
            cart.items[existingItemIndex].name = product.name;
            cart.items[existingItemIndex].image = product.images?.[0] || product.thumbnail || '';
          } else {
            // Set to max available stock
            cart.items[existingItemIndex].quantity = product.stock;
          }
        } else {
          // Add new item from local cart
          const quantity = Math.min(localItem.quantity, product.stock);
          const cartItem: any = {
            product: new Types.ObjectId(productId),
            quantity,
            price: product.price,
            name: product.name,
            image: product.images?.[0] || product.thumbnail || ''
          };
          cart.items.push(cartItem);
        }
      }

      await cart.save();
      await cart.populate('items.product', 'name price images thumbnail stock isActive');
      
      return cart;
    } catch (error: any) {
      throw new AppError(error.message || 'Error syncing cart', 500);
    }
  }
}
