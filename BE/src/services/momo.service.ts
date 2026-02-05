import axios from 'axios';
// @ts-ignore
import CryptoJS from 'crypto-js';
import { AppError } from '../utils/AppError';

export interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
}

export interface MoMoCreatePaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  amount: number;
  responseTime: number;
  message: string;
  resultCode: number;
  payUrl?: string;
  deeplink?: string;
  deeplinkWebInApp?: string;
  qrCodeUrl?: string;
}

export interface MoMoQueryPaymentResponse {
  partnerCode: string;
  orderId: string;
  requestId: string;
  responseTime: number;
  resultCode: number;
  resultDescription: string;
  amount?: number;
  transId?: number;
  payType?: string;
  finishTime?: number;
  message?: string;
}

class MoMoService {
  private config: MoMoConfig;

  constructor() {
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE || '',
      accessKey: process.env.MOMO_ACCESS_KEY || '',
      secretKey: process.env.MOMO_SECRET_KEY || '',
      endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v3/gateway',
    };

    if (!this.config.partnerCode || !this.config.accessKey || !this.config.secretKey) {
      console.warn(
        '⚠️ MoMo configuration is incomplete. Please set MOMO_PARTNER_CODE, MOMO_ACCESS_KEY, MOMO_SECRET_KEY in .env'
      );
    }
  }

  /**
   * Tạo chữ ký (signature) cho request
   * signature = HmacSHA256(rawSignature, secretKey)
   * rawSignature = accessKey|requestId|orderId|amount|saretKey
   */
  private generateSignature(rawSignature: string): string {
    return CryptoJS.HmacSHA256(rawSignature, this.config.secretKey).toString();
  }

  /**
   * Tạo orderId duy nhất
   * Format: timestamp_randomString
   * Ví dụ: 1675850123456_ABC123
   */
  private generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${timestamp}_${random}`;
  }

  /**
   * Tạo requestId duy nhất
   */
  private generateRequestId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `${timestamp}${random}`;
  }

  /**
   * Tạo link thanh toán MoMo
   * POST /create
   */
  async createPayment(
    amount: number,
    description: string,
    orderInfo: string,
    redirectUrl: string,
    orderId?: string
  ): Promise<MoMoCreatePaymentResponse> {

    try {
      const motoOrderId = orderId || this.generateOrderId();
      const requestId = motoOrderId;
      const requestType = 'payWithMethod';
      const notifyUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/momo/callback`;
      const extraData = '';

      console.log('📤 MoMo createPayment request:');
      console.log('  OrderId:', motoOrderId);
      console.log('  RequestId:', requestId);
      console.log('  Amount:', amount, 'VND');
      console.log('  Description:', description);
      console.log('  📍 RedirectUrl:', redirectUrl);
      console.log('  📍 NotifyUrl:', notifyUrl);

      // MoMo v2 gateway signature format (query string):
      // signature = HmacSHA256(accessKey=xxx&amount=xxx&extraData=xxx&ipnUrl=xxx&orderId=xxx&orderInfo=xxx&partnerCode=xxx&redirectUrl=xxx&requestId=xxx&requestType=xxx, secretKey)
      const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${motoOrderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

      const signature = this.generateSignature(rawSignature);

      console.log('📝 Signature Debug:');
      console.log('  accessKey:', this.config.accessKey);
      console.log('  amount:', amount);
      console.log('  extraData:', extraData);
      console.log('  ipnUrl:', notifyUrl);
      console.log('  orderId:', motoOrderId);
      console.log('  orderInfo:', orderInfo);
      console.log('  partnerCode:', this.config.partnerCode);
      console.log('  redirectUrl:', redirectUrl);
      console.log('  requestId:', requestId);
      console.log('  requestType:', requestType);
      console.log('📝 Full Raw Signature:');
      console.log('  ', rawSignature);
      console.log('🔐 Generated Signature:', signature);

      const payload = {
        partnerCode: this.config.partnerCode,
        partnerName: 'Organic Produce Distribution',
        storeId: 'MomoStore',
        requestId,
        amount,
        orderId: motoOrderId,
        orderInfo,
        redirectUrl,
        ipnUrl: notifyUrl,
        lang: 'vi',
        requestType,
        autoCapture: true,
        extraData,
        orderGroupId: '',
        signature,
      };

      console.log('🔐 Signature generated');
      console.log('📋 Payload:', JSON.stringify(payload, null, 2));

      const response = await axios.post<MoMoCreatePaymentResponse>(
        `${this.config.endpoint}/create`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📥 MoMo createPayment response:');
      console.log('  ResultCode:', response.data.resultCode);
      console.log('  Message:', response.data.message);
      console.log('  PayUrl:', response.data.payUrl ? response.data.payUrl.substring(0, 50) + '...' : 'N/A');

      if (response.data.resultCode !== 0) {
        throw new AppError(
          `MoMo createPayment failed: ${response.data.message || 'Unknown error'}`,
          400
        );
      }

      return {
        ...response.data,
        orderId: motoOrderId,
      };
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to create MoMo payment';
      console.error('❌ MoMo createPayment error:', errorMessage);
      console.error('❌ Error response data:', JSON.stringify(error.response?.data, null, 2));
      console.error('❌ Error status:', error.response?.status);
      throw new AppError(errorMessage, 500);
    }
  }



  /**
   * Mock payment for testing (returns fake success response)
   */
  async createPaymentMock(
    amount: number,
    description: string,
    orderInfo: string,
    redirectUrl: string,
    orderId?: string
  ): Promise<MoMoCreatePaymentResponse> {
    try {
      const motoOrderId = orderId || this.generateOrderId();
      const requestId = this.generateRequestId();

      console.log('🧪 MOCK MODE - Returning fake MoMo response');
      console.log('  OrderId:', motoOrderId);
      console.log('  Amount:', amount);

      // Return mock response with valid structure
      return {
        partnerCode: this.config.partnerCode,
        orderId: motoOrderId,
        requestId,
        amount,
        responseTime: Date.now(),
        message: 'MOCK SUCCESS',
        resultCode: 0,
        payUrl: `https://test-payment.momo.vn/v3/gateway?token=mock_${motoOrderId}`,
        deeplink: `momo://transaction/payment/mock_${motoOrderId}`,
        deeplinkWebInApp: `momo://transaction/payment/mock_${motoOrderId}`,
        qrCodeUrl: 'https://api.momo.vn/qr/mock_qr.png',
      };
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create mock MoMo payment';
      console.error('❌ Mock payment error:', errorMessage);
      throw new AppError(errorMessage, 500);
    }
  }

  /**
   * Truy vấn trạng thái giao dịch
   * POST /query
   */
  async queryPayment(orderId: string, requestId: string): Promise<MoMoQueryPaymentResponse> {
    try {
      console.log('📤 MoMo queryPayment request:');
      console.log('  OrderId:', orderId);
      console.log('  RequestId:', requestId);

      // Tạo raw signature: accessKey=${accessKey}&orderId=${orderId}&partnerCode=${partnerCode}&requestId=${requestId}
      const rawSignature = `accessKey=${this.config.accessKey}&orderId=${orderId}&partnerCode=${this.config.partnerCode}&requestId=${requestId}`;
      const signature = this.generateSignature(rawSignature);

      const payload = {
        partnerCode: this.config.partnerCode,
        requestId,
        orderId,
        signature,
        lang: 'vi',
      };

      const response = await axios.post<MoMoQueryPaymentResponse>(
        `${this.config.endpoint}/query`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      console.log('📥 MoMo queryPayment response:');
      console.log('  ResultCode:', response.data.resultCode);
      console.log('  ResultDescription:', response.data.resultDescription);

      return response.data;
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to query MoMo payment';
      console.error('❌ MoMo queryPayment error:', errorMessage);
      throw new AppError(errorMessage, 500);
    }
  }

  /**
   * Verify callback signature từ MoMo server
   * signature = HmacSHA256(accessKey|amount|extraData|ipnUrl|orderId|orderInfo|partnerCode|requestId|requestType|responseTime|resultCode|transId, secretKey)
   */
  verifyCallbackSignature(payload: any, receivedSignature: string): boolean {
    try {
      const {
        accessKey,
        amount,
        extraData,
        ipnUrl,
        orderId,
        orderInfo,
        partnerCode,
        requestId,
        requestType,
        responseTime,
        resultCode,
        transId,
      } = payload;

      const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&requestId=${requestId}&requestType=${requestType}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

      const expectedSignature = this.generateSignature(rawSignature);
      return expectedSignature === receivedSignature;
    } catch (error) {
      console.error('❌ Signature verification error:', error);
      return false;
    }
  }

  /**
   * Parse extraData (base64 encoded JSON)
   */
  parseExtraData(extraData: string): any {
    try {
      const decoded = Buffer.from(extraData, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch (error) {
      console.error('❌ Error parsing extraData:', error);
      return null;
    }
  }

  /**
   * Debug method - tính signature để so sánh
   */
  calculateSignature(rawSignature: string): string {
    try {
      return this.generateSignature(rawSignature);
    } catch (error) {
      console.error('❌ Error calculating signature:', error);
      return '';
    }
  }
}

export default new MoMoService();
