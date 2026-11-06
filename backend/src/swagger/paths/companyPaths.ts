/**
 * Company, membership, and verification paths.
 */
export const companyPaths = {
  '/companies': {
    get: {
      tags: ['Companies'],
      summary: 'Company directory (public)',
      description:
        'Paginated company directory. Anonymous callers only see ACTIVE + ' +
        'VERIFIED companies; admins may pass status/verification filters.',
      security: [],
      parameters: [
        { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Name search' },
        { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Admin only' },
        {
          name: 'verification_status',
          in: 'query',
          schema: { type: 'string' },
          description: 'Admin only',
        },
        { $ref: '#/components/parameters/Page' },
        { $ref: '#/components/parameters/PerPage' },
      ],
      responses: { '200': { description: 'Paginated companies' } },
    },
    post: {
      tags: ['Companies'],
      summary: 'Create a company (employer)',
      responses: { '201': { description: 'Company created' } },
    },
  },
  '/companies/mine': {
    get: {
      tags: ['Companies'],
      summary: 'Companies the caller belongs to (member-scoped)',
      description:
        'Every company where the caller holds an ACTIVE membership, ' +
        'regardless of company status — how an employer discovers their own ' +
        'company before it is ACTIVE/VERIFIED. Returns `{ companies }`.',
      responses: { '200': { description: 'Membership-scoped companies (may be empty)' } },
    },
  },
  '/companies/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Companies'],
      summary: 'Get a company (public for ACTIVE companies)',
      security: [],
      responses: {
        '200': { description: 'Company' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
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
  '/companies/{companyId}/applications': {
    parameters: [{ $ref: '#/components/parameters/CompanyId' }],
    get: {
      tags: ['Applications'],
      summary: 'Company applicant pipeline (member)',
      description: 'Requires an active membership on the company (checked in the service).',
      parameters: [
        { name: 'job_id', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'status', in: 'query', schema: { type: 'string' } },
        { $ref: '#/components/parameters/Page' },
        { $ref: '#/components/parameters/PerPage' },
      ],
      responses: { '200': { description: 'Paginated applications' } },
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
