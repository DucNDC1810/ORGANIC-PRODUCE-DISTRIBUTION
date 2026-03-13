import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Leaf, Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');
    const redirectParam = searchParams.get('redirect');
    const storedRedirect = sessionStorage.getItem('redirectAfterLogin');
    const redirectTarget =
      (redirectParam ? decodeURIComponent(redirectParam) : null) ||
      storedRedirect ||
      '/';

    if (error) {
      toast.error('Google authentication failed. Please try again.');
      setStatus('error');
      setTimeout(() => navigate('/login'), 2000);
      return;
    }

    if (token) {
      // Save token to localStorage
      localStorage.setItem('token', token);
      
      // Fetch user details using the token
      fetch('http://localhost:5000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            // Save user to localStorage
            localStorage.setItem('user', JSON.stringify(data.data));
            setStatus('success');
            toast.success('Successfully logged in with Google!');
            if (storedRedirect) {
              sessionStorage.removeItem('redirectAfterLogin');
            }
            
            // Reload page to update AuthContext, then land on intended page
            setTimeout(() => {
              window.location.href = redirectTarget;
            }, 1000);
          } else {
            throw new Error('Failed to fetch user data');
          }
        })
        .catch((err) => {
          console.error('Error fetching user:', err);
          toast.error('Failed to complete login');
          setStatus('error');
          setTimeout(() => navigate('/login'), 2000);
        });
    } else {
      toast.error('No authentication token received');
      setStatus('error');
      setTimeout(() => navigate('/login'), 2000);
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-white">
      <div className="text-center max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-9 h-9 text-white" />
          </div>
          <span className="text-3xl font-bold text-foreground">FreshMarket</span>
        </div>

        {/* Status Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          {status === 'error' && (
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        {/* Message */}
        <div>
          {status === 'loading' && (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Completing Google Sign-In</h2>
              <p className="text-muted-foreground">Please wait while we set up your account...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <h2 className="text-2xl font-bold text-green-600 mb-2">Success!</h2>
              <p className="text-muted-foreground">Redirecting you to your previous page...</p>
            </>
          )}
          {status === 'error' && (
            <>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Authentication Failed</h2>
              <p className="text-muted-foreground">Redirecting back to login...</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
