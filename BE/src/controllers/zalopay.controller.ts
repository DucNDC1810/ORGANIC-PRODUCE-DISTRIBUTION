import { Response, NextFunction } from 'express';
import { Payment } from '../models/Payment.model';
import { Order } from '../models/Order.model';
import zalopayService, { ZaloPayItem } from '../services/zalopay.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { AppError } from '../utils/AppError';

export class ZaloPayController {
  /**
   * Tạo đơn hàng ZaloPay
   * POST /api/zalopay/create-order
   * Body: {
   *   orderId: "string", // Order ID từ database, hoặc "temp" để tạo mới
   *   amount: number,
   *   description: string,
   *   items: Array<{itemid, itemname, itemprice, itemquantity}>,
   *   deliveryInfo: {...} // (optional) chỉ cần khi orderId = "temp"
   * }
   */
  createOrder = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { orderId, amount, description, items, deliveryInfo } = req.body;
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
      let finalItems: ZaloPayItem[] = items || [];

      if (!orderId || orderId === 'temp') {
        // Tạo order mới nếu không có orderId
        if (!deliveryInfo) {
          throw new AppError('Delivery info is required for new orders', 400);
        }

        // Nếu không có items, tạo item mặc định từ description
        if (!finalItems || finalItems.length === 0) {
          finalItems = [
            {
              itemid: 'order_item',
              itemname: description,
              itemprice: Math.floor(amount),
              itemquantity: 1,
            },
          ];
        }

        // Tạo items theo schema Order
        const itemPrice = Math.floor(amount / (finalItems.length || 1));
        const orderItems = finalItems.map((item: any, index: number) => ({
          productId: new (require('mongoose')).Types.ObjectId(), // Tạo temp ObjectId
          quantity: item.itemquantity || 1,
          price: item.itemprice || itemPrice,
          subtotal: (item.itemprice || itemPrice) * (item.itemquantity || 1),
        }));

        const newOrder = await Order.create({
          userId,
          deliveryInfo,
          paymentMethod: 'zalopay',
          items: orderItems,
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

        // Lấy items từ order nếu không được cung cấp
        if (!finalItems || finalItems.length === 0) {
          finalItems = (order.items as any[]).map((item: any, index: number) => ({
            itemid: item.productId?.toString() || `item_${index}`,
            itemname: item.productId ? `Product ${index + 1}` : 'Order Item',
            itemprice: Math.floor(amount / (order.items?.length || 1)),
            itemquantity: item.quantity || 1,
          }));
        }
      }

      // Gọi ZaloPay service để tạo đơn hàng
      const zaloPayResponse = await zalopayService.createOrder(
        userId, // appuser
        Math.floor(amount), // amount must be integer
        description,
        finalItems
      );

      // Tạo payment record
      const payment = await Payment.create({
        orderId: finalOrderId,
        paymentMethod: 'zalopay',
        amount,
        transactionId: zaloPayResponse.zptranstoken || zaloPayResponse.apptransid || '',
        metadata: {
          appTransId: zaloPayResponse.apptransid,
          zptranstoken: zaloPayResponse.zptranstoken,
          provider: 'zalopay',
          returncode: zaloPayResponse.returncode,
        },
        paymentStatus: 'pending',
        paymentDate: new Date(),
      });

      console.log('✅ ZaloPay order created successfully');
      console.log('  OrderId:', finalOrderId);
      console.log('  PaymentId:', payment._id);
      console.log('  AppTransId:', zaloPayResponse.apptransid);
      console.log('  Amount:', amount, 'VND');

      res.status(200).json({
        success: true,
        message: 'ZaloPay order created successfully',
        data: {
          paymentId: payment._id,
          orderId: finalOrderId,
          orderUrl: zaloPayResponse.orderurl,
          apptransid: zaloPayResponse.apptransid,
          amount: amount,
        },
      });
    } catch (error) {
      console.error('❌ Create order error:', error);
      next(error);
    }
  };

  /**
   * ZaloPay callback handler
   * POST /api/zalopay/callback
   * Xử lý callback từ ZaloPay server khi khách hàng thanh toán thành công
   */
  handleCallback = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    const result: { returncode: number; returnmessage: string } = {
      returncode: 0,
      returnmessage: 'exception',
    };

    try {
      console.log('🔔 ZALOPAY CALLBACK RECEIVED');
      console.log('Full Body:', JSON.stringify(req.body, null, 2));
      console.log('Headers:', JSON.stringify(req.headers, null, 2));

      const dataStr: string = req.body?.data;
      const reqMac: string = req.body?.mac;

      console.log('📝 Extract data:');
      console.log('  dataStr:', dataStr ? dataStr.substring(0, 100) + '...' : 'missing');
      console.log('  reqMac:', reqMac ? reqMac.substring(0, 20) + '...' : 'missing');

      // Kiểm tra dữ liệu callback
      if (!dataStr || !reqMac) {
        console.error('❌ Missing data or mac in callback');
        result.returncode = -1;
        result.returnmessage = 'missing data/mac';
        return void res.json(result);
      }

      // Verify MAC theo cách của ZaloPay: MAC = HmacSHA256(dataStr, key2)
      console.log('🔐 Verifying MAC...');
      const isValidMac = zalopayService.verifyCallbackMac(dataStr, reqMac);
      console.log('MAC Valid:', isValidMac);
      
      if (!isValidMac) {
        console.error('❌ MAC verification failed');
        console.error('Expected MAC:', zalopayService.calculateMac(dataStr));
        console.error('Received MAC:', reqMac);
        result.returncode = -1;
        result.returnmessage = 'mac not equal';
        return void res.json(result);
      }

      console.log('✅ MAC verified successfully');

      // Parse callback data
      const dataJson = zalopayService.parseCallbackData(dataStr);
      const apptransid: string = dataJson.apptransid;
      const zaloTransId: number = dataJson.zptransid;
      const amount: number = dataJson.amount;

      console.log('📊 Callback data:');
      console.log('  AppTransId:', apptransid);
      console.log('  ZaloTransId:', zaloTransId);
      console.log('  Amount:', amount);

      if (!apptransid) {
        result.returncode = -1;
        result.returnmessage = 'missing apptransid';
        return void res.json(result);
      }

      // Tìm payment từ appTransId
      const payment = await Payment.findOne({ 'metadata.appTransId': apptransid });

      if (!payment) {
        console.log('⚠️ Payment not found for apptransid:', apptransid);
        // Vẫn trả về success để ZaloPay không retry nữa
        result.returncode = 1;
        result.returnmessage = 'success';
        return void res.json(result);
      }

      // Cập nhật payment status (idempotent - nếu đã thanh toán rồi thì không cập nhật lại)
      if (payment.paymentStatus !== 'paid') {
        payment.paymentStatus = 'paid';
        payment.metadata = {
          ...(payment.metadata || {}),
          zaloTransId,
          callbackTime: new Date(),
          callbackData: dataJson,
        } as any;
        await payment.save();

        // Cập nhật order status
        await Order.findByIdAndUpdate(payment.orderId, {
          status: 'confirmed',
          paymentStatus: 'paid',
        });

        console.log('✅ PAYMENT UPDATED TO PAID');
        console.log('  PaymentId:', payment._id);
        console.log('  OrderId:', payment.orderId);
        console.log('  AppTransId:', apptransid);
      } else {
        console.log('ℹ️ Payment already paid (idempotent):', payment._id);
      }

      // Thông báo thành công cho ZaloPay
      result.returncode = 1;
      result.returnmessage = 'success';
      return void res.json(result);
    } catch (error: any) {
      console.error('❌ Callback exception:', error);
      
      // returncode = 0 -> ZaloPay sẽ retry callback (tối đa 3 lần)
      result.returncode = 0;
      result.returnmessage = error?.message || 'exception';
      return void res.json(result);
    }
  };

  /**
   * Test callback - Simulate ZaloPay callback (for testing purposes)
   * POST /api/zalopay/test-callback
   * Body: { apptransid: "string" }
   */
  testCallback = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { apptransid } = req.body;

      if (!apptransid) {
        throw new AppError('apptransid is required', 400);
      }

      console.log('🧪 TEST CALLBACK - Simulating ZaloPay callback');
      console.log('  AppTransId:', apptransid);

      // Tìm payment
      const payment = await Payment.findOne({ 'metadata.appTransId': apptransid });

      if (!payment) {
        throw new AppError(`Payment not found for apptransid: ${apptransid}`, 404);
      }

      console.log('✅ Payment found:', payment._id);

      // Update payment status
      if (payment.paymentStatus !== 'paid') {
        payment.paymentStatus = 'paid';
        payment.metadata = {
          ...(payment.metadata || {}),
          zaloTransId: 999999999,
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

  /**
   * Kiểm tra trạng thái đơn hàng
   * POST /api/zalopay/check-order-status
   * Body: { apptransid: "string" }
   */
  checkOrderStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { apptransid } = req.body;

      if (!apptransid) {
        throw new AppError('App Transaction ID (apptransid) is required', 400);
      }

      // Gửi ZaloPay service để lấy trạng thái
      const statusResponse = await zalopayService.getOrderStatus(apptransid);

      // Phân tích trạng thái
      let orderStatus = 'pending';
      let paymentStatus = 'pending';

      // Theo docs ZaloPay:
      // returncode = 1: success (payment completed)
      // returncode = -49: chưa thanh toán (not yet paid)
      // returncode = -117: nhập sai mật khẩu ZaloPay
      // isprocessing = true: giao dịch đang xử lý
      // isprocessing = false: giao dịch đã kết thúc

      if (statusResponse.returncode === 1) {
        // Thanh toán thành công
        orderStatus = 'confirmed';
        paymentStatus = 'paid';
      } else if (statusResponse.returncode === -49) {
        // Chưa thanh toán
        orderStatus = 'pending';
        paymentStatus = 'pending';
      } else if (statusResponse.returncode === -117) {
        // Nhập sai mật khẩu ZaloPay
        orderStatus = 'failed';
        paymentStatus = 'failed';
      } else if (statusResponse.isprocessing === true) {
        // Giao dịch đang xử lý
        orderStatus = 'pending';
        paymentStatus = 'pending';
      } else {
        // Các trường hợp lỗi khác
        orderStatus = 'failed';
        paymentStatus = 'failed';
      }

      // Cập nhật payment status nếu thanh toán thành công
      if (paymentStatus === 'paid') {
        const payment = await Payment.findOne({ 'metadata.appTransId': apptransid });
        if (payment && payment.paymentStatus !== 'paid') {
          payment.paymentStatus = 'paid';
          payment.metadata = {
            ...(payment.metadata || {}),
            zaloTransId: statusResponse.zalo_trans_id,
            finishTime: statusResponse.finish_time,
            statusCheckTime: new Date(),
          } as any;
          await payment.save();

          // Cập nhật order status
          const order = await Order.findById(payment.orderId);
          if (order && order.status === 'pending') {
            order.status = 'confirmed';
            order.paymentStatus = 'paid';
            await order.save();
          }

          console.log('✅ Order status updated to PAID via check-order-status');
          console.log('  OrderId:', payment.orderId);
          console.log('  AppTransId:', apptransid);
        }
      }

      res.status(200).json({
        success: true,
        message: 'Order status checked successfully',
        data: {
          apptransid,
          orderStatus,
          paymentStatus,
          amount: statusResponse.amount,
          zaloTransId: statusResponse.zalo_trans_id,
          isProcessing: statusResponse.isprocessing,
          returnCode: statusResponse.returncode,
          returnMessage: statusResponse.returnmessage,
          serverTime: statusResponse.server_time,
        },
      });
    } catch (error) {
      console.error('❌ Check order status error:', error);
      next(error);
    }
  };
}

export default new ZaloPayController();

