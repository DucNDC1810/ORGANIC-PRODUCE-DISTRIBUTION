import mongoose, { Document, Schema } from 'mongoose';

export interface IShipper extends Document {
    userId?: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    vehiclePlate: string;
    email?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const shipperSchema = new Schema<IShipper>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            unique: true,
            sparse: true
        },
        name: {
            type: String,
            required: [true, 'Shipper name is required'],
            trim: true
        },
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true
        },
        vehiclePlate: {
            type: String,
            required: [true, 'Vehicle plate is required'],
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
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

// Index for faster lookups
shipperSchema.index({ phone: 1 });
shipperSchema.index({ isActive: 1 });

export const Shipper = mongoose.model<IShipper>('Shipper', shipperSchema);
