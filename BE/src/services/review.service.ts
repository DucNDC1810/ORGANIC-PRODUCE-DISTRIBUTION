import Review, { IReview } from '../models/Review.model';
import Product from '../models/Product.model';
import { Order } from '../models/Order.model';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';

export class ReviewService {
  // Lấy tất cả reviews của một sản phẩm
  async getProductReviews(productId: string, page: number = 1, limit: number = 10) {
    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('Invalid product ID', 400);
    }

    const skip = (page - 1) * limit;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ product: productId });

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Lấy review của user cho một sản phẩm cụ thể
  async getUserProductReview(userId: string, productId: string) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('Invalid product ID', 400);
    }
    
    return await Review.findOne({ user: userId, product: productId })
      .populate('user', 'name email avatar');
  }

  // Tạo review mới
  async createReview(userId: string, productId: string, rating: number, comment: string, images?: string[]) {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('Invalid product ID', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Kiểm tra user đã review sản phẩm này chưa
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      throw new AppError('You have already reviewed this product', 400);
    }

    // Kiểm tra user đã mua và nhận sản phẩm này chưa
    const hasPurchased = await this.checkUserPurchase(userId, productId);
    if (!hasPurchased) {
      throw new AppError('You can only review products that you have purchased and received', 403);
    }

    const review = await Review.create({
      user: userId,
      product: productId,
      rating,
      comment,
      images: images || [],
      isVerifiedPurchase: true // User đã mua và nhận hàng thành công
    });

    await review.populate('user', 'name email avatar');

    return review;
  }

  // Kiểm tra user đã mua và nhận sản phẩm chưa
  private async checkUserPurchase(userId: string, productId: string): Promise<boolean> {
    const order = await Order.findOne({
      userId: userId,
      'items.productId': productId,
      status: 'delivered' // Chỉ cho phép review khi đơn hàng đã giao thành công
    });

    return !!order;
  }

  // Kiểm tra user có thể review sản phẩm không (public method)
  async canUserReview(userId: string, productId: string): Promise<{ canReview: boolean; reason?: string; hasPurchased: boolean; hasReviewed: boolean }> {
    // Validate IDs
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('Invalid product ID', 400);
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid user ID', 400);
    }

    // Kiểm tra đã review chưa
    const existingReview = await Review.findOne({ user: userId, product: productId });
    if (existingReview) {
      return {
        canReview: false,
        reason: 'You have already reviewed this product',
        hasPurchased: true,
        hasReviewed: true
      };
    }

    // Kiểm tra đã mua chưa
    const hasPurchased = await this.checkUserPurchase(userId, productId);
    if (!hasPurchased) {
      return {
        canReview: false,
        reason: 'You can only review products that you have purchased and received',
        hasPurchased: false,
        hasReviewed: false
      };
    }

    return {
      canReview: true,
      hasPurchased: true,
      hasReviewed: false
    };
  }

  // Cập nhật review
  async updateReview(reviewId: string, userId: string, rating?: number, comment?: string, images?: string[]) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Kiểm tra quyền sở hữu
    if (review.user.toString() !== userId) {
      throw new AppError('You are not authorized to update this review', 403);
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) review.comment = comment;
    if (images !== undefined) review.images = images;

    await review.save();
    await review.populate('user', 'name email avatar');

    return review;
  }

  // Xóa review
  async deleteReview(reviewId: string, userId: string, isAdmin: boolean = false) {
    const review = await Review.findById(reviewId);

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    // Chỉ user tạo review hoặc admin mới có thể xóa
    if (!isAdmin && review.user.toString() !== userId) {
      throw new AppError('You are not authorized to delete this review', 403);
    }

    await Review.findByIdAndDelete(reviewId);

    return { message: 'Review deleted successfully' };
  }

  // Lấy reviews của user
  async getUserReviews(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ user: userId })
      .populate('product', 'name thumbnail price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ user: userId });

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Đánh dấu review là helpful
  async markHelpful(reviewId: string) {
    const review = await Review.findByIdAndUpdate(
      reviewId,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    ).populate('user', 'name email avatar');

    if (!review) {
      throw new AppError('Review not found', 404);
    }

    return review;
  }

  // Lấy thống kê rating của sản phẩm
  async getProductRatingStats(productId: string) {
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw new AppError('Invalid product ID', 400);
    }

    const stats = await Review.aggregate([
      {
        $match: { product: new mongoose.Types.ObjectId(productId) }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ]);

    // Tạo object với tất cả ratings từ 1-5
    const ratingDistribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    stats.forEach(stat => {
      ratingDistribution[stat._id as keyof typeof ratingDistribution] = stat.count;
    });

    const totalReviews = stats.reduce((sum, stat) => sum + stat.count, 0);
    const averageRating = stats.reduce((sum, stat) => sum + (stat._id * stat.count), 0) / (totalReviews || 1);

    return {
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
      ratingDistribution
    };
  }
}

export default new ReviewService();
