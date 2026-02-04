import mongoose, { Document, Schema } from 'mongoose';

export interface IGroupBuyEvent extends Document {
  productId: mongoose.Types.ObjectId;
  voucherId?: mongoose.Types.ObjectId;
  targetQuantity: number;
  currentQuantity: number;
  startTime: Date;
  endTime: Date;
  status: 'open' | 'closed' | 'success' | 'failed';
  description?: string;
  discountPercentage?: number;
  pricePerUnit?: number;
  participants?: mongoose.Types.ObjectId[];
  participantCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const groupBuyEventSchema = new Schema<IGroupBuyEvent>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    voucherId: {
      type: Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null
    },
    targetQuantity: {
      type: Number,
      required: [true, 'Target quantity is required'],
      min: 1
    },
    currentQuantity: {
      type: Number,
      default: 0,
      min: 0
    },
    startTime: {
      type: Date,
      required: [true, 'Start time is required']
    },
    endTime: {
      type: Date,
      required: [true, 'End time is required']
    },
    status: {
      type: String,
      enum: ['open', 'closed', 'success', 'failed'],
      default: 'open'
    },
    description: {
      type: String,
      trim: true
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    pricePerUnit: {
      type: Number,
      min: 0
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    participantCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true
  }
);

// Index for common queries
groupBuyEventSchema.index({ productId: 1 });
groupBuyEventSchema.index({ status: 1 });
groupBuyEventSchema.index({ endTime: 1 });
groupBuyEventSchema.index({ createdAt: -1 });

export const GroupBuyEvent = mongoose.model<IGroupBuyEvent>('GroupBuyEvent', groupBuyEventSchema);
