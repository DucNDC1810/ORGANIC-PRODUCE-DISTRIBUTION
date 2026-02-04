import api from './api';

// ===== INTERFACES =====

export interface Payment {
  _id: string;
  orderId: string;
  paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'e_wallet';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentDate: string;
  amount: number;
  transactionId?: string;
  description?: string;
  failureReason?: string;
  refundedAt?: string;
  refundAmount?: number;
  metadata?: {
    bankName?: string;
    cardLast4?: string;
    walletProvider?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentPayload {
  orderId: string;
  paymentMethod: string;
  amount: number;
  transactionId?: string;
  description?: string;
  metadata?: any;
}

export interface PaymentsResponse {
  success: boolean;
  data: Payment[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export interface PaymentResponse {
  success: boolean;
  message: string;
  data: Payment;
}

// ===== API CALLS =====

export const paymentService = {
  // Create payment
  createPayment: (payload: CreatePaymentPayload) =>
    api.post<PaymentResponse>('/payments', payload),

  // Get all payments (admin)
  getAllPayments: (page = 1, limit = 10, status?: string, paymentMethod?: string, orderId?: string) =>
    api.get<PaymentsResponse>('/payments', {
      params: { page, limit, status, paymentMethod, orderId }
    }),

  // Get my payments
  getMyPayments: (page = 1, limit = 10, status?: string) =>
    api.get<PaymentsResponse>('/payments/my-payments', {
      params: { page, limit, status }
    }),

  // Get payment by ID
  getPaymentById: (id: string) =>
    api.get<PaymentResponse>(`/payments/${id}`),

  // Get payment by transaction ID
  getPaymentByTransactionId: (transactionId: string) =>
    api.get<PaymentResponse>(`/payments/transaction/${transactionId}`),

  // Confirm payment
  confirmPayment: (id: string, transactionId?: string) =>
    api.patch<PaymentResponse>(`/payments/${id}/confirm`, { transactionId }),

  // Fail payment
  failPayment: (id: string, failureReason?: string) =>
    api.patch<PaymentResponse>(`/payments/${id}/fail`, { failureReason }),

  // Refund payment
  refundPayment: (id: string, refundAmount?: number) =>
    api.patch<PaymentResponse>(`/payments/${id}/refund`, { refundAmount }),

  // Cancel payment
  cancelPayment: (id: string) =>
    api.patch<PaymentResponse>(`/payments/${id}/cancel`, {}),

  // Retry payment
  retryPayment: (id: string) =>
    api.post<PaymentResponse>(`/payments/${id}/retry`, {}),

  // Get payment statistics (admin)
  getPaymentStats: (startDate?: string, endDate?: string) =>
    api.get('/payments/stats/summary', {
      params: { startDate, endDate }
    })
};

export default paymentService;
