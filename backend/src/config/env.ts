import dotenv from 'dotenv';

// Load `.env.local` first so local credentials win, then fall back to `.env`.
// dotenv does not overwrite variables that are already set.
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

/**
 * Typed, validated access to process.env.
 * Reading env vars through this single module keeps configuration
 * centralized and fails fast when something required is missing.
 */

/** Return the first non-empty value among the given keys. */
const firstOf = (...keys: string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined && value !== '') return value;
  }
  return undefined;
};

const isProduction = () => (process.env.ENVIRONMENT ?? process.env.NODE_ENV) === 'production';
const isTest = () => (process.env.ENVIRONMENT ?? process.env.NODE_ENV) === 'test';

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string): string => process.env[key] || fallback;

const optionalInt = (key: string, fallback: number): number => {
  const parsed = parseInt(process.env[key] ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const optionalBool = (key: string, fallback: boolean): boolean => {
  const value = process.env[key];
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};

const csv = (key: string, fallback: string[]): string[] => {
  const value = process.env[key];
  if (!value) return fallback;
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
};

export const env = {
  nodeEnv: process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
  get isProduction() {
    return isProduction();
  },
  get isTest() {
    return isTest();
  },

  app: {
    name: 'MeroKhoj',
    tagline: "Find what's yours",
    port: optionalInt('PORT', 5000),
    apiVersion: optional('API_VERSION', 'v1'),
  },

  db: {
    host: required('DB_HOST', 'localhost'),
    port: optionalInt('DB_PORT', 5432),
    name: required('DB_NAME', 'merokhoj'),
    user: required('DB_USER', 'postgres'),
    password: required('DB_PASSWORD', 'postgres'),
    logging: optionalBool('DB_LOGGING', false),
    ssl: optionalBool('DB_SSL', false),
  },

  jwt: {
    // JWT_ACCESS_SECRET / JWT_REFRESH_SECRET, falling back to a shared JWT_SECRET_KEY.
    accessSecret: firstOf('JWT_ACCESS_SECRET', 'JWT_SECRET_KEY') ?? 'dev-access-secret',
    refreshSecret: firstOf('JWT_REFRESH_SECRET', 'JWT_SECRET_KEY') ?? 'dev-refresh-secret',
    accessExpires: optional('JWT_ACCESS_EXPIRES', '15m'),
    refreshExpires: optional('JWT_REFRESH_EXPIRES', '30d'),
  },

  cors: {
    clientUrl: optional('CLIENT_URL', 'http://localhost:3000'),
    allowedOrigins: csv('ALLOWED_ORIGINS', ['http://localhost:3000', 'http://localhost:5173']),
  },

  security: {
    bcryptSaltRounds: optionalInt('BCRYPT_SALT_ROUNDS', 10),
  },

  rateLimit: {
    windowMs: optionalInt('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
    max: optionalInt('RATE_LIMIT_MAX', 300),
  },

  smtp: {
    host: optional('SMTP_HOST', ''),
    port: optionalInt('SMTP_PORT', 587),
    secure: optionalBool('SMTP_SECURE', false),
    user: optional('SMTP_USER', ''),
    password: optional('SMTP_PASSWORD', ''),
    from: optional('SMTP_FROM', 'MeroKhoj <noreply@merokhoj.com>'),
  },

  upload: {
    dir: optional('UPLOAD_DIR', 'uploads'),
    maxFileSizeMb: optionalInt('MAX_FILE_SIZE_MB', 5),
  },

  pagination: {
    defaultPageSize: optionalInt('DEFAULT_PAGE_SIZE', 20),
    maxPageSize: optionalInt('MAX_PAGE_SIZE', 100),
  },
} as const;

export type Env = typeof env;