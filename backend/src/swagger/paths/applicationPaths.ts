/**
 * Application pipeline & interview paths.
 */
export const applicationPaths = {
  '/applications': {
    get: {
      tags: ['Applications'],
      summary: 'My applications (jobseeker)',
      responses: { '200': { description: 'Paginated applications' } },
    },
  },
  '/applications/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Applications'],
      summary: 'Get an application (applicant or company member)',
      responses: { '200': { description: 'Application' } },
    },
  },
  '/applications/{id}/history': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Applications'],
      summary: 'Status history for an application',
      responses: { '200': { description: 'History entries' } },
    },
  },
  '/applications/{id}/status': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Applications'],
      summary: 'Change application status (employer)',
      responses: { '200': { description: 'New status' } },
    },
  },
  '/applications/{id}/withdraw': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    post: {
      tags: ['Applications'],
      summary: 'Withdraw my application (jobseeker)',
      responses: { '200': { description: 'Withdrawn' } },
    },
  },
  '/interviews': {
    post: {
      tags: ['Interviews'],
      summary: 'Schedule an interview (employer)',
      responses: { '201': { description: 'Interview scheduled' } },
    },
  },
  '/interviews/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Interviews'],
      summary: 'Get an interview',
      responses: { '200': { description: 'Interview' } },
    },
    patch: {
      tags: ['Interviews'],
      summary: 'Update interview details',
      responses: { '200': { description: 'Updated interview' } },
    },
  },
  '/interviews/{id}/status': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Interviews'],
      summary: 'Change interview status',
      responses: { '200': { description: 'New status' } },
    },
  },
};

export default applicationPaths;
