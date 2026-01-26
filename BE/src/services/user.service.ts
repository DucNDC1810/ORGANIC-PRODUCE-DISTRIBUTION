import { User, IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { EmailService } from './email.service';
import { UserRole } from '../constants/roles';

interface AuthResponse {
  user: Partial<IUser>;
  token: string;
}

export class UserService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }
  async getAllUsers(): Promise<IUser[]> {
    return await User.find().select('-password');
  }

  async getUserById(id: string): Promise<IUser> {
    const user = await User.findById(id).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return user;
  }

  async createUser(userData: Partial<IUser>): Promise<IUser> {
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }
    
    const user = await User.create(userData);
    return user;
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      id,
      { $set: userData },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    const user = await User.findByIdAndDelete(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
  }

  // Authentication methods
  async register(userData: { email: string; password: string; name: string; role?: string }): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
      throw new AppError('Email already exists', 400);
    }

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await User.create({
      ...userData,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      isEmailVerified: false
    });

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken, user.name);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't throw error, user is still created
    }

    // Generate token
    const token = this.generateToken(user._id.toString());

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    };
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    // Find user with password
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if user has password (not Google OAuth user)
    if (!user.password) {
      throw new AppError('Please login with Google', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate token
    const token = this.generateToken(user._id.toString());

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email, user.name);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return { message: 'Email verified successfully' };
  }

  async googleLogin(profile: any): Promise<AuthResponse> {
    const { id, emails, displayName } = profile;
    const email = emails[0].value;

    // Find or create user
    let user = await User.findOne({ $or: [{ googleId: id }, { email }] });

    if (!user) {
      // Create new user with Google
      user = await User.create({
        googleId: id,
        email,
        name: displayName,
        isEmailVerified: true, // Google emails are already verified
        role: 'customer'
      });
    } else if (!user.googleId) {
      // Link existing account with Google
      user.googleId = id;
      user.isEmailVerified = true;
      await user.save();
    }

    // Generate token
    const token = this.generateToken(user._id.toString());

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified
      },
      token
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Check if user has password (not Google OAuth user)
    if (!user.password) {
      throw new AppError('This account uses Google login. Please login with Google.', 400);
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetToken, user.name);
    } catch (error) {
      // Rollback token if email fails
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new AppError('Failed to send password reset email. Please try again.', 500);
    }

    return { message: 'If the email exists, a password reset link has been sent' };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    // Update password
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return { message: 'Password has been reset successfully' };
  }

  private generateToken(userId: string): string {
    const jwtSecret = process.env.JWT_SECRET;
    
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined');
    }
    
    const token = jwt.sign(
      { id: userId }, 
      jwtSecret,
      { expiresIn: '15m' } // 15 minutes expiration
    );
    
    return token;
  }
}
