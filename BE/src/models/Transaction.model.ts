import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  userId: mongoose.Types.ObjectId;
  amount: number;
  type: 'topup' | 'payment' | 'refund';
  status: 'pending' | 'success' | 'failed';
  orderId?: mongoose.Types.ObjectId;
  description?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0
    },
    type: {
      type: String,
      enum: ['topup', 'payment', 'refund'],
      required: [true, 'Transaction type is required']
    },
    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending'
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    description: {
      type: String,
      trim: true
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Index để query lịch sử ví của user nhanh hơn
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, type: 1 });

export const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
