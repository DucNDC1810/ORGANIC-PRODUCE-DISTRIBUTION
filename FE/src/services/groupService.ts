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
  status: 'active' | 'locked' | 'completed';
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
}

// ── API calls ────────────────────────────────────────────────────────────────

export const groupService = {
  /** POST /api/groups — Tạo nhóm mới, trả về thông tin nhóm */
  createGroup: async (data: {
    groupName: string;
    paymentMethod: string;
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

  /** POST /api/groups/:id/join — Tham gia nhóm (khách vãng lai hoặc user đã đăng nhập) */
  joinGroup: async (
    groupId: string,
    data: { tempName?: string }
  ): Promise<GroupMember> => {
    const res: any = await api.post(`/groups/${groupId}/join`, data);
    return res.data;
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
};
