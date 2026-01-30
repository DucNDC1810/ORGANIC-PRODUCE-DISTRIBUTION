import { Router, RequestHandler } from 'express';
import { CartController } from '../controllers/cart.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const cartController = new CartController();

// @ts-ignore - Type compatibility issue with AuthRequest
router.get('/', authenticate as any, cartController.getCart as RequestHandler);

// @ts-ignore - Type compatibility issue with AuthRequest
router.post('/add', authenticate as any, cartController.addToCart as RequestHandler);

// @ts-ignore - Type compatibility issue with AuthRequest
router.put('/item/:productId', authenticate as any, cartController.updateCartItem as RequestHandler);

// @ts-ignore - Type compatibility issue with AuthRequest
router.delete('/item/:productId', authenticate as any, cartController.removeFromCart as RequestHandler);

// @ts-ignore - Type compatibility issue with AuthRequest
router.delete('/clear', authenticate as any, cartController.clearCart as RequestHandler);

// @ts-ignore - Type compatibility issue with AuthRequest
router.post('/sync', authenticate as any, cartController.syncCart as RequestHandler);

export default router;
