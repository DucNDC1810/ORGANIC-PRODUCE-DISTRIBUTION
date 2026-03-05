import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupCartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  qty: number;
}

export interface IGroupMember extends Document {
  groupId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  tempName?: string;
  role: 'owner' | 'member';
  isReady: boolean;
  cartItems: IGroupCartItem[];
  joinedAt: Date;
  /** Số tiền đã tạm giữ từ ví (đặt cọc) */
  walletHoldAmount: number;
  /** Thành viên đã thanh toán phần của mình qua ví chưa */
  walletPaid: boolean;
}

const groupCartItemSchema = new Schema<IGroupCartItem>(
  {
    productId: { type: String, required: true },
    name:      { type: String, required: true },
    price:     { type: Number, required: true },
    image:     { type: String, default: '' },
    qty:       { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const groupMemberSchema = new Schema<IGroupMember>(
  {
    groupId:          { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    userId:           { type: Schema.Types.ObjectId, ref: 'User', default: null },
    tempName:         { type: String, default: null },
    role:             { type: String, enum: ['owner', 'member'], default: 'member' },
    isReady:          { type: Boolean, default: false },
    cartItems:        { type: [groupCartItemSchema], default: [] },
    joinedAt:         { type: Date, default: Date.now },
    walletHoldAmount: { type: Number, default: 0 },
    walletPaid:       { type: Boolean, default: false },
  },
  { timestamps: false }
);

// Index để query theo nhóm nhanh
groupMemberSchema.index({ groupId: 1 });
// Mỗi user chỉ tham gia một nhóm một lần
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IGroupMember>('GroupMember', groupMemberSchema);
