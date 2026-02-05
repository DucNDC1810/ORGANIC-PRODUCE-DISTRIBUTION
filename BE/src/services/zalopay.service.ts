import axios from 'axios';
// @ts-ignore
import CryptoJS from 'crypto-js';
import { v4 as uuidv4 } from 'uuid';
import { AppError } from '../utils/AppError';

export interface ZaloPayConfig {
  appId: number;
  key1: string;
  key2: string;
}

export interface ZaloPayInitResponse {
  returncode: number;
  returnmessage: string;
  zptranstoken?: string;
  orderurl?: string;
  apptransid?: string;
}

export interface ZaloPayItem {
  itemid: string;
  itemname: string;
  itemprice: number;
  itemquantity: number;
}

export interface ZaloPayStatusResponse {
  returncode: number;
  returnmessage: string;
  sub_return_code?: number;
  sub_return_message?: string;
  zalo_trans_id?: number;
  server_time?: number;
  amount?: number;
  finish_time?: number;
  isprocessing?: boolean;
}

class ZaloPayService {
  private config: ZaloPayConfig;
  private readonly API_BASE_URL = 'https://sandbox.zalopay.com.vn/v001/tpe';

  constructor() {
    this.config = {
      appId: parseInt(process.env.ZALOPAY_APP_ID || '0'),
      key1: process.env.ZALOPAY_KEY1 || '',
      key2: process.env.ZALOPAY_KEY2 || '',
    };

    if (!this.config.appId || !this.config.key1 || !this.config.key2) {
      console.warn(
        '⚠️ ZaloPay configuration is incomplete. Please set ZALOPAY_APP_ID, ZALOPAY_KEY1, ZALOPAY_KEY2 in .env'
      );
    }
  }

  /**
   * Tạo mã giao dịch theo định dạng của ZaloPay: yyMMdd_xxxx
   * Ví dụ: 260205_123456
   */
  private generateAppTransId(): string {
    const now = new Date();
    // Lấy năm (2 chữ số cuối), tháng, ngày
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    
    // Tạo phần random (6 chữ số)
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, '0');

    return `${year}${month}${date}_${random}`;
  }

  /**
   * Tạo MAC theo hướng dẫn của ZaloPay
   * MAC = HmacSHA256(data, key1)
   * Trong đó data = appid|apptransid|appuser|amount|apptime|embeddata|item
   */
  private generateMac(data: string, key: string): string {
    return CryptoJS.HmacSHA256(data, key).toString();
  }

  /**
   * Tạo đơn hàng trên ZaloPay
   * POST /api/zalopay/create-order
   */
  async createOrder(
    appuser: string,
    amount: number,
    description: string,
    items: ZaloPayItem[],
    embeddata?: any,
    redirectUrl?: string
  ): Promise<ZaloPayInitResponse> {
    try {
      const apptransid = this.generateAppTransId();
      const apptime = Date.now(); // timestamp in milliseconds

      // embeddata mặc định
      const embeddataObj = embeddata || {
        merchantinfo: 'organica',
      };

      const embeddataStr = JSON.stringify(embeddataObj);
      const itemStr = JSON.stringify(items);

      // Tạo data để tính MAC theo đúng định dạng của ZaloPay
      // appid|apptransid|appuser|amount|apptime|embeddata|item
      const dataToMac = `${this.config.appId}|${apptransid}|${appuser}|${amount}|${apptime}|${embeddataStr}|${itemStr}`;
      const mac = this.generateMac(dataToMac, this.config.key1);

      // Chuẩn bị payload gửi đến ZaloPay
      const callbackUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/zalopay/callback`;
      const payload = {
        appid: this.config.appId,
        apptransid,
        appuser,
        amount,
        apptime,
        embeddata: embeddataStr,
        item: itemStr,
        description,
        // bankcode: 'zalopayapp',
        callback_url: callbackUrl,
        mac,
      };

      console.log('📤 ZaloPay createOrder request:');
      console.log('  AppTransId:', apptransid);
      console.log('  Amount:', amount, 'VND');
      console.log('  User:', appuser);
      console.log('  Items:', items);
      console.log('  📍 CallbackUrl:', callbackUrl);
      console.log('  📍 API_BASE_URL from env:', process.env.API_BASE_URL);

      const response = await axios.post<ZaloPayInitResponse>(
        `${this.API_BASE_URL}/createorder`,
        null,
        { params: payload }
      );

      console.log('📥 ZaloPay createOrder response:');
      console.log('  ReturnCode:', response.data.returncode);
      console.log('  ReturnMessage:', response.data.returnmessage);
      console.log('  OrderURL:', response.data.orderurl);

      if (response.data.returncode !== 1) {
        throw new AppError(
          `ZaloPay createorder failed: ${response.data.returnmessage || 'Unknown error'}`,
          400
        );
      }

      return {
        returncode: response.data.returncode,
        returnmessage: response.data.returnmessage,
        zptranstoken: response.data.zptranstoken,
        orderurl: response.data.orderurl,
        apptransid: apptransid,
      };
    } catch (error: any) {
      const errorMessage = error.response?.data?.returnmessage || error.message || 'Failed to create ZaloPay order';
      console.error('❌ ZaloPay createorder error:', errorMessage);
      throw new AppError(errorMessage, 500);
    }
  }

  /**
   * Truy vấn trạng thái đơn hàng từ ZaloPay
   * POST https://sandbox.zalopay.com.vn/v001/tpe/getstatusbyapptransid
   * MAC = HmacSHA256(appid|apptransid|key1, key1)
   */
  async getOrderStatus(apptransid: string): Promise<ZaloPayStatusResponse> {
    try {
      // Tính MAC: appid|apptransid|key1
      const dataToMac = `${this.config.appId}|${apptransid}|${this.config.key1}`;
      const mac = this.generateMac(dataToMac, this.config.key1);

      const payload = {
        appid: this.config.appId,
        apptransid,
        mac,
      };

      console.log('📤 ZaloPay getStatusByAppTransId request:');
      console.log('  AppTransId:', apptransid);

      // Dùng application/x-www-form-urlencoded
      const response = await axios.post<ZaloPayStatusResponse>(
        `${this.API_BASE_URL}/getstatusbyapptransid`,
        new URLSearchParams(payload as any),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      console.log('📥 ZaloPay getStatusByAppTransId response:');
      console.log('  ReturnCode:', response.data.returncode);
      console.log('  ReturnMessage:', response.data.returnmessage);
      console.log('  IsProcessing:', response.data.isprocessing);

      return response.data;
    } catch (error: any) {
      const errorMessage = error.response?.data?.returnmessage || error.message || 'Failed to check order status';
      console.error('❌ ZaloPay getStatusByAppTransId error:', errorMessage);
      throw new AppError(errorMessage, 500);
    }
  }

  /**
   * Verify callback MAC từ ZaloPay server
   * MAC = HmacSHA256(dataStr, key2)
   * dataStr là JSON string của dữ liệu giao dịch
   */
  verifyCallbackMac(dataStr: string, receivedMac: string): boolean {
    try {
      const expectedMac = CryptoJS.HmacSHA256(dataStr, this.config.key2).toString();
      return expectedMac === receivedMac;
    } catch (error) {
      console.error('❌ MAC verification error:', error);
      return false;
    }
  }

  /**
   * Debug method - tính MAC để so sánh
   */
  calculateMac(dataStr: string): string {
    try {
      return CryptoJS.HmacSHA256(dataStr, this.config.key2).toString();
    } catch (error) {
      console.error('❌ Error calculating MAC:', error);
      return '';
    }
  }

  /**
   * Parse callback data từ ZaloPay
   * Trích xuất thông tin giao dịch từ callback data
   */
  parseCallbackData(dataStr: string): any {
    try {
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('❌ Error parsing callback data:', error);
      throw new AppError('Invalid callback data format', 400);
    }
  }
}


export default new ZaloPayService();
