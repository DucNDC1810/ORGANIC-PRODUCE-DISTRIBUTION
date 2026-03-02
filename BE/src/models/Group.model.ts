import mongoose, { Document, Schema } from 'mongoose';

export interface IGroup extends Document {
  groupName: string;
  ownerId: mongoose.Types.ObjectId;
  inviteCode: string;
  settings: {
    paymentMethod: string;
    timeLimit: Date | null;
  };
  status: 'active' | 'locked' | 'completed';
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
    status: {
      type: String,
      enum: ['active', 'locked', 'completed'],
      default: 'active',
    },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

export default mongoose.model<IGroup>('Group', groupSchema);
