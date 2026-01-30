import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkPermission, checkRole } from '../middlewares/permission.middleware';
import { Permission, UserRole } from '../constants/roles';

const router = Router();
const productController = new ProductController();

// ===== PUBLIC ROUTES =====

// Get all products (public - with filters)
router.get('/', productController.getAllProducts as any);

// Get featured products
router.get('/featured', productController.getFeaturedProducts as any);

// Search products
router.get('/search', productController.searchProducts as any);

// Check if SKU exists
router.get('/check-sku', productController.checkSkuExists as any);

// Get products by category
router.get('/category/:category', productController.getProductsByCategory as any);

// Get products by farmer
router.get('/farmer/:farmerId', productController.getProductsByFarmer as any);

// Get product by SKU
router.get('/sku/:sku', productController.getProductBySku as any);

// Get product by ID (public)
router.get('/:id', productController.getProductById as any);

// Get related products
router.get('/:id/related', productController.getRelatedProducts as any);

// ===== PROTECTED ROUTES (Requires Authentication) =====

// Product statistics (Admin/Manager only)
router.get(
  '/admin/stats',
  authenticate as any,
  checkPermission(Permission.PRODUCT_MANAGE_ALL) as any,
  productController.getProductStats as any
);

// ===== PRODUCT CRUD ROUTES (Requires specific permissions) =====

// Create new product (Admin, Manager, Farmer)
router.post(
  '/',
  authenticate as any,
  checkPermission(Permission.PRODUCT_CREATE) as any,
  productController.createProduct as any
);

// Update product
router.put(
  '/:id',
  authenticate as any,
  checkPermission(Permission.PRODUCT_UPDATE) as any,
  productController.updateProduct as any
);

// Delete product
router.delete(
  '/:id',
  authenticate as any,
  checkPermission(Permission.PRODUCT_DELETE) as any,
  productController.deleteProduct as any
);

// ===== PRODUCT STATUS MANAGEMENT =====

// Toggle product active status
router.patch(
  '/:id/toggle-status',
  authenticate as any,
  checkPermission(Permission.PRODUCT_UPDATE) as any,
  productController.toggleProductStatus as any
);

// Toggle product featured status (Admin/Manager only)
router.patch(
  '/:id/toggle-featured',
  authenticate as any,
  checkPermission(Permission.PRODUCT_MANAGE_ALL) as any,
  productController.toggleFeaturedStatus as any
);

// Update product stock
router.patch(
  '/:id/stock',
  authenticate as any,
  checkPermission(Permission.PRODUCT_UPDATE) as any,
  productController.updateStock as any
);

// ===== BULK OPERATIONS (Admin/Manager only) =====

// Bulk update products
router.post(
  '/bulk-update',
  authenticate as any,
  checkPermission(Permission.PRODUCT_MANAGE_ALL) as any,
  productController.bulkUpdateProducts as any
);

// Bulk delete products
router.post(
  '/bulk-delete',
  authenticate as any,
  checkPermission(Permission.PRODUCT_MANAGE_ALL) as any,
  productController.bulkDeleteProducts as any
);

export default router;
