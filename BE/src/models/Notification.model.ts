import mongoose, { Document, Schema } from 'mongoose';

export type NotificationType = 'new_order' | 'account_locked' | 'unlock_request' | 'new_review' | 'stock_low' | 'system' | 'order_update';

export interface INotification extends Document {
  type: NotificationType;
  title: string;
  message: string;
  link?: string;       // admin tab query param, e.g. "?tab=orders"
  isRead: boolean;
  userId?: mongoose.Types.ObjectId; // Optional: notification for specific user
  metadata?: Record<string, any>;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      enum: ['new_order', 'account_locked', 'unlock_request', 'new_review', 'stock_low', 'system', 'order_update'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Keep only latest 200 notifications (auto-clean old ones)
NotificationSchema.post('save', async function () {
  const count = await mongoose.model('Notification').countDocuments();
  if (count > 200) {
    const oldest = await mongoose.model('Notification')
      .find()
      .sort({ createdAt: 1 })
      .limit(count - 200)
      .select('_id');
    await mongoose.model('Notification').deleteMany({ _id: { $in: oldest.map((d: any) => d._id) } });
  }
});

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);

/** Utility: create a notification — can be called from any service/controller */
export async function createNotification(
  type: NotificationType,
  title: string,
  message: string,
  options?: { link?: string; metadata?: Record<string, any>; userId?: mongoose.Types.ObjectId }
): Promise<void> {
  try {
    await Notification.create({ type, title, message, ...options });
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
