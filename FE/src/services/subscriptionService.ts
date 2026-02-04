import api from './api';

// ===== INTERFACES =====

export interface SubscriptionItem {
  _id?: string;
  subscriptionId?: string;
  productId: string;
  quantity: number;
}

export interface Subscription {
  _id: string;
  userId: string;
  addressId: string;
  frequency: 'weekly' | 'monthly';
  nextDeliveryDate: string;
  status: 'active' | 'paused' | 'cancelled';
  items?: any[];
  startDate: string;
  endDate?: string;
  cancelledAt?: string;
  pausedAt?: string;
  totalPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSubscriptionPayload {
  addressId: string;
  frequency: 'weekly' | 'monthly';
  nextDeliveryDate: string;
  items: SubscriptionItem[];
  notes?: string;
}

export interface UpdateSubscriptionPayload {
  addressId?: string;
  frequency?: string;
  nextDeliveryDate?: string;
  notes?: string;
}

export interface SubscriptionsResponse {
  success: boolean;
  data: Subscription[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface SubscriptionResponse {
  success: boolean;
  message: string;
  data: Subscription | any;
}

// ===== API CALLS =====

export const subscriptionService = {
  // Create subscription
  createSubscription: (payload: CreateSubscriptionPayload) =>
    api.post<SubscriptionResponse>('/subscriptions', payload),

  // Get all subscriptions (admin)
  getAllSubscriptions: (page = 1, limit = 10, status?: string, userId?: string, frequency?: string) =>
    api.get<SubscriptionsResponse>('/subscriptions', {
      params: { page, limit, status, userId, frequency }
    }),

  // Get my subscriptions
  getMySubscriptions: (page = 1, limit = 10, status?: string) =>
    api.get<SubscriptionsResponse>('/subscriptions/my-subscriptions', {
      params: { page, limit, status }
    }),

  // Get subscription by ID
  getSubscriptionById: (id: string) =>
    api.get<SubscriptionResponse>(`/subscriptions/${id}`),

  // Update subscription
  updateSubscription: (id: string, payload: UpdateSubscriptionPayload) =>
    api.patch<SubscriptionResponse>(`/subscriptions/${id}`, payload),

  // Update subscription items
  updateSubscriptionItems: (id: string, items: SubscriptionItem[]) =>
    api.patch<SubscriptionResponse>(`/subscriptions/${id}/items`, { items }),

  // Pause subscription
  pauseSubscription: (id: string) =>
    api.patch<SubscriptionResponse>(`/subscriptions/${id}/pause`, {}),

  // Resume subscription
  resumeSubscription: (id: string) =>
    api.patch<SubscriptionResponse>(`/subscriptions/${id}/resume`, {}),

  // Cancel subscription
  cancelSubscription: (id: string) =>
    api.patch<SubscriptionResponse>(`/subscriptions/${id}/cancel`, {}),

  // Get deliveries for today (admin/shipper)
  getDeliveriesForToday: () =>
    api.get<SubscriptionResponse>('/subscriptions/deliveries/today'),

  // Get subscription statistics (admin)
  getSubscriptionStats: () =>
    api.get('/subscriptions/stats/summary')
};

export default subscriptionService;
