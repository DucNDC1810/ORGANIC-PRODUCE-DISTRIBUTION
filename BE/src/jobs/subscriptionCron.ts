/**
 * subscriptionCron.ts
 *
 * Cron job tự động xử lý đơn hàng định kỳ:
 *  - Chạy mỗi ngày lúc 00:00 (midnight)
 *  - Tìm các gói subscription "active" có nextDeliveryDate <= hôm nay
 *  - Tạo Order mới cho mỗi gói
 *  - Cập nhật nextDeliveryDate theo frequency (7 / 14 / 30 ngày)
 *  - Gửi email nhắc thanh toán (MoMo) hoặc log thành công (COD)
 *
 * Ngoài ra còn chạy job nhắc thanh toán lúc 08:00 sáng:
 *  - Tìm đơn subscription với paymentStatus = 'unpaid' và ngày giao là NGÀY MAI
 *  - Gửi email/link thanh toán cho khách
 */

import cron from 'node-cron';
import mongoose from 'mongoose';
import { Subscription, ISubscription } from '../models/Subscription.model';
import { Order } from '../models/Order.model';
import { EmailService } from '../services/email.service';

// ─────────────────────────────────────────────────────────────
// Helper: tính nextDeliveryDate kế tiếp
// ─────────────────────────────────────────────────────────────
function advanceDate(current: Date, frequency: ISubscription['frequency']): Date {
  const next = new Date(current);
  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'bi-weekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setDate(next.getDate() + 30);
      break;
  }
  return next;
}

// ─────────────────────────────────────────────────────────────
// Helper: lấy ngày hôm nay, reset về 00:00:00
// ─────────────────────────────────────────────────────────────
function todayMidnight(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─────────────────────────────────────────────────────────────
// Job 1 – Tự động tạo đơn hàng định kỳ (chạy mỗi ngày 00:00)
// ─────────────────────────────────────────────────────────────
async function processSubscriptionOrders(): Promise<void> {
  const today = todayMidnight();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log(`[SubscriptionCron] 🕛 Running at ${new Date().toISOString()} — looking for subscriptions due on or before ${today.toDateString()}`);

  const emailService = new EmailService();

  // Lấy các gói active đến hạn hôm nay
  const dueSubscriptions = await Subscription.find({
    status: 'active',
    nextDeliveryDate: { $lte: tomorrow }
  })
    .populate('userId', 'name email phone')
    .populate('addressId')
    .populate('items.productId', 'name price');

  if (dueSubscriptions.length === 0) {
    console.log('[SubscriptionCron] ✅ No subscriptions due today.');
    return;
  }

  console.log(`[SubscriptionCron] 📦 Found ${dueSubscriptions.length} subscription(s) to process.`);

  for (const sub of dueSubscriptions) {
    try {
      const user = sub.userId as any;
      const address = sub.addressId as any;

      // ── Tính tổng tiền ──────────────────────────────────
      const orderItems = sub.items.map((item) => {
        const product = item.productId as any;
        const unitPrice = item.priceAtSubscription ?? product?.price ?? 0;
        return {
          productId: (item.productId as any)._id ?? item.productId,
          quantity: item.quantity,
          price: unitPrice,
          subtotal: unitPrice * item.quantity
        };
      });

      const rawTotal = orderItems.reduce((sum, i) => sum + i.subtotal, 0);
      const discount = rawTotal * (sub.discountRate ?? 0);
      const totalAmount = Math.max(0, rawTotal - discount);

      // ── Xác định trạng thái đơn & thanh toán ────────────
      // Normalize sớm để dùng nhất quán
      const normalizedPaymentMethod = (sub.paymentMethod ?? 'cod').toLowerCase();
      const isCOD = !normalizedPaymentMethod || normalizedPaymentMethod === 'cod' || normalizedPaymentMethod === 'cash';

      const orderStatus = 'pending';
      const paymentStatus = isCOD ? 'pending' : 'unpaid';

      // ── Delivery info từ address ─────────────────────────
      const deliveryInfo = address
        ? {
            fullName: address.fullName ?? user?.name,
            phone: address.phone ?? user?.phone,
            email: user?.email,
            address: [
              address.addressLine1,
              address.ward,
              address.district,
              address.city
            ]
              .filter(Boolean)
              .join(', '),
            type: 'delivery' as const
          }
        : {
            fullName: user?.name,
            email: user?.email,
            type: 'delivery' as const
          };

      // ── Tạo Order ────────────────────────────────────────
      // Lấy userId._id vì sau populate userId là object
      const userIdValue = (sub.userId as any)?._id ?? sub.userId;

      const newOrder = await Order.create({
        userId: userIdValue,
        orderType: 'subscription',
        addressId: sub.addressId,
        subscriptionId: sub._id,
        orderDate: new Date(),
        totalAmount,
        discountAmount: discount,
        items: orderItems,
        status: orderStatus,
        paymentMethod: normalizedPaymentMethod,
        paymentStatus,
        deliveryInfo,
        notes: `Đơn hàng định kỳ tự động tạo từ gói đặt hàng. Tần suất: ${sub.frequency}.`
      });

      // ── Cập nhật nextDeliveryDate ─────────────────────────
      const nextDate = advanceDate(sub.nextDeliveryDate, sub.frequency);
      sub.nextDeliveryDate = nextDate;
      await sub.save();

      // ── Thông báo / Email ─────────────────────────────────
      if (isCOD) {
        console.log(
          `[SubscriptionCron] ✅ COD order created — Order #${newOrder._id} for user ${user?.email ?? sub.userId}. Next delivery: ${nextDate.toDateString()}`
        );
        // Gửi email xác nhận đơn COD
        if (user?.email) {
          await emailService.sendSubscriptionOrderConfirmation(
            user.email,
            user.name ?? 'Khách hàng',
            String(newOrder._id),
            totalAmount,
            nextDate
          );
        }
      } else {
        // MoMo — gửi link thanh toán
        console.log(
          `[SubscriptionCron] 💳 Online-payment order created — Order #${newOrder._id} for user ${user?.email ?? sub.userId}. Awaiting payment.`
        );
        if (user?.email) {
          await emailService.sendSubscriptionPaymentRequest(
            user.email,
            user.name ?? 'Khách hàng',
            String(newOrder._id),
            totalAmount,
            sub.paymentMethod,
            sub.nextDeliveryDate // ngày giao (đã cập nhật)
          );
        }
      }
    } catch (err: any) {
      console.error(
        `[SubscriptionCron] ❌ Failed to process subscription ${sub._id}:`,
        err.message ?? err
      );
      // Print Mongoose validation errors clearly
      if (err.errors) {
        Object.values(err.errors).forEach((e: any) =>
          console.error(`  → Validation: ${e.path} = "${e.value}" — ${e.message}`)
        );
      }
    }
  }

  console.log('[SubscriptionCron] 🏁 Done processing subscriptions.');
}

// ─────────────────────────────────────────────────────────────
// Job 2 – Nhắc thanh toán đơn online chưa thanh toán (08:00 sáng)
// ─────────────────────────────────────────────────────────────
async function sendPaymentReminders(): Promise<void> {
  const today = todayMidnight();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  console.log(`[SubscriptionCron] ⏰ Payment reminder job — looking for unpaid orders delivering tomorrow (${tomorrow.toDateString()})`);

  const emailService = new EmailService();

  // Tìm đơn hàng unpaid từ subscription, dự định giao ngày mai
  const unpaidOrders = await Order.find({
    subscriptionId: { $ne: null },
    paymentStatus: 'unpaid',
    status: 'pending',
    orderDate: { $gte: today, $lt: tomorrow }
  })
    .populate('userId', 'name email')
    .populate('items.productId', 'name');

  if (unpaidOrders.length === 0) {
    console.log('[SubscriptionCron] ✅ No unpaid subscription orders needing reminder today.');
    return;
  }

  console.log(`[SubscriptionCron] 📨 Sending payment reminders for ${unpaidOrders.length} order(s).`);

  for (const order of unpaidOrders) {
    try {
      const user = order.userId as any;
      if (user?.email) {
        await emailService.sendSubscriptionPaymentReminder(
          user.email,
          user.name ?? 'Khách hàng',
          String(order._id),
          order.totalAmount,
          order.paymentMethod ?? 'online'
        );
        console.log(`[SubscriptionCron] 📧 Reminder sent to ${user.email} for order #${order._id}`);
      }
    } catch (err: any) {
      console.error(`[SubscriptionCron] ❌ Failed to send reminder for order ${order._id}:`, err.message ?? err);
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Khởi động cron jobs
// ─────────────────────────────────────────────────────────────
export function initSubscriptionCron(): void {
  // Job 1: Mỗi ngày lúc 00:00
  cron.schedule('0 0 * * *', async () => {
    try {
      await processSubscriptionOrders();
    } catch (err) {
      console.error('[SubscriptionCron] ❌ Unhandled error in processSubscriptionOrders:', err);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

  // Job 2: Mỗi ngày lúc 08:00 sáng
  cron.schedule('0 8 * * *', async () => {
    try {
      await sendPaymentReminders();
    } catch (err) {
      console.error('[SubscriptionCron] ❌ Unhandled error in sendPaymentReminders:', err);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh'
  });

  console.log('[SubscriptionCron] 🚀 Subscription cron jobs initialized (00:00 & 08:00 Asia/Ho_Chi_Minh).');
}

// ─────────────────────────────────────────────────────────────
// Export để test thủ công qua API admin nếu cần
// ─────────────────────────────────────────────────────────────
export { processSubscriptionOrders, sendPaymentReminders };
