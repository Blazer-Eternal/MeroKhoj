import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';

import { corsOptions, env } from './config';
import apiRouter from './api/routes';
import { globalLimiter, errorHandler, notFoundHandler } from './middleware';
import { swaggerUi, swaggerSpec } from './swagger/swagger';

/**
 * Express application assembly.
 *
 * Middleware order matters:
 *   helmet → cors → morgan → compression → json/cookies → rate limit → routes
 *   → 404 → errorHandler
 */
export const createApp = (): Application => {
  const app: Application = express();

  // Security & CORS
  // Note: Helmet's default CSP blocks inline styles. We must allow them for the landing page.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "style-src": ["'self'", "'unsafe-inline'"],
        },
      },
    })
  );
  app.use(cors(corsOptions));

  // Request logging (skip in test to keep output clean)
  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.isProduction ? 'combined' : 'dev'));
  }

  // Compression + parsers
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Trust the first proxy hop so rate-limiting sees real client IPs.
  app.set('trust proxy', 1);

  // Global rate limiter
  app.use('/api', globalLimiter);

  // API docs
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  // Health & API Routes
  app.use('/api', apiRouter);

  // Landing Page
  app.get('/', (_req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${env.app.name || 'MeroKhoj'}</title>
        <style>
          *, *::before, *::after { box-sizing: border-box; }

          body {
            margin: 0;
            min-height: 100vh;
            background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
            color: #ffffff;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }

          main {
            max-width: 40rem;
            text-align: center;
            animation: fadeIn 1s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          h1 {
            font-size: clamp(3rem, 8vw, 5rem);
            font-weight: 700;
            letter-spacing: -0.03em;
            margin: 0 0 1rem;
            text-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
          }

          .tagline {
            font-size: clamp(1.25rem, 3vw, 1.5rem);
            font-weight: 400;
            color: #cbd5e1;
            margin: 0 0 1.5rem;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          }

          .description {
            font-size: 1rem;
            line-height: 1.6;
            color: #e2e8f0;
            margin: 0 auto 3rem;
            max-width: 32rem;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
          }

          nav {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
            font-size: 0.95rem;
            font-weight: 500;
          }

          nav a {
            color: #ffffff;
            text-decoration: none;
            padding: 0.5rem 1rem;
            position: relative;
            text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
            transition: color 0.2s ease;
          }

          nav a::after {
            content: '';
            position: absolute;
            width: 100%;
            transform: scaleX(0);
            height: 1px;
            bottom: 0;
            left: 0;
            background-color: #ffffff;
            transform-origin: bottom right;
            transition: transform 0.2s ease-out;
          }

          nav a:hover::after,
          nav a:focus-visible::after {
            transform: scaleX(1);
            transform-origin: bottom left;
          }

          nav a:focus-visible {
            outline: none;
          }

          @media (prefers-reduced-motion: reduce) {
            main { animation: none; }
            nav a::after { transition: none; }
          }
        </style>
      </head>
      <body>
        <main>
          <h1>${env.app.name || 'MeroKhoj'}</h1>
          <p class="tagline">${env.app.tagline || "Find what's yours."}</p>
          <p class="description">
            Search verified openings, build a profile that stands out, and connect with hiring teams across Nepal. 
            Employers can post jobs, filter applicants, and manage the entire hiring process from one dashboard.
          </p>
          <nav>
            <a href="/api/docs">Documentation</a>
            <a href="/api/health">Status</a>
          </nav>
        </main>
      </body>
    </html>
    `);
  });

  // 404 + central error handler (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;


