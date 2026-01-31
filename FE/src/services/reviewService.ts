import api from './api';
import { Review, RatingStats } from '../types';

interface ReviewsResponse {
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface CreateReviewData {
  rating: number;
  comment: string;
  images?: string[];
}

interface UpdateReviewData {
  rating?: number;
  comment?: string;
  images?: string[];
}

export const reviewService = {
  // Lấy tất cả reviews của sản phẩm
  getProductReviews: async (productId: string, page: number = 1, limit: number = 10) => {
    const response = await api.get<ReviewsResponse>(`/products/${productId}/reviews`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Lấy thống kê rating của sản phẩm
  getProductRatingStats: async (productId: string) => {
    const response = await api.get<RatingStats>(`/products/${productId}/reviews/stats`);
    return response.data;
  },

  // Lấy review của user hiện tại cho sản phẩm
  getMyProductReview: async (productId: string) => {
    const response = await api.get<Review>(`/products/${productId}/reviews/my`);
    return response.data;
  },

  // Tạo review cho sản phẩm
  createReview: async (productId: string, data: CreateReviewData) => {
    const response = await api.post<Review>(`/products/${productId}/reviews`, data);
    return response.data;
  },

  // Cập nhật review
  updateReview: async (reviewId: string, data: UpdateReviewData) => {
    const response = await api.put<Review>(`/reviews/${reviewId}`, data);
    return response.data;
  },

  // Xóa review
  deleteReview: async (reviewId: string) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // Lấy tất cả reviews của user hiện tại
  getMyReviews: async (page: number = 1, limit: number = 10) => {
    const response = await api.get<ReviewsResponse>('/reviews/my', {
      params: { page, limit }
    });
    return response.data;
  },

  // Đánh dấu review là helpful
  markHelpful: async (reviewId: string) => {
    const response = await api.post<Review>(`/reviews/${reviewId}/helpful`);
    return response.data;
  }
};
