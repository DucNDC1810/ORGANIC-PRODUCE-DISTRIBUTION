import { Router } from 'express';
import { GroupController } from '../controllers/group.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const groupController = new GroupController();

// Tạo nhóm (cần đăng nhập)
router.post('/', authenticate as any, groupController.createGroup as any);

// Lấy thông tin nhóm (public – dùng cho trang join)
router.get('/:id', groupController.getGroup as any);

// Lấy danh sách thành viên (public)
router.get('/:id/members', groupController.getMembers as any);

// Tham gia nhóm (bắt buộc đăng nhập)
router.post('/:id/join', authenticate as any, groupController.joinGroup as any);

// Rời nhóm (bắt buộc đăng nhập)
router.delete('/:id/members/:memberId', authenticate as any, groupController.leaveGroup as any);

// Cập nhật trạng thái đã chọn món (bắt buộc đăng nhập)
router.patch('/:id/members/:memberId/ready', authenticate as any, groupController.setMemberReady as any);

// Thêm món vào giỏ của thành viên (bắt buộc đăng nhập)
router.post('/:id/members/:memberId/items', authenticate as any, groupController.addMemberItem as any);

export default router;
