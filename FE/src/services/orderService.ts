import api from './api';

// ===== INTERFACES =====

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  userId: string;
  addressId: string;
  voucherId?: string;
  groupBuyId?: string;
  subscriptionId?: string;
  orderDate: string;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: OrderItem[];
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'unpaid';
  shippingCost?: number;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  addressId: string;
  voucherId?: string;
  items: OrderItem[];
  paymentMethod?: string;
  notes?: string;
}

export interface OrdersResponse {
  success: boolean;
  data: Order[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface OrderResponse {
  success: boolean;
  message: string;
  data: Order;
}

// ===== API CALLS =====

export const orderService = {
  // Create order
  createOrder: (payload: CreateOrderPayload) =>
    api.post<OrderResponse>('/orders', payload),

  // Get all orders (admin)
  getAllOrders: (page = 1, limit = 10, status?: string, userId?: string) =>
    api.get<OrdersResponse>('/orders', {
      params: { page, limit, status, userId }
    }),

  // Get my orders
  getMyOrders: (page = 1, limit = 10, status?: string) =>
    api.get<OrdersResponse>('/orders/my-orders', {
      params: { page, limit, status }
    }),

  // Get order by ID
  getOrderById: (id: string) =>
    api.get<OrderResponse>(`/orders/${id}`),

  // Update order status (admin)
  updateOrderStatus: (id: string, status: string) =>
    api.patch<OrderResponse>(`/orders/${id}/status`, { status }),

  // Update payment status (admin)
  updatePaymentStatus: (id: string, paymentStatus: string) =>
    api.patch<OrderResponse>(`/orders/${id}/payment-status`, { paymentStatus }),

  // Cancel order
  cancelOrder: (id: string, cancelReason?: string) =>
    api.patch<OrderResponse>(`/orders/${id}/cancel`, { cancelReason }),

  // Delete order (admin)
  deleteOrder: (id: string) =>
    api.delete(`/orders/${id}`),

  // Get order statistics (admin)
  getOrderStats: (startDate?: string, endDate?: string) =>
    api.get('/orders/stats/summary', {
      params: { startDate, endDate }
    })
};

export default orderService;
