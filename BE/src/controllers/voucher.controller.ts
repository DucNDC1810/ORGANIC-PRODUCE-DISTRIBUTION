import { Response, NextFunction } from 'express';
import { Voucher } from '../models/Voucher.model';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

export class VoucherController {
  /**
   * Create a new voucher
   * POST /api/vouchers
   */
  createVoucher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const {
        code,
        discountAmount,
        discountPercentage,
        discountType,
        startDate,
        expiryDate,
        minPurchaseAmount,
        maxDiscountAmount,
        usageLimit,
        perCustomerLimit,
        applicableCategories,
        applicableProducts,
        description,
        isActive
      } = req.body;

      if (!code || !discountType || !expiryDate) {
        throw new AppError('Code, discount type, and expiry date are required', 400);
      }

      // Validate discount type and values
      if (!['fixed', 'percentage'].includes(discountType)) {
        throw new AppError('Discount type must be fixed or percentage', 400);
      }

      if (discountType === 'fixed' && !discountAmount) {
        throw new AppError('Discount amount is required for fixed discount type', 400);
      }

      if (discountType === 'percentage' && !discountPercentage) {
        throw new AppError('Discount percentage is required for percentage discount type', 400);
      }

      if (discountPercentage && (discountPercentage < 0 || discountPercentage > 100)) {
        throw new AppError('Discount percentage must be between 0 and 100', 400);
      }

      const start = startDate ? new Date(startDate) : new Date();
      const expiry = new Date(expiryDate);

      if (expiry <= start) {
        throw new AppError('Expiry date must be after start date', 400);
      }

      const voucher = await Voucher.create({
        code: code.toUpperCase(),
        discountAmount,
        discountPercentage,
        discountType,
        startDate: start,
        expiryDate: expiry,
        minPurchaseAmount: minPurchaseAmount || 0,
        maxDiscountAmount,
        usageLimit,
        perCustomerLimit: perCustomerLimit || 1,
        applicableCategories: applicableCategories || [],
        applicableProducts: applicableProducts || [],
        description,
        usageCount: 0,
        isActive: isActive !== undefined ? isActive : true
      });

      res.status(201).json({
        success: true,
        message: 'Voucher created successfully',
        data: voucher
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all vouchers with filters and pagination
   * GET /api/vouchers
   */
  getAllVouchers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10, code, isActive, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};
      const now = new Date();

      if (code) {
        filter.code = { $regex: code as string, $options: 'i' };
      }

      if (status) {
        if (status === 'active') {
          filter.isActive = true;
          filter.startDate = { $lte: now };
          filter.expiryDate = { $gt: now };
        } else if (status === 'scheduled') {
          filter.isActive = true;
          filter.startDate = { $gt: now };
        } else if (status === 'expired') {
          filter.expiryDate = { $lte: now };
        }
      } else if (isActive !== undefined) {
        filter.isActive = isActive === 'true';
      }

      const sortObj: any = {};
      sortObj[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

      const vouchers = await Voucher.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum);

      const total = await Voucher.countDocuments(filter);
      const pages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: vouchers,
        pagination: {
          currentPage: pageNum,
          totalPages: pages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get active vouchers
   * GET /api/vouchers/active
   */
  getActiveVouchers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page = 1, limit = 10 } = req.query;

      const pageNum = parseInt(page as string) || 1;
      const limitNum = parseInt(limit as string) || 10;
      const skip = (pageNum - 1) * limitNum;

      const now = new Date();

      const activeFilter = {
        isActive: true,
        startDate: { $lte: now },
        expiryDate: { $gt: now },
      };
      const vouchers = await Voucher.find(activeFilter)
        .sort({ expiryDate: 1 })
        .skip(skip)
        .limit(limitNum);

      const total = await Voucher.countDocuments(activeFilter);
      const pages = Math.ceil(total / limitNum);

      res.status(200).json({
        success: true,
        data: vouchers,
        pagination: {
          currentPage: pageNum,
          totalPages: pages,
          totalItems: total,
          itemsPerPage: limitNum
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get voucher by code
   * GET /api/vouchers/:code
   */
  getVoucherByCode = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.params;
      const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const voucher = await Voucher.findOne({ code: { $regex: new RegExp(`^${escapedCode}$`, 'i') } }).populate(
        'applicableProducts',
        'name price'
      );

      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      res.status(200).json({
        success: true,
        data: voucher
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get voucher by ID or code
   * GET /api/vouchers/:id
   */
  getVoucherById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Try by MongoDB ObjectId first, fallback to code search
      let voucher = null;
      if (id.match(/^[a-f\d]{24}$/i)) {
        voucher = await Voucher.findById(id).populate('applicableProducts', 'name price');
      }
      if (!voucher) {
        const escapedCode = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        voucher = await Voucher.findOne({ code: { $regex: new RegExp(`^${escapedCode}$`, 'i') } }).populate('applicableProducts', 'name price');
      }

      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      res.status(200).json({
        success: true,
        data: voucher
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Validate voucher for purchase
   * POST /api/vouchers/:code/validate
   */
  validateVoucher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.params;
      const { purchaseAmount, userId, productIds, categoryId } = req.body;
      const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const voucher = await Voucher.findOne({ code: { $regex: new RegExp(`^${escapedCode}$`, 'i') } });

      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      const now = new Date();

      // Check if not yet started
      if (now < voucher.startDate) {
        throw new AppError('Voucher is not yet active', 400);
      }

      // Check if expired
      if (now > voucher.expiryDate) {
        throw new AppError('Voucher has expired', 400);
      }

      // Check if active
      if (!voucher.isActive) {
        throw new AppError('Voucher is not active', 400);
      }

      // Check usage limit
      if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
        throw new AppError('Voucher usage limit reached', 400);
      }

      // Check minimum purchase amount
      if (purchaseAmount && purchaseAmount < (voucher.minPurchaseAmount || 0)) {
        throw new AppError(
          `Minimum purchase amount is ${voucher.minPurchaseAmount || 0}. Current: ${purchaseAmount}`,
          400
        );
      }

      // Check per-customer usage limit
      if (userId) {
        const userUsageCount = voucher.usedBy?.filter((id) => id.toString() === userId).length || 0;
        const perCustomerLimit = voucher.perCustomerLimit || 1;
        if (userUsageCount >= perCustomerLimit) {
          throw new AppError('You have reached the usage limit for this voucher', 400);
        }
      }

      // Check applicable products
      if (voucher.applicableProducts && voucher.applicableProducts.length > 0 && productIds) {
        const validProducts = productIds.every((productId: string) =>
          voucher.applicableProducts?.some((p) => p.toString() === productId)
        );
        if (!validProducts) {
          throw new AppError('Some products are not eligible for this voucher', 400);
        }
      }

      // Check applicable categories
      if (voucher.applicableCategories && voucher.applicableCategories.length > 0 && categoryId) {
        if (!voucher.applicableCategories.includes(categoryId)) {
          throw new AppError('This category is not eligible for this voucher', 400);
        }
      }

      // Calculate discount
      let discountValue = 0;
      if (voucher.discountType === 'fixed') {
        discountValue = voucher.discountAmount || 0;
      } else {
        discountValue = purchaseAmount ? Math.round((purchaseAmount * (voucher.discountPercentage || 0)) / 100) : 0;

        // Apply max discount amount if set
        if (voucher.maxDiscountAmount && discountValue > voucher.maxDiscountAmount) {
          discountValue = voucher.maxDiscountAmount;
        }
      }

      res.status(200).json({
        success: true,
        message: 'Voucher is valid',
        data: {
          voucher,
          discountValue,
          isValid: true
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Apply voucher (use voucher)
   * POST /api/vouchers/:code/apply
   */
  applyVoucher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { code } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }
      const escapedCode = code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const voucher = await Voucher.findOne({ code: { $regex: new RegExp(`^${escapedCode}$`, 'i') } });

      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      const now = new Date();

      // Check if not yet started
      if (now < voucher.startDate) {
        throw new AppError('Voucher is not yet active', 400);
      }

      // Check if expired
      if (now > voucher.expiryDate) {
        throw new AppError('Voucher has expired', 400);
      }

      // Check if active
      if (!voucher.isActive) {
        throw new AppError('Voucher is not active', 400);
      }

      // Check usage limit
      if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
        throw new AppError('Voucher usage limit reached', 400);
      }

      // Check per-customer usage limit
      const userUsageCount = voucher.usedBy?.filter((id) => id.toString() === userId).length || 0;
      const perCustomerLimit = voucher.perCustomerLimit || 1;
      if (userUsageCount >= perCustomerLimit) {
        throw new AppError('You have reached the usage limit for this voucher', 400);
      }

      // Update voucher
      if (!voucher.usedBy) {
        voucher.usedBy = [];
      }
      voucher.usedBy.push(new mongoose.Types.ObjectId(userId));
      voucher.usageCount += 1;

      await voucher.save();

      res.status(200).json({
        success: true,
        message: 'Voucher applied successfully',
        data: voucher
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update voucher
   * PATCH /api/vouchers/:id
   */
  updateVoucher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { discountAmount, discountPercentage, startDate, expiryDate, minPurchaseAmount, maxDiscountAmount, usageLimit, perCustomerLimit, isActive, description } =
        req.body;

      const voucher = await Voucher.findById(id);

      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      const updateData: any = {};

      if (discountAmount !== undefined) updateData.discountAmount = discountAmount;
      if (discountPercentage !== undefined) {
        if (discountPercentage < 0 || discountPercentage > 100) {
          throw new AppError('Discount percentage must be between 0 and 100', 400);
        }
        updateData.discountPercentage = discountPercentage;
      }
      if (startDate) updateData.startDate = new Date(startDate);
      if (expiryDate) updateData.expiryDate = new Date(expiryDate);
      if (minPurchaseAmount !== undefined) updateData.minPurchaseAmount = minPurchaseAmount;
      if (maxDiscountAmount !== undefined) updateData.maxDiscountAmount = maxDiscountAmount;
      if (usageLimit !== undefined) updateData.usageLimit = usageLimit;
      if (perCustomerLimit !== undefined) updateData.perCustomerLimit = perCustomerLimit;
      if (isActive !== undefined) updateData.isActive = isActive;
      if (description !== undefined) updateData.description = description;

      const updatedVoucher = await Voucher.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });

      res.status(200).json({
        success: true,
        message: 'Voucher updated successfully',
        data: updatedVoucher
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deactivate voucher
   * PATCH /api/vouchers/:id/deactivate
   */
  deactivateVoucher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const voucher = await Voucher.findByIdAndUpdate(id, { isActive: false }, { new: true });

      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Voucher deactivated successfully',
        data: voucher
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete voucher
   * DELETE /api/vouchers/:id
   */
  deleteVoucher = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      const voucher = await Voucher.findByIdAndDelete(id);

      if (!voucher) {
        throw new AppError('Voucher not found', 404);
      }

      res.status(200).json({
        success: true,
        message: 'Voucher deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get voucher statistics
   * GET /api/vouchers/stats/summary
   */
  getVoucherStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const now = new Date();
      const [totalVouchers, activeVouchers, scheduledVouchers, expiredVouchers] = await Promise.all([
        Voucher.countDocuments(),
        Voucher.countDocuments({ isActive: true, startDate: { $lte: now }, expiryDate: { $gt: now } }),
        Voucher.countDocuments({ isActive: true, startDate: { $gt: now } }),
        Voucher.countDocuments({ expiryDate: { $lte: now } })
      ]);

      const stats = await Voucher.aggregate([
        {
          $group: {
            _id: null,
            totalUsage: { $sum: '$usageCount' },
            avgUsage: { $avg: '$usageCount' }
          }
        }
      ]);

      const discountTypeStats = await Voucher.aggregate([
        {
          $group: {
            _id: '$discountType',
            count: { $sum: 1 }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          totalVouchers,
          activeVouchers,
          scheduledVouchers,
          expiredVouchers,
          totalUsage: stats[0]?.totalUsage || 0,
          avgUsage: Math.round(stats[0]?.avgUsage || 0),
          byDiscountType: discountTypeStats
        }
      });
    } catch (error) {
      next(error);
    }
  };
}
