import api from './api';

// ===== INTERFACES =====

export interface GroupBuyEvent {
  _id: string;
  productId: any;
  voucherId?: string;
  targetQuantity: number;
  currentQuantity: number;
  startTime: string;
  endTime: string;
  status: 'open' | 'closed' | 'success' | 'failed';
  description?: string;
  discountPercentage?: number;
  pricePerUnit?: number;
  participants?: string[];
  participantCount: number;
  progress?: number;
  timeRemaining?: number;
  timeRemainingText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroupBuyParticipation {
  _id: string;
  groupBuyId: string;
  userId: string;
  quantity: number;
  orderPrice?: number;
  joinedAt: string;
}

export interface CreateGroupBuyEventPayload {
  productId: string;
  voucherId?: string;
  targetQuantity: number;
  startTime: string;
  endTime: string;
  description?: string;
  discountPercentage?: number;
  pricePerUnit?: number;
}

export interface GroupBuyEventsResponse {
  success: boolean;
  data: GroupBuyEvent[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface GroupBuyEventResponse {
  success: boolean;
  message: string;
  data: GroupBuyEvent;
}

// ===== API CALLS =====

export const groupbuyService = {
  // Create group buy event (admin)
  createGroupBuyEvent: (payload: CreateGroupBuyEventPayload) =>
    api.post<GroupBuyEventResponse>('/group-buy-events', payload),

  // Get all group buy events
  getAllGroupBuyEvents: (page = 1, limit = 10, status?: string, productId?: string) =>
    api.get<GroupBuyEventsResponse>('/group-buy-events', {
      params: { page, limit, status, productId }
    }),

  // Get active group buy events
  getActiveGroupBuyEvents: (page = 1, limit = 10) =>
    api.get<GroupBuyEventsResponse>('/group-buy-events/active', {
      params: { page, limit }
    }),

  // Get group buy event by ID
  getGroupBuyEventById: (id: string) =>
    api.get<GroupBuyEventResponse>(`/group-buy-events/${id}`),

  // Join group buy event
  joinGroupBuyEvent: (id: string, quantity: number) =>
    api.post<GroupBuyEventResponse>(`/group-buy-events/${id}/join`, { quantity }),

  // Update participation quantity
  updateParticipationQuantity: (id: string, quantity: number) =>
    api.patch<GroupBuyEventResponse>(`/group-buy-events/${id}/update-quantity`, { quantity }),

  // Leave group buy event
  leaveGroupBuyEvent: (id: string) =>
    api.post<GroupBuyEventResponse>(`/group-buy-events/${id}/leave`, {}),

  // Get my participations
  getMyParticipations: (page = 1, limit = 10, status?: string) =>
    api.get('/group-buy-events/my-participations', {
      params: { page, limit, status }
    }),

  // Update event status (admin)
  updateEventStatus: (id: string, status: string) =>
    api.patch<GroupBuyEventResponse>(`/group-buy-events/${id}/status`, { status }),

  // Get group buy statistics (admin)
  getGroupBuyStats: () =>
    api.get('/group-buy-events/stats/summary')
};

export default groupbuyService;
