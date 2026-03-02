import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupMember extends Document {
  groupId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  tempName?: string;
  role: 'owner' | 'member';
  isReady: boolean;
  joinedAt: Date;
}

const groupMemberSchema = new Schema<IGroupMember>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    tempName: { type: String, default: null },
    role: {
      type: String,
      enum: ['owner', 'member'],
      default: 'member',
    },
    isReady: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// Index để query theo nhóm nhanh
groupMemberSchema.index({ groupId: 1 });
// Mỗi user chỉ tham gia một nhóm một lần
groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IGroupMember>('GroupMember', groupMemberSchema);
