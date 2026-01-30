import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { CheckCircle, XCircle, Leaf, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    // Verify the email using direct axios (not the interceptor that modifies response)
    axios
      .get(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/verify-email?token=${token}`)
      .then((response) => {
        // Check if verification was successful
        if (response.data && response.data.success) {
          setStatus('success');
          setMessage(response.data.message || 'Email verified successfully!');
          
          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage(response.data?.message || 'Email verification failed.');
        }
      })
      .catch((error) => {
        setStatus('error');
        setMessage(
          error.response?.data?.message || 'Email verification failed. The link may have expired.'
        );
      });
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-white px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-md">
            <Leaf className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">FreshMarket</span>
        </div>

        {/* Status Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-pulse" />
          )}
          {status === 'error' && (
            <XCircle className="w-16 h-16 text-red-500 mx-auto" />
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-foreground mb-3">
          {status === 'loading' && 'Verifying Your Email'}
          {status === 'success' && 'Email Verified!'}
          {status === 'error' && 'Verification Failed'}
        </h1>

        {/* Message */}
        <p className="text-muted-foreground mb-8">{message}</p>

        {/* Actions */}
        <div className="space-y-3">
          {status === 'success' && (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Redirecting to login page in a few seconds...
              </p>
              <Link
                to="/login"
                className="block w-full py-3 bg-gradient-to-r from-[#6ee7b7] via-primary to-primary-dark text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Go to Login
              </Link>
            </>
          )}
          {status === 'error' && (
            <>
              <Link
                to="/signup"
                className="block w-full py-3 bg-gradient-to-r from-[#6ee7b7] via-primary to-primary-dark text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Sign Up Again
              </Link>
              <Link
                to="/login"
                className="block w-full py-3 bg-white border-2 border-primary text-primary rounded-xl font-semibold hover:bg-primary/5 transition-all"
              >
                Back to Login
              </Link>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="mt-6">
          <Link
            to="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
          >
            <span>←</span> Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
