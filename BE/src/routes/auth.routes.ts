import { Router } from 'express';
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

router.get('/google/callback', 
  passport.authenticate('google', { 
    session: false,
    failureRedirect: '/login' 
  }),
  userController.googleCallback
);

export default router;
