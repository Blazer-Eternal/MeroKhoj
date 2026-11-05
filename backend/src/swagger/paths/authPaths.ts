/**
 * Auth & user account paths.
 */
export const authPaths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Register a new account',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'full_name'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password' },
                full_name: { type: 'string' },
                role: { type: 'string', enum: ['JOBSEEKER', 'RECRUITER', 'COMPANY_ADMIN'] },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Account created' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Authenticate and obtain tokens',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                password: { type: 'string', format: 'password' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Tokens issued' },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
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
  '/auth/logout': {
    post: {
      tags: ['Auth'],
      summary: 'Log out (revoke the current refresh token)',
      responses: { '200': { description: 'Logged out' } },
    },
  },
  '/users/me': {
    get: {
      tags: ['Users'],
      summary: 'Get my account',
      responses: { '200': { description: 'Account' } },
    },
    patch: {
      tags: ['Users'],
      summary: 'Update my account',
      responses: { '200': { description: 'Updated account' } },
    },
  },
  '/users/me/password': {
    patch: {
      tags: ['Users'],
      summary: 'Change my password',
      responses: { '200': { description: 'Password changed' } },
    },
  },
  '/users/me/profile': {
    get: {
      tags: ['Users'],
      summary: 'Get my jobseeker profile',
      responses: { '200': { description: 'Jobseeker profile' } },
    },
    put: {
      tags: ['Users'],
      summary: 'Create or update my jobseeker profile',
      responses: { '200': { description: 'Upserted profile' } },
    },
  },
};

export default authPaths;
