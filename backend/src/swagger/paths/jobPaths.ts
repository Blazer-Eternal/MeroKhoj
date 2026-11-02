/**
 * Job posting & search paths.
 */
export const jobPaths = {
  '/jobs': {
    get: {
      tags: ['Jobs'],
      summary: 'Search published jobs',
      security: [],
      parameters: [
        { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Keyword' },
        { name: 'category_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'industry_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'location_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'employment_type', in: 'query', schema: { type: 'string' } },
        { name: 'experience_level', in: 'query', schema: { type: 'string' } },
        { name: 'salary_min', in: 'query', schema: { type: 'number' } },
        { name: 'salary_max', in: 'query', schema: { type: 'number' } },
        { $ref: '#/components/parameters/Page' },
        { $ref: '#/components/parameters/PerPage' },
      ],
      responses: {
        '200': { description: 'Paginated jobs' },
      },
    },
    post: {
      tags: ['Jobs'],
      summary: 'Create a job (employer)',
      responses: { '201': { description: 'Job created as DRAFT' } },
    },
  },
  '/jobs/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Jobs'],
      summary: 'Get a job by id',
      security: [],
      responses: { '200': { description: 'Job' } },
    },
    patch: {
      tags: ['Jobs'],
      summary: 'Update a job (employer)',
      responses: { '200': { description: 'Updated job' } },
    },
    delete: {
      tags: ['Jobs'],
      summary: 'Delete a job (employer)',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/jobs/{id}/status': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Jobs'],
      summary: 'Change job status (publish/pause/close…)',
      responses: { '200': { description: 'New status' } },
    },
  },
  '/jobs/{id}/skills': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Jobs'],
      summary: 'List required skills for a job',
      security: [],
      responses: { '200': { description: 'Skills' } },
    },
    put: {
      tags: ['Jobs'],
      summary: 'Replace the job skill set (employer)',
      responses: { '200': { description: 'Skills set' } },
    },
  },
  '/jobs/{jobId}/applications': {
    parameters: [{ $ref: '#/components/parameters/JobId' }],
    post: {
      tags: ['Jobs'],
      summary: 'Apply to a job (jobseeker)',
      responses: {
        '201': { description: 'Application created' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/jobs/{jobId}/questions': {
    parameters: [{ $ref: '#/components/parameters/JobId' }],
    get: {
      tags: ['Questions'],
      summary: 'List screening questions with options',
      description:
        'Public for PUBLISHED jobs (jobseekers previewing the form); other statuses ' +
        'require company management rights.',
      security: [],
      responses: { '200': { description: 'Questions (each with its options)' } },
    },
    post: {
      tags: ['Questions'],
      summary: 'Create a screening question (employer)',
      responses: {
        '201': { description: 'Question created' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/questions/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Questions'],
      summary: 'Update a question (employer)',
      description: 'Rejected once the job has applications, so submitted answers stay coherent.',
      responses: {
        '200': { description: 'Updated question' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
    delete: {
      tags: ['Questions'],
      summary: 'Delete a question (employer)',
      description: 'Rejected once the job has applications.',
      responses: {
        '200': { description: 'Question deleted' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/questions/{id}/options': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Questions'],
      summary: 'List a question’s options (employer)',
      responses: { '200': { description: 'Options' } },
    },
    put: {
      tags: ['Questions'],
      summary: 'Replace a question’s option set (employer)',
      description:
        'Choice questions must keep at least one option; TEXT/NUMBER/DATE/BOOLEAN ' +
        'questions must end with none.',
      responses: {
        '200': { description: 'Options replaced' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/skills': {
    get: {
      tags: ['Skills'],
      summary: 'List skills',
      security: [],
      responses: { '200': { description: 'Skills' } },
    },
    post: {
      tags: ['Skills'],
      summary: 'Create a skill (admin)',
      responses: { '201': { description: 'Skill created' } },
    },
  },
  '/skills/search': {
    get: {
      tags: ['Skills'],
      summary: 'Search skills by name',
      security: [],
      responses: { '200': { description: 'Matching skills' } },
    },
  },
};

export default jobPaths;
