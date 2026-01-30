import { Request, Response, NextFunction } from 'express';
import { ProductService } from '../services/product.service';
import { AuthRequest } from '../middlewares/auth.middleware';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  // ===== CRUD OPERATIONS =====

  /**
   * Get all products with pagination, search, and filters
   * GET /api/products
   */
  getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        page,
        limit,
        search,
        category,
        minPrice,
        maxPrice,
        isActive,
        isFeatured,
        isOrganic,
        farmer,
        sortBy,
        sortOrder,
        tags,
        stockStatus
      } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        category: category as string,
        minPrice: minPrice ? parseFloat(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice as string) : undefined,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        isFeatured: isFeatured !== undefined ? isFeatured === 'true' : undefined,
        isOrganic: isOrganic !== undefined ? isOrganic === 'true' : undefined,
        farmer: farmer as string,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc',
        tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
        stockStatus: stockStatus as 'in_stock' | 'low_stock' | 'out_of_stock'
      };

      const result = await this.productService.getAllProducts(params);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await this.productService.getProductById(id);

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product by SKU
   * GET /api/products/sku/:sku
   */
  getProductBySku = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sku } = req.params;
      const product = await this.productService.getProductBySku(sku);

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create new product
   * POST /api/products
   */
  createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const productData = req.body;

      // If farmer is creating, set farmer ID to their own ID
      if (req.user?.role === 'farmer') {
        productData.farmer = req.user.id;
      }

      const product = await this.productService.createProduct(productData);

      res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update product
   * PUT /api/products/:id
   */
  updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // If farmer is updating, ensure they can only update their own products
      if (req.user?.role === 'farmer') {
        const existingProduct = await this.productService.getProductById(id);
        if (existingProduct.farmer?.toString() !== req.user.id) {
          res.status(403).json({
            success: false,
            message: 'You can only update your own products'
          });
          return;
        }
      }

      const product = await this.productService.updateProduct(id, updateData);

      res.status(200).json({
        success: true,
        message: 'Product updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete product (soft delete)
   * DELETE /api/products/:id
   */
  deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { hardDelete } = req.query;

      // If farmer is deleting, ensure they can only delete their own products
      if (req.user?.role === 'farmer') {
        const existingProduct = await this.productService.getProductById(id);
        if (existingProduct.farmer?.toString() !== req.user.id) {
          res.status(403).json({
            success: false,
            message: 'You can only delete your own products'
          });
          return;
        }
      }

      if (hardDelete === 'true') {
        await this.productService.deleteProduct(id);
        res.status(200).json({
          success: true,
          message: 'Product permanently deleted'
        });
      } else {
        const product = await this.productService.softDeleteProduct(id);
        res.status(200).json({
          success: true,
          message: 'Product deactivated successfully',
          data: product
        });
      }
    } catch (error) {
      next(error);
    }
  };

  // ===== ADDITIONAL OPERATIONS =====

  /**
   * Toggle product active status
   * PATCH /api/products/:id/toggle-status
   */
  toggleProductStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await this.productService.toggleProductStatus(id);

      res.status(200).json({
        success: true,
        message: `Product ${product.isActive ? 'activated' : 'deactivated'} successfully`,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Toggle product featured status
   * PATCH /api/products/:id/toggle-featured
   */
  toggleFeaturedStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const product = await this.productService.toggleFeaturedStatus(id);

      res.status(200).json({
        success: true,
        message: `Product ${product.isFeatured ? 'featured' : 'unfeatured'} successfully`,
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update product stock
   * PATCH /api/products/:id/stock
   */
  updateStock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { quantity, operation } = req.body;

      if (quantity === undefined || !operation) {
        res.status(400).json({
          success: false,
          message: 'Please provide quantity and operation (add, subtract, or set)'
        });
        return;
      }

      const product = await this.productService.updateStock(id, quantity, operation);

      res.status(200).json({
        success: true,
        message: 'Stock updated successfully',
        data: product
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get featured products
   * GET /api/products/featured
   */
  getFeaturedProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const products = await this.productService.getFeaturedProducts(limit);

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get products by category
   * GET /api/products/category/:category
   */
  getProductsByCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { category } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const products = await this.productService.getProductsByCategory(category, limit);

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get products by farmer
   * GET /api/products/farmer/:farmerId
   */
  getProductsByFarmer = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { farmerId } = req.params;
      const { page, limit, sortBy, sortOrder } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.productService.getProductsByFarmer(farmerId, params);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get product statistics
   * GET /api/products/stats
   */
  getProductStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.productService.getProductStats();

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search products
   * GET /api/products/search
   */
  searchProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { q, limit } = req.query;

      if (!q) {
        res.status(400).json({
          success: false,
          message: 'Search query is required'
        });
        return;
      }

      const limitNum = limit ? parseInt(limit as string) : 20;
      const products = await this.productService.searchProducts(q as string, limitNum);

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update products
   * POST /api/products/bulk-update
   */
  bulkUpdateProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, updateData } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please provide an array of product IDs'
        });
        return;
      }

      if (!updateData || Object.keys(updateData).length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please provide update data'
        });
        return;
      }

      const modifiedCount = await this.productService.bulkUpdateProducts(ids, updateData);

      res.status(200).json({
        success: true,
        message: `${modifiedCount} products updated successfully`
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk delete products
   * POST /api/products/bulk-delete
   */
  bulkDeleteProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { ids, hardDelete } = req.body;

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Please provide an array of product IDs'
        });
        return;
      }

      const deletedCount = await this.productService.bulkDeleteProducts(ids, hardDelete);

      res.status(200).json({
        success: true,
        message: hardDelete 
          ? `${deletedCount} products permanently deleted`
          : `${deletedCount} products deactivated`
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if SKU exists
   * GET /api/products/check-sku
   */
  checkSkuExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { sku, excludeId } = req.query;

      if (!sku) {
        res.status(400).json({
          success: false,
          message: 'SKU is required'
        });
        return;
      }

      const exists = await this.productService.checkSkuExists(
        sku as string, 
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
   * Get related products
   * GET /api/products/:id/related
   */
  getRelatedProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 6;
      const products = await this.productService.getRelatedProducts(id, limit);

      res.status(200).json({
        success: true,
        data: products
      });
    } catch (error) {
      next(error);
    }
  };
}
