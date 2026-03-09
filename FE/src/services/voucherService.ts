import api from './api';

// ===== INTERFACES =====

export interface Voucher {
  _id: string;
  code: string;
  discountAmount?: number;
  discountPercentage?: number;
  discountType: 'fixed' | 'percentage';
  startDate: string;
  expiryDate: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  perCustomerLimit?: number;
  usedBy?: string[];
  applicableCategories?: string[];
  applicableProducts?: string[];
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVoucherPayload {
  code: string;
  discountAmount?: number;
  discountPercentage?: number;
  discountType: 'fixed' | 'percentage';
  startDate?: string;
  expiryDate: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  description?: string;
  isActive?: boolean;
}

export interface UpdateVoucherPayload {
  discountAmount?: number;
  discountPercentage?: number;
  startDate?: string;
  expiryDate?: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  perCustomerLimit?: number;
  isActive?: boolean;
  description?: string;
}

export interface VouchersResponse {
  success: boolean;
  data: Voucher[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface VoucherResponse {
  success: boolean;
  message: string;
  data: Voucher;
}

export interface ValidateVoucherPayload {
  purchaseAmount?: number;
  userId?: string;
  productIds?: string[];
  categoryId?: string;
}

export interface ValidateVoucherResponse {
  success: boolean;
  message: string;
  data: {
    voucher: Voucher;
    discountValue: number;
    isValid: boolean;
  };
}

export interface VoucherStats {
  totalVouchers: number;
  activeVouchers: number;
  scheduledVouchers: number;
  expiredVouchers: number;
  totalUsage: number;
  avgUsage: number;
  byDiscountType: { _id: string; count: number }[];
}

export interface VoucherStatsResponse {
  success: boolean;
  data: VoucherStats;
}

// ===== API CALLS =====
// NOTE: axios interceptor returns response.data directly, so res = JSON body.
// e.g. for GET /vouchers: res = { success, data: Voucher[], pagination }
// Access pattern: res.data (NOT res.data.data)

export const voucherService = {
  // Create voucher (admin)
  async createVoucher(payload: CreateVoucherPayload): Promise<VoucherResponse> {
    const res: any = await api.post('/vouchers', payload);
    return res;
  },

  // Get all vouchers
  async getAllVouchers(page = 1, limit = 10, code?: string, isActive?: boolean, status?: string): Promise<VouchersResponse> {
    const res: any = await api.get('/vouchers', { params: { page, limit, code, isActive, status } });
    return res;
  },

  // Get active vouchers
  async getActiveVouchers(page = 1, limit = 10): Promise<VouchersResponse> {
    const res: any = await api.get('/vouchers/active', { params: { page, limit } });
    return res;
  },

  // Get voucher by ID
  async getVoucherById(id: string): Promise<VoucherResponse> {
    const res: any = await api.get(`/vouchers/${id}`);
    return res;
  },

  // Validate voucher (check if can use)
  async validateVoucher(code: string, payload: ValidateVoucherPayload): Promise<ValidateVoucherResponse> {
    const res: any = await api.post(`/vouchers/${code}/validate`, payload);
    return res;
  },

  // Apply voucher (use voucher)
  async applyVoucher(code: string): Promise<VoucherResponse> {
    const res: any = await api.post(`/vouchers/${code}/apply`, {});
    return res;
  },

  // Update voucher (admin)
  async updateVoucher(id: string, payload: UpdateVoucherPayload): Promise<VoucherResponse> {
    const res: any = await api.patch(`/vouchers/${id}`, payload);
    return res;
  },

  // Deactivate voucher (admin)
  async deactivateVoucher(id: string): Promise<VoucherResponse> {
    const res: any = await api.patch(`/vouchers/${id}/deactivate`, {});
    return res;
  },

  // Delete voucher (admin)
  async deleteVoucher(id: string): Promise<void> {
    await api.delete(`/vouchers/${id}`);
  },

  // Get voucher statistics (admin)
  async getVoucherStats(): Promise<VoucherStatsResponse> {
    const res: any = await api.get('/vouchers/stats/summary');
    return res;
  },
};

export default voucherService;
