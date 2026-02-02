import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class CategoryController {
  private categoryService: CategoryService;

  constructor() {
    this.categoryService = new CategoryService();
  }

  // ===== CRUD OPERATIONS =====

  /**
   * Get all categories with pagination, search, and filters
   * GET /api/categories
   */
  getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page,
        limit,
        search,
        isActive,
        parentCategory,
        sortBy,
        sortOrder,
        includeSubcategories
      } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        parentCategory: parentCategory as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        includeSubcategories: includeSubcategories === 'true'
      };

      const result = await this.categoryService.getAllCategories(params);

      res.status(200).json({
        success: true,
        data: result.categories,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get category by ID
   * GET /api/categories/:id
   */
  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.getCategoryById(id);

      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get category by slug
   * GET /api/categories/slug/:slug
   */
  getCategoryBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug } = req.params;
      const category = await this.categoryService.getCategoryBySlug(slug);

      res.status(200).json({
        success: true,
        data: category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create a new category
   * POST /api/categories
   */
  createCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categoryData = req.body;
      const category = await this.categoryService.createCategory(categoryData);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update a category
   * PUT /api/categories/:id
   */
  updateCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      const category = await this.categoryService.updateCategory(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete a category
   * DELETE /api/categories/:id
   */
  deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { force } = req.query;
      const result = await this.categoryService.deleteCategory(id, force === 'true');

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  // ===== UTILITY ENDPOINTS =====

  /**
   * Toggle category active status
   * PATCH /api/categories/:id/toggle-status
   */
  toggleCategoryStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const category = await this.categoryService.toggleCategoryStatus(id);

      res.status(200).json({
        success: true,
        message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`,
        data: category
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get root categories (no parent)
   * GET /api/categories/root
   */
  getRootCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.categoryService.getRootCategories();

      res.status(200).json({
        success: true,
        data: categories
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get category tree (hierarchical structure)
   * GET /api/categories/tree
   */
  getCategoryTree = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tree = await this.categoryService.getCategoryTree();

      res.status(200).json({
        success: true,
        data: tree
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if slug exists
   * GET /api/categories/check-slug
   */
  checkSlugExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { slug, excludeId } = req.query;

      if (!slug) {
        res.status(400).json({
          success: false,
          message: 'Slug is required'
        });
        return;
      }

      const exists = await this.categoryService.checkSlugExists(
        slug as string, 
        excludeId as string
      );

      res.status(200).json({
        success: true,
        data: { exists }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get category statistics
   * GET /api/categories/stats
   */
  getCategoryStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.categoryService.getCategoryStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update product counts for all categories
   * POST /api/categories/update-counts
   */
  updateProductCounts = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.categoryService.updateAllProductCounts();

      res.status(200).json({
        success: true,
        message: result.message,
        data: { updated: result.updated }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Reorder categories
   * POST /api/categories/reorder
   */
  reorderCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderedIds } = req.body;

      if (!orderedIds || !Array.isArray(orderedIds)) {
        res.status(400).json({
          success: false,
          message: 'orderedIds array is required'
        });
        return;
      }

      const result = await this.categoryService.reorderCategories(orderedIds);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update categories
   * POST /api/categories/bulk-update
   */
  bulkUpdateCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, data } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'ids array is required'
        });
        return;
      }

      const result = await this.categoryService.bulkUpdateCategories(ids, data);

      res.status(200).json({
        success: true,
        message: `${result.modifiedCount} categories updated successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk delete categories
   * POST /api/categories/bulk-delete
   */
  bulkDeleteCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'ids array is required'
        });
        return;
      }

      const result = await this.categoryService.bulkDeleteCategories(ids);

      res.status(200).json({
        success: true,
        message: `${result.deletedCount} categories deleted successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
