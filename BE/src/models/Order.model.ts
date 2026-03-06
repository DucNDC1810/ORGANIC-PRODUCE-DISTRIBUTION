import mongoose, { Document, Schema } from 'mongoose';

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  addressId?: mongoose.Types.ObjectId;
  voucherId?: mongoose.Types.ObjectId;
  groupBuyId?: mongoose.Types.ObjectId;
  subscriptionId?: mongoose.Types.ObjectId;
  orderDate: Date;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
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
  confirmedAt?: Date;
  confirmedBy?: mongoose.Types.ObjectId;
  deliveredAt?: Date;
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
    groupBuyId: {
      type: Schema.Types.ObjectId,
      ref: 'GroupBuy',
      default: null
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'Subscription',
      default: null
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
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
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

export const Order = mongoose.model<IOrder>('Order', orderSchema);
