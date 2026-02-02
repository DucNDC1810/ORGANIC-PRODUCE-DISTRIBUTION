import { Request, Response, NextFunction } from 'express';
import reviewService from '../services/review.service';
import { AppError } from '../utils/AppError';

export class ReviewController {
  // GET /api/products/:productId/reviews - Lấy tất cả reviews của sản phẩm
  async getProductReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await reviewService.getProductReviews(productId, page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/products/:productId/reviews/stats - Lấy thống kê rating
  async getProductRatingStats(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const stats = await reviewService.getProductRatingStats(productId);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/products/:productId/reviews/my - Lấy review của user hiện tại cho sản phẩm
  async getMyProductReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const review = await reviewService.getUserProductReview(userId, productId);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/products/:productId/reviews - Tạo review mới
  async createReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const user = (req as any).user;
      const { rating, comment, images } = req.body;

      if (!user || !user.id) {
        throw new AppError('User not authenticated', 401);
      }

      if (!rating || !comment) {
        throw new AppError('Rating and comment are required', 400);
      }

      if (rating < 1 || rating > 5) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      const review = await reviewService.createReview(user.id, productId, rating, comment, images);

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/reviews/:reviewId - Cập nhật review
  async updateReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const userId = (req as any).user?.id;
      const { rating, comment, images } = req.body;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      if (rating !== undefined && (rating < 1 || rating > 5)) {
        throw new AppError('Rating must be between 1 and 5', 400);
      }

      const review = await reviewService.updateReview(reviewId, userId, rating, comment, images);

      res.status(200).json({
        success: true,
        message: 'Review updated successfully',
        data: review
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/reviews/:reviewId - Xóa review
  async deleteReview(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const userId = (req as any).user?.id;
      const isAdmin = (req as any).user?.role === 'admin';

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await reviewService.deleteReview(reviewId, userId, isAdmin);

      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/reviews/my - Lấy tất cả reviews của user hiện tại
  async getMyReviews(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      const result = await reviewService.getUserReviews(userId, page, limit);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/reviews/:reviewId/helpful - Đánh dấu review là helpful
  async markHelpful(req: Request, res: Response, next: NextFunction) {
    try {
      const { reviewId } = req.params;
      const review = await reviewService.markHelpful(reviewId);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new ReviewController();
