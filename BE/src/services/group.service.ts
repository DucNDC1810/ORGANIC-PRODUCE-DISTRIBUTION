import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import Group from '../models/Group.model';
import GroupMember from '../models/GroupMember.model';
import { User } from '../models/User.model';
import { Transaction } from '../models/Transaction.model';
import { Order } from '../models/Order.model';
import { AppError } from '../utils/AppError';

// Discount tiers (mirrors FE TIERS constant)
const TIERS = [
  { members: 2, pct: 2 },
  { members: 3, pct: 4 },
  { members: 5, pct: 6 },
  { members: 8, pct: 10 },
];
const SHIPPING = 25_000;

export class GroupService {
  /** Tạo nhóm mới và thêm chủ nhóm là thành viên đầu tiên */
  async createGroup(
    ownerId: string,
    groupName: string,
    paymentMethod: string,
    timeLimit: Date | null
  ) {
    // Tạo invite code ngẫu nhiên dạng "nhom-xxxxxxxx"
    const inviteCode = 'nhom-' + uuidv4().replace(/-/g, '').slice(0, 8);

    const group = await Group.create({
      groupName,
      ownerId,
      inviteCode,
      settings: { paymentMethod, timeLimit },
      status: 'active',
    });

    // Thêm chủ nhóm là owner member (isReady = true vì họ đã chọn món)
    await GroupMember.create({
      groupId: group._id,
      userId: ownerId,
      role: 'owner',
      isReady: true,
    });

    return group;
  }

  /** Lấy thông tin nhóm theo ID */
  async getGroupById(groupId: string) {
    return Group.findById(groupId);
  }

  /** Lấy danh sách thành viên của nhóm */
  async getMembers(groupId: string) {
    return GroupMember.find({ groupId })
      .populate('userId', 'name email')
      .sort({ joinedAt: 1 });
  }

  /** Tham gia nhóm (bắt buộc user đã đăng nhập) */
  async joinGroup(groupId: string, userId: string) {
    // Tránh join trùng cho user đã đăng nhập
    const existing = await GroupMember.findOne({ groupId, userId });
    if (existing) return existing;

    const member = await GroupMember.create({
      groupId,
      userId,
      role: 'member',
      isReady: false,
    });

    return member;
  }

  /** Xóa thành viên khỏi nhóm – tự động hoàn tiền nếu đã đặt cọc */
  async removeMember(groupId: string, memberId: string) {
    const member = await GroupMember.findOne({ _id: memberId, groupId, role: { $ne: 'owner' } });
    if (!member) return null;

    // Hoàn tiền nếu đã đặt cọc
    if (member.walletPaid && member.walletHoldAmount > 0 && member.userId) {
      await User.findByIdAndUpdate(member.userId, {
        $inc: { walletBalance: member.walletHoldAmount },
      });
      await Transaction.create({
        userId: member.userId,
        amount: member.walletHoldAmount,
        type: 'refund',
        status: 'success',
        description: `Hoàn tiền đặt cọc đơn nhóm (rời nhóm)`,
        metadata: { groupId, memberId },
      });
    }

    await GroupMember.findByIdAndDelete(memberId);
    return member;
  }

  // ── Wallet Hold ────────────────────────────────────────────────────────────

  /**
   * Tạm giữ (hold) tiền ví của thành viên cho đơn nhóm.
   * Trừ walletBalance, lưu walletHoldAmount, đánh dấu walletPaid = true.
   */
  async holdWalletShare(groupId: string, memberId: string) {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Không tìm thấy nhóm', 404);
    if (group.status !== 'active') throw new AppError('Nhóm đã đóng hoặc hoàn thành', 400);

    const member = await GroupMember.findOne({ _id: memberId, groupId });
    if (!member) throw new AppError('Không tìm thấy thành viên', 404);
    if (member.walletPaid) throw new AppError('Bạn đã đặt cọc rồi', 400);
    if (!member.userId) throw new AppError('Chỉ tài khoản đã đăng nhập mới có thể đặt cọc', 400);

    const subtotal = member.cartItems.reduce((s, i) => s + i.price * i.qty, 0);
    if (subtotal <= 0) throw new AppError('Giỏ hàng trống, không thể đặt cọc', 400);

    const user = await User.findById(member.userId);
    if (!user) throw new AppError('Không tìm thấy tài khoản', 404);
    if (user.walletBalance < subtotal) {
      throw new AppError(`Số dư ví không đủ. Cần ${subtotal.toLocaleString('vi-VN')}đ, hiện có ${user.walletBalance.toLocaleString('vi-VN')}đ`, 400);
    }

    // Trừ ví
    user.walletBalance -= subtotal;
    await user.save();

    // Cập nhật member
    member.walletHoldAmount = subtotal;
    member.walletPaid = true;
    await member.save();

    // Ghi log giao dịch
    await Transaction.create({
      userId: member.userId,
      amount: subtotal,
      type: 'payment',
      status: 'success',
      description: `Đặt cọc đơn nhóm "${group.groupName}"`,
      metadata: { groupId, memberId },
    });

    await member.populate('userId', 'name email');
    return { member, walletBalance: user.walletBalance };
  }

  // ── Cancel Group ───────────────────────────────────────────────────────────

  /**
   * Chủ nhóm hủy đơn – hoàn tiền cho tất cả thành viên đã đặt cọc.
   */
  async cancelGroup(groupId: string, ownerId: string) {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Không tìm thấy nhóm', 404);
    if (group.ownerId.toString() !== ownerId) throw new AppError('Bạn không phải chủ nhóm', 403);
    if (group.status === 'completed') throw new AppError('Nhóm đã hoàn thành', 400);

    const members = await GroupMember.find({ groupId });

    // Hoàn tiền cho các thành viên đã đặt cọc
    for (const m of members) {
      if (m.walletPaid && m.walletHoldAmount > 0 && m.userId) {
        await User.findByIdAndUpdate(m.userId, {
          $inc: { walletBalance: m.walletHoldAmount },
        });
        await Transaction.create({
          userId: m.userId,
          amount: m.walletHoldAmount,
          type: 'refund',
          status: 'success',
          description: `Hoàn tiền đặt cọc đơn nhóm "${group.groupName}" (chủ nhóm hủy)`,
          metadata: { groupId },
        });
      }
    }

    group.status = 'completed';
    await group.save();
    return group;
  }

  // ── Place Group Order ──────────────────────────────────────────────────────

  /**
   * Chủ nhóm chốt đơn: tổng hợp tiền đã giữ + trừ phần còn lại từ ví owner
   * → tạo đơn hàng chính thức với paymentStatus = 'paid'.
   */
  async placeGroupOrder(
    groupId: string,
    ownerId: string,
    ownerCartItems: Array<{ productId: string; name: string; price: number; qty: number; image?: string }>,
    deliveryInfo?: Record<string, any>
  ) {
    const group = await Group.findById(groupId);
    if (!group) throw new AppError('Không tìm thấy nhóm', 404);
    if (group.ownerId.toString() !== ownerId) throw new AppError('Bạn không phải chủ nhóm', 403);
    if (group.status !== 'active') throw new AppError('Nhóm đã đóng hoặc hoàn thành', 400);

    const members = await GroupMember.find({ groupId });

    // Tính tổng tiền từng thành viên (không phải owner)
    const regularMembers = members.filter((m) => m.role !== 'owner');
    const memberSubtotal = regularMembers.reduce(
      (s, m) => s + m.cartItems.reduce((cs, i) => cs + i.price * i.qty, 0),
      0
    );
    const ownerSubtotal = ownerCartItems.reduce((s, i) => s + i.price * i.qty, 0);
    const groupSubtotal = memberSubtotal + ownerSubtotal;

    // Tính mức giảm giá
    const readyCount = members.filter((m) => m.isReady || m.role === 'owner').length;
    const activeTierIdx = TIERS.reduce((acc, t, i) => (readyCount >= t.members ? i : acc), -1);
    const activePct = activeTierIdx >= 0 ? TIERS[activeTierIdx].pct : 0;
    const discount = Math.round(groupSubtotal * activePct / 100);
    const total = groupSubtotal - discount + SHIPPING;

    // Tổng tiền đã giữ từ thành viên
    const totalHeld = regularMembers
      .filter((m) => m.walletPaid && m.walletHoldAmount > 0)
      .reduce((s, m) => s + m.walletHoldAmount, 0);

    // Phần owner cần thanh toán
    const ownerCharge = Math.max(0, total - totalHeld);

    const owner = await User.findById(ownerId);
    if (!owner) throw new AppError('Không tìm thấy chủ nhóm', 404);

    if (ownerCharge > 0) {
      if (owner.walletBalance < ownerCharge) {
        throw new AppError(
          `Số dư ví chủ nhóm không đủ. Cần thêm ${(ownerCharge - owner.walletBalance).toLocaleString('vi-VN')}đ`,
          400
        );
      }
      owner.walletBalance -= ownerCharge;
      await owner.save();
    }

    // Gộp tất cả items
    const allItems = [
      ...ownerCartItems.map((i) => ({
        productId: new mongoose.Types.ObjectId(i.productId),
        quantity: i.qty,
        price: i.price,
        subtotal: i.price * i.qty,
      })),
      ...regularMembers.flatMap((m) =>
        m.cartItems.map((i) => ({
          productId: new mongoose.Types.ObjectId(i.productId),
          quantity: i.qty,
          price: i.price,
          subtotal: i.price * i.qty,
        }))
      ),
    ];

    // Tạo đơn hàng chính thức
    const order = await Order.create({
      userId: ownerId,
      totalAmount: total,
      status: 'confirmed',
      paymentMethod: 'wallet',
      paymentStatus: 'paid',
      shippingCost: SHIPPING,
      discountAmount: discount,
      items: allItems,
      deliveryInfo: deliveryInfo ?? {},
      notes: `Đơn nhóm: ${group.groupName}`,
    });

    // Ghi log giao dịch cho owner
    if (ownerCharge > 0) {
      await Transaction.create({
        userId: ownerId,
        amount: ownerCharge,
        type: 'payment',
        status: 'success',
        orderId: order._id,
        description: `Thanh toán phần chủ nhóm cho đơn nhóm "${group.groupName}"`,
        metadata: { groupId },
      });
    }

    // Đóng nhóm
    group.status = 'completed';
    await group.save();

    return {
      order,
      total,
      discount,
      totalHeld,
      ownerCharge,
      walletBalance: owner.walletBalance,
    };
  }

  /** Cập nhật trạng thái sẵn sàng (đã chọn món) của một thành viên */
  async setMemberReady(memberId: string, isReady: boolean) {
    return GroupMember.findByIdAndUpdate(memberId, { isReady }, { new: true });
  }

  /** Thêm / cập nhật số lượng món trong giỏ của một thành viên */
  async addItemToMember(
    memberId: string,
    item: { productId: string; name: string; price: number; image: string; qty: number }
  ) {
    const member = await GroupMember.findById(memberId);
    if (!member) return null;

    const existing = member.cartItems.find((i) => i.productId === item.productId);
    if (existing) {
      existing.qty += item.qty;
    } else {
      member.cartItems.push(item);
    }
    // Tự động đánh dấu đã chọn món khi có ít nhất 1 item
    member.isReady = member.cartItems.length > 0;
    await member.save();
    return member;
  }
}
