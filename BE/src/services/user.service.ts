import { User, IUser } from '../models/User.model';
import { AppError } from '../utils/AppError';
import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { EmailService } from './email.service';
import { UserRole } from '../constants/roles';
import { getSecurityConfig } from '../config/securityConfig';
import { createNotification } from '../models/Notification.model';

interface AuthResponse {
  user: Partial<IUser>;
  token: string;
}

interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface PaginatedUsersResponse {
  users: IUser[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
    limit: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class UserService {
  private emailService: EmailService;

  constructor() {
    this.emailService = new EmailService();
  }

  // ===== ENHANCED CRUD OPERATIONS =====

  /**
   * Get all users with pagination, search, and filters
   */
  async getAllUsers(params: UserQueryParams = {}): Promise<PaginatedUsersResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      role,
      isActive,
      isEmailVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    // Build query
    const query: any = {};

    // Search by name, email, or username
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    // Filter by role
    if (role) {
      query.role = role;
    }

    // Filter by active status
    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    // Filter by email verification status
    if (typeof isEmailVerified === 'boolean') {
      query.isEmailVerified = isEmailVerified;
    }

    // Calculate pagination
    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    // Execute query
    const [users, totalUsers] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return {
      users,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
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

    const user = await User.create({
      ...userData,
      // Users created from admin management are trusted and can login immediately.
      isEmailVerified: true,
      emailVerificationToken: undefined,
      emailVerificationExpires: undefined
    });
    return user;
  }

  async updateUser(id: string, userData: Partial<IUser>): Promise<IUser> {
    // Check if email is being updated and if it already exists
    if (userData.email) {
      const existingUser = await User.findOne({ 
        email: userData.email,
        _id: { $ne: id } // Exclude current user from check
      });
      if (existingUser) {
        throw new AppError('Email already exists', 400);
      }
    }

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

  // ===== ADDITIONAL ACCOUNT MANAGEMENT METHODS =====

  /**
   * Toggle user active status (activate/deactivate account)
   */
  async toggleUserStatus(id: string): Promise<IUser> {
    const user = await User.findById(id).select('-password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.isActive = !user.isActive;
    await user.save();

    return user;
  }

  /**
   * Activate user account
   */
  async activateUser(id: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: true },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(id: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Change user role
   */
  async changeUserRole(id: string, newRole: UserRole): Promise<IUser> {
    const validRoles = Object.values(UserRole);
    if (!validRoles.includes(newRole)) {
      throw new AppError(`Invalid role. Valid roles are: ${validRoles.join(', ')}`, 400);
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role: newRole },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  /**
   * Bulk update users status
   */
  async bulkUpdateStatus(userIds: string[], isActive: boolean): Promise<{ modifiedCount: number }> {
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { isActive }
    );

    return { modifiedCount: result.modifiedCount };
  }

  /**
   * Request unlock — user submits request, emails sent to admin + confirmation to user
   */
  async requestUnlock(email: string): Promise<void> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal whether email exists
      return;
    }
    if (user.isActive) {
      throw new AppError('This account is not locked.', 400);
    }
    // Send emails (fire-and-forget for user, awaited for admin)
    this.emailService.sendUnlockRequestConfirmation(user.email, user.name).catch(() => {});
    this.emailService.sendUnlockRequestToAdmin(user.name, user.email).catch(() => {});
    // Create admin notification
    createNotification(
      'unlock_request',
      'Yêu cầu mở khóa tài khoản',
      `${user.name} (${user.email}) đang yêu cầu được mở khóa tài khoản.`,
      { link: '?tab=settings', metadata: { userId: user._id, email: user.email } }
    );
  }

  /**
   * Unlock a locked-out user account (admin only)
   */
  async unlockUser(id: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      id,
      { failedLoginAttempts: 0, lockedUntil: null, isActive: true },
      { new: true }
    ).select('-password');
    if (!user) throw new AppError('User not found', 404);
    return user;
  }

  /**
   * Get all locked users (admin only)
   */
  async getLockedUsers(): Promise<IUser[]> {
    return User.find({ isActive: false }).select('-password');
  }

  /**
   * Bulk delete users
   */
  async bulkDeleteUsers(userIds: string[]): Promise<{ deletedCount: number }> {
    const result = await User.deleteMany({ _id: { $in: userIds } });
    return { deletedCount: result.deletedCount };
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    verifiedUsers: number;
    unverifiedUsers: number;
    usersByRole: Record<string, number>;
    newUsersThisMonth: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      activeUsers,
      verifiedUsers,
      newUsersThisMonth,
      roleStats
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isEmailVerified: true }),
      User.countDocuments({ createdAt: { $gte: startOfMonth } }),
      User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ])
    ]);

    const usersByRole: Record<string, number> = {};
    roleStats.forEach((stat: { _id: string; count: number }) => {
      usersByRole[stat._id] = stat.count;
    });

    return {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      usersByRole,
      newUsersThisMonth
    };
  }

  /**
   * Search users by keyword
   */
  async searchUsers(keyword: string, limit: number = 10): Promise<IUser[]> {
    return await User.find({
      $or: [
        { name: { $regex: keyword, $options: 'i' } },
        { email: { $regex: keyword, $options: 'i' } },
        { username: { $regex: keyword, $options: 'i' } }
      ]
    })
      .select('-password')
      .limit(limit);
  }

  /**
   * Check if email exists
   */
  async checkEmailExists(email: string): Promise<boolean> {
    const user = await User.findOne({ email: email.toLowerCase() });
    return !!user;
  }

  /**
   * Check if username exists
   */
  async checkUsernameExists(username: string): Promise<boolean> {
    const user = await User.findOne({ username: username.toLowerCase() });
    return !!user;
  }

  /**
   * Reset user password (Admin action)
   */
  async adminResetPassword(userId: string, newPassword: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.password = newPassword;
    await user.save();

    // Return user without password
    return await User.findById(userId).select('-password') as IUser;
  }

  /**
   * Manually verify user email (Admin action)
   */
  async adminVerifyEmail(userId: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        isEmailVerified: true,
        emailVerificationToken: undefined,
        emailVerificationExpires: undefined
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  // Authentication methods
  async register(userData: { email: string; password: string; name: string; username: string; role?: string }): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await User.findOne({ 
      $or: [{ email: userData.email }, { username: userData.username }] 
    });
    if (existingUser) {
      if (existingUser.email === userData.email) {
        throw new AppError('Email already exists', 400);
      }
      if (existingUser.username === userData.username) {
        throw new AppError('Username already exists', 400);
      }
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
        username: user.username,
        role: user.role,
        phone: user.phone,
        address: user.address,
        street: user.street,
        ward: user.ward,
        district: user.district,
        province: user.province,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  async login(emailOrUsername: string, password: string): Promise<AuthResponse> {
    const { maxLoginAttempts: MAX_ATTEMPTS } = getSecurityConfig();

    // Find user with password by email or username
    const user = await User.findOne({ 
      $or: [{ email: emailOrUsername.toLowerCase() }, { username: emailOrUsername.toLowerCase() }] 
    }).select('+password');
    
    if (!user) {
      throw new AppError('Invalid email/username or password', 401);
    }

    // Check if user has password (not Google OAuth user)
    if (!user.password) {
      throw new AppError('Please login with Google', 401);
    }

    // Check if account is locked/deactivated (must be checked before password attempt)
    if (!user.isActive) {
      throw new AppError(
        'Your account has been locked. Please contact admin to unlock your account.',
        423
      );
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      const newAttempts = (user.failedLoginAttempts || 0) + 1;
      if (newAttempts >= MAX_ATTEMPTS) {
        await User.findByIdAndUpdate(user._id, {
          failedLoginAttempts: newAttempts,
          isActive: false
        });
        // Notify user and admin (fire-and-forget)
        this.emailService.sendAccountLockedToUser(user.email, user.name, newAttempts).catch(() => {});
        this.emailService.sendAccountLockedToAdmin(user.name, user.email, newAttempts).catch(() => {});
        createNotification(
          'account_locked',
          'Tài khoản bị khóa',
          `Tài khoản của ${user.name} (${user.email}) đã bị khóa sau ${newAttempts} lần nhập sai mật khẩu.`,
          { link: '?tab=customers', metadata: { userId: user._id, email: user.email } }
        );
        throw new AppError(
          `Your account has been locked after ${MAX_ATTEMPTS} failed login attempts. Please contact admin to unlock your account.`,
          423
        );
      }
      await User.findByIdAndUpdate(user._id, { failedLoginAttempts: newAttempts });
      throw new AppError(`Invalid email or password. ${MAX_ATTEMPTS - newAttempts} attempt(s) remaining before account lock.`, 401);
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      throw new AppError('Please verify your email before logging in. Check your inbox for the verification link.', 403);
    }

    // Reset failed attempts on successful login
    await User.findByIdAndUpdate(user._id, { failedLoginAttempts: 0, lockedUntil: null });

    // Generate token
    const token = this.generateToken(user._id.toString());

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        phone: user.phone,
        address: user.address,
        street: user.street,
        ward: user.ward,
        district: user.district,
        province: user.province,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    // First, check if user exists with this token (regardless of expiration)
    const userWithToken = await User.findOne({
      emailVerificationToken: token
    });

    if (!userWithToken) {
      // Check if user already verified
      const verifiedUser = await User.findOne({
        isEmailVerified: true,
        emailVerificationToken: { $exists: false }
      });
      
      if (verifiedUser) {
        // User might have already verified
        throw new AppError('This email has already been verified. Please login.', 400);
      }
      
      throw new AppError('Invalid verification token. Please request a new verification email.', 400);
    }

    // Check if token is expired
    if (userWithToken.emailVerificationExpires && userWithToken.emailVerificationExpires < new Date()) {
      throw new AppError('Verification link has expired. Please request a new verification email.', 400);
    }

    // Check if already verified
    if (userWithToken.isEmailVerified) {
      throw new AppError('This email has already been verified. Please login.', 400);
    }

    // Verify the email
    userWithToken.isEmailVerified = true;
    userWithToken.emailVerificationToken = undefined;
    userWithToken.emailVerificationExpires = undefined;
    await userWithToken.save();

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(userWithToken.email, userWithToken.name);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }

    return { message: 'Email verified successfully! You can now login.' };
  }

  async resendVerificationEmail(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return { message: 'If the email exists and is not verified, a verification link has been sent' };
    }

    if (user.isEmailVerified) {
      throw new AppError('Email is already verified. Please login.', 400);
    }

    // Generate new email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    user.emailVerificationToken = verificationToken;
    user.emailVerificationExpires = verificationExpires;
    await user.save();

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationToken, user.name);
    } catch (error) {
      console.error('Failed to send verification email:', error);
      throw new AppError('Failed to send verification email. Please try again.', 500);
    }

    return { message: 'If the email exists and is not verified, a verification link has been sent' };
  }

  async googleLogin(profile: any): Promise<AuthResponse> {
    const { id, emails, displayName } = profile;
    const email = emails?.[0]?.value?.toLowerCase().trim();

    if (!email) {
      throw new AppError('Unable to get email from Google account.', 400);
    }

    const existingGoogleUser = await User.findOne({ googleId: id });
    let user = existingGoogleUser;

    if (!user) {
      const existingEmailUser = await User.findOne({ email });

      if (existingEmailUser) {
        throw new AppError(
          'This Google account or email is already registered. Please use a different Google account or login with your existing account.',
          409
        );
      }

      // Generate username from email or displayName
      let username = email.split('@')[0].toLowerCase();
      // Check if username exists and add random suffix if needed
      let usernameExists = await User.findOne({ username });
      if (usernameExists) {
        username = `${username}${Math.floor(Math.random() * 10000)}`;
      }
      
      // Create new user with Google
      user = await User.create({
        googleId: id,
        email,
        name: displayName,
        username,
        isEmailVerified: true, // Google emails are already verified
        role: 'customer'
      });
    }

    // Generate token
    const token = this.generateToken(user._id.toString());

    return {
      user: {
        _id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
        role: user.role,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      token
    };
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      // Don't reveal that the user doesn't exist for security reasons
      return { message: 'If the email exists, a password reset link has been sent' };
    }

    // Check if user registered with Google OAuth only (has googleId but no password)
    // Users who registered normally will have a password
    // Users who linked their account with Google after registering will have both googleId and password
    if (user.googleId && !user.password) {
      throw new AppError('This account uses Google login. Please login with Google.', 400);
    }

    // If user doesn't have password (edge case), they need to register properly
    if (!user.password) {
      throw new AppError('This account does not have a password set. Please contact support.', 400);
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
    
    const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as string;
    const options: SignOptions = { expiresIn: expiresIn as any };
    
    const token = jwt.sign(
      { id: userId }, 
      jwtSecret,
      options // Use environment variable or default to 7 days
    );
    
    return token;
  }
}
