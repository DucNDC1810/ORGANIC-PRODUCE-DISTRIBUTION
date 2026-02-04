import api from './api';

// ===== INTERFACES =====

export interface Voucher {
  _id: string;
  code: string;
  discountAmount?: number;
  discountPercentage?: number;
  discountType: 'fixed' | 'percentage';
  expiryDate: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
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
  expiryDate: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  applicableCategories?: string[];
  applicableProducts?: string[];
  description?: string;
}

export interface UpdateVoucherPayload {
  discountAmount?: number;
  discountPercentage?: number;
  expiryDate?: string;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
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

// ===== API CALLS =====

export const voucherService = {
  // Create voucher (admin)
  createVoucher: (payload: CreateVoucherPayload) =>
    api.post<VoucherResponse>('/vouchers', payload),

  // Get all vouchers
  getAllVouchers: (page = 1, limit = 10, code?: string, isActive?: boolean) =>
    api.get<VouchersResponse>('/vouchers', {
      params: { page, limit, code, isActive }
    }),

  // Get active vouchers
  getActiveVouchers: (page = 1, limit = 10) =>
    api.get<VouchersResponse>('/vouchers/active', {
      params: { page, limit }
    }),

  // Get voucher by code
  getVoucherByCode: (code: string) =>
    api.get<VoucherResponse>(`/vouchers/${code}`),

  // Get voucher by ID
  getVoucherById: (id: string) =>
    api.get<VoucherResponse>(`/vouchers/${id}`),

  // Validate voucher (check if can use)
  validateVoucher: (code: string, payload: ValidateVoucherPayload) =>
    api.post<ValidateVoucherResponse>(`/vouchers/${code}/validate`, payload),

  // Apply voucher (use voucher)
  applyVoucher: (code: string) =>
    api.post<VoucherResponse>(`/vouchers/${code}/apply`, {}),

  // Update voucher (admin)
  updateVoucher: (id: string, payload: UpdateVoucherPayload) =>
    api.patch<VoucherResponse>(`/vouchers/${id}`, payload),

  // Deactivate voucher (admin)
  deactivateVoucher: (id: string) =>
    api.patch<VoucherResponse>(`/vouchers/${id}/deactivate`, {}),

  // Delete voucher (admin)
  deleteVoucher: (id: string) =>
    api.delete(`/vouchers/${id}`),

  // Get voucher statistics (admin)
  getVoucherStats: () =>
    api.get('/vouchers/stats/summary')
};

export default voucherService;
