import swaggerUi from 'swagger-ui-express';
import { env } from '../config';

/**
 * Minimal OpenAPI 3 spec for MeroKhoj.
 * Expanded over time; kept inline so there's no build step for docs.
 */
export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MeroKhoj API',
    version: '1.0.0',
    description:
      "MeroKhoj:Find what's yours. API for the MeroKhoj job portal. " +
      '"Khoj" is a function, not a channel: seekers discover jobs, employers discover talent.',
    contact: { name: 'MeroKhoj' },
  },
  servers: [
    { url: `http://localhost:${env.app.port}/api`, description: 'Local' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: { '200': { description: 'Service healthy' } },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        security: [],
        responses: { '201': { description: 'Account created' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and obtain tokens',
        security: [],
        responses: { '200': { description: 'Tokens issued' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a refresh token for a new token pair',
        security: [],
        responses: { '200': { description: 'New tokens issued' } },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Current authenticated user',
        responses: { '200': { description: 'User + roles' } },
      },
    },
    '/jobs': {
      get: {
        tags: ['Jobs'],
        summary: 'Search published jobs',
        security: [],
        responses: { '200': { description: 'Paginated jobs' } },
      },
      post: {
        tags: ['Jobs'],
        summary: 'Create a job (employer)',
        responses: { '201': { description: 'Job created as DRAFT' } },
      },
    },
    '/jobs/{id}': {
      get: {
        tags: ['Jobs'],
        summary: 'Get a job by id',
        security: [],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        responses: { '200': { description: 'Job' } },
      },
    },
    '/applications': {
      get: {
        tags: ['Applications'],
        summary: 'My applications (jobseeker)',
        responses: { '200': { description: 'Paginated applications' } },
      },
    },
  },
  tags: [
    { name: 'System', description: 'Health and metadata' },
    { name: 'Auth', description: 'Registration, login, tokens' },
    { name: 'Jobs', description: 'Job postings and search' },
    { name: 'Applications', description: 'The recruitment pipeline' },
  ],
} as const;

export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: { persistAuthorization: true },
};

export { swaggerUi };
