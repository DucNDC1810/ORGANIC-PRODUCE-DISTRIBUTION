import { Router, Request, Response } from 'express';
import { SubscriptionController } from '../controllers/subscription.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/permission.middleware';
import { UserRole } from '../constants/roles';
import { processSubscriptionOrders, sendPaymentReminders } from '../jobs/subscriptionCron';
import { Subscription } from '../models/Subscription.model';

const router = Router();
const subscriptionController = new SubscriptionController();

// ===== PROTECTED ROUTES =====

// Create subscription
router.post('/', authenticate as any, subscriptionController.createSubscription as any);

// Get my subscriptions
router.get('/my-subscriptions', authenticate as any, subscriptionController.getMySubscriptions as any);

// Get subscription by ID
router.get('/:id', authenticate as any, subscriptionController.getSubscriptionById as any);

// Update subscription
router.patch('/:id', authenticate as any, subscriptionController.updateSubscription as any);

// Update subscription items
router.patch('/:id/items', authenticate as any, subscriptionController.updateSubscriptionItems as any);

// Pause subscription
router.patch('/:id/pause', authenticate as any, subscriptionController.pauseSubscription as any);

// Resume subscription
router.patch('/:id/resume', authenticate as any, subscriptionController.resumeSubscription as any);

// Cancel subscription
router.patch('/:id/cancel', authenticate as any, subscriptionController.cancelSubscription as any);

// ===== ADMIN ROUTES =====

// Get all subscriptions (admin only)
router.get('/', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, subscriptionController.getAllSubscriptions as any);

// Get deliveries for today (admin/shipper)
router.get('/deliveries/today', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER, UserRole.SHIPPER) as any, subscriptionController.getDeliveriesForToday as any);

// Get subscription statistics (admin only)
router.get('/stats/summary', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, subscriptionController.getSubscriptionStats as any);

// ===== ADMIN MANUAL TRIGGERS (for testing / emergency) =====

// Manually run the subscription order creation job
router.post(
  '/cron/run-orders',
  authenticate as any,
  checkRole(UserRole.ADMIN) as any,
  async (req, res) => {
    await processSubscriptionOrders();
    res.json({ success: true, message: 'Subscription order cron job executed manually.' });
  }
);

// Manually run the payment reminder job
router.post(
  '/cron/run-reminders',
  authenticate as any,
  checkRole(UserRole.ADMIN) as any,
  async (req, res) => {
    await sendPaymentReminders();
    res.json({ success: true, message: 'Payment reminder cron job executed manually.' });
  }
);

// ===== DEV-ONLY ROUTES (blocked in production) =====
if (process.env.NODE_ENV !== 'production') {

  // Run cron job immediately – no auth required (dev only)
  router.post('/dev/trigger-now', async (req: Request, res: Response) => {
    console.log('[DEV] Manual cron trigger via /dev/trigger-now');
    try {
      await processSubscriptionOrders();
      res.json({ success: true, message: '✅ processSubscriptionOrders completed. Check server logs and orders collection.' });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // Set nextDeliveryDate of a subscription to yesterday – for testing (dev only)
  router.patch('/dev/set-due/:id', async (req: Request, res: Response) => {
    try {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const sub = await Subscription.findByIdAndUpdate(
        req.params.id,
        { nextDeliveryDate: yesterday },
        { new: true }
      );

      if (!sub) {
        res.status(404).json({ success: false, message: 'Subscription not found' });
        return;
      }

      res.json({
        success: true,
        message: `✅ nextDeliveryDate set to ${yesterday.toISOString()} (yesterday). Now call /dev/trigger-now.`,
        nextDeliveryDate: sub.nextDeliveryDate
      });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
}

export default router;
