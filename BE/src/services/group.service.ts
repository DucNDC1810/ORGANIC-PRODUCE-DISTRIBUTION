import { v4 as uuidv4 } from 'uuid';
import Group from '../models/Group.model';
import GroupMember from '../models/GroupMember.model';

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
