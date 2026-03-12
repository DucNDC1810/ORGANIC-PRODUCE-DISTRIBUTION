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
    timeLimit: Date | null,
    paymentOption: 'owner_only' | 'individual' | 'equal_split' = 'owner_only'
  ) {
    // Tạo invite code ngẫu nhiên dạng "nhom-xxxxxxxx"
    const inviteCode = 'nhom-' + uuidv4().replace(/-/g, '').slice(0, 8);

    const group = await Group.create({
      groupName,
      ownerId,
      inviteCode,
      settings: { paymentMethod, timeLimit },
      paymentOption,
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
        description: `Group order deposit refund (left group)`,
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

    // Calculate shared shipping: split SHIPPING equally among all group members
    const allMembers = await GroupMember.find({ groupId });
    const sharedShipping = allMembers.length > 0
      ? Math.round(SHIPPING / allMembers.length)
      : 0;

    // Calculate group discount tier based on ready member count
    const orderedCount = allMembers.filter((m) => m.isReady).length;
    const activeTierIdx = TIERS.reduce((acc, t, i) => (orderedCount >= t.members ? i : acc), -1);
    const activePct = activeTierIdx >= 0 ? TIERS[activeTierIdx].pct : 0;
    const myDiscountPct = allMembers.length > 0 ? activePct / allMembers.length : 0;
    const myDiscount = Math.round(subtotal * myDiscountPct / 100);

    // Hold amount = cart items + shared shipping - personal discount
    const holdAmount = subtotal + sharedShipping - myDiscount;

    const user = await User.findById(member.userId);
    if (!user) throw new AppError('Không tìm thấy tài khoản', 404);
    if (user.walletBalance < holdAmount) {
      throw new AppError(`Số dư ví không đủ. Cần ${holdAmount.toLocaleString('vi-VN')}đ, hiện có ${user.walletBalance.toLocaleString('vi-VN')}đ`, 400);
    }

    // Trừ ví
    user.walletBalance -= holdAmount;
    await user.save();

    // Cập nhật member
    member.walletHoldAmount = holdAmount;
    member.walletPaid = true;
    await member.save();

    // Ghi log giao dịch
    await Transaction.create({
      userId: member.userId,
      amount: subtotal,
      type: 'payment',
      status: 'success',
      description: `Group order deposit for "${group.groupName}"`,
      metadata: { groupId, memberId },
    });

    await member.populate('userId', 'name email');
    return { member, walletBalance: user.walletBalance };
  }

  // ── Cancel Group ───────────────────────────────────────────────────────────

  /** Cập nhật tùy chọn thanh toán (chỉ chủ nhóm) */
  async updatePaymentOption(
    groupId: string,
    ownerId: string,
    paymentOption: 'owner_only' | 'individual' | 'equal_split'
  ) {
    const group = await Group.findOne({ _id: groupId, ownerId });
    if (!group) throw new AppError('Không tìm thấy nhóm hoặc bạn không có quyền', 403);
    group.paymentOption = paymentOption;
    await group.save();
    return group;
  }

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
          description: `Group order deposit refund for "${group.groupName}" (leader cancelled)`,
          metadata: { groupId },
        });
      }
    }

    // Soft delete: đánh dấu nhóm là 'deleted' thay vì xóa vĩnh viễn
    // Giữ lại GroupMember records để audit trail; inviteCode tự động mất hiệu lực
    group.status = 'deleted';
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

    const members = await GroupMember.find({ groupId }).populate('userId', 'name');

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

    // Lấy địa chỉ mặc định của owner từ User model (giống checkout) làm địa chỉ giao hàng chung
    const canonicalDeliveryInfo =
      deliveryInfo && Object.keys(deliveryInfo).length > 0
        ? deliveryInfo
        : {
            fullName: owner.name,
            phone:    owner.phone,
            address:  [owner.street, owner.ward, owner.district, owner.province]
                        .filter(Boolean).join(', ') || '',
            type: 'delivery' as const,
          };

    // Tạo đơn hàng chính thức (pending – chờ manager duyệt trước khi ship)
    const order = await Order.create({
      userId: ownerId,
      orderType: 'group_buy',
      groupId: new mongoose.Types.ObjectId(groupId),
      totalAmount: total,
      status: 'pending',
      paymentMethod: 'wallet',
      paymentStatus: 'paid',
      shippingCost: SHIPPING,
      discountAmount: discount,
      items: allItems,
      deliveryInfo: canonicalDeliveryInfo,
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
        description: `Group order leader payment for "${group.groupName}"`,
        metadata: { groupId },
      });
    }

    // Tạo đơn hàng lịch sử cho từng thành viên (không phải owner) có giỏ hàng
    const sharedShippingPerMember = members.length > 0 ? Math.round(SHIPPING / members.length) : 0;
    const memberDiscountPct = members.length > 0 ? activePct / members.length : 0;

    for (const m of regularMembers) {
      if (!m.userId || m.cartItems.length === 0) continue;

      const memberName = (m.userId as any)?.name || m.tempName || 'Member';
      const mSubtotal  = m.cartItems.reduce((s, i) => s + i.price * i.qty, 0);
      const mDiscount  = Math.round(mSubtotal * memberDiscountPct / 100);
      const mTotal     = m.walletPaid
        ? m.walletHoldAmount  // use exact amount already charged
        : mSubtotal + sharedShippingPerMember - mDiscount;

      await Order.create({
        userId:         m.userId,
        orderType:      'group_buy',
        groupId:        new mongoose.Types.ObjectId(groupId),
        totalAmount:    mTotal,
        status:         'pending',
        paymentMethod:  'wallet',
        paymentStatus:  m.walletPaid ? 'paid' : 'unpaid',
        shippingCost:   sharedShippingPerMember,
        discountAmount: mDiscount,
        items: m.cartItems.map((i) => ({
          productId: new mongoose.Types.ObjectId(i.productId),
          quantity:  i.qty,
          price:     i.price,
          subtotal:  i.price * i.qty,
        })),
        deliveryInfo: canonicalDeliveryInfo,  // always owner's address
        notes: `[member: ${memberName}] Đơn nhóm: ${group.groupName}`,
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
      existing.qty = item.qty; // Frontend sends full new qty, not a delta
    } else {
      member.cartItems.push(item);
    }
    // isReady is NOT auto-set here — member must explicitly click "Xác nhận" button
    await member.save();
    return member;
  }

  /**
   * Đồng bộ toàn bộ danh sách món của một thành viên (replace, dùng cho Owner sync).
   * Tự động cập nhật isReady dựa trên số lượng item.
   */
  async syncMemberItems(
    memberId: string,
    items: { productId: string; name: string; price: number; image: string; qty: number }[]
  ) {
    const member = await GroupMember.findByIdAndUpdate(
      memberId,
      { cartItems: items, isReady: items.length > 0 },
      { new: true }
    ).populate('userId', 'name email');
    return member;
  }
}
