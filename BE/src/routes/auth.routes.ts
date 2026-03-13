import { Router, Request, Response, NextFunction } from 'express';
import { UserController } from '../controllers/user.controller';
import passport from 'passport';

const router = Router();
const userController = new UserController();

// Authentication routes
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/verify-email', userController.verifyEmail);
router.post('/resend-verification-email', userController.resendVerificationEmail);

// Password Reset routes
router.post('/forgot-password', userController.forgotPassword);
router.post('/reset-password', userController.resetPassword);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  session: false 
}));

router.get(
  '/google/callback',
  (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate('google', { session: false }, (err: any, user: any) => {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

      if (err) {
        const errorCode = err.statusCode === 409 ? 'google_account_exists' : 'authentication_failed';
        const message = encodeURIComponent(err.message || 'Google authentication failed');
        res.redirect(`${frontendUrl}/login?error=${errorCode}&message=${message}`);
        return;
      }

      if (!user) {
        res.redirect(`${frontendUrl}/login?error=authentication_failed`);
        return;
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  userController.googleCallback
);

export default router;
