import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Leaf, Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';
import authService from '../../services/authService';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token. Please request a new password reset.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may be invalid or expired.');
    } finally {
      setIsLoading(false);
    }
  };

  // Show error if no token
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Reset Link</h1>
          <p className="text-muted-foreground mb-6">
            This password reset link is invalid. Please request a new one.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary-dark transition-colors"
          >
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image with Glassmorphism Quote */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.unsplash.com/photo-1678831654314-8d68bb47cb0f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmcmVzaCUyMHZlZ2V0YWJsZXMlMjBmcnVpdHMlMjB3b29kZW4lMjB0YWJsZSUyMHRvcCUyMHZpZXd8ZW58MXx8fHwxNzY4NDY3MzEwfDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt="Fresh vegetables and fruits"
          className="w-full h-full object-cover"
        />
        
        {/* Glassmorphism Overlay with Quote */}
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="relative backdrop-blur-xl bg-white/20 border border-white/30 rounded-3xl p-12 shadow-2xl max-w-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl"></div>
            <div className="relative">
              <Leaf className="w-12 h-12 text-white mb-6 mx-auto" />
              <blockquote className="text-center">
                <p className="text-2xl font-semibold text-white leading-relaxed mb-4">
                  "Create a strong password to keep your account secure and continue enjoying fresh organic produce."
                </p>
                <footer className="text-white/90 text-lg">— FreshMarket</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Reset Password Form */}
      <div className="flex-1 lg:w-1/2 relative flex items-center justify-center bg-white px-6 py-12">
        {/* Subtle Leaf Watermark Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-5">
          <div className="absolute top-10 left-10 transform rotate-12">
            <Leaf className="w-32 h-32 text-primary" />
          </div>
          <div className="absolute top-40 right-20 transform -rotate-45">
            <Leaf className="w-24 h-24 text-primary" />
          </div>
          <div className="absolute bottom-20 left-1/4 transform rotate-90">
            <Leaf className="w-28 h-28 text-primary" />
          </div>
          <div className="absolute bottom-40 right-10 transform -rotate-12">
            <Leaf className="w-36 h-36 text-primary" />
          </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-45">
            <Leaf className="w-40 h-40 text-primary" />
          </div>
        </div>

        {/* Reset Password Form Container */}
        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">FreshMarket</span>
          </div>

          {!success ? (
            <>
              {/* Welcome Text */}
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-foreground mb-2">Reset Your Password</h1>
                <p className="text-muted-foreground">
                  Enter your new password below
                </p>
              </div>

              {/* Reset Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* New Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3.5 bg-white border-2 border-primary/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0 transition-all outline-none hover:border-primary/50"
                      placeholder="Enter your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Must be at least 6 characters long
                  </p>
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-11 pr-12 py-3.5 bg-white border-2 border-primary/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0 transition-all outline-none hover:border-primary/50"
                      placeholder="Confirm your new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Reset Password Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#6ee7b7] via-primary to-primary-dark text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? 'Resetting Password...' : 'Reset Password'}
                </button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link
                    to="/login"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center mb-10">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Password Reset Successful!</h1>
                <p className="text-muted-foreground mb-6">
                  Your password has been reset successfully. You can now login with your new password.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirecting to login page in 3 seconds...
                </p>
              </div>
              
              <Link
                to="/login"
                className="block w-full py-4 bg-gradient-to-r from-[#6ee7b7] via-primary to-primary-dark text-white rounded-xl font-semibold text-lg text-center shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
              >
                Go to Login Now
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
