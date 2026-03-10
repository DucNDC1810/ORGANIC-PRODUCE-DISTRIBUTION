import mongoose, { Document, Schema } from 'mongoose';

export interface IDelivery extends Document {
    orderId: mongoose.Types.ObjectId;
    deliveryStatus: 'Pending' | 'Delivering' | 'Delivered' | 'Failed' | 'Cancelled';
    estimatedDeliveryTime: Date;
    actualDeliveryTime?: Date;
    notes?: string;
    failureReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const deliverySchema = new Schema<IDelivery>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'Order',
            required: [true, 'Order ID is required'],
            unique: true
        },
        deliveryStatus: {
            type: String,
            enum: ['Pending', 'Delivering', 'Delivered', 'Failed', 'Cancelled'],
            default: 'Pending'
        },
        estimatedDeliveryTime: {
            type: Date,
            required: [true, 'Estimated delivery time is required']
        },
        actualDeliveryTime: {
            type: Date
        },
        notes: {
            type: String,
            trim: true
        },
        failureReason: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

// Indexes for faster queries
deliverySchema.index({ orderId: 1 });
deliverySchema.index({ deliveryStatus: 1 });
deliverySchema.index({ estimatedDeliveryTime: 1 });

export const Delivery = mongoose.model<IDelivery>('Delivery', deliverySchema);
