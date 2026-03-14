import { Category, ICategory } from '../models/Category.model';
import { Product } from '../models/Product.model';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

interface CategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  parentCategory?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  includeSubcategories?: boolean;
}

interface PaginatedCategoriesResponse {
  categories: ICategory[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCategories: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface CreateCategoryData {
  name: string;
  slug?: string;
  description?: string;
  icon?: string;
  color?: string;
  image?: string;
  parentCategory?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface UpdateCategoryData extends Partial<CreateCategoryData> {
  productCount?: number;
}

export class CategoryService {

  // ===== CRUD OPERATIONS =====

  /**
   * Get all categories with pagination, search, and filters
   */
  async getAllCategories(params: CategoryQueryParams = {}): Promise<PaginatedCategoriesResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      parentCategory,
      sortBy = 'sortOrder',
      sortOrder = 'asc',
      includeSubcategories = false
    } = params;

    // Build query
    const query: any = {};

    // Text search
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } }
      ];
    }

    // Active filter
    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    // Parent category filter (null = root categories only)
    if (parentCategory !== undefined) {
      if (parentCategory === 'root' || parentCategory === 'null') {
        query.parentCategory = null;
      } else {
        query.parentCategory = new mongoose.Types.ObjectId(parentCategory);
      }
    }

    // Count total documents
    const totalCategories = await Category.countDocuments(query);
    const totalPages = Math.ceil(totalCategories / limit);
    const skip = (page - 1) * limit;

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute query
    let categoryQuery = Category.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);

    // Populate subcategories if requested
    if (includeSubcategories) {
      categoryQuery = categoryQuery.populate({
        path: 'subcategories',
        match: { isActive: true },
        options: { sort: { sortOrder: 1 } }
      });
    }

    // Populate parent category
    categoryQuery = categoryQuery.populate('parentCategory', 'name slug');

    const categories = await categoryQuery.lean().exec();

    // Get product counts for all categories in a single aggregation query (avoids N+1)
    const slugs = categories.map((c: any) => c.slug);
    const productCountsAgg = await Product.aggregate([
      { $match: { category: { $in: slugs } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const productCountMap: Record<string, number> = {};
    productCountsAgg.forEach((item: any) => {
      productCountMap[item._id] = item.count;
    });

    const categoriesWithCount = categories.map((category: any) => ({
      ...category,
      productCount: productCountMap[category.slug] ?? 0
    }));

    return {
      categories: categoriesWithCount as ICategory[],
      pagination: {
        currentPage: page,
        totalPages,
        totalCategories,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<ICategory> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid category ID');
    }

    const category = await Category.findById(id)
      .populate('parentCategory', 'name slug')
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        options: { sort: { sortOrder: 1 } }
      })
      .lean();

    if (!category) {
      throw AppError.notFound('Category');
    }

    // Calculate real productCount from Product collection (all products, not just active)
    const productCount = await Product.countDocuments({ 
      category: category.slug
    });

    return { ...category, productCount } as unknown as ICategory;
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<ICategory> {
    const category = await Category.findOne({ slug })
      .populate('parentCategory', 'name slug')
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        options: { sort: { sortOrder: 1 } }
      })
      .lean();

    if (!category) {
      throw AppError.notFound('Category');
    }

    // Calculate real productCount from Product collection (all products, not just active)
    const productCount = await Product.countDocuments({ 
      category: category.slug
    });

    return { ...category, productCount } as unknown as ICategory;
  }

  /**
   * Create a new category
   */
  async createCategory(data: CreateCategoryData): Promise<ICategory> {
    // Check if name already exists
    const existingCategory = await Category.findOne({ 
      name: { $regex: new RegExp(`^${data.name}$`, 'i') }
    });

    if (existingCategory) {
      throw AppError.conflict('Category with this name already exists');
    }

    // Check if slug already exists
    if (data.slug) {
      const existingSlug = await Category.findOne({ slug: data.slug });
      if (existingSlug) {
        throw AppError.conflict('Category with this slug already exists');
      }
    }

    // Validate parent category if provided
    if (data.parentCategory) {
      if (!mongoose.Types.ObjectId.isValid(data.parentCategory)) {
        throw AppError.badRequest('Invalid parent category ID');
      }
      
      const parentExists = await Category.findById(data.parentCategory);
      if (!parentExists) {
        throw AppError.notFound('Parent category');
      }
    }

    const category = new Category(data);
    await category.save();

    return category;
  }

  /**
   * Update a category
   */
  async updateCategory(id: string, data: UpdateCategoryData): Promise<ICategory> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid category ID');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category');
    }

    // Check if name already exists (excluding current category)
    if (data.name && data.name !== category.name) {
      const existingCategory = await Category.findOne({ 
        name: { $regex: new RegExp(`^${data.name}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingCategory) {
        throw AppError.conflict('Category with this name already exists');
      }
    }

    // Check if slug already exists (excluding current category)
    if (data.slug && data.slug !== category.slug) {
      const existingSlug = await Category.findOne({ 
        slug: data.slug,
        _id: { $ne: id }
      });

      if (existingSlug) {
        throw AppError.conflict('Category with this slug already exists');
      }
    }

    // Validate parent category if provided
    if (data.parentCategory) {
      if (data.parentCategory === id) {
        throw AppError.badRequest('Category cannot be its own parent');
      }

      if (!mongoose.Types.ObjectId.isValid(data.parentCategory)) {
        throw AppError.badRequest('Invalid parent category ID');
      }
      
      const parentExists = await Category.findById(data.parentCategory);
      if (!parentExists) {
        throw AppError.notFound('Parent category');
      }
    }

    const oldSlug = category.slug;

    // Update category
    Object.assign(category, data);
    await category.save();

    // If slug changed, cascade-update all products referencing the old slug
    if (data.slug && data.slug !== oldSlug) {
      await Product.updateMany(
        { category: oldSlug },
        { $set: { category: data.slug } }
      );
    }

    return category;
  }

  /**
   * Delete a category
   */
  async deleteCategory(id: string, force: boolean = false): Promise<{ message: string }> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid category ID');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category');
    }

    // Never allow deleting a category that still has products.
    const productsCount = await Product.countDocuments({ category: category.slug });
    if (productsCount > 0) {
      throw AppError.conflict(
        `Cannot delete category. It has ${productsCount} products. Please move or delete products first.`
      );
    }

    // Check if category has subcategories
    const subcategoriesCount = await Category.countDocuments({ parentCategory: id });
    if (subcategoriesCount > 0 && !force) {
      throw AppError.conflict(
        `Cannot delete category. It has ${subcategoriesCount} subcategories. Use force=true to delete anyway.`
      );
    }

    // If force delete, update subcategories to have no parent
    if (force && subcategoriesCount > 0) {
      await Category.updateMany(
        { parentCategory: id },
        { $set: { parentCategory: null } }
      );
    }

    await Category.findByIdAndDelete(id);

    return { 
      message: `Category deleted successfully${force ? ' (force mode)' : ''}` 
    };
  }

  // ===== UTILITY METHODS =====

  /**
   * Toggle category active status
   */
  async toggleCategoryStatus(id: string): Promise<ICategory> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid category ID');
    }

    const category = await Category.findById(id);
    if (!category) {
      throw AppError.notFound('Category');
    }

    category.isActive = !category.isActive;
    await category.save();

    return category;
  }

  /**
   * Get root categories (no parent)
   */
  async getRootCategories(): Promise<ICategory[]> {
    const categories = await Category.find({ parentCategory: null, isActive: true })
      .sort({ sortOrder: 1 })
      .populate({
        path: 'subcategories',
        match: { isActive: true },
        options: { sort: { sortOrder: 1 } }
      })
      .lean();

    // Get product counts for all root categories in a single aggregation query
    const slugs = categories.map((c: any) => c.slug);
    const productCountsAgg = await Product.aggregate([
      { $match: { category: { $in: slugs } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const productCountMap: Record<string, number> = {};
    productCountsAgg.forEach((item: any) => {
      productCountMap[item._id] = item.count;
    });

    const categoriesWithCount = categories.map((category: any) => ({
      ...category,
      productCount: productCountMap[category.slug] ?? 0
    }));

    return categoriesWithCount as ICategory[];
  }

  /**
   * Get category tree (hierarchical structure)
   */
  async getCategoryTree(): Promise<ICategory[]> {
    const categories = await Category.find({ isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    // Get product counts for all categories in a single aggregation query
    const slugs = categories.map((c: any) => c.slug);
    const productCountsAgg = await Product.aggregate([
      { $match: { category: { $in: slugs } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const productCountMap: Record<string, number> = {};
    productCountsAgg.forEach((item: any) => {
      productCountMap[item._id] = item.count;
    });

    const categoriesWithCount = categories.map((cat: any) => ({
      ...cat,
      productCount: productCountMap[cat.slug] ?? 0
    }));

    // Build tree structure
    const categoryMap = new Map();
    const roots: ICategory[] = [];

    // First pass: create map of all categories
    categoriesWithCount.forEach(cat => {
      categoryMap.set(cat._id.toString(), { ...cat, subcategories: [] });
    });

    // Second pass: build tree
    categoriesWithCount.forEach(cat => {
      const category = categoryMap.get(cat._id.toString());
      if (cat.parentCategory) {
        const parent = categoryMap.get(cat.parentCategory.toString());
        if (parent) {
          parent.subcategories.push(category);
        } else {
          roots.push(category);
        }
      } else {
        roots.push(category);
      }
    });

    return roots;
  }

  /**
   * Update product count for a category
   */
  async updateProductCount(categorySlug: string): Promise<void> {
    const productCount = await Product.countDocuments({ 
      category: categorySlug
    });

    await Category.findOneAndUpdate(
      { slug: categorySlug },
      { productCount }
    );
  }

  /**
   * Update all categories product counts
   */
  async updateAllProductCounts(): Promise<{ message: string; updated: number }> {
    const categories = await Category.find({});

    // Get all product counts in a single aggregation query
    const productCountsAgg = await Product.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const productCountMap: Record<string, number> = {};
    productCountsAgg.forEach((item: any) => {
      productCountMap[item._id] = item.count;
    });

    let updated = 0;
    for (const category of categories) {
      const productCount = productCountMap[category.slug] ?? 0;

      if (category.productCount !== productCount) {
        category.productCount = productCount;
        await category.save();
        updated++;
      }
    }

    return { 
      message: 'Product counts updated successfully', 
      updated 
    };
  }

  /**
   * Reorder categories
   */
  async reorderCategories(orderedIds: string[]): Promise<{ message: string }> {
    for (let i = 0; i < orderedIds.length; i++) {
      await Category.findByIdAndUpdate(orderedIds[i], { sortOrder: i });
    }

    return { message: 'Categories reordered successfully' };
  }

  /**
   * Check if slug exists
   */
  async checkSlugExists(slug: string, excludeId?: string): Promise<boolean> {
    const query: any = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    const exists = await Category.findOne(query);
    return !!exists;
  }

  /**
   * Get categories statistics
   */
  async getCategoryStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    withProducts: number;
    empty: number;
  }> {
    const [total, active, categoriesWithProducts] = await Promise.all([
      Category.countDocuments({}),
      Category.countDocuments({ isActive: true }),
      // Use real product counts from Product collection, not stale cached field
      Product.aggregate([
        { $group: { _id: '$category' } },
        { $lookup: { from: 'categories', localField: '_id', foreignField: 'slug', as: 'cat' } },
        { $match: { 'cat.0': { $exists: true } } },
        { $count: 'total' }
      ])
    ]);

    const withProducts = categoriesWithProducts[0]?.total ?? 0;

    return {
      total,
      active,
      inactive: total - active,
      withProducts,
      empty: total - withProducts
    };
  }

  /**
   * Bulk update categories
   */
  async bulkUpdateCategories(
    ids: string[], 
    data: Partial<UpdateCategoryData>
  ): Promise<{ modifiedCount: number }> {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));
    
    const result = await Category.updateMany(
      { _id: { $in: objectIds } },
      { $set: data }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Bulk delete categories
   */
  async bulkDeleteCategories(ids: string[]): Promise<{ deletedCount: number }> {
    const objectIds = ids.map(id => new mongoose.Types.ObjectId(id));

    const categories = await Category.find({ _id: { $in: objectIds } })
      .select('name slug')
      .lean();

    if (categories.length === 0) {
      return { deletedCount: 0 };
    }

    const slugs = categories.map(category => category.slug);
    const productCounts = await Product.aggregate<{ _id: string; count: number }>([
      { $match: { category: { $in: slugs } } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    if (productCounts.length > 0) {
      const countBySlug = new Map(productCounts.map(item => [item._id, item.count]));
      const blockedCategories = categories
        .filter(category => countBySlug.has(category.slug))
        .map(category => `${category.name} (${countBySlug.get(category.slug)} products)`);

      throw AppError.conflict(
        `Cannot delete categories that still have products: ${blockedCategories.join(', ')}.`
      );
    }
    
    const result = await Category.deleteMany({ _id: { $in: objectIds } });

    return { deletedCount: result.deletedCount };
  }
}
