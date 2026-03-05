import { Product, IProduct } from '../models/Product.model';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

interface ProductQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: boolean;
  isFeatured?: boolean;
  isOrganic?: boolean;
  farmer?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tags?: string[];
  stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

interface PaginatedProductsResponse {
  products: IProduct[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalProducts: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface CreateProductData {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images?: string[];
  thumbnail: string;
  stock: number;
  unit: string;
  origin: string;
  isOrganic?: boolean;
  certifications?: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  farmer?: string;
  isFeatured?: boolean;
  tags?: string[];
  sku?: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  expiryDate?: Date;
  harvestDate?: Date;
}

interface UpdateProductData extends Partial<CreateProductData> {
  isActive?: boolean;
  rating?: number;
  reviewCount?: number;
  soldCount?: number;
}

export class ProductService {
  
  // ===== CRUD OPERATIONS =====

  /**
   * Get all products with pagination, search, and filters
   */
  async getAllProducts(params: ProductQueryParams = {}): Promise<PaginatedProductsResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      minPrice,
      maxPrice,
      isActive,
      isFeatured,
      isOrganic,
      farmer,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      tags,
      stockStatus
    } = params;

    // Build query
    const query: any = {};

    // Text search — only name and tags to avoid false positives from description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) query.price.$gte = minPrice;
      if (maxPrice !== undefined) query.price.$lte = maxPrice;
    }

    // Boolean filters
    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    if (typeof isFeatured === 'boolean') {
      query.isFeatured = isFeatured;
    }

    if (typeof isOrganic === 'boolean') {
      query.isOrganic = isOrganic;
    }

    // Farmer filter
    if (farmer) {
      query.farmer = new mongoose.Types.ObjectId(farmer);
    }

    // Tags filter
    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    // Stock status filter
    if (stockStatus) {
      switch (stockStatus) {
        case 'out_of_stock':
          query.stock = 0;
          break;
        case 'low_stock':
          query.stock = { $gt: 0, $lte: 10 };
          break;
        case 'in_stock':
          query.stock = { $gt: 10 };
          break;
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const [products, totalProducts] = await Promise.all([
      Product.find(query)
        .populate('farmer', 'name email phone')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalProducts / limit);

    return {
      products,
      pagination: {
        currentPage: page,
        totalPages,
        totalProducts,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get product by ID
   */
  async getProductById(id: string): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    const product = await Product.findById(id).populate('farmer', 'name email phone address');

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  /**
   * Get product by SKU
   */
  async getProductBySku(sku: string): Promise<IProduct> {
    const product = await Product.findOne({ sku: sku.toUpperCase() })
      .populate('farmer', 'name email phone');

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  /**
   * Create new product
   */
  async createProduct(data: CreateProductData): Promise<IProduct> {
    // Check if SKU already exists
    if (data.sku) {
      const existingProduct = await Product.findOne({ sku: data.sku.toUpperCase() });
      if (existingProduct) {
        throw new AppError('Product with this SKU already exists', 400);
      }
    }

    const product = new Product(data);
    await product.save();

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(id: string, data: UpdateProductData): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    // Check if updating SKU to an existing one
    if (data.sku) {
      const existingProduct = await Product.findOne({ 
        sku: data.sku.toUpperCase(),
        _id: { $ne: id }
      });
      if (existingProduct) {
        throw new AppError('Product with this SKU already exists', 400);
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    ).populate('farmer', 'name email phone');

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  /**
   * Delete product (soft delete by setting isActive to false)
   */
  async softDeleteProduct(id: string): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return product;
  }

  /**
   * Hard delete product
   */
  async deleteProduct(id: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }
  }

  // ===== ADDITIONAL OPERATIONS =====

  /**
   * Toggle product active status
   */
  async toggleProductStatus(id: string): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    product.isActive = !product.isActive;
    await product.save();

    return product;
  }

  /**
   * Toggle product featured status
   */
  async toggleFeaturedStatus(id: string): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    product.isFeatured = !product.isFeatured;
    await product.save();

    return product;
  }

  /**
   * Update product stock
   */
  async updateStock(id: string, quantity: number, operation: 'add' | 'subtract' | 'set'): Promise<IProduct> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError('Invalid product ID', 400);
    }

    const product = await Product.findById(id);

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    switch (operation) {
      case 'add':
        product.stock += quantity;
        break;
      case 'subtract':
        if (product.stock < quantity) {
          throw new AppError('Insufficient stock', 400);
        }
        product.stock -= quantity;
        break;
      case 'set':
        if (quantity < 0) {
          throw new AppError('Stock cannot be negative', 400);
        }
        product.stock = quantity;
        break;
    }

    await product.save();
    return product;
  }

  /**
   * Get featured products
   */
  async getFeaturedProducts(limit: number = 10): Promise<IProduct[]> {
    return Product.find({ isFeatured: true, isActive: true })
      .populate('farmer', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string, limit: number = 20): Promise<IProduct[]> {
    return Product.find({ category, isActive: true })
      .populate('farmer', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  /**
   * Get products by farmer
   */
  async getProductsByFarmer(farmerId: string, params: ProductQueryParams = {}): Promise<PaginatedProductsResponse> {
    return this.getAllProducts({ ...params, farmer: farmerId });
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<any> {
    const [
      totalProducts,
      activeProducts,
      featuredProducts,
      outOfStockProducts,
      lowStockProducts,
      categoryStats,
      organicCount
    ] = await Promise.all([
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isFeatured: true }),
      Product.countDocuments({ stock: 0 }),
      Product.countDocuments({ stock: { $gt: 0, $lte: 10 } }),
      Product.aggregate([
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Product.countDocuments({ isOrganic: true })
    ]);

    const avgPrice = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, avgPrice: { $avg: '$price' } } }
    ]);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      featuredProducts,
      outOfStockProducts,
      lowStockProducts,
      organicProducts: organicCount,
      averagePrice: avgPrice[0]?.avgPrice || 0,
      categoryDistribution: categoryStats.reduce((acc: any, curr: any) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    };
  }

  /**
   * Search products with text search
   */
  async searchProducts(searchTerm: string, limit: number = 20): Promise<IProduct[]> {
    const escaped = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const results = await Product.aggregate([
      {
        $match: {
          isActive: true,
          $or: [
            { name: { $regex: escaped, $options: 'i' } },
            { description: { $regex: escaped, $options: 'i' } },
            { tags: { $regex: escaped, $options: 'i' } },
          ],
        },
      },
      {
        $addFields: {
          _namePriority: {
            $cond: [{ $regexMatch: { input: '$name', regex: escaped, options: 'i' } }, 0, 1],
          },
        },
      },
      { $sort: { _namePriority: 1, soldCount: -1, rating: -1 } },
      { $limit: limit },
    ]);
    // Populate farmer manually after aggregate
    await Product.populate(results, { path: 'farmer', select: 'name' });
    return results as IProduct[];
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(ids: string[], updateData: UpdateProductData): Promise<number> {
    const objectIds = ids.map(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(`Invalid product ID: ${id}`, 400);
      }
      return new mongoose.Types.ObjectId(id);
    });

    const result = await Product.updateMany(
      { _id: { $in: objectIds } },
      { $set: updateData }
    );

    return result.modifiedCount;
  }

  /**
   * Bulk delete products
   */
  async bulkDeleteProducts(ids: string[], hardDelete: boolean = false): Promise<number> {
    const objectIds = ids.map(id => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new AppError(`Invalid product ID: ${id}`, 400);
      }
      return new mongoose.Types.ObjectId(id);
    });

    if (hardDelete) {
      const result = await Product.deleteMany({ _id: { $in: objectIds } });
      return result.deletedCount;
    } else {
      const result = await Product.updateMany(
        { _id: { $in: objectIds } },
        { isActive: false }
      );
      return result.modifiedCount;
    }
  }

  /**
   * Check if SKU exists
   */
  async checkSkuExists(sku: string, excludeId?: string): Promise<boolean> {
    const query: any = { sku: sku.toUpperCase() };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const product = await Product.findOne(query);
    return !!product;
  }

  /**
   * Get related products
   */
  async getRelatedProducts(productId: string, limit: number = 6): Promise<IProduct[]> {
    const product = await this.getProductById(productId);
    
    return Product.find({
      _id: { $ne: productId },
      category: product.category,
      isActive: true
    })
      .limit(limit)
      .populate('farmer', 'name');
  }
}
