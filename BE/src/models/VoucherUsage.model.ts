import mongoose, { Document, Schema } from 'mongoose';

export interface IVoucherUsage extends Document {
  userId: mongoose.Types.ObjectId;
  voucherId: mongoose.Types.ObjectId;
  orderId: mongoose.Types.ObjectId;
  status: 'pending' | 'used' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const voucherUsageSchema = new Schema<IVoucherUsage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    voucherId: {
      type: Schema.Types.ObjectId,
      ref: 'Voucher',
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'used', 'cancelled'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// Compound index: quickly check if user already used/pending a voucher
voucherUsageSchema.index({ userId: 1, voucherId: 1, status: 1 });
voucherUsageSchema.index({ orderId: 1 });

export const VoucherUsage = mongoose.model<IVoucherUsage>('VoucherUsage', voucherUsageSchema);
