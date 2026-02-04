import mongoose, { Document, Schema } from 'mongoose';

export interface IVoucher extends Document {
  code: string;
  discountAmount?: number;
  discountPercentage?: number;
  discountType: 'fixed' | 'percentage';
  expiryDate: Date;
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usageCount: number;
  usedBy?: mongoose.Types.ObjectId[];
  applicableCategories?: string[];
  applicableProducts?: mongoose.Types.ObjectId[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const voucherSchema = new Schema<IVoucher>(
  {
    code: {
      type: String,
      required: [true, 'Voucher code is required'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 50
    },
    discountAmount: {
      type: Number,
      min: 0
    },
    discountPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    discountType: {
      type: String,
      enum: ['fixed', 'percentage'],
      required: [true, 'Discount type is required']
    },
    expiryDate: {
      type: Date,
      required: [true, 'Expiry date is required']
    },
    minPurchaseAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    maxDiscountAmount: {
      type: Number,
      min: 0
    },
    usageLimit: {
      type: Number,
      min: 1
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0
    },
    usedBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    applicableCategories: [
      {
        type: String,
        trim: true
      }
    ],
    applicableProducts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    description: {
      type: String,
      trim: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Index for common queries
voucherSchema.index({ expiryDate: 1 });
voucherSchema.index({ isActive: 1 });
voucherSchema.index({ createdAt: -1 });

// Virtual to check if voucher is expired
voucherSchema.virtual('isExpired').get(function (this: IVoucher) {
  return new Date() > this.expiryDate;
});

// Virtual to check if voucher can be used
voucherSchema.virtual('canBeUsed').get(function (this: IVoucher) {
  const isExpired = new Date() > this.expiryDate;
  return this.isActive && !isExpired && (!this.usageLimit || this.usageCount < this.usageLimit);
});

export const Voucher = mongoose.model<IVoucher>('Voucher', voucherSchema);
