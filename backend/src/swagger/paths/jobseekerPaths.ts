/**
 * Jobseeker engagement paths:
 * saved jobs, job alerts, notifications.
 */
export const jobseekerPaths = {
  '/saved-jobs': {
    get: {
      tags: ['Saved Jobs'],
      summary: 'List my saved jobs',
      responses: { '200': { description: 'Saved jobs (newest first)' } },
    },
    post: {
      tags: ['Saved Jobs'],
      summary: 'Save a published job',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['job_id'],
              properties: { job_id: { type: 'string', format: 'uuid' } },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Job saved' },
        '400': { $ref: '#/components/responses/BadRequest' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/saved-jobs/{jobId}': {
    parameters: [{ $ref: '#/components/parameters/JobId' }],
    delete: {
      tags: ['Saved Jobs'],
      summary: 'Remove a job from my saved jobs',
      responses: { '200': { description: 'Removed' } },
    },
  },
  '/saved-jobs/{jobId}/status': {
    parameters: [{ $ref: '#/components/parameters/JobId' }],
    get: {
      tags: ['Saved Jobs'],
      summary: 'Whether I have saved a job',
      responses: { '200': { description: '{ saved: boolean }' } },
    },
  },
  '/job-alerts': {
    get: {
      tags: ['Job Alerts'],
      summary: 'List my job alerts',
      responses: { '200': { description: 'Job alerts' } },
    },
    post: {
      tags: ['Job Alerts'],
      summary: 'Create a job alert (saved search)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                keywords: { type: 'string', nullable: true },
                category_id: { type: 'string', format: 'uuid', nullable: true },
                location_id: { type: 'string', format: 'uuid', nullable: true },
                employment_type: { type: 'string', nullable: true },
                is_active: { type: 'boolean', default: true },
                frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'INSTANT'] },
              },
            },
          },
        },
      },
      responses: { '201': { description: 'Alert created' } },
    },
  },
  '/job-alerts/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Job Alerts'],
      summary: 'Get a job alert',
      responses: { '200': { description: 'Job alert' } },
    },
    patch: {
      tags: ['Job Alerts'],
      summary: 'Update a job alert',
      responses: { '200': { description: 'Updated alert' } },
    },
    delete: {
      tags: ['Job Alerts'],
      summary: 'Delete a job alert',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/job-alerts/{id}/test': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    post: {
      tags: ['Job Alerts'],
      summary: 'Preview current matches for an alert (no notification sent)',
      responses: { '200': { description: 'Matching jobs' } },
    },
  },
  '/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'My notifications',
      parameters: [
        {
          name: 'unread_only',
          in: 'query',
          schema: { type: 'string', enum: ['true', 'false'] },
        },
      ],
      responses: { '200': { description: 'Notifications (newest first)' } },
    },
  },
  '/notifications/unread-count': {
    get: {
      tags: ['Notifications'],
      summary: 'Unread notification count',
      responses: { '200': { description: '{ unread_count: number }' } },
    },
  },
  '/notifications/read-all': {
    patch: {
      tags: ['Notifications'],
      summary: 'Mark all notifications as read',
      responses: { '200': { description: '{ updated: number }' } },
    },
  },
  '/notifications/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    delete: {
      tags: ['Notifications'],
      summary: 'Delete a notification',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/notifications/{id}/read': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Notifications'],
      summary: 'Mark a notification as read',
      responses: { '200': { description: 'Marked read' } },
    },
  },
};

export default jobseekerPaths;
