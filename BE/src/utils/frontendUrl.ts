const DEFAULT_DEV_FRONTEND_URL = 'http://localhost:5173';
const DEFAULT_PROD_FRONTEND_URL = 'https://organic-produce-distribution.vercel.app';

const normalizeBaseUrl = (value: string): string => value.replace(/\/+$/, '');

const getPrimaryOrigin = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .find(Boolean);
};

const shouldIgnoreInProduction = (value: string): boolean => {
  if (process.env.NODE_ENV !== 'production') {
    return false;
  }

  return /localhost|127\.0\.0\.1/i.test(value);
};

export const getFrontendBaseUrl = (): string => {
  const candidates = [
    process.env.FRONTEND_URL,
    process.env.CLIENT_URL,
    process.env.FE_BASE_URL,
    getPrimaryOrigin(process.env.CORS_ORIGIN),
    process.env.NODE_ENV === 'production'
      ? DEFAULT_PROD_FRONTEND_URL
      : DEFAULT_DEV_FRONTEND_URL,
  ];

  const baseUrl = candidates.find((candidate): candidate is string => {
    if (!candidate || !candidate.trim()) {
      return false;
    }

    return !shouldIgnoreInProduction(candidate);
  });

  return normalizeBaseUrl(baseUrl || DEFAULT_DEV_FRONTEND_URL);
};

export const buildFrontendUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getFrontendBaseUrl()}${normalizedPath}`;
};