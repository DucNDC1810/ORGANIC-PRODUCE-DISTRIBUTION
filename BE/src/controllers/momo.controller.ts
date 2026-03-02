import { Response, NextFunction } from 'express';
import { Payment } from '../models/Payment.model';
import { Order } from '../models/Order.model';
import momoService from '../services/momo.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class MoMoController {
  /**
   * Tạo link thanh toán MoMo
   * POST /api/momo/create-payment
   * Body: {
   *   orderId: "string", // Order ID từ database, hoặc "temp" để tạo mới
   *   amount: number,
   *   description: string,
   *   deliveryInfo: {...} // (optional) chỉ cần khi orderId = "temp"
   * }
   */
  createPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, amount, description, deliveryInfo } = req.body;
      const userId = req.user?.id;

      // Validate required fields
      if (!amount || !description) {
        throw new AppError('Amount and description are required', 400);
      }

      if (!userId) {
        throw new AppError('User not authenticated', 401);
      }

      // Xử lý order
      let finalOrderId = orderId;

      if (!orderId || orderId === 'temp') {
        // Tạo order mới nếu không có orderId
        if (!deliveryInfo) {
          throw new AppError('Delivery info is required for new orders', 400);
        }

        const newOrder = await Order.create({
          userId,
          deliveryInfo,
          paymentMethod: 'momo',
          items: [],
          totalAmount: amount,
          status: 'pending',
        });

        finalOrderId = newOrder._id.toString();
      } else {
        // Kiểm tra order tồn tại
        const order = await Order.findById(orderId);
        if (!order) {
          throw new AppError('Order not found', 404);
        }

        // Kiểm tra quyền
        if (req.user?.id !== order.userId.toString() && req.user?.role !== 'admin') {
          throw new AppError('You do not have permission to pay for this order', 403);
        }
      }

      // Tạo redirect URL (return after payment)
      // Ưu tiên sử dụng domain từ request, fallback sang FE_BASE_URL
      const feOrigin = req.headers.origin || process.env.FE_BASE_URL || 'http://localhost:5173';
      const redirectUrl = `${feOrigin}/order-success`;

      console.log('🔗 Redirect URL Configuration:');
      console.log('  req.headers.origin:', req.headers.origin);
      console.log('  process.env.FE_BASE_URL:', process.env.FE_BASE_URL);
      console.log('  Final redirectUrl:', redirectUrl);

      // Gọi MoMo service để tạo link thanh toán
      const momoResponse = await momoService.createPayment(
        Math.floor(amount), // amount must be integer
        description,
        description, // orderInfo
        redirectUrl,
        finalOrderId
      );

      // Tạo payment record
      const payment = await Payment.create({
        orderId: finalOrderId,
        paymentMethod: 'momo',
        amount,
        transactionId: momoResponse.requestId || '',
        metadata: {
          momoOrderId: momoResponse.orderId,
          requestId: momoResponse.requestId,
          provider: 'momo',
          resultCode: momoResponse.resultCode,
        },
        paymentStatus: 'pending',
        paymentDate: new Date(),
      });

      console.log('✅ MoMo payment created successfully');
      console.log('  OrderId:', finalOrderId);
      console.log('  PaymentId:', payment._id);
      console.log('  MoMo OrderId:', momoResponse.orderId);
      console.log('  Amount:', amount, 'VND');

      res.status(200).json({
        success: true,
        message: 'MoMo payment link created successfully',
        data: {
          paymentId: payment._id,
          orderId: finalOrderId,
          payUrl: momoResponse.payUrl,
          deeplink: momoResponse.deeplink,
          deeplinkWebInApp: momoResponse.deeplinkWebInApp,
          qrCodeUrl: momoResponse.qrCodeUrl,
          momoOrderId: momoResponse.orderId,
          requestId: momoResponse.requestId,
          amount,
        },
      });
    } catch (error) {
      console.error('❌ Create payment error:', error);
      next(error);
    }
  };

  /**
   * MoMo callback handler
   * POST /api/momo/callback
   * Xử lý callback từ MoMo server khi khách hàng thanh toán thành công
   */
  handleCallback = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    const result: { resultCode: number; message: string } = {
      resultCode: 0,
      message: 'exception',
    };

    try {
      console.log('🔔 MOMO CALLBACK RECEIVED');
      console.log('Full Body:', JSON.stringify(req.body, null, 2));

      const receivedSignature = req.body?.signature;
      const { orderId, resultCode, transId, amount, extraData } = req.body;

      console.log('📝 Extract data:');
      console.log('  OrderId:', orderId);
      console.log('  ResultCode:', resultCode);
      console.log('  TransId:', transId);
      console.log('  Amount:', amount);

      // Kiểm tra required fields
      if (!orderId || receivedSignature === undefined) {
        console.error('❌ Missing orderId or signature in callback');
        result.resultCode = 1;
        result.message = 'Missing required fields';
        return void res.json(result);
      }

      // Verify signature
      console.log('🔐 Verifying signature...');
      const isValidSignature = momoService.verifyCallbackSignature(req.body, receivedSignature);
      console.log('Signature Valid:', isValidSignature);

      if (!isValidSignature) {
        console.error('❌ Signature verification failed');
        result.resultCode = 1;
        result.message = 'Invalid signature';
        return void res.json(result);
      }

      console.log('✅ Signature verified successfully');

      // Kiểm tra resultCode (0 = success, khác = failed)
      if (resultCode !== 0) {
        console.log('⚠️ MoMo payment failed with resultCode:', resultCode);
        
        // Cập nhật trạng thái thanh toán và đơn hàng thành "failed"
        let payment = await Payment.findOne({ 'metadata.momoOrderId': orderId });
        if (!payment) payment = await Payment.findOne({ transactionId: orderId });
        if (!payment) payment = await Payment.findOne({ orderId: orderId });
        
        if (payment) {
          await Payment.findByIdAndUpdate(
            payment._id,
            { $set: { paymentStatus: 'failed' } },
            { new: true }
          );

          await Order.findByIdAndUpdate(
            payment.orderId,
            { status: 'failed', paymentStatus: 'failed' },
            { new: true }
          );

          console.log('✅ PAYMENT AND ORDER UPDATED TO FAILED');
          console.log('  PaymentId:', payment._id);
          console.log('  OrderId:', payment.orderId);
          console.log('  MoMo OrderId:', orderId);
        }

        // Vẫn trả về success để MoMo không retry nữa
        result.resultCode = 0;
        result.message = 'success';
        return void res.json(result);
      }

      // Tìm payment từ orderId (từ extraData hoặc orderId)
      let payment = await Payment.findOne({ 'metadata.momoOrderId': orderId });

      if (!payment) {
        // Fallback: tìm từ transactionId
        payment = await Payment.findOne({ transactionId: orderId });
      }

      if (!payment) {
        // Fallback: momoOrderId === MongoDB orderId (service dùng finalOrderId làm momo orderId)
        payment = await Payment.findOne({ orderId: orderId });
      }

      if (!payment) {
        console.log('⚠️ Payment not found for orderId:', orderId);
        // Vẫn trả về success để MoMo không retry nữa
        result.resultCode = 0;
        result.message = 'success';
        return void res.json(result);
      }

      // Cập nhật payment status (idempotent)
      if (payment.paymentStatus !== 'paid') {
        payment.paymentStatus = 'paid';
        payment.metadata = {
          ...(payment.metadata || {}),
          momoTransId: transId,
          callbackTime: new Date(),
          callbackData: req.body,
        } as any;
        payment.markModified('metadata');
        await payment.save();

        // Cập nhật order status thành "confirmed"
        await Order.findByIdAndUpdate(payment.orderId, {
          status: 'confirmed',
          paymentStatus: 'paid',
        });

        console.log('✅ PAYMENT UPDATED TO PAID');
        console.log('  PaymentId:', payment._id);
        console.log('  OrderId:', payment.orderId);
        console.log('  MoMo OrderId:', orderId);
        console.log('  MoMo TransId:', transId);
      } else {
        console.log('ℹ️ Payment already paid (idempotent):', payment._id);
      }

      // Thông báo thành công cho MoMo
      result.resultCode = 0;
      result.message = 'success';
      return void res.json(result);
    } catch (error: any) {
      console.error('❌ Callback exception:', error);
      result.resultCode = 1;
      result.message = error?.message || 'exception';
      return void res.json(result);
    }
  };

  /**
   * Query payment status
   * POST /api/momo/query-payment
   * Body: { momoOrderId: "string", requestId: "string" }
   */
  queryPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { momoOrderId, requestId } = req.body;

      if (!momoOrderId || !requestId) {
        throw new AppError('momoOrderId and requestId are required', 400);
      }

      console.log('🔍 Querying MoMo payment status');
      console.log('  OrderId:', momoOrderId);
      console.log('  RequestId:', requestId);

      // Gửi MoMo service để lấy trạng thái
      const statusResponse = await momoService.queryPayment(momoOrderId, requestId);

      // Phân tích trạng thái
      let orderStatus = 'pending';
      let paymentStatus = 'pending';

      // Theo docs MoMo:
      // resultCode = 0: success (payment completed)
      // resultCode != 0: chưa thanh toán hoặc thất bại

      if (statusResponse.resultCode === 0) {
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
      } else {
        orderStatus = 'failed';
        paymentStatus = 'failed';
      }

      // Cập nhật payment status nếu thanh toán thành công
      if (paymentStatus === 'paid') {
        let payment = await Payment.findOne({ 'metadata.momoOrderId': momoOrderId });
        // Fallback: momoOrderId === MongoDB orderId (vì service dùng finalOrderId làm momo orderId)
        if (!payment) {
          payment = await Payment.findOne({ orderId: momoOrderId });
        }
        // Fallback: tìm theo transactionId (requestId === orderId trong service)
        if (!payment) {
          payment = await Payment.findOne({ transactionId: momoOrderId });
        }
        if (payment && payment.paymentStatus !== 'paid') {
          payment.paymentStatus = 'paid';
          payment.metadata = {
            ...(payment.metadata || {}),
            momoTransId: statusResponse.transId,
            queryTime: new Date(),
          } as any;
          payment.markModified('metadata');
          await payment.save();

          // Cập nhật order status
          const order = await Order.findById(payment.orderId);
          if (order && order.status === 'pending') {
            order.status = 'confirmed';
            order.paymentStatus = 'paid';
            await order.save();
          }

          console.log('✅ Payment status updated to PAID via query');
          console.log('  OrderId:', payment.orderId);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Payment status queried successfully',
        data: {
          momoOrderId,
          orderStatus,
          paymentStatus,
          amount: statusResponse.amount,
          momoTransId: statusResponse.transId,
          resultCode: statusResponse.resultCode,
          resultDescription: statusResponse.resultDescription,
        },
      });
    } catch (error) {
      console.error('❌ Query payment error:', error);
      next(error);
    }
  };

  /**
   * Test callback - Simulate MoMo callback (for testing purposes)
   * POST /api/momo/test-callback
   * Body: { momoOrderId: "string" }
   */
  testCallback = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { momoOrderId } = req.body;

      if (!momoOrderId) {
        throw new AppError('momoOrderId is required', 400);
      }

      console.log('🧪 TEST CALLBACK - Simulating MoMo callback');
      console.log('  MoMo OrderId:', momoOrderId);

      // Tìm payment
      const payment = await Payment.findOne({ 'metadata.momoOrderId': momoOrderId });

      if (!payment) {
        throw new AppError(`Payment not found for momoOrderId: ${momoOrderId}`, 404);
      }

      console.log('✅ Payment found:', payment._id);

      // Update payment status
      if (payment.paymentStatus !== 'paid') {
        payment.paymentStatus = 'paid';
        payment.metadata = {
          ...(payment.metadata || {}),
          momoTransId: 999999999,
          callbackTime: new Date(),
          testMode: true,
        } as any;
        await payment.save();

        // Update order status
        const order = await Order.findByIdAndUpdate(
          payment.orderId,
          {
            status: 'confirmed',
            paymentStatus: 'paid',
          },
          { new: true }
        );

        console.log('✅ TEST - Payment and Order updated to PAID');
        console.log('  PaymentId:', payment._id);
        console.log('  OrderId:', order?._id);

        res.status(200).json({
          success: true,
          message: 'Test callback successful - Payment status updated to PAID',
          data: {
            paymentId: payment._id,
            orderId: order?._id,
            paymentStatus: 'paid',
            orderStatus: order?.status,
          },
        });
      } else {
        res.status(200).json({
          success: true,
          message: 'Payment already paid',
          data: {
            paymentId: payment._id,
            paymentStatus: 'paid',
          },
        });
      }
    } catch (error) {
      console.error('❌ Test callback error:', error);
      next(error);
    }
  };
}

export default new MoMoController();
