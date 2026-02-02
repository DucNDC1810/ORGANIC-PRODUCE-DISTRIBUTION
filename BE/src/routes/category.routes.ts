import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkPermission } from '../middlewares/permission.middleware';
import { Permission } from '../constants/roles';

const router = Router();
const categoryController = new CategoryController();

// ===== PUBLIC ROUTES =====

// Get all categories (public - with filters)
router.get('/', categoryController.getAllCategories as any);

// Get root categories (no parent)
router.get('/root', categoryController.getRootCategories as any);

// Get category tree (hierarchical structure)
router.get('/tree', categoryController.getCategoryTree as any);

// Check if slug exists
router.get('/check-slug', categoryController.checkSlugExists as any);

// Get category by slug
router.get('/slug/:slug', categoryController.getCategoryBySlug as any);

// Get category by ID (public)
router.get('/:id', categoryController.getCategoryById as any);

// ===== PROTECTED ROUTES (Requires Authentication) =====

// Get category statistics (Admin/Manager only)
router.get(
  '/admin/stats',
  authenticate as any,
  checkPermission(Permission.CATEGORY_MANAGE_ALL) as any,
  categoryController.getCategoryStats as any
);

// ===== CATEGORY CRUD ROUTES (Requires specific permissions) =====

// Create new category (Admin, Manager)
router.post(
  '/',
  authenticate as any,
  checkPermission(Permission.CATEGORY_CREATE) as any,
  categoryController.createCategory as any
);

// Update category
router.put(
  '/:id',
  authenticate as any,
  checkPermission(Permission.CATEGORY_UPDATE) as any,
  categoryController.updateCategory as any
);

// Delete category
router.delete(
  '/:id',
  authenticate as any,
  checkPermission(Permission.CATEGORY_DELETE) as any,
  categoryController.deleteCategory as any
);

// ===== CATEGORY STATUS MANAGEMENT =====

// Toggle category active status
router.patch(
  '/:id/toggle-status',
  authenticate as any,
  checkPermission(Permission.CATEGORY_UPDATE) as any,
  categoryController.toggleCategoryStatus as any
);

// ===== ADMIN/MANAGER UTILITIES =====

// Update product counts for all categories
router.post(
  '/update-counts',
  authenticate as any,
  checkPermission(Permission.CATEGORY_MANAGE_ALL) as any,
  categoryController.updateProductCounts as any
);

// Reorder categories
router.post(
  '/reorder',
  authenticate as any,
  checkPermission(Permission.CATEGORY_MANAGE_ALL) as any,
  categoryController.reorderCategories as any
);

// ===== BULK OPERATIONS (Admin/Manager only) =====

// Bulk update categories
router.post(
  '/bulk-update',
  authenticate as any,
  checkPermission(Permission.CATEGORY_MANAGE_ALL) as any,
  categoryController.bulkUpdateCategories as any
);

// Bulk delete categories
router.post(
  '/bulk-delete',
  authenticate as any,
  checkPermission(Permission.CATEGORY_MANAGE_ALL) as any,
  categoryController.bulkDeleteCategories as any
);

export default router;
