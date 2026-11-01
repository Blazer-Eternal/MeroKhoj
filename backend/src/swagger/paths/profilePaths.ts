/**
 * Jobseeker profile content paths:
 * educations, work experiences, resumes.
 */
export const profilePaths = {
  '/profiles/{profileId}/educations': {
    parameters: [{ $ref: '#/components/parameters/ProfileId' }],
    get: {
      tags: ['Profile'],
      summary: 'List educations on a profile',
      responses: { '200': { description: 'Educations' } },
    },
    post: {
      tags: ['Profile'],
      summary: 'Add an education entry',
      responses: { '201': { description: 'Education created' } },
    },
  },
  '/educations/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Profile'],
      summary: 'Update an education entry',
      responses: { '200': { description: 'Updated education' } },
    },
    delete: {
      tags: ['Profile'],
      summary: 'Delete an education entry',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/profiles/{profileId}/work-experiences': {
    parameters: [{ $ref: '#/components/parameters/ProfileId' }],
    get: {
      tags: ['Profile'],
      summary: 'List work experiences on a profile',
      responses: { '200': { description: 'Experiences' } },
    },
    post: {
      tags: ['Profile'],
      summary: 'Add a work experience entry',
      responses: { '201': { description: 'Experience created' } },
    },
  },
  '/work-experiences/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Profile'],
      summary: 'Update a work experience entry',
      responses: { '200': { description: 'Updated experience' } },
    },
    delete: {
      tags: ['Profile'],
      summary: 'Delete a work experience entry',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/profiles/{profileId}/resumes': {
    parameters: [{ $ref: '#/components/parameters/ProfileId' }],
    get: {
      tags: ['Profile'],
      summary: 'List resumes on a profile',
      responses: { '200': { description: 'Resumes' } },
    },
    post: {
      tags: ['Profile'],
      summary: 'Add a resume',
      responses: { '201': { description: 'Resume created' } },
    },
  },
  '/resumes/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Profile'],
      summary: 'Update a resume',
      responses: { '200': { description: 'Updated resume' } },
    },
    delete: {
      tags: ['Profile'],
      summary: 'Delete a resume',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/resumes/{id}/default': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    patch: {
      tags: ['Profile'],
      summary: 'Set a resume as the default',
      responses: { '200': { description: 'Default set; previous default cleared' } },
    },
  },
};

export default profilePaths;
