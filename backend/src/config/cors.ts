import cors, { CorsOptions } from 'cors';
import { env } from './env';

/**
 * CORS allow-list policy.
 *
 * In production only origins explicitly listed in ALLOWED_ORIGINS are
 * permitted. In development we fall back to a permissive localhost set so
 * the frontend can be iterated on without editing env vars on every run.
 */
const devOrigins = ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000'];

const getAllowedOrigins = (): string[] => {
  if (!env.isProduction) {
    // Union of configured origins + common dev servers.
    return Array.from(new Set([...env.cors.allowedOrigins, ...devOrigins]));
  }
  return env.cors.allowedOrigins;
};

export const corsOptions: CorsOptions = {
  origin(origin, callback) {
    // Allow non-browser clients (curl, server-to-server) with no Origin header.
    if (!origin) return callback(null, true);

    const allowed = getAllowedOrigins();
    if (allowed.includes(origin) || allowed.includes('*')) {
      return callback(null, true);
    }

    // In dev, permit any localhost port to avoid friction.
    if (!env.isProduction && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true, // allow cookies / Authorization header
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page', 'X-Total-Pages'],
  maxAge: 600, // preflight cache: 10 minutes
};

export const corsMiddleware = cors(corsOptions);

export const reportCorsAllowList = (): string[] => getAllowedOrigins();