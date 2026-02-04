import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscriptionItem extends Document {
  subscriptionId: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionItemSchema = new Schema<ISubscriptionItem>(
  {
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      required: [true, 'Subscription ID is required']
    },
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 1
    }
  },
  {
    timestamps: true
  }
);

subscriptionItemSchema.index({ subscriptionId: 1 });
subscriptionItemSchema.index({ productId: 1 });

export const SubscriptionItem = mongoose.model<ISubscriptionItem>('SubscriptionItem', subscriptionItemSchema);

export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  addressId: mongoose.Types.ObjectId;
  frequency: 'weekly' | 'monthly';
  nextDeliveryDate: Date;
  status: 'active' | 'paused' | 'cancelled';
  items?: ISubscriptionItem[];
  startDate: Date;
  endDate?: Date;
  cancelledAt?: Date;
  pausedAt?: Date;
  totalPrice?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      required: [true, 'Address ID is required']
    },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: [true, 'Frequency is required']
    },
    nextDeliveryDate: {
      type: Date,
      required: [true, 'Next delivery date is required']
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'cancelled'],
      default: 'active'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    pausedAt: {
      type: Date
    },
    totalPrice: {
      type: Number,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

subscriptionSchema.index({ userId: 1, status: 1 });
subscriptionSchema.index({ nextDeliveryDate: 1 });
subscriptionSchema.index({ status: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema);
