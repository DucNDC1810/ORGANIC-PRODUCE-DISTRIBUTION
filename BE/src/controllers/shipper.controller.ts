import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { shipperService } from '../services/shipper.service';

export class ShipperController {
    /**
     * GET /api/shipper/dashboard/overview
     * Get dashboard overview statistics for the logged-in shipper
     */
    getDashboardOverview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            // Get userId from authenticated user
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // Find shipper by userId
            const shipper = await (await import('../models/Shipper.model')).Shipper.findOne({ userId });

            if (!shipper) {
                res.status(404).json({ message: 'Shipper profile not found. Please contact admin.' });
                return;
            }

            const overview = await shipperService.getDashboardOverview(shipper._id.toString());

            res.status(200).json({
                success: true,
                data: overview
            });
        } catch (error) {
            console.error('[ShipperController] Error getting dashboard overview:', error);
            next(error);
        }
    };

    /**
     * GET /api/shipper/zones
     * Get all zones managed by the logged-in shipper
     * Query params: lat, lon, sortBy (optional)
     */
    getZones = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // Find shipper by userId
            const shipper = await (await import('../models/Shipper.model')).Shipper.findOne({ userId });

            if (!shipper) {
                res.status(404).json({ message: 'Shipper profile not found. Please contact admin.' });
                return;
            }

            // Get query parameters for location-based sorting
            const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
            const lon = req.query.lon ? parseFloat(req.query.lon as string) : undefined;
            const sortBy = (req.query.sortBy as 'name' | 'distance') || 'name';

            const zones = await shipperService.getZones(shipper._id.toString(), lat, lon, sortBy);

            res.status(200).json({
                success: true,
                data: zones
            });
        } catch (error) {
            console.error('[ShipperController] Error getting zones:', error);
            next(error);
        }
    };

    /**
     * GET /api/shipper/addresses
     * Get all addresses under shipper's responsibility
     */
    getAddresses = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // Find shipper by userId
            const shipper = await (await import('../models/Shipper.model')).Shipper.findOne({ userId });

            if (!shipper) {
                res.status(404).json({ message: 'Shipper profile not found. Please contact admin.' });
                return;
            }

            const addresses = await shipperService.getAddresses(shipper._id.toString());

            res.status(200).json({
                success: true,
                data: addresses
            });
        } catch (error) {
            console.error('[ShipperController] Error getting addresses:', error);
            next(error);
        }
    };

    /**
     * GET /api/shipper/deliveries
     * Get all deliveries for the logged-in shipper
     * Query params: status (optional), zoneId (optional)
     */
    getDeliveries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // Find shipper by userId
            const shipper = await (await import('../models/Shipper.model')).Shipper.findOne({ userId });

            if (!shipper) {
                res.status(404).json({ message: 'Shipper profile not found. Please contact admin.' });
                return;
            }

            const status = req.query.status as string | undefined;
            const zoneId = req.query.zoneId as string | undefined;

            const deliveries = await shipperService.getDeliveries(shipper._id.toString(), status, zoneId);

            res.status(200).json({
                success: true,
                data: deliveries
            });
        } catch (error) {
            console.error('[ShipperController] Error getting deliveries:', error);
            next(error);
        }
    };

    /**
     * PATCH /api/shipper/deliveries/:deliveryId/status
     * Update delivery status
     */
    updateDeliveryStatus = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.user?.id;

            if (!userId) {
                res.status(401).json({ message: 'Unauthorized: User ID not found' });
                return;
            }

            // Find shipper by userId
            const shipper = await (await import('../models/Shipper.model')).Shipper.findOne({ userId });

            if (!shipper) {
                res.status(404).json({ message: 'Shipper profile not found. Please contact admin.' });
                return;
            }

            const { deliveryId } = req.params;
            const { status, notes } = req.body;

            if (!status) {
                res.status(400).json({ message: 'Status is required' });
                return;
            }

            const validStatuses = ['Pending', 'Delivering', 'Delivered', 'Failed', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                res.status(400).json({ message: 'Invalid status value' });
                return;
            }

            const delivery = await shipperService.updateDeliveryStatus(deliveryId, status, notes);

            res.status(200).json({
                success: true,
                message: 'Delivery status updated successfully',
                data: delivery
            });
        } catch (error) {
            console.error('[ShipperController] Error updating delivery status:', error);
            next(error);
        }
    };
}

export const shipperController = new ShipperController();
