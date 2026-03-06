import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  orderId: mongoose.Types.ObjectId;
  paymentMethod: 'credit_card' | 'debit_card' | 'cash' | 'bank_transfer' | 'e_wallet' | 'momo';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  paymentDate: Date;
  amount: number;
  transactionId?: string;
  description?: string;
  failureReason?: string;
  refundedAt?: Date;
  refundAmount?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required']
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'e_wallet', 'momo'],
      required: [true, 'Payment method is required']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
      default: 'pending'
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: 0
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    failureReason: {
      type: String,
      trim: true
    },
    refundedAt: {
      type: Date
    },
    refundAmount: {
      type: Number,
      min: 0
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

// Index for common queries
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ paymentStatus: 1 });
paymentSchema.index({ paymentDate: -1 });

export const Payment = mongoose.model<IPayment>('Payment', paymentSchema);
