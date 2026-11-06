/**
 * Application pipeline & interview paths.
 */
export const applicationPaths = {
  '/applications/mine': {
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
  '/applications/{id}/answers': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Applications'],
      summary: 'Read application answers (applicant or company member)',
      responses: { '200': { description: 'Answers' } },
    },
    post: {
      tags: ['Applications'],
      summary: 'Submit screening answers (applicant)',
      description:
        'Upserts per question. Answer format must match the question type; only ' +
        'possible while the application is still active (non-terminal status).',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['answers'],
              properties: {
                answers: {
                  type: 'array',
                  items: {
                    type: 'object',
                    required: ['question_id', 'value'],
                    properties: {
                      question_id: { type: 'string', format: 'uuid' },
                      value: {
                        oneOf: [
                          { type: 'string' },
                          { type: 'number' },
                          { type: 'boolean' },
                          { type: 'array', items: { type: 'string', format: 'uuid' } },
                        ],
                        nullable: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Saved answers' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/applications/{id}/decision': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Hiring'],
      summary: 'Current hiring decision (employer/admin)',
      responses: { '200': { description: 'Decision, or null when none yet' } },
    },
    post: {
      tags: ['Hiring'],
      summary: 'Record the hiring decision (employer/admin)',
      description:
        'Upserts the single current decision AND moves the application status in ' +
        'ONE transaction, appending status history + an audit entry.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['outcome'],
              properties: {
                outcome: {
                  type: 'string',
                  enum: ['HIRED', 'REJECTED', 'ON_HOLD', 'SHORTLISTED'],
                },
                notes: { type: 'string', maxLength: 5000, nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Decision recorded; application status updated' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/interviews': {
    get: {
      tags: ['Interviews'],
      summary: 'Interview feed for the caller (scoped)',
      description:
        'Platform admins see every interview; other users see interviews on ' +
        'their own applications plus interviews on applications to companies ' +
        'they are an ACTIVE member of. Newest `scheduled_at` first. Returns ' +
        '`{ interviews }` with nested application, job and applicant.',
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string' },
          description: 'Filter by interview status',
        },
      ],
      responses: { '200': { description: 'Scoped interviews (may be empty)' } },
    },
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
  '/interviews/{id}/feedback': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Interviews'],
      summary: 'All feedback on an interview (company member)',
      responses: { '200': { description: 'Feedback entries' } },
    },
    post: {
      tags: ['Interviews'],
      summary: 'Submit feedback (company member)',
      description:
        'One row per reviewer per interview — re-submitting upserts the reviewer’s ' +
        'existing row. Scores are integers 1–5.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                communication_score: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
                technical_score: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
                cultural_fit_score: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
                overall_score: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
                strengths: { type: 'string', maxLength: 5000, nullable: true },
                weaknesses: { type: 'string', maxLength: 5000, nullable: true },
                comments: { type: 'string', maxLength: 5000, nullable: true },
                recommendation: { type: 'string', maxLength: 5000, nullable: true },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Feedback saved' } },
    },
  },
  '/interviews/{id}/feedback/mine': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Interviews'],
      summary: 'The caller’s own feedback on an interview',
      responses: { '200': { description: 'Feedback, or null when not written yet' } },
    },
  },
  '/interviews/{id}/feedback/{feedbackId}': {
    parameters: [
      { $ref: '#/components/parameters/UuidId' },
      {
        name: 'feedbackId',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
      },
    ],
    patch: {
      tags: ['Interviews'],
      summary: 'Update feedback (original reviewer only)',
      responses: { '200': { description: 'Updated feedback' } },
    },
    delete: {
      tags: ['Interviews'],
      summary: 'Delete feedback (reviewer or admin)',
      responses: { '200': { description: 'Feedback deleted' } },
    },
  },
};

export default applicationPaths;
