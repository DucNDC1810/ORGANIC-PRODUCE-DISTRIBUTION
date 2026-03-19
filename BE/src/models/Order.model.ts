import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  orderType: 'regular' | 'group_buy' | 'subscription';
  addressId?: mongoose.Types.ObjectId;
  voucherId?: mongoose.Types.ObjectId;
  groupId?: mongoose.Types.ObjectId;
  memberIds?: mongoose.Types.ObjectId[];
  subscriptionId?: mongoose.Types.ObjectId;
  shipperId?: mongoose.Types.ObjectId;
  cancelledByShipperId?: mongoose.Types.ObjectId;
  rejectedByShippers?: mongoose.Types.ObjectId[];
  reopenedForShipping?: boolean;
  orderDate: Date;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded' | 'returned';
  returnedAt?: Date;
  returnReason?: string;
  returnCondition?: 'salvageable' | 'spoiled';
  returnNote?: string;
  returnProcessedAt?: Date;
  returnProcessedBy?: mongoose.Types.ObjectId;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
  deliveryInfo?: {
    fullName?: string;
    phone?: string;
    email?: string;
    address?: string;
    type?: 'delivery' | 'pickup';
  };
  pickupLocation?: {
    name?: string;
    address?: string;
  };
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed' | 'unpaid';
  shippingCost?: number;
  discountAmount?: number;
  taxAmount?: number;
  notes?: string;
  cancelReason?: string;
  cancelledAt?: Date;
  shipperCancelledAt?: Date;
  isRecurring?: boolean;
  subscriptionFrequency?: string;
  confirmedAt?: Date;
  confirmedBy?: mongoose.Types.ObjectId;
  deliveredAt?: Date;
  shippingAcceptedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    orderType: {
      type: String,
      enum: ['regular', 'group_buy', 'subscription'],
      default: 'regular',
      required: true
    },
    addressId: {
      type: Schema.Types.ObjectId,
      ref: 'Address',
      default: null
    },
    voucherId: {
      type: Schema.Types.ObjectId,
      ref: 'Voucher',
      default: null
    },
    groupId: {
      type: Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },
    memberIds: [{
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: undefined
    }],
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null
    },
    shipperId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    cancelledByShipperId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    rejectedByShippers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    reopenedForShipping: {
      type: Boolean,
      default: false
    },
    orderDate: {
      type: Date,
      default: Date.now
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded', 'returned'],
      default: 'pending'
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        },
        price: {
          type: Number,
          required: true,
          min: 0
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0
        }
      }
    ],
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'e_wallet', 'momo', 'cod', 'wallet'],
      default: 'credit_card'
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'unpaid'],
      default: 'pending'
    },
    deliveryInfo: {
      fullName: {
        type: String,
        trim: true
      },
      phone: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true
      },
      address: {
        type: String,
        trim: true
      },
      type: {
        type: String,
        enum: ['delivery', 'pickup'],
        default: 'delivery'
      }
    },
    pickupLocation: {
      name: {
        type: String,
        trim: true
      },
      address: {
        type: String,
        trim: true
      }
    },
    shippingCost: {
      type: Number,
      default: 0,
      min: 0
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    notes: {
      type: String,
      trim: true
    },
    cancelReason: {
      type: String,
      trim: true
    },
    cancelledAt: {
      type: Date
    },
    shipperCancelledAt: {
      type: Date
    },
    confirmedAt: {
      type: Date
    },
    confirmedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    deliveredAt: {
      type: Date
    },
    shippingAcceptedAt: {
      type: Date
    },
    returnedAt: {
      type: Date
    },
    returnReason: {
      type: String,
      trim: true
    },
    returnCondition: {
      type: String,
      enum: ['salvageable', 'spoiled'],
      default: null
    },
    returnNote: {
      type: String,
      trim: true
    },
    returnProcessedAt: {
      type: Date
    },
    returnProcessedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    subscriptionFrequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly', null],
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Index for common queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderDate: -1 });
orderSchema.index({ 'items.productId': 1 });
orderSchema.index({ shipperId: 1, status: 1 });
orderSchema.index({ orderType: 1 });
orderSchema.index({ groupId: 1 });
orderSchema.index({ subscriptionId: 1 });
orderSchema.index({ memberIds: 1 });

export const Order = mongoose.model<IOrder>('Order', orderSchema);
