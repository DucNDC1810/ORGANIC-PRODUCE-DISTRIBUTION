import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      
      // Small delay to ensure localStorage is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get user data from localStorage after successful login
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        toast.success('Login successful! Welcome back!');

        // Priority 1: ?redirect= URL param (e.g. from email link via Profile guard)
        const redirectParam = searchParams.get('redirect');
        if (redirectParam && (user.role === 'customer' || !user.role)) {
          navigate(decodeURIComponent(redirectParam), { replace: true });
          return;
        }

        // Priority 2: sessionStorage redirect (e.g. group invite links)
        const pendingRedirect = sessionStorage.getItem('redirectAfterLogin');
        if (pendingRedirect && (user.role === 'customer' || !user.role)) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(pendingRedirect, { replace: true });
          return;
        }

        // Redirect based on user role
        switch (user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'manager':
            navigate('/manager');
            break;
          case 'farmer':
            navigate('/farmer/dashboard');
            break;
          case 'shipper':
            navigate('/shipper/dashboard');
            break;
          case 'customer':
          default:
            navigate('/');
            break;
        }
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const status = error.response?.status;
      const message = error.response?.data?.message;
      
      if (status === 403) {
        // Email not verified or account deactivated
        toast.error(message || 'Please verify your email before logging in.', {
          duration: 5000,
        });
      } else {
        toast.error(message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
                  "Eating organic is not a luxury, it's a necessity for a healthier tomorrow."
                </p>
                <footer className="text-white/90 text-lg">— FreshMarket</footer>
              </blockquote>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
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

        {/* Login Form Container */}
        <div className="relative z-10 w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">FreshMarket</span>
          </div>

          {/* Welcome Text */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-foreground mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">Sign in to your account to continue</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email or Username Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                Email or Username
              </label>
              <input
                id="email"
                name="email"
                type="text"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="block w-full px-4 py-3.5 bg-white border-2 border-primary/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0 transition-all outline-none hover:border-primary/50"
                placeholder="you@example.com or username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-3.5 pr-12 bg-white border-2 border-primary/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0 transition-all outline-none hover:border-primary/50"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-primary/30 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-foreground">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-[#6ee7b7] via-primary to-primary-dark text-white rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative py-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-muted-foreground">Or continue with</span>
              </div>
            </div>

            {/* Social Login Buttons */}
            <div className="flex items-center justify-center gap-6">
              {/* Google */}
              <button
                type="button"
                onClick={() => window.location.href = 'http://localhost:5000/api/auth/google'}
                className="w-16 h-16 bg-white border-2 border-border rounded-full hover:border-primary hover:shadow-lg transition-all flex items-center justify-center group"
                title="Sign in with Google"
              >
                <svg className="w-7 h-7 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
              </button>

              {/* Facebook */}
              <button
                type="button"
                className="w-16 h-16 bg-white border-2 border-border rounded-full hover:border-primary hover:shadow-lg transition-all flex items-center justify-center group opacity-50 cursor-not-allowed"
                title="Sign in with Facebook (Coming soon)"
                disabled
              >
                <svg className="w-7 h-7 group-hover:scale-110 transition-transform" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
            </div>
          </form>

          {/* Sign Up Link */}
          <p className="text-center text-sm text-muted-foreground mt-8">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-semibold hover:text-primary-dark transition-colors">
              Sign up
            </Link>
          </p>

          {/* Back to Home */}
          <div className="text-center mt-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1">
              <span>←</span> Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}