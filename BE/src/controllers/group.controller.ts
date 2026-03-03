import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { GroupService } from '../services/group.service';
import { AppError } from '../utils/AppError';
import { getIO } from '../socket';

const groupService = new GroupService();

export class GroupController {
  /** POST /api/groups — Tạo nhóm mới */
  createGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      if (!userId) throw new AppError('Unauthorized', 401);

      const { groupName, paymentMethod, timeLimit } = req.body;
      if (!groupName?.trim()) throw new AppError('groupName là bắt buộc', 400);

      const group = await groupService.createGroup(
        userId,
        groupName.trim(),
        paymentMethod ?? 'Chủ nhóm thanh toán',
        timeLimit ? new Date(timeLimit) : null
      );

      res.status(201).json({ success: true, data: group });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/groups/:id — Lấy thông tin nhóm */
  getGroup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const group = await groupService.getGroupById(req.params.id);
      if (!group) throw new AppError('Không tìm thấy nhóm', 404);
      res.json({ success: true, data: group });
    } catch (err) {
      next(err);
    }
  };

  /** GET /api/groups/:id/members — Lấy danh sách thành viên */
  getMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const members = await groupService.getMembers(req.params.id);
      res.json({ success: true, data: members });
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/groups/:id/join — Tham gia nhóm */
  joinGroup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const groupId = req.params.id;
      const userId = req.user?.id ?? null;
      const { tempName } = req.body;

      if (!userId && !tempName?.trim()) {
        throw new AppError('tempName là bắt buộc cho khách vãng lai', 400);
      }

      // Kiểm tra nhóm tồn tại
      const group = await groupService.getGroupById(groupId);
      if (!group) throw new AppError('Không tìm thấy nhóm', 404);
      if (group.status !== 'active') throw new AppError('Nhóm đã đóng', 400);

      const member = await groupService.joinGroup(groupId, userId, tempName?.trim());

      // Populate để trả về đầy đủ thông tin
      await member.populate('userId', 'name email');

      // Phát sự kiện realtime cho tất cả thành viên trong phòng
      try {
        const io = getIO();
        io.to(`group:${groupId}`).emit('member:joined', member);
      } catch (_) {
        // Socket không bắt buộc, bỏ qua nếu chưa khởi tạo
      }

      res.status(201).json({ success: true, data: member });
    } catch (err) {
      next(err);
    }
  };

  /** PATCH /api/groups/:id/members/:memberId/ready — Đánh dấu đã chọn món */
  setMemberReady = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { memberId, id: groupId } = req.params;
      const { isReady } = req.body;
      const updated = await groupService.setMemberReady(memberId, Boolean(isReady));
      if (!updated) throw new AppError('Không tìm thấy thành viên', 404);

      try {
        getIO().to(`group:${groupId}`).emit('member:updated', updated);
      } catch (_) {}

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };

  /** POST /api/groups/:id/members/:memberId/items — Thêm món vào giỏ của thành viên */
  addMemberItem = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id: groupId, memberId } = req.params;
      const { productId, name, price, image, qty = 1 } = req.body;

      if (!productId || !name || price == null) {
        throw new AppError('productId, name, price là bắt buộc', 400);
      }

      const updated = await groupService.addItemToMember(memberId, {
        productId,
        name,
        price: Number(price),
        image: image ?? '',
        qty: Number(qty),
      });
      if (!updated) throw new AppError('Không tìm thấy thành viên', 404);

      // Populate userId để owner nhận được đầy đủ tên
      await updated.populate('userId', 'name email');

      try {
        getIO().to(`group:${groupId}`).emit('member:item_added', updated);
      } catch (_) {}

      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  };
}
