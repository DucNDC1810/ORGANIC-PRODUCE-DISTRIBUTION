import api from './api';

// ===== INTERFACES =====

export interface ZaloPayInitPaymentPayload {
  orderId: string;
  amount: number;
  description: string;
  returnUrl?: string;
  notifyUrl?: string;
  deliveryInfo?: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    type: 'delivery' | 'pickup';
  };
}

export interface ZaloPayPaymentResponse {
  success: boolean;
  message: string;
  data: {
    orderUrl?: string;
    transactionId?: string;
    zaloTransId?: string;
    checkoutUrl?: string;
    returncode: number;
    returnmessage: string;
  };
}

export interface ZaloPayCheckStatusPayload {
  orderId: string;
  transactionId?: string;
}

export interface ZaloPayCheckStatusResponse {
  success: boolean;
  message: string;
  data: {
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    transactionId?: string;
    zaloTransId?: string;
    amount: number;
    paymentTime?: string;
  };
}

export interface ZaloPayCallbackPayload {
  appid: number;
  apptransid: string;
  zaloTransId: string;
  amount: number;
  status: number;
  mac: string;
  timestamp: number;
}

// ===== API CALLS =====

export const zalopayService = {
  // Initialize ZaloPay payment
  initPayment: (payload: ZaloPayInitPaymentPayload) =>
    api.post<ZaloPayPaymentResponse>('/zalopay/init', payload),

  // Check payment status
  checkPaymentStatus: (payload: ZaloPayCheckStatusPayload) =>
    api.post<ZaloPayCheckStatusResponse>('/zalopay/check-status', payload),

  // Verify payment after user returns from ZaloPay
  verifyReturn: (orderId: string, appTransId?: string) =>
    api.post<ZaloPayCheckStatusResponse>('/zalopay/verify-return', {
      orderId,
      appTransId,
    }),

  // Get payment details
  getPaymentDetails: (transactionId: string) =>
    api.get<any>(`/zalopay/payment/${transactionId}`),

  // Refund ZaloPay payment
  refundPayment: (transactionId: string, amount: number) =>
    api.post<ZaloPayPaymentResponse>('/zalopay/refund', {
      transactionId,
      amount,
    }),

  // Cancel ZaloPay payment
  cancelPayment: (transactionId: string) =>
    api.post<ZaloPayPaymentResponse>('/zalopay/cancel', {
      transactionId,
    }),

  // Test callback for sandbox/development
  testCallback: (appTransId: string) =>
    api.post<any>('/zalopay/test-callback', {
      appTransId,
    }),
};

export default zalopayService;
