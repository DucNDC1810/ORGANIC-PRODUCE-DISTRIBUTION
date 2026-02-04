import axios from "axios";
import * as crypto from "crypto";
import { AppError } from "../utils/AppError";

// ===== INTERFACES =====

export interface ZaloPayConfig {
  appId: number;
  key1: string;
  key2: string;
  baseUrl: string;
}

export interface ZaloPayInitPayload {
  app_id: number;
  app_trans_id: string;
  app_user: string;
  amount: number;
  app_time: number;
  embed_data: string;
  item: string;
  description: string;
  bank_code?: string;
  callback_url: string;
  mac: string;
}

export interface ZaloPayInitResponse {
  returncode: number;
  returnmessage: string;
  zptranstoken?: string;
  orderurl?: string;
  apptransid?: string;
  zaloTransId?: string;
}

// Legacy response format (if any)
export interface ZaloPayInitResponse2 {
  return_code: number;
  return_message: string;
  order_url?: string;
  order_token?: string;
  sub_return_code?: number;
  sub_return_message?: string;
  zalo_trans_id?: string;
}

export interface ZaloPayStatusPayload {
  app_id: number;
  app_trans_id: string;
  mac: string;
}

export interface ZaloPayStatusResponse {
  return_code: number;
  return_message: string;
  sub_return_code: number;
  sub_return_message: string;
  zalo_trans_id: number;
  server_time: number;
  amount: number;
  discount_amount?: number;
  discount_info_data?: string;
  user_fee_amount?: number;
  discount_amount_remain?: number;
  embed_data?: string;
  method?: string;
  sub_merchant_id?: string;
  create_time?: number;
  finish_time?: number;
}

export interface ZaloPayRefundPayload {
  app_id: number;
  m_refund_id: string;
  zalo_trans_id: number;
  amount: number;
  app_time: number;
  mac: string;
  description?: string;
}

// ===== ZALOPAY SERVICE =====

class ZaloPayService {
  private config: ZaloPayConfig;
  private readonly API_BASE_URL = "https://sandbox.zalopay.com.vn/v001/tpe";

  constructor() {
    this.config = {
      appId: parseInt(process.env.ZALOPAY_APP_ID || "0"),
      key1: process.env.ZALOPAY_KEY1 || "",
      key2: process.env.ZALOPAY_KEY2 || "",
      baseUrl: process.env.ZALOPAY_BASE_URL || this.API_BASE_URL,
    };

    if (!this.config.appId || !this.config.key1 || !this.config.key2) {
      console.warn(
        "⚠️ ZaloPay configuration is incomplete. Please set ZALOPAY_APP_ID, ZALOPAY_KEY1, and ZALOPAY_KEY2 in .env",
      );
    }
  }

  /**
   * Generate HMAC SHA256 signature
   */
  private generateMac(data: string, key: string): string {
    return crypto.createHmac("sha256", key).update(data).digest("hex");
  }

  /**
   * Generate unique transaction ID with format YYMMDD_xxxx
   */
  private generateTransactionId(): string {
    const now = new Date();
    const yymmdd = now.toISOString().slice(2, 10).replace(/-/g, "");
    const random = Math.floor(Math.random() * 1000000)
      .toString()
      .padStart(6, "0");
    return `${yymmdd}_${random}`;
  }

  /**
   * Initialize ZaloPay payment
   */
  async initPayment(
    orderId: string,
    amount: number,
    description: string,
    userId: string,
    callbackUrl: string,
  ): Promise<ZaloPayInitResponse> {
    try {
      const appTransId = this.generateTransactionId();
      const appTime = Date.now(); // milliseconds, not seconds!

      const embedData = JSON.stringify({
        merchantinfo: "organica",
      });

      const items = [
        {
          itemid: orderId,
          itemname: description,
          itemprice: amount,
          itemquantity: 1,
        },
      ];

      const item = JSON.stringify(items);

      // Build MAC data according to ZaloPay format
      // appid|apptransid|appuser|amount|apptime|embeddata|item
      const dataToMac = `${this.config.appId}|${appTransId}|${userId}|${amount}|${appTime}|${embedData}|${item}`;
      const mac = this.generateMac(dataToMac, this.config.key1);

      console.log("ZaloPay MAC data:", dataToMac);
      console.log("ZaloPay MAC signature:", mac);

      // Build payload with correct field names
      // Get frontend base URL from environment
      const getFrontendUrl = () => {
        // Use FRONTEND_URL from .env
        const feUrl = process.env.FRONTEND_URL;
        if (feUrl) return feUrl;

        // Fallback to localhost for development
        return "http://localhost:5173";
      };

      const payload = {
        appid: this.config.appId,
        apptransid: appTransId,
        appuser: userId,
        amount,
        apptime: appTime,
        embeddata: embedData,
        item,
        description,
        // bankcode: "", // Leave empty or omit to show all payment methods
        callbackurl: callbackUrl,
        returnurl: `${getFrontendUrl()}/checkout/zalopay-return`,
        mac,
      };

      console.log("ZaloPay request payload:", payload);
      console.log("Return URL:", `${getFrontendUrl()}/checkout/zalopay-return`);

      // Send as params (query string), not JSON body!
      const response = await axios.post<ZaloPayInitResponse>(
        `${this.config.baseUrl}/createorder`,
        null,
        { params: payload },
      );

      console.log("ZaloPay response:", response.data);

      if (response.data.returncode !== 1) {
        throw new AppError(
          `ZaloPay init failed: ${response.data.returnmessage || "Unknown error"}`,
          400,
        );
      }

      // Add appTransId to response data for tracking
      return {
        ...response.data,
        apptransid: appTransId, // Include appTransId for frontend reference
      };
    } catch (error: any) {
      console.error("ZaloPay init error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          appId: this.config.appId,
          baseUrl: this.config.baseUrl,
        },
      });
      throw new AppError(
        error.response?.data?.return_message ||
          error.message ||
          "Failed to initialize ZaloPay payment",
        500,
      );
    }
  }

  /**
   * Check payment status
   */
  async checkPaymentStatus(appTransId: string): Promise<ZaloPayStatusResponse> {
    try {
      const appTime = Math.floor(new Date().getTime() / 1000);
      const dataToMac = `${this.config.appId}|${appTransId}|${appTime}`;
      const mac = this.generateMac(dataToMac, this.config.key2);

      const payload: ZaloPayStatusPayload = {
        app_id: this.config.appId,
        app_trans_id: appTransId,
        mac,
      };

      const response = await axios.post<ZaloPayStatusResponse>(
        `${this.config.baseUrl}/query`,
        payload,
      );

      if (response.data.return_code !== 1) {
        throw new AppError(
          `Payment check failed: ${response.data.return_message}`,
          400,
        );
      }

      return response.data;
    } catch (error: any) {
      console.error("ZaloPay check status error:", error);
      throw new AppError(
        error.response?.data?.return_message ||
          "Failed to check payment status",
        500,
      );
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(
    zaloTransId: number,
    amount: number,
    description?: string,
  ): Promise<any> {
    try {
      const mRefundId = this.generateTransactionId();
      const appTime = Math.floor(new Date().getTime() / 1000);
      const dataToMac = `${this.config.appId}|${mRefundId}|${zaloTransId}|${amount}|${appTime}`;
      const mac = this.generateMac(dataToMac, this.config.key1);

      const payload: ZaloPayRefundPayload = {
        app_id: this.config.appId,
        m_refund_id: mRefundId,
        zalo_trans_id: zaloTransId,
        amount,
        app_time: appTime,
        mac,
        description: description || "Refund",
      };

      const response = await axios.post(
        `${this.config.baseUrl}/refund`,
        payload,
      );

      if (response.data.return_code !== 1) {
        throw new AppError(
          `Refund failed: ${response.data.return_message}`,
          400,
        );
      }

      return response.data;
    } catch (error: any) {
      console.error("ZaloPay refund error:", error);
      throw new AppError(
        error.response?.data?.return_message || "Failed to refund payment",
        500,
      );
    }
  }

  /**
   * Verify webhook callback signature
   */
  verifyCallbackMac(data: any, receivedMac: string): boolean {
    try {
      const dataToMac = `${data.app_id}|${data.apptransid}|${data.zaloTransId}|${data.amount}|${data.status}|${data.timestamp}`;
      const expectedMac = this.generateMac(dataToMac, this.config.key2);
      return expectedMac === receivedMac;
    } catch (error) {
      console.error("MAC verification error:", error);
      return false;
    }
  }
}

export default new ZaloPayService();
