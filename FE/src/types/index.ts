export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
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
