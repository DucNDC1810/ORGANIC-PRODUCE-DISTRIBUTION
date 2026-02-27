import mongoose, { Document, Schema } from 'mongoose';

export interface IAddress extends Document {
  userId: mongoose.Types.ObjectId;
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  district?: string;
  ward?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new Schema<IAddress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    fullName: { type: String },
    phone: { type: String },
    addressLine1: { type: String },
    addressLine2: { type: String },
    city: { type: String },
    district: { type: String },
    ward: { type: String },
    province: { type: String },
    country: { type: String, default: 'Vietnam' },
    postalCode: { type: String },
    isDefault: { type: Boolean, default: false }
  },
  {
    timestamps: true
  }
);

export const Address = mongoose.model<IAddress>('Address', addressSchema);
