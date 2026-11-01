import swaggerUi from 'swagger-ui-express';
import { env } from '../config';

import { securitySchemes, parameters, schemas, responses } from './components';
import authPaths from './paths/authPaths';
import jobPaths from './paths/jobPaths';
import companyPaths from './paths/companyPaths';
import applicationPaths from './paths/applicationPaths';
import profilePaths from './paths/profilePaths';
import taxonomyPaths from './paths/taxonomyPaths';
import moderationPaths from './paths/moderationPaths';
import jobseekerPaths from './paths/jobseekerPaths';
import talentPaths from './paths/talentPaths';

/**
 * OpenAPI 3 spec for MeroKhoj, assembled from per-domain path modules.
 * Kept in code (no build step) so docs ship with the API.
 */
export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'MeroKhoj API',
    version: '1.1.0',
    description:
      "MeroKhoj: Find what's yours. API for the MeroKhoj job portal. " +
      '"Khoj" is a function, not a channel: seekers discover jobs, employers discover talent.\n\n' +
      'All endpoints return `{ success, data }` on success and ' +
      '`{ success: false, error: { code, message } }` on failure.',
    contact: { name: 'MeroKhoj' },
  },
  servers: [{ url: `http://localhost:${env.app.port}/api`, description: 'Local' }],
  components: {
    securitySchemes,
    parameters,
    schemas,
    responses,
  },
  security: [{ bearerAuth: [] }],
  paths: {
    ...authPaths,
    ...jobPaths,
    ...companyPaths,
    ...applicationPaths,
    ...profilePaths,
    ...taxonomyPaths,
    ...moderationPaths,
    ...jobseekerPaths,
    ...talentPaths,
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: { '200': { description: 'Service healthy' } },
      },
    },
  },
  tags: [
    { name: 'System', description: 'Health and metadata' },
    { name: 'Auth', description: 'Registration, login, tokens' },
    { name: 'Users', description: 'Account and jobseeker profile' },
    { name: 'Jobs', description: 'Job postings and search' },
    { name: 'Skills', description: 'Skill catalog' },
    { name: 'Companies', description: 'Company profiles and members' },
    { name: 'Applications', description: 'The recruitment pipeline' },
    { name: 'Interviews', description: 'Interview scheduling' },
    { name: 'Profile', description: 'Educations, experience, resumes' },
    { name: 'Taxonomy', description: 'Categories, industries, locations' },
    { name: 'Verification', description: 'Company verification workflow' },
    { name: 'Moderation', description: 'Job moderation (admin)' },
    { name: 'Reports', description: 'User/company/job reports' },
    { name: 'Audit', description: 'Immutable audit trail (admin)' },
    { name: 'Saved Jobs', description: 'Jobseeker bookmarks' },
    { name: 'Job Alerts', description: 'Saved searches with dispatch' },
    { name: 'Notifications', description: 'In-app inbox' },
    { name: 'Talent', description: 'Company talent rosters' },
  ],
} as const;

export const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: { persistAuthorization: true },
};

export { swaggerUi };
