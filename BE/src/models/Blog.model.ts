import mongoose, { Document, Schema } from 'mongoose';

export interface IComment {
  _id?: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

export interface IBlog extends Document {
  author: mongoose.Types.ObjectId;
  content: string;
  images: string[];
  tags: string[];
  likes: mongoose.Types.ObjectId[];
  comments: IComment[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const blogSchema = new Schema<IBlog>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      maxlength: [3000, 'Content cannot exceed 3000 characters'],
    },
    images: [
      {
        type: String,
        trim: true,
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    comments: [commentSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

blogSchema.virtual('likeCount').get(function (this: IBlog) {
  return this.likes?.length || 0;
});

blogSchema.virtual('commentCount').get(function (this: IBlog) {
  return this.comments?.length || 0;
});

blogSchema.index({ author: 1 });
blogSchema.index({ createdAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ isActive: 1 });

export const Blog = mongoose.model<IBlog>('Blog', blogSchema);
