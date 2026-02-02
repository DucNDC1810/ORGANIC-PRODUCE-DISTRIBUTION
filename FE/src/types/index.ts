export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface Review {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  product: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RatingStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export interface Product {
  _id: string;
  product_id?: number;
  name: string;
  description: string;
  price: number;
  stockQuantity: number;
  certification?: string;
  originFarm?: string;
  nutritionInfo?: string;
  imageUrls: string[];
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Discontinued';
  categoryId: number;
  category?: string;
  createdAt: string;
  // Review fields
  rating?: number;
  reviewCount?: number;
  reviews?: Review[];
  // Legacy fields for backward compatibility
  image?: string;
  stock?: number;
  farmerId?: string;
}

export interface Order {
  _id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: 'pending' | 'processing' | 'delivered' | 'cancelled';
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}
