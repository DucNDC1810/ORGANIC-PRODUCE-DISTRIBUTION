import mongoose, { Document, Schema } from 'mongoose';

export interface IDeliveryZone extends Document {
    zoneName: string;
    shippingRate: number;
    shipperId: mongoose.Types.ObjectId;
    description?: string;
    isActive: boolean;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    createdAt: Date;
    updatedAt: Date;
}

const deliveryZoneSchema = new Schema<IDeliveryZone>(
    {
        zoneName: {
            type: String,
            required: [true, 'Zone name is required'],
            trim: true
        },
        shippingRate: {
            type: Number,
            required: [true, 'Shipping rate is required'],
            min: 0
        },
        shipperId: {
            type: Schema.Types.ObjectId,
            ref: 'Shipper',
            required: [true, 'Shipper ID is required']
        },
        description: {
            type: String,
            trim: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        coordinates: {
            latitude: {
                type: Number,
                min: -90,
                max: 90
            },
            longitude: {
                type: Number,
                min: -180,
                max: 180
            }
        }
    },
    {
        timestamps: true
    }
);

// Indexes for faster queries
deliveryZoneSchema.index({ shipperId: 1 });
deliveryZoneSchema.index({ isActive: 1 });

export const DeliveryZone = mongoose.model<IDeliveryZone>('DeliveryZone', deliveryZoneSchema);
