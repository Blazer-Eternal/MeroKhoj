/**
 * Company, membership, and verification paths.
 */
export const companyPaths = {
  '/companies': {
    post: {
      tags: ['Companies'],
      summary: 'Create a company (employer)',
      responses: { '201': { description: 'Company created' } },
    },
  },
  '/companies/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Companies'],
      summary: 'Get a company',
      responses: { '200': { description: 'Company' } },
    },
    patch: {
      tags: ['Companies'],
      summary: 'Update a company',
      responses: { '200': { description: 'Updated company' } },
    },
  },
  '/companies/{companyId}/members': {
    parameters: [{ $ref: '#/components/parameters/CompanyId' }],
    get: {
      tags: ['Companies'],
      summary: 'List company members',
      responses: { '200': { description: 'Members' } },
    },
    post: {
      tags: ['Companies'],
      summary: 'Add a company member',
      responses: { '201': { description: 'Member added' } },
    },
  },
  '/companies/{companyId}/members/{memberId}': {
    parameters: [
      { $ref: '#/components/parameters/CompanyId' },
      { name: 'memberId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
    ],
    patch: {
      tags: ['Companies'],
      summary: 'Update a member role/status',
      responses: { '200': { description: 'Updated member' } },
    },
    delete: {
      tags: ['Companies'],
      summary: 'Remove a member',
      responses: { '200': { description: 'Removed' } },
    },
  },
  '/companies/{companyId}/jobs': {
    parameters: [{ $ref: '#/components/parameters/CompanyId' }],
    get: {
      tags: ['Companies'],
      summary: 'List jobs belonging to a company',
      responses: { '200': { description: 'Paginated jobs' } },
    },
  },
  '/companies/{companyId}/verifications': {
    parameters: [{ $ref: '#/components/parameters/CompanyId' }],
    post: {
      tags: ['Verification'],
      summary: 'Submit a company verification request',
      responses: {
        '201': { description: 'Verification submitted (PENDING)' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
    get: {
      tags: ['Verification'],
      summary: 'Full verification history for a company',
      responses: { '200': { description: 'Verifications (newest first)' } },
    },
  },
  '/companies/{companyId}/verifications/latest': {
    parameters: [{ $ref: '#/components/parameters/CompanyId' }],
    get: {
      tags: ['Verification'],
      summary: 'Latest verification record for a company',
      responses: { '200': { description: 'Verification or null' } },
    },
  },
  '/admin/verifications/pending': {
    get: {
      tags: ['Verification'],
      summary: 'Pending verification queue (admin)',
      responses: { '200': { description: 'Pending verifications' } },
    },
  },
  '/admin/verifications/{id}/review': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Verification'],
      summary: 'Approve/reject a verification (admin)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['status'],
              properties: {
                status: { type: 'string', enum: ['VERIFIED', 'REJECTED'] },
                remarks: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      responses: { '200': { description: 'Reviewed; company status synced' } },
    },
  },
};

export default companyPaths;
