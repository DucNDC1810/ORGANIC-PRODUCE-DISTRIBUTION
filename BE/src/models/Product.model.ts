import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  category: string;
  subcategory?: string;
  images: string[];
  thumbnail: string;
  stock: number;
  unit: string;
  origin: string;
  isOrganic: boolean;
  certifications?: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  farmer?: mongoose.Types.ObjectId;
  isActive: boolean;
  isFeatured: boolean;
  rating: number;
  reviewCount: number;
  soldCount: number;
  tags?: string[];
  sku: string;
  barcode?: string;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  expiryDate?: Date;
  harvestDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      enum: {
        values: [
          'vegetables',      // Rau củ
          'fruits',          // Trái cây
          'grains',          // Ngũ cốc
          'dairy',           // Sữa và sản phẩm từ sữa
          'meat',            // Thịt
          'seafood',         // Hải sản
          'herbs',           // Thảo mộc
          'nuts',            // Hạt
          'beverages',       // Đồ uống
          'processed',       // Thực phẩm chế biến
          'other'            // Khác
        ],
        message: '{VALUE} is not a valid category'
      }
    },
    subcategory: {
      type: String,
      trim: true
    },
    images: [{
      type: String,
      trim: true
    }],
    thumbnail: {
      type: String,
      required: [true, 'Product thumbnail is required'],
      trim: true
    },
    stock: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: ['kg', 'g', 'piece', 'bunch', 'pack', 'box', 'bottle', 'liter', 'ml'],
        message: '{VALUE} is not a valid unit'
      },
      default: 'kg'
    },
    origin: {
      type: String,
      required: [true, 'Product origin is required'],
      trim: true
    },
    isOrganic: {
      type: Boolean,
      default: true
    },
    certifications: [{
      type: String,
      trim: true
    }],
    nutritionInfo: {
      calories: { type: Number, min: 0 },
      protein: { type: Number, min: 0 },
      carbs: { type: Number, min: 0 },
      fat: { type: Number, min: 0 },
      fiber: { type: Number, min: 0 }
    },
    farmer: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot be more than 5']
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0
    },
    tags: [{
      type: String,
      trim: true
    }],
    sku: {
      type: String,
      unique: true,
      trim: true,
      uppercase: true,
      default: function() {
        // Tự động tạo SKU nếu không được cung cấp
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `PRD-${timestamp}-${random}`;
      }
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true
    },
    weight: {
      type: Number,
      min: 0
    },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
    expiryDate: {
      type: Date
    },
    harvestDate: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ farmer: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.originalPrice && this.originalPrice > this.price) {
    return Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }
  return 0;
});

// Virtual for stock status
productSchema.virtual('stockStatus').get(function() {
  if (this.stock === 0) return 'out_of_stock';
  if (this.stock <= 10) return 'low_stock';
  return 'in_stock';
});

// Pre-save middleware to generate SKU if not provided
productSchema.pre('save', function(next) {
  if (!this.sku) {
    const categoryCode = this.category.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    this.sku = `${categoryCode}-${timestamp}-${random}`;
  }
  next();
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
export default Product;
