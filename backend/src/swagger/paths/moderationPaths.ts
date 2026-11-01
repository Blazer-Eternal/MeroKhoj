/**
 * Moderation & administration paths:
 * job moderation, reports, audit logs.
 */
export const moderationPaths = {
  '/admin/moderation/jobs/{jobId}': {
    parameters: [{ $ref: '#/components/parameters/JobId' }],
    post: {
      tags: ['Moderation'],
      summary: 'Moderate a job (admin)',
      description:
        'Records an append-only moderation entry and updates the job status ' +
        'in the same transaction (APPROVED→PUBLISHED, REJECTED→CANCELLED, ' +
        'FLAGGED→PAUSED, REMOVED→CLOSED). A reason is required for REJECTED/REMOVED.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['action'],
              properties: {
                action: { type: 'string', enum: ['APPROVED', 'REJECTED', 'FLAGGED', 'REMOVED'] },
                reason: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Moderation applied; job status updated' },
        '400': { $ref: '#/components/responses/BadRequest' },
      },
    },
  },
  '/admin/moderation/jobs/{jobId}/history': {
    parameters: [{ $ref: '#/components/parameters/JobId' }],
    get: {
      tags: ['Moderation'],
      summary: 'Moderation history for a job (admin)',
      responses: { '200': { description: 'History entries (newest first)' } },
    },
  },
  '/jobs/{jobId}/moderation/latest': {
    parameters: [{ $ref: '#/components/parameters/JobId' }],
    get: {
      tags: ['Moderation'],
      summary: 'Latest moderation decision for a job',
      responses: { '200': { description: 'Moderation or null' } },
    },
  },
  '/reports': {
    post: {
      tags: ['Reports'],
      summary: 'File a report against a user, company or job',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['entity_type', 'entity_id', 'reason'],
              properties: {
                entity_type: { type: 'string', enum: ['USER', 'COMPANY', 'JOB'] },
                entity_id: { type: 'string', format: 'uuid' },
                reason: { type: 'string', minLength: 3, maxLength: 150 },
                description: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Report filed' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
    get: {
      tags: ['Reports'],
      summary: 'List reports (admin)',
      parameters: [
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] },
        },
      ],
      responses: { '200': { description: 'Reports (newest first)' } },
    },
  },
  '/reports/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Reports'],
      summary: 'Get a report (admin or reporter)',
      responses: { '200': { description: 'Report' } },
    },
  },
  '/reports/{id}/status': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Reports'],
      summary: 'Transition a report status (admin)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['RESOLVED', 'DISMISSED'] },
                reason: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Status updated' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/audit-logs': {
    get: {
      tags: ['Audit'],
      summary: 'Query the audit trail (admin)',
      parameters: [
        { name: 'user_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'action', in: 'query', schema: { type: 'string' } },
        { name: 'entity_type', in: 'query', schema: { type: 'string' } },
        { name: 'entity_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
      ],
      responses: { '200': { description: 'Audit entries (newest first)' } },
    },
  },
  '/audit-logs/entity/{entityType}/{entityId}': {
    parameters: [
      { name: 'entityType', in: 'path', required: true, schema: { type: 'string' } },
      { name: 'entityId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
    get: {
      tags: ['Audit'],
      summary: 'Audit entries for a specific entity (admin)',
      responses: { '200': { description: 'Audit entries' } },
    },
  },
};

export default moderationPaths;
