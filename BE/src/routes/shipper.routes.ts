import { Router } from 'express';
import { shipperController } from '../controllers/shipper.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

// Dashboard overview
router.get('/dashboard/overview', shipperController.getDashboardOverview as any);

// Zones management
router.get('/zones', shipperController.getZones as any);

// Addresses under shipper's responsibility
router.get('/addresses', shipperController.getAddresses as any);

// Deliveries management
router.get('/deliveries', shipperController.getDeliveries as any);
router.patch('/deliveries/:deliveryId/status', shipperController.updateDeliveryStatus as any);

export default router;
