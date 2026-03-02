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

// Tham gia nhóm (có thể là khách, có thể dùng authenticate tùy chọn)
router.post('/:id/join', (req, res, next) => {
  // Thử xác thực, nếu không có token thì vẫn cho qua (khách vãng lai)
  authenticate(req as any, res, (err) => {
    if (err) return next(); // ignore auth error, guest flow
    next();
  });
}, groupController.joinGroup as any);

// Cập nhật trạng thái đã chọn món
router.patch('/:id/members/:memberId/ready', groupController.setMemberReady as any);

// Thêm món vào giỏ của thành viên (không cần đăng nhập)
router.post('/:id/members/:memberId/items', groupController.addMemberItem as any);

export default router;
