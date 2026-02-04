import { Router } from 'express';
import { VoucherController } from '../controllers/voucher.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/permission.middleware';
import { UserRole } from '../constants/roles';

const router = Router();
const voucherController = new VoucherController();

// ===== ADMIN ROUTES - MUST BE BEFORE WILDCARD ROUTES =====

// Get voucher statistics (admin only)
router.get('/stats/summary', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, voucherController.getVoucherStats as any);

// ===== PUBLIC ROUTES =====

// Get all vouchers (public listing)
router.get('/', voucherController.getAllVouchers as any);

// Get active vouchers
router.get('/active', voucherController.getActiveVouchers as any);

// Validate voucher (check if can use)
router.post('/:code/validate', voucherController.validateVoucher as any);

// ===== PROTECTED ROUTES =====

// Apply voucher (use voucher - requires auth)
router.post('/:code/apply', authenticate as any, voucherController.applyVoucher as any);

// ===== WILDCARD ROUTES - MUST BE LAST =====

// Get voucher by code
router.get('/:code', voucherController.getVoucherByCode as any);

// Get voucher by ID
router.get('/:id', voucherController.getVoucherById as any);

// ===== ADMIN CRUD ROUTES - ID BASED =====

// Create voucher (admin only)
router.post('/', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, voucherController.createVoucher as any);

// Update voucher (admin only)
router.patch('/:id', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, voucherController.updateVoucher as any);

// Deactivate voucher (admin only)
router.patch('/:id/deactivate', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, voucherController.deactivateVoucher as any);

// Delete voucher (admin only)
router.delete('/:id', authenticate as any, checkRole(UserRole.ADMIN, UserRole.MANAGER) as any, voucherController.deleteVoucher as any);

export default router;
