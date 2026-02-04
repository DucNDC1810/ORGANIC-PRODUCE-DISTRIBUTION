import { Response, NextFunction } from 'express';
import { Payment } from '../models/Payment.model';
import { Order } from '../models/Order.model';
import zalopayService from '../services/zalopay.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class ZaloPayController {
  /**
   * Initialize ZaloPay payment
   * POST /api/zalopay/init
   */
  initPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, amount, description, deliveryInfo } = req.body;
      const userId = req.user?.id;

      if (!amount || !description) {
        throw new AppError('Amount and description are required', 400);
      }

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      let finalOrderId = orderId;

      // Nếu orderId là "temp", tạo order mới trước
      if (orderId === "temp" || !orderId) {
        if (!deliveryInfo) {
          throw new AppError('Delivery info is required for new orders', 400);
        }

        const newOrder = await Order.create({
          userId,
          deliveryInfo,
          paymentMethod: 'zalopay',
          items: [],
          totalAmount: amount,
          status: 'pending',
        });

        finalOrderId = newOrder._id.toString();
      } else {
        // Verify order exists
        const order = await Order.findById(orderId);
        if (!order) {
          throw new AppError('Order not found', 404);
        }

        // Verify user is order owner
        if (req.user?.id !== order.userId.toString() && req.user?.role !== 'admin') {
          throw new AppError('You do not have permission to pay for this order', 403);
        }
      }

      // Generate callback URL
      const callbackUrl = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/zalopay/callback`;
      const returnUrl = `${process.env.FRONTEND_BASE_URL}/zalopay-return`; 
      // Initialize payment with ZaloPay
      const zaloPayResponse = await zalopayService.initPayment(
        finalOrderId,
        Math.floor(amount), // ZaloPay requires integer amount in VND
        description,
        userId,
        callbackUrl
      );

      console.log('ZaloPayResponse received in controller:', zaloPayResponse);

      // Create payment record
      // returncode = 1 means ZaloPay order created successfully, NOT that payment is complete
      // Payment is only confirmed when ZaloPay callback is received
      type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";
      const paymentStatus: PaymentStatus = 'pending'; // Always pending until callback confirmation

      const payment = await Payment.create({
        orderId: finalOrderId,
        paymentMethod: 'zalopay',
        amount,
        transactionId: zaloPayResponse.zptranstoken || zaloPayResponse.apptransid || '',
        metadata: {
          appTransId: zaloPayResponse.apptransid,
          zaloTransId: zaloPayResponse.zaloTransId,
          zptranstoken: zaloPayResponse.zptranstoken,
          provider: 'zalopay',
          returncode: zaloPayResponse.returncode,
        },
        paymentStatus: paymentStatus,
        paymentDate: new Date(),
      });

      // Order status remains 'pending' until payment callback confirms success
      console.log('📝 ZaloPay order created (awaiting payment confirmation)');
      console.log('Order ID:', finalOrderId);
      console.log('Payment ID:', payment._id);
      console.log('App Trans ID:', zaloPayResponse.apptransid);
      console.log('Amount:', amount, 'VND');
      console.log('Status: pending (awaiting ZaloPay callback)');

      const responseData = {
        success: true,
        message: 'ZaloPay payment initialized',
        data: {
          paymentId: payment._id,
          orderId: finalOrderId,
          orderUrl: zaloPayResponse.orderurl,
          transactionId: zaloPayResponse.zptranstoken,
          appTransId: zaloPayResponse.apptransid, // Add appTransId for test-callback
          checkoutUrl: zaloPayResponse.orderurl, // For frontend
        },
      };

      console.log('Final response being sent to frontend:', responseData);
      console.log('checkoutUrl value:', zaloPayResponse.orderurl);
      console.log('appTransId:', zaloPayResponse.apptransid);
      console.log('Full zaloPayResponse:', JSON.stringify(zaloPayResponse, null, 2));

      res.status(200).json(responseData);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check ZaloPay payment status
   * POST /api/zalopay/check-status
   */
  checkPaymentStatus = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { orderId, transactionId } = req.body;
      const userId = req.user?.id;

      if (!orderId && !transactionId) {
        throw new AppError('Order ID or transaction ID is required', 400);
      }

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Get payment by orderId or transactionId
      const payment = await Payment.findOne({
        $or: [{ orderId }, { transactionId }],
      }).populate('orderId');

      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Verify user is owner or admin
      const order = await Order.findById(payment.orderId);
      if (req.user?.id !== order?.userId.toString() && req.user?.role !== 'admin') {
        throw new AppError('You do not have permission to check this payment', 403);
      }

      // Check status with ZaloPay
      const appTransId = (payment.metadata as any)?.appTransId;
      if (!appTransId) {
        throw new AppError('Invalid transaction ID', 400);
      }

      const zaloPayStatus = await zalopayService.checkPaymentStatus(appTransId);

      // Update payment status based on ZaloPay response
      let paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled' = 'pending';
      if (zaloPayStatus.sub_return_code === 0) {
        paymentStatus = 'paid';
      } else if (zaloPayStatus.sub_return_code === -1) {
        paymentStatus = 'failed';
      }

      if (paymentStatus === 'paid' && payment.paymentStatus !== 'paid') {
        payment.paymentStatus = 'paid';
        payment.metadata = {
          ...(payment.metadata || {}),
          zaloTransId: zaloPayStatus.zalo_trans_id,
          finishTime: zaloPayStatus.finish_time,
        } as any;
        await payment.save();

        // Update order status
        if (order) {
          order.status = 'confirmed';
          await order.save();
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment status checked',
        data: {
          status: paymentStatus,
          transactionId: payment.transactionId,
          amount: payment.amount,
          zaloTransId: zaloPayStatus.zalo_trans_id,
          returnCode: zaloPayStatus.return_code,
          returnMessage: zaloPayStatus.return_message,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * ZaloPay webhook callback
   * POST /api/zalopay/callback
   */
  handleCallback = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      console.log('🔔 ZALOPAY CALLBACK RECEIVED');
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      console.log('Request headers:', req.headers);

      const { data, mac } = req.body;

      if (!data || !mac) {
        console.log('❌ Missing data or mac in callback');
        throw new AppError('Invalid callback payload', 400);
      }

      console.log('Callback data:', data);
      console.log('Callback mac:', mac);

      // Verify MAC signature
      const isValidMac = zalopayService.verifyCallbackMac(data, mac);
      console.log('MAC verification result:', isValidMac);
      
      if (!isValidMac) {
        console.log('❌ Invalid MAC signature');
        throw new AppError('Invalid signature', 400);
      }

      const { apptransid, zaloTransId, amount, status } = data;
      console.log('Parsed callback data:', { apptransid, zaloTransId, amount, status });

      // Find payment by app transaction ID
      const payment = await Payment.findOne({
        'metadata.appTransId': apptransid,
      }).populate('orderId');

      if (!payment) {
        console.log('❌ Payment not found for appTransId:', apptransid);
        res.json({ return_code: 1, return_message: 'Invalid transaction' });
        return;
      }

      console.log('Found payment:', payment._id);

      if (!payment) {
        res.json({ return_code: 1, return_message: 'Invalid transaction' });
        return;
      }

      // Update payment status based on ZaloPay status
      if (status === 1) {
        // Payment successful
        payment.paymentStatus = 'paid';
        payment.metadata = {
          ...(payment.metadata || {}),
          zaloTransId,
          callbackTime: new Date(),
        } as any;
        await payment.save();

        // Update order status
        const order = await Order.findById(payment.orderId);
        if (order) {
          order.status = 'confirmed';
          await order.save();
        }

        // Log successful payment
        console.log('✅ THANH TOÁN ZALOPAY THÀNH CÔNG');
        console.log('═'.repeat(50));
        console.log('Order ID:', payment.orderId);
        console.log('Payment ID:', payment._id);
        console.log('App Transaction ID:', apptransid);
        console.log('ZaloTransId:', zaloTransId);
        console.log('Amount:', amount, 'VND');
        console.log('Status: PAID');
        console.log('Time:', new Date().toLocaleString('vi-VN'));
        console.log('═'.repeat(50));
      } else {
        // Payment failed
        payment.paymentStatus = 'failed';
        payment.metadata = {
          ...(payment.metadata || {}),
          callbackStatus: status,
          callbackTime: new Date(),
        } as any;
        await payment.save();

        console.log('❌ THANH TOÁN ZALOPAY THẤT BẠI');
        console.log('Order ID:', payment.orderId);
        console.log('Status Code:', status);
      }

      res.json({ return_code: 1, return_message: 'Success' });
    } catch (error) {
      console.error('ZaloPay callback error:', error);
      res.json({ return_code: 0, return_message: 'Error' });
    }
  };

  verifyReturn = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, appTransId } = req.body;

      if (!orderId && !appTransId) {
        throw new AppError('Order ID or app transaction ID is required', 400);
      }

      // Find payment
      const query: any = {};
      if (orderId) query.orderId = orderId;
      if (appTransId) query['metadata.appTransId'] = appTransId;

      const payment = await Payment.findOne(query).populate('orderId');
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // If already paid, return current status
      if (payment.paymentStatus === 'paid') {
        res.status(200).json({
          success: true,
          message: 'Payment already confirmed',
          data: {
            status: 'paid',
            orderId: payment.orderId,
            amount: payment.amount,
            paymentDate: payment.paymentDate,
          },
        });
        return;
      }

      // Check status with ZaloPay
      const transactionId = (payment.metadata as any)?.appTransId;
      if (!transactionId) {
        throw new AppError('Invalid transaction ID', 400);
      }

      let zaloPayStatus: any = null;
      let retries = 0;
      const maxRetries = 3;

      // Retry logic for checking status (as per ZaloPay docs)
      while (retries < maxRetries) {
        try {
          zaloPayStatus = await zalopayService.checkPaymentStatus(transactionId);
          
          // If processing, retry after delay
          if ((zaloPayStatus as any).isprocessing === true) {
            retries++;
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              continue;
            }
          }
          break;
        } catch (error: any) {
          retries++;
          if (retries >= maxRetries) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
        }
      }

      if (!zaloPayStatus) {
        throw new AppError('Failed to verify payment status', 500);
      }

      console.log('ZaloPay status response:', zaloPayStatus);

      // Update payment status based on ZaloPay response
      let paymentStatus: 'pending' | 'paid' | 'failed' = 'pending';
      
      if (zaloPayStatus.return_code === 1 && zaloPayStatus.sub_return_code === 0) {
        // Payment successful
        paymentStatus = 'paid';
      } else if (zaloPayStatus.return_code === -49) {
        // Payment not completed yet
        paymentStatus = 'pending';
      } else {
        // Payment failed
        paymentStatus = 'failed';
      }

      // Update payment if status changed to paid
      if (paymentStatus === 'paid' && (payment.paymentStatus as any) !== 'paid') {
        payment.paymentStatus = 'paid';
        payment.metadata = {
          ...(payment.metadata || {}),
          zaloTransId: zaloPayStatus.zalo_trans_id,
          finishTime: zaloPayStatus.finish_time,
          verifyReturnTime: new Date(),
        } as any;
        await payment.save();

        // Update order status
        const order = await Order.findById(payment.orderId);
        if (order && order.status === 'pending') {
          order.status = 'confirmed';
          await order.save();
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment status verified',
        data: {
          status: paymentStatus,
          orderId: payment.orderId,
          amount: payment.amount,
          transactionId: payment.transactionId,
          zaloTransId: zaloPayStatus.zalo_trans_id,
          returnCode: zaloPayStatus.return_code,
          returnMessage: zaloPayStatus.return_message,
        },
      });
    } catch (error) {
      console.error('ZaloPay verify return error:', error);
      next(error);
    }
  };

  /**
   * Refund ZaloPay payment
   * POST /api/zalopay/refund
   */
  refundPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { transactionId, amount } = req.body;
      const userId = req.user?.id;

      if (!transactionId || !amount) {
        throw new AppError('Transaction ID and amount are required', 400);
      }

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Only admin can refund
      if (req.user?.role !== 'admin') {
        throw new AppError('Only admin can refund payments', 403);
      }

      // Find payment
      const payment = await Payment.findOne({ transactionId }).populate('orderId');
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      if (payment.paymentStatus !== 'paid') {
        throw new AppError('Only paid payments can be refunded', 400);
      }

      // Request refund from ZaloPay
      const zaloTransId = (payment.metadata as any)?.zaloTransId;
      if (!zaloTransId) {
        throw new AppError('Invalid ZaloPay transaction ID', 400);
      }

      const refundResponse = await zalopayService.refundPayment(
        zaloTransId,
        Math.floor(amount),
        `Refund for order ${payment.orderId}`
      );

      // Update payment
      payment.paymentStatus = 'refunded';
      payment.refundAmount = amount;
      payment.refundedAt = new Date();
      await payment.save();

      res.status(200).json({
        success: true,
        message: 'Refund processed successfully',
        data: {
          paymentId: payment._id,
          refundAmount: amount,
          refundedAt: payment.refundedAt,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancel ZaloPay payment
   * POST /api/zalopay/cancel
   */
  cancelPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId } = req.body;
      const userId = req.user?.id;

      if (!orderId) {
        throw new AppError('Order ID is required', 400);
      }

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Find payment
      const payment = await Payment.findOne({ orderId }).populate('orderId');
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      // Verify user is owner or admin
      const order = await Order.findById(orderId);
      if (req.user?.id !== order?.userId.toString() && req.user?.role !== 'admin') {
        throw new AppError('You do not have permission to cancel this payment', 403);
      }

      // Only cancel pending or failed payments
      if (payment.paymentStatus !== 'pending' && payment.paymentStatus !== 'failed') {
        throw new AppError('Only pending or failed payments can be cancelled', 400);
      }

      // Update payment status
      payment.paymentStatus = 'cancelled';
      await payment.save();

      res.status(200).json({
        success: true,
        message: 'Payment cancelled successfully',
        data: {
          paymentId: payment._id,
          status: 'cancelled',
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get payment status by transaction ID
   * GET /api/zalopay/payment/:transactionId
   */
  getPaymentByTransactionId = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { transactionId } = req.params;

      const payment = await Payment.findOne({ transactionId }).populate('orderId');
      if (!payment) {
        throw new AppError('Payment not found', 404);
      }

      res.status(200).json({
        success: true,
        data: payment,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Test callback for sandbox - Simulate successful payment
   * POST /api/zalopay/test-callback
   * Body: { appTransId: "260204_781012" }
   */
  testCallback = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { appTransId } = req.body;

      if (!appTransId) {
        throw new AppError('appTransId is required', 400);
      }

      // Find payment by app transaction ID
      const payment = await Payment.findOne({
        'metadata.appTransId': appTransId,
      }).populate('orderId');

      if (!payment) {
        res.status(404).json({ 
          success: false,
          message: 'Payment not found for appTransId: ' + appTransId 
        });
        return;
      }

      // Simulate successful payment
      payment.paymentStatus = 'paid';
      payment.metadata = {
        ...(payment.metadata || {}),
        zaloTransId: Math.floor(Math.random() * 1000000000),
        callbackTime: new Date(),
        testMode: true,
      } as any;
      await payment.save();

      // Update order status
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.status = 'confirmed';
        order.paymentStatus = 'paid';
        await order.save();
      }

      // Log successful test payment
      console.log('✅ TEST PAYMENT SUCCESSFUL (SANDBOX)');
      console.log('═'.repeat(50));
      console.log('Order ID:', payment.orderId);
      console.log('Payment ID:', payment._id);
      console.log('App Transaction ID:', appTransId);
      console.log('Amount:', payment.amount, 'VND');
      console.log('Status: PAID (TEST MODE)');
      console.log('═'.repeat(50));

      res.json({ 
        success: true,
        message: 'Test payment completed successfully',
        data: {
          orderId: payment.orderId,
          paymentId: payment._id,
          status: 'paid'
        }
      });
    } catch (error) {
      console.error('Test callback error:', error);
      next(error);
    }
  };
}

export default new ZaloPayController();

