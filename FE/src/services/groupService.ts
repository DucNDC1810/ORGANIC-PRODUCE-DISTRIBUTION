import api from './api';

// ── Types ────────────────────────────────────────────────────────────────────

export interface GroupSettings {
  paymentMethod: string;
  timeLimit: string | null;
}

export interface Group {
  _id: string;
  groupName: string;
  ownerId: string;
  inviteCode: string;
  settings: GroupSettings;
  paymentOption: 'owner_only' | 'individual' | 'equal_split';
  status: 'active' | 'locked' | 'completed' | 'deleted';
  createdAt: string;
}

export interface GroupCartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
}

export interface GroupMember {
  _id: string;
  groupId: string;
  userId?: { _id: string; name: string; email: string } | null;
  tempName?: string | null;
  role: 'owner' | 'member';
  isReady: boolean;
  cartItems: GroupCartItem[];
  joinedAt: string;
  /** Số tiền đã tạm giữ từ ví */
  walletHoldAmount?: number;
  /** Đã thanh toán phần của mình qua ví chưa */
  walletPaid?: boolean;
}

// ── API calls ────────────────────────────────────────────────────────────────

export const groupService = {
  /** POST /api/groups — Tạo nhóm mới, trả về thông tin nhóm */
  createGroup: async (data: {
    groupName: string;
    paymentMethod: string;
    paymentOption?: 'owner_only' | 'individual' | 'equal_split';
    timeLimit?: string | null;
  }): Promise<Group> => {
    const res: any = await api.post('/groups', data);
    return res.data;
  },

  /** GET /api/groups/:id — Lấy thông tin nhóm */
  getGroup: async (groupId: string): Promise<Group> => {
    const res: any = await api.get(`/groups/${groupId}`);
    return res.data;
  },

  /** GET /api/groups/:id/members — Lấy danh sách thành viên */
  getMembers: async (groupId: string): Promise<GroupMember[]> => {
    const res: any = await api.get(`/groups/${groupId}/members`);
    return res.data;
  },

  /** POST /api/groups/:id/join — Tham gia nhóm (bắt buộc đăng nhập, dùng thông tin tài khoản) */
  joinGroup: async (groupId: string): Promise<GroupMember> => {
    const res: any = await api.post(`/groups/${groupId}/join`);
    return res.data;
  },

  /** DELETE /api/groups/:id/members/:memberId — Rời nhóm */
  leaveGroup: async (groupId: string, memberId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}/members/${memberId}`);
  },

  /** PATCH /api/groups/:id/members/:memberId/ready — Đánh dấu đã chọn món */
  setMemberReady: async (
    groupId: string,
    memberId: string,
    isReady: boolean
  ): Promise<GroupMember> => {
    const res: any = await api.patch(
      `/groups/${groupId}/members/${memberId}/ready`,
      { isReady }
    );
    return res.data;
  },

  /** POST /api/groups/:id/members/:memberId/items — Thêm món vào giỏ nhóm */
  addGroupItem: async (
    groupId: string,
    memberId: string,
    item: { productId: string; name: string; price: number; image: string; qty: number }
  ): Promise<GroupMember> => {
    const res: any = await api.post(
      `/groups/${groupId}/members/${memberId}/items`,
      item
    );
    return res.data;
  },

  /** PUT /api/groups/:id/members/:memberId/items — Đồng bộ toàn bộ danh sách món (replace, dùng cho Owner sync) */
  syncGroupItems: async (
    groupId: string,
    memberId: string,
    items: Array<{ productId: string; name: string; price: number; image: string; qty: number }>
  ): Promise<GroupMember> => {
    const res: any = await api.put(`/groups/${groupId}/members/${memberId}/items`, { items });
    return res.data;
  },

  /** POST /api/groups/:id/members/:memberId/wallet-hold — Đặt cọc phần tiền qua ví */
  holdWalletShare: async (
    groupId: string,
    memberId: string
  ): Promise<{ member: GroupMember; walletBalance: number }> => {
    const res: any = await api.post(`/groups/${groupId}/members/${memberId}/wallet-hold`);
    return res.data;
  },

  /** DELETE /api/groups/:id — Chủ nhóm hủy đơn (hoàn tiền tất cả) */
  cancelGroup: async (groupId: string): Promise<void> => {
    await api.delete(`/groups/${groupId}`);
  },

  /** PATCH /api/groups/:id/payment-option — Cập nhật tùy chọn thanh toán */
  updatePaymentOption: async (
    groupId: string,
    paymentOption: 'owner_only' | 'individual' | 'equal_split'
  ): Promise<Group> => {
    const res: any = await api.patch(`/groups/${groupId}/payment-option`, { paymentOption });
    return res.data;
  },

  /** POST /api/groups/:id/place-order — Chủ nhóm chốt đơn */
  placeGroupOrder: async (
    groupId: string,
    ownerCartItems: Array<{ productId: string; name: string; price: number; qty: number; image?: string }>,
    deliveryInfo?: Record<string, any>
  ): Promise<{ order: any; total: number; discount: number; totalHeld: number; ownerCharge: number; walletBalance: number }> => {
    const res: any = await api.post(`/groups/${groupId}/place-order`, {
      ownerCartItems,
      deliveryInfo: deliveryInfo ?? {},
    });
    return res.data;
  },
};
