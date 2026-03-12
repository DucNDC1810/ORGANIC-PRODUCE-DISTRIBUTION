import api from './api';

// ===== INTERFACES =====

export interface MoMoCreatePaymentPayload {
  orderId: string; // Order ID từ database hoặc "temp"
  amount: number;
  description: string;
  deliveryInfo?: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    type: 'delivery' | 'pickup';
  };
  items?: Array<{
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  notes?: string;
  pickupLocation?: { name: string; address: string };
  isRecurring?: boolean;
  subscriptionFrequency?: string;
  discountAmount?: number;
}

export interface MoMoCreatePaymentResponse {
  success: boolean;
  message: string;
  data: {
    paymentId: string;
    orderId: string;
    payUrl: string;
    deeplink?: string;
    deeplinkWebInApp?: string;
    qrCodeUrl?: string;
    momoOrderId: string;
    requestId: string;
    amount: number;
  };
}

export interface MoMoQueryPaymentPayload {
  momoOrderId: string;
  requestId: string;
}

export interface MoMoQueryPaymentResponse {
  success: boolean;
  message: string;
  data: {
    momoOrderId: string;
    orderStatus: 'confirmed' | 'pending' | 'failed';
    paymentStatus: 'paid' | 'pending' | 'failed';
    amount: number;
    momoTransId?: number;
    resultCode: number;
    resultDescription: string;
  };
}

// ===== API CALLS =====

export const momoService = {
  // Create MoMo payment
  createPayment: (payload: MoMoCreatePaymentPayload) =>
    api.post<MoMoCreatePaymentResponse>('/momo/create-payment', payload),

  // Query payment status
  queryPayment: (payload: MoMoQueryPaymentPayload) =>
    api.post<MoMoQueryPaymentResponse>('/momo/query-payment', payload),
};

export default momoService;
