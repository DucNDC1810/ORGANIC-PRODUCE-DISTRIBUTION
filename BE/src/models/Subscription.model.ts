import mongoose, { Document, Schema } from 'mongoose';

// ──────────────────────────────────────────────
// Embedded item (stored inside each Subscription)
// ──────────────────────────────────────────────
export interface ISubscriptionItem {
  productId: mongoose.Types.ObjectId;
  quantity: number;
  /** Giá tại thời điểm đăng ký – bảo vệ quyền lợi khách */
  priceAtSubscription?: number;
}

const subscriptionItemSchema = new Schema<ISubscriptionItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product ID is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: 1,
      default: 1
    },
    priceAtSubscription: {
      type: Number,
      min: 0
    }
  },
  { _id: false } // không cần _id riêng cho subdocument
);

// ──────────────────────────────────────────────
// Main Subscription document
// ──────────────────────────────────────────────
export interface ISubscription extends Document {
  userId: mongoose.Types.ObjectId;
  addressId?: mongoose.Types.ObjectId;

  items: ISubscriptionItem[];

  /** Tần suất giao hàng */
  frequency: 'weekly' | 'bi-weekly' | 'monthly';

  /**
   * Ngày giao cụ thể:
   *  - weekly / bi-weekly → 0-6 (0 = CN, 1 = T2, …, 6 = T7)
   *  - monthly           → 1-28 (ngày trong tháng)
   */
  deliveryDay: number;

  startDate: Date;
  nextDeliveryDate: Date;

  status: 'active' | 'paused' | 'cancelled';

  /** Ưu đãi đặt hàng định kì (mặc định 5%) */
  discountRate: number;

  /** Phương thức thanh toán */
  paymentMethod: string;

  // Trạng thái phụ
  endDate?: Date;
  cancelledAt?: Date;
  pausedAt?: Date;

  totalPrice?: number;
  shippingCost?: number;
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
      default: null
    },

    items: {
      type: [subscriptionItemSchema],
      default: [],
      validate: {
        validator: (v: ISubscriptionItem[]) => v.length > 0,
        message: 'At least one product item is required'
      }
    },

    frequency: {
      type: String,
      enum: ['weekly', 'bi-weekly', 'monthly'],
      required: [true, 'Frequency is required']
    },

    deliveryDay: {
      type: Number,
      required: [true, 'Delivery day is required']
    },

    startDate: {
      type: Date,
      default: Date.now
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

    discountRate: {
      type: Number,
      default: 0.05,
      min: 0,
      max: 1
    },

    paymentMethod: {
      type: String,
      default: 'COD'
    },

    endDate:      { type: Date },
    cancelledAt:  { type: Date },
    pausedAt:     { type: Date },

    totalPrice: {
      type: Number,
      min: 0
    },
    shippingCost: {
      type: Number,
      min: 0,
      default: 25000
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
