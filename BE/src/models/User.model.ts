import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'customer' | 'farmer';
  phone?: string;
  address?: string;
  googleId?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: false,
      minlength: 6,
      select: false
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ['admin', 'customer', 'farmer'],
      default: 'customer'
    },
    phone: String,
    address: String,
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    emailVerificationToken: String,
    emailVerificationExpires: Date
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Skip if password is not modified or doesn't exist (Google OAuth users)
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
