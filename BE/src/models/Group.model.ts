import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  groupName: string;
  ownerId: mongoose.Types.ObjectId;
  inviteCode: string;
  settings: {
    paymentMethod: string;
    timeLimit: Date | null;
  };
  paymentOption: 'owner_only' | 'individual' | 'equal_split';
  status: 'active' | 'locked' | 'completed' | 'deleted';
  createdAt: Date;
}

const groupSchema = new Schema<IGroup>(
  {
    groupName: { type: String, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    inviteCode: { type: String, unique: true, required: true },
    settings: {
      paymentMethod: { type: String, default: 'Chủ nhóm thanh toán' },
      timeLimit: { type: Date, default: null },
    },
    paymentOption: {
      type: String,
      enum: ['owner_only', 'individual', 'equal_split'],
      default: 'owner_only',
    },
    status: {
      type: String,
      enum: ['active', 'locked', 'completed', 'deleted'],
      default: 'active',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export default mongoose.model<IGroup>('Group', groupSchema);
