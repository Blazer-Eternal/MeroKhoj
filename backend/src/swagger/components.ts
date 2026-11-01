/**
 * Shared OpenAPI components: reusable schemas, parameters and responses.
 *
 * The API wraps every success response in `{ success: true, data: ... }`;
 * error responses use `{ success: false, error: { code, message } }`.
 */

export const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Paste the JWT access token from /auth/login.',
  },
};

/** Common path parameters. */
export const parameters = {
  UuidId: {
    name: 'id',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
    description: 'Resource UUID',
  },
  ProfileId: {
    name: 'profileId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
    description: 'Jobseeker profile UUID',
  },
  CompanyId: {
    name: 'companyId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
    description: 'Company UUID',
  },
  JobId: {
    name: 'jobId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
    description: 'Job UUID',
  },
  RosterId: {
    name: 'rosterId',
    in: 'path',
    required: true,
    schema: { type: 'string', format: 'uuid' },
    description: 'Talent roster UUID',
  },
  Page: {
    name: 'page',
    in: 'query',
    schema: { type: 'integer', minimum: 1, default: 1 },
  },
  PerPage: {
    name: 'perPage',
    in: 'query',
    schema: { type: 'integer', minimum: 1 },
  },
};

export const schemas = {
  /** Pagination envelope embedded in list responses. */
  PaginationMeta: {
    type: 'object',
    properties: {
      total: { type: 'integer' },
      page: { type: 'integer' },
      perPage: { type: 'integer' },
      totalPages: { type: 'integer' },
      hasNextPage: { type: 'boolean' },
      hasPrevPage: { type: 'boolean' },
    },
  },
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string' },
        },
      },
    },
  },
  Timestamps: {
    type: 'object',
    properties: {
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
    },
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      full_name: { type: 'string' },
      status: { type: 'string' },
      ...{},
    },
  },
  Job: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      company_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      slug: { type: 'string' },
      description: { type: 'string' },
      employment_type: {
        type: 'string',
        enum: ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'TEMPORARY', 'FREELANCE'],
      },
      experience_level: { type: 'string', nullable: true },
      salary_min: { type: 'number', nullable: true },
      salary_max: { type: 'number', nullable: true },
      salary_currency: { type: 'string' },
      vacancies: { type: 'integer' },
      location: { type: 'string', nullable: true },
      application_deadline: { type: 'string', format: 'date-time', nullable: true },
      status: {
        type: 'string',
        enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'PAUSED', 'CLOSED', 'CANCELLED'],
      },
      published_at: { type: 'string', format: 'date-time', nullable: true },
      closed_at: { type: 'string', format: 'date-time', nullable: true },
      category_id: { type: 'string', format: 'uuid', nullable: true },
      industry_id: { type: 'string', format: 'uuid', nullable: true },
      location_id: { type: 'string', format: 'uuid', nullable: true },
      ...{},
    },
  },
  Company: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      slug: { type: 'string' },
      website: { type: 'string', nullable: true },
      industry: { type: 'string', nullable: true },
      industry_id: { type: 'string', format: 'uuid', nullable: true },
      verification_status: {
        type: 'string',
        enum: ['UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED'],
      },
      status: { type: 'string' },
      ...{},
    },
  },
  Application: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      job_id: { type: 'string', format: 'uuid' },
      jobseeker_id: { type: 'string', format: 'uuid' },
      status: { type: 'string' },
      cover_letter: { type: 'string', nullable: true },
      ...{},
    },
  },
  Education: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      jobseeker_id: { type: 'string', format: 'uuid' },
      institution: { type: 'string' },
      degree: { type: 'string' },
      field_of_study: { type: 'string', nullable: true },
      start_date: { type: 'string', format: 'date', nullable: true },
      end_date: { type: 'string', format: 'date', nullable: true },
      is_current: { type: 'boolean' },
      grade: { type: 'string', nullable: true },
      description: { type: 'string', nullable: true },
      ...{},
    },
  },
  WorkExperience: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      jobseeker_id: { type: 'string', format: 'uuid' },
      company_name: { type: 'string' },
      designation: { type: 'string' },
      start_date: { type: 'string', format: 'date', nullable: true },
      end_date: { type: 'string', format: 'date', nullable: true },
      is_current: { type: 'boolean' },
      description: { type: 'string', nullable: true },
      ...{},
    },
  },
  Resume: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      jobseeker_id: { type: 'string', format: 'uuid' },
      title: { type: 'string' },
      file_url: { type: 'string' },
      is_default: { type: 'boolean' },
      ...{},
    },
  },
  JobCategory: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      slug: { type: 'string' },
      parent_id: { type: 'string', format: 'uuid', nullable: true },
      status: { type: 'string' },
      ...{},
    },
  },
  Industry: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      slug: { type: 'string' },
      status: { type: 'string' },
      ...{},
    },
  },
  Location: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      country: { type: 'string' },
      province: { type: 'string', nullable: true },
      district: { type: 'string', nullable: true },
      city: { type: 'string', nullable: true },
      address: { type: 'string', nullable: true },
      postal_code: { type: 'string', nullable: true },
      latitude: { type: 'number', nullable: true },
      longitude: { type: 'number', nullable: true },
      ...{},
    },
  },
  CompanyVerification: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      company_id: { type: 'string', format: 'uuid' },
      submitted_by: { type: 'string', format: 'uuid' },
      reviewed_by: { type: 'string', format: 'uuid', nullable: true },
      status: { type: 'string', enum: ['PENDING', 'VERIFIED', 'REJECTED'] },
      document_url: { type: 'string', nullable: true },
      remarks: { type: 'string', nullable: true },
      submitted_at: { type: 'string', format: 'date-time' },
      reviewed_at: { type: 'string', format: 'date-time', nullable: true },
      ...{},
    },
  },
  JobModeration: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      job_id: { type: 'string', format: 'uuid' },
      reviewed_by: { type: 'string', format: 'uuid' },
      action: { type: 'string', enum: ['APPROVED', 'REJECTED', 'FLAGGED', 'REMOVED'] },
      reason: { type: 'string', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  Report: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      reported_by: { type: 'string', format: 'uuid' },
      entity_type: { type: 'string', enum: ['USER', 'COMPANY', 'JOB'] },
      entity_id: { type: 'string', format: 'uuid' },
      reason: { type: 'string' },
      description: { type: 'string', nullable: true },
      status: { type: 'string', enum: ['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'] },
      resolved_by: { type: 'string', format: 'uuid', nullable: true },
      resolved_at: { type: 'string', format: 'date-time', nullable: true },
      ...{},
    },
  },
  AuditLog: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      user_id: { type: 'string', format: 'uuid', nullable: true },
      action: { type: 'string' },
      entity_type: { type: 'string' },
      entity_id: { type: 'string', format: 'uuid', nullable: true },
      old_values: { type: 'object', nullable: true },
      new_values: { type: 'object', nullable: true },
      ip_address: { type: 'string', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
    },
  },
  SavedJob: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      user_id: { type: 'string', format: 'uuid' },
      job_id: { type: 'string', format: 'uuid' },
      created_at: { type: 'string', format: 'date-time' },
      ...{},
    },
  },
  JobAlert: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      user_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      keywords: { type: 'string', nullable: true },
      category_id: { type: 'string', format: 'uuid', nullable: true },
      location_id: { type: 'string', format: 'uuid', nullable: true },
      employment_type: { type: 'string', nullable: true },
      is_active: { type: 'boolean' },
      frequency: { type: 'string', enum: ['DAILY', 'WEEKLY', 'INSTANT'] },
      last_sent_at: { type: 'string', format: 'date-time', nullable: true },
      ...{},
    },
  },
  Notification: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      user_id: { type: 'string', format: 'uuid' },
      type: {
        type: 'string',
        enum: [
          'APPLICATION_STATUS',
          'INTERVIEW_SCHEDULED',
          'INTERVIEW_REMINDER',
          'NEW_MESSAGE',
          'JOB_ALERT',
          'SAVED_JOB_CLOSED',
          'COMPANY_VERIFICATION',
          'JOB_MODERATION',
          'REPORT_UPDATE',
          'PAYMENT_UPDATE',
          'SYSTEM',
        ],
      },
      title: { type: 'string' },
      body: { type: 'string', nullable: true },
      data: { type: 'object', nullable: true },
      is_read: { type: 'boolean' },
      read_at: { type: 'string', format: 'date-time', nullable: true },
      created_at: { type: 'string', format: 'date-time' },
      ...{},
    },
  },
  TalentRoster: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      company_id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      created_by: { type: 'string', format: 'uuid' },
      ...{},
    },
  },
  TalentRosterMember: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      roster_id: { type: 'string', format: 'uuid' },
      jobseeker_id: { type: 'string', format: 'uuid' },
      added_by: { type: 'string', format: 'uuid' },
      notes: { type: 'string', nullable: true },
      ...{},
    },
  },
};

/** Reusable responses. */
export const responses = {
  BadRequest: { description: 'Invalid input', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
  Unauthorized: { description: 'Authentication required', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
  Forbidden: { description: 'Insufficient permissions', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
  NotFound: { description: 'Resource not found', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
  Conflict: { description: 'Conflict (e.g. duplicate or invalid transition)', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
};
