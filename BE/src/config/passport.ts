import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { UserService } from '../services/user.service';
import { UserRole } from '../constants/roles';

const userService = new UserService();

export const configurePassport = () => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const callbackURL = process.env.CALLBACK_URL || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

  if (!googleClientId || !googleClientSecret) {
    console.warn('⚠️  Google OAuth not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env');
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: googleClientId,
        clientSecret: googleClientSecret,
        callbackURL: callbackURL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const result = await userService.googleLogin(profile);
          const roleMap: { [key: string]: UserRole } = {
            'admin': UserRole.ADMIN,
            'manager': UserRole.MANAGER,
            'customer': UserRole.CUSTOMER,
            'user': UserRole.USER,
            'shipper': UserRole.SHIPPER,
            'farmer': UserRole.FARMER,
          };
          const user = {
            id: result.user._id?.toString() || '',
            token: result.token,
            role: roleMap[result.user.role as string] || UserRole.CUSTOMER,
            email: result.user.email || '',
            isEmailVerified: result.user.isEmailVerified || false,
          };
          done(null, user);
        } catch (error) {
          done(error as Error, undefined);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user);
  });

  passport.deserializeUser((user: any, done) => {
    done(null, user);
  });
};
