import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { AuthRequest } from '../middlewares/auth.middleware';
import { UserRole } from '../constants/roles';
import { getSecurityConfig, updateSecurityConfig } from '../config/securityConfig';
import { buildFrontendUrl } from '../utils/frontendUrl';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  // Get current authenticated user
  getCurrentUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user?.id) {
        res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
        return;
      }

      const user = await this.userService.getUserById(req.user.id);
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  // Authentication
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, name, username, role } = req.body;
      
      if (!email || !password || !name || !username) {
        res.status(400).json({
          success: false,
          message: 'Please provide email, password, name and username'
        });
        return;
      }

      const result = await this.userService.register({ email, password, name, username, role });
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        res.status(400).json({
          success: false,
          message: 'Please provide email/username and password'
        });
        return;
      }

      const result = await this.userService.login(email, password);
      
      res.status(200).json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Verification token is required'
        });
        return;
      }

      const result = await this.userService.verifyEmail(token);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  resendVerificationEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      const result = await this.userService.resendVerificationEmail(email);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authResult = req.user as any;
      
      if (!authResult) {
        res.redirect(buildFrontendUrl('/login?error=authentication_failed'));
        return;
      }

      // Redirect to frontend with token
      res.redirect(buildFrontendUrl(`/auth/callback?token=${encodeURIComponent(authResult.token)}`));
    } catch (error) {
      next(error);
    }
  };

  // User CRUD
  getAllUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Parse query parameters
      const {
        page,
        limit,
        search,
        role,
        isActive,
        isEmailVerified,
        sortBy,
        sortOrder
      } = req.query;

      const params = {
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        search: search as string,
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        isEmailVerified: isEmailVerified === 'true' ? true : isEmailVerified === 'false' ? false : undefined,
        sortBy: sortBy as string,
        sortOrder: sortOrder as 'asc' | 'desc'
      };

      const result = await this.userService.getAllUsers(params);
      res.status(200).json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getUserById(id);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData = req.body;
      const user = await this.userService.createUser(userData);
      res.status(201).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const userData = req.body;
      const user = await this.userService.updateUser(id, userData);
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      await this.userService.deleteUser(id);
      res.status(200).json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  // ===== ADDITIONAL ACCOUNT MANAGEMENT METHODS =====

  /**
   * Toggle user active status
   */
  toggleUserStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.toggleUserStatus(id);
      res.status(200).json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Activate user account
   */
  activateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.activateUser(id);
      res.status(200).json({
        success: true,
        message: 'User activated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Deactivate user account
   */
  deactivateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.deactivateUser(id);
      res.status(200).json({
        success: true,
        message: 'User deactivated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change user role
   */
  changeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        res.status(400).json({
          success: false,
          message: 'Role is required'
        });
        return;
      }

      const user = await this.userService.changeUserRole(id, role as UserRole);
      res.status(200).json({
        success: true,
        message: 'User role updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk update users status
   */
  bulkUpdateStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userIds, isActive } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'userIds array is required'
        });
        return;
      }

      if (typeof isActive !== 'boolean') {
        res.status(400).json({
          success: false,
          message: 'isActive boolean is required'
        });
        return;
      }

      const result = await this.userService.bulkUpdateStatus(userIds, isActive);
      res.status(200).json({
        success: true,
        message: `${result.modifiedCount} users updated successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk delete users
   */
  bulkDeleteUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        res.status(400).json({
          success: false,
          message: 'userIds array is required'
        });
        return;
      }

      const result = await this.userService.bulkDeleteUsers(userIds);
      res.status(200).json({
        success: true,
        message: `${result.deletedCount} users deleted successfully`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user statistics
   */
  getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userService.getUserStats();
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Request unlock — public endpoint, user sends unlock request to admin
   */
  requestUnlock = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      if (!email) {
        res.status(400).json({ success: false, message: 'Email is required' });
        return;
      }
      await this.userService.requestUnlock(email);
      res.status(200).json({
        success: true,
        message: 'Unlock request sent. Admin will review and unlock your account shortly.'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get locked users (admin only)
   */
  getLockedUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const users = await this.userService.getLockedUsers();
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Unlock a locked user account (admin only)
   */
  unlockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.unlockUser(id);
      res.status(200).json({
        success: true,
        message: 'User account has been unlocked successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get security config (admin only)
   */
  getSecurityConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      res.status(200).json({ success: true, data: getSecurityConfig() });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update security config (admin only)
   */
  updateSecurityConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { maxLoginAttempts } = req.body;
      const updated = updateSecurityConfig({ maxLoginAttempts });
      res.status(200).json({
        success: true,
        message: 'Security configuration updated successfully',
        data: updated
      });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * Search users
   */
  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { keyword, limit } = req.query;

      if (!keyword) {
        res.status(400).json({
          success: false,
          message: 'Search keyword is required'
        });
        return;
      }

      const users = await this.userService.searchUsers(
        keyword as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if email exists
   */
  checkEmailExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.query;

      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Email is required'
        });
        return;
      }

      const exists = await this.userService.checkEmailExists(email as string);
      res.status(200).json({
        success: true,
        data: { exists }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Check if username exists
   */
  checkUsernameExists = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username } = req.query;

      if (!username) {
        res.status(400).json({
          success: false,
          message: 'Username is required'
        });
        return;
      }

      const exists = await this.userService.checkUsernameExists(username as string);
      res.status(200).json({
        success: true,
        data: { exists }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Admin reset user password
   */
  adminResetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          success: false,
          message: 'New password must be at least 6 characters long'
        });
        return;
      }

      const user = await this.userService.adminResetPassword(id, newPassword);
      res.status(200).json({
        success: true,
        message: 'Password reset successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Admin verify user email
   */
  adminVerifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.adminVerifyEmail(id);
      res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  };

  // Password Reset
  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.body;
      
      if (!email) {
        res.status(400).json({
          success: false,
          message: 'Please provide an email address'
        });
        return;
      }

      const result = await this.userService.forgotPassword(email);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { token } = req.query;
      const { password } = req.body;
      
      if (!token || typeof token !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Password reset token is required'
        });
        return;
      }

      if (!password) {
        res.status(400).json({
          success: false,
          message: 'New password is required'
        });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Password must be at least 6 characters long'
        });
        return;
      }

      const result = await this.userService.resetPassword(token, password);
      
      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  };
}
