/**
 * Talent roster paths (company-scoped shortlists).
 */
export const talentPaths = {
  '/companies/{companyId}/rosters': {
    parameters: [{ $ref: '#/components/parameters/CompanyId' }],
    get: {
      tags: ['Talent'],
      summary: 'List rosters for a company',
      responses: { '200': { description: 'Rosters' } },
    },
    post: {
      tags: ['Talent'],
      summary: 'Create a talent roster',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name'],
              properties: {
                name: { type: 'string' },
                description: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Roster created' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/rosters/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Talent'],
      summary: 'Get a roster',
      responses: { '200': { description: 'Roster' } },
    },
    patch: {
      tags: ['Talent'],
      summary: 'Update a roster',
      responses: { '200': { description: 'Updated roster' } },
    },
    delete: {
      tags: ['Talent'],
      summary: 'Delete a roster',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/rosters/{rosterId}/members': {
    parameters: [{ $ref: '#/components/parameters/RosterId' }],
    get: {
      tags: ['Talent'],
      summary: 'List roster members',
      responses: { '200': { description: 'Members' } },
    },
    post: {
      tags: ['Talent'],
      summary: 'Add a jobseeker to the roster',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['jobseeker_id'],
              properties: {
                jobseeker_id: { type: 'string', format: 'uuid' },
                notes: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Member added' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/rosters/{rosterId}/members/{jobseekerId}': {
    parameters: [
      { $ref: '#/components/parameters/RosterId' },
      { name: 'jobseekerId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
    patch: {
      tags: ['Talent'],
      summary: 'Update member notes',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['notes'],
              properties: { notes: { type: 'string', nullable: true } },
            },
          },
        },
      },
      responses: { '200': { description: 'Updated member' } },
    },
    delete: {
      tags: ['Talent'],
      summary: 'Remove a member from the roster',
      responses: { '200': { description: 'Removed' } },
    },
  },
};

export default talentPaths;
