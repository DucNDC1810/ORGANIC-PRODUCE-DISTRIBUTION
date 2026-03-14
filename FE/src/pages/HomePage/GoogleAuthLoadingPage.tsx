import { useEffect, useState } from 'react';
import { Loader2, Leaf } from 'lucide-react';

const DEFAULT_API_BASE = 'https://organic-produce-be.onrender.com/api';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function GoogleAuthLoadingPage() {
  const [attempt, setAttempt] = useState(0);
  const [message, setMessage] = useState('Preparing secure Google sign-in...');

  useEffect(() => {
    let isCancelled = false;

    const apiBaseUrl = (import.meta.env.VITE_API_URL || DEFAULT_API_BASE).replace(/\/+$/, '');
    const healthUrl = `${apiBaseUrl}/health`;
    const googleAuthUrl = `${apiBaseUrl}/auth/google`;

    const wakeBackend = async () => {
      // Render free tier may sleep. Warm up first to avoid the cold-start splash screen.
      for (let i = 1; i <= 7; i += 1) {
        if (isCancelled) return;
        setAttempt(i);

        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 4000);

          const response = await fetch(`${healthUrl}?_t=${Date.now()}`, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeout);

          if (response.ok) {
            return;
          }
        } catch {
          // Ignore transient errors while backend starts.
        }

        await sleep(1200);
      }
    };

    const startAuth = async () => {
      setMessage('Waking up server...');
      await wakeBackend();

      if (isCancelled) return;

      setMessage('Redirecting to Google...');
      await sleep(300);
      window.location.assign(googleAuthUrl);
    };

    startAuth();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-white">
      <div className="w-full max-w-md mx-auto px-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <span className="text-2xl font-bold text-foreground">FreshMarket</span>
        </div>

        <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-primary/10 flex items-center justify-center">
          <Loader2 className="w-9 h-9 text-primary animate-spin" />
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Google Sign-In</h1>
        <p className="text-muted-foreground mb-2">{message}</p>
        <p className="text-xs text-muted-foreground/80">Attempt {attempt}/7</p>
      </div>
    </div>
  );
}