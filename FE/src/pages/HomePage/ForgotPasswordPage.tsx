import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import authService from '../../services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authService.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
                  "Don't worry! We'll help you get back to enjoying fresh, organic produce in no time."
                </p>
                <footer className="text-white/90 text-lg">— FreshMarket</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Forgot Password Form */}
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

        {/* Forgot Password Form Container */}
        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">FreshMarket</span>
          </div>

          {!isSubmitted ? (
            <>
              {/* Welcome Text */}
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-foreground mb-2">Forgot Password?</h1>
                <p className="text-muted-foreground">
                  No worries! Enter your email and we'll send you reset instructions.
                </p>
              </div>

              {/* Forgot Password Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3.5 bg-white border-2 border-primary/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0 transition-all outline-none hover:border-primary/50"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                {/* Reset Password Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-[#6ee7b7] via-primary to-primary-dark text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Instructions'}
                </button>

                {/* Back to Login */}
                <div className="text-center">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </form>

              {/* Additional Info */}
              <div className="mt-10 p-4 bg-primary/5 border border-primary/20 rounded-xl">
                <p className="text-sm text-foreground text-center">
                  <strong>Note:</strong> If you don't receive an email within 5 minutes, please check your spam folder or{' '}
                  <a href="#" className="text-primary hover:text-primary-dark font-medium transition-colors">
                    contact support
                  </a>
                  .
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="text-center mb-10">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Check Your Email</h1>
                <p className="text-muted-foreground">
                  We've sent password reset instructions to
                </p>
                <p className="text-foreground font-semibold mt-2">{email}</p>
              </div>

              {/* Instructions */}
              <div className="space-y-6">
                <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl">
                  <h3 className="font-semibold text-foreground mb-3">What's next?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Check your inbox for an email from FreshMarket</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Click the reset password link in the email</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Create a new password for your account</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary mt-0.5">•</span>
                      <span>Sign in with your new password</span>
                    </li>
                  </ul>
                </div>

                {/* Didn't receive email */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-3">
                    Didn't receive the email?
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary hover:text-primary-dark font-semibold text-sm transition-colors"
                  >
                    Try another email address
                  </button>
                </div>

                {/* Back to Login */}
                <div className="text-center pt-4">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </div>
            </>
          )}

          {/* Back to Home */}
          <div className="text-center mt-8">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
              <span>←</span> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
