import mongoose, { Document, Schema } from 'mongoose';

export interface IReview extends Document {
  user: mongoose.Types.ObjectId;
  product: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required']
    },
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required']
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    images: [{
      type: String,
      trim: true
    }],
    isVerifiedPurchase: {
      type: Boolean,
      default: false
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Index để tối ưu hóa query
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true }); // Mỗi user chỉ review 1 lần cho 1 sản phẩm

// Virtual để populate thông tin user
reviewSchema.virtual('userInfo', {
  ref: 'User',
  localField: 'user',
  foreignField: '_id',
  justOne: true
});

// Middleware để cập nhật rating và reviewCount của Product sau khi review được tạo/cập nhật/xóa
reviewSchema.post('save', async function() {
  await (this.constructor as any).calcAverageRatings(this.product);
});

// Middleware cho update operations
reviewSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    await (doc.constructor as any).calcAverageRatings(doc.product);
  }
});

// Middleware cho delete operations
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await (doc.constructor as any).calcAverageRatings(doc.product);
  }
});

reviewSchema.post('deleteOne', { document: true, query: false }, async function() {
  await (this.constructor as any).calcAverageRatings(this.product);
});

// Static method để tính toán rating trung bình
reviewSchema.statics.calcAverageRatings = async function(productId: mongoose.Types.ObjectId) {
  const stats = await this.aggregate([
    {
      $match: { product: productId }
    },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        numReviews: { $sum: 1 }
      }
    }
  ]);

  const Product = mongoose.model('Product');
  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10, // Làm tròn đến 1 chữ số thập phân
      reviewCount: stats[0].numReviews
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviewCount: 0
    });
  }
};

const Review = mongoose.model<IReview>('Review', reviewSchema);

export default Review;
