import api from './api';

export interface WalletInfo {
  walletBalance: number;
  transactions: Transaction[];
}

export interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'topup' | 'payment' | 'refund';
  status: 'pending' | 'success' | 'failed';
  orderId?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WalletPayPayload {
  addressId?: string;
  deliveryInfo?: Record<string, any>;
  pickupLocation?: { name: string; address: string };
  items: Array<{ productId: string; quantity: number; price: number; subtotal: number }>;
  totalAmount: number;
  notes?: string;
  voucherId?: string;
  discountAmount?: number;
  shippingCost?: number;
}

const walletService = {
  getWalletInfo: (): Promise<{ success: boolean; data: WalletInfo }> =>
    api.get('/wallet/balance') as any,

  topUp: (amount: number): Promise<{ success: boolean; data: { payUrl: string; transactionId: string } }> =>
    api.post('/wallet/topup', { amount }) as any,

  payWithWallet: (payload: WalletPayPayload): Promise<{ success: boolean; data: { order: any; walletBalance: number } }> =>
    api.post('/wallet/pay', payload) as any,

  getTransactions: (params?: { page?: number; limit?: number; type?: string }): Promise<any> =>
    api.get('/wallet/transactions', { params }) as any,

  transfer: (payload: { toUserId: string; amount: number; description?: string }): Promise<{
    success: boolean;
    data: { amount: number; toUser: { id: string; name: string }; walletBalance: number };
  }> =>
    api.post('/wallet/transfer', payload) as any,
};

export default walletService;
