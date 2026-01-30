import { Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  /**
   * Get current user's cart
   */
  getCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const cart = await this.cartService.getCart(req.user.id);

      res.status(200).json({
        success: true,
        data: cart
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Add item to cart
   */
  addToCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { productId, quantity } = req.body;

      if (!productId) {
        res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
        return;
      }

      const cart = await this.cartService.addToCart(req.user.id, {
        productId,
        quantity: quantity || 1
      });

      res.status(200).json({
        success: true,
        message: 'Item added to cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update cart item quantity
   */
  updateCartItem = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { productId } = req.params;
      const { quantity } = req.body;

      if (quantity === undefined || quantity === null) {
        res.status(400).json({
          success: false,
          message: 'Quantity is required'
        });
        return;
      }

      const cart = await this.cartService.updateCartItem(req.user.id, {
        productId,
        quantity
      });

      res.status(200).json({
        success: true,
        message: 'Cart updated',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Remove item from cart
   */
  removeFromCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { productId } = req.params;

      const cart = await this.cartService.removeFromCart(req.user.id, productId);

      res.status(200).json({
        success: true,
        message: 'Item removed from cart',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Clear entire cart
   */
  clearCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const cart = await this.cartService.clearCart(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Cart cleared',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Sync local cart with database (when user logs in)
   */
  syncCart = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const { items } = req.body;

      if (!Array.isArray(items)) {
        res.status(400).json({
          success: false,
          message: 'Items must be an array'
        });
        return;
      }

      const cart = await this.cartService.syncCart(req.user.id, items);

      res.status(200).json({
        success: true,
        message: 'Cart synced',
        data: cart
      });
    } catch (error) {
      next(error);
    }
  };
}
