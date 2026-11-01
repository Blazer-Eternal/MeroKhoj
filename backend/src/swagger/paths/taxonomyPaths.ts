/**
 * Job classification taxonomy paths:
 * job categories, industries, locations.
 */
export const taxonomyPaths = {
  '/job-categories': {
    get: {
      tags: ['Taxonomy'],
      summary: 'List job categories',
      security: [],
      responses: { '200': { description: 'Categories' } },
    },
    post: {
      tags: ['Taxonomy'],
      summary: 'Create a job category (admin)',
      responses: { '201': { description: 'Category created' } },
    },
  },
  '/job-categories/tree': {
    get: {
      tags: ['Taxonomy'],
      summary: 'Category hierarchy as a tree',
      security: [],
      responses: { '200': { description: 'Nested categories' } },
    },
  },
  '/job-categories/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Taxonomy'],
      summary: 'Get a job category',
      security: [],
      responses: { '200': { description: 'Category' } },
    },
    patch: {
      tags: ['Taxonomy'],
      summary: 'Update a job category (admin)',
      responses: { '200': { description: 'Updated category' } },
    },
    delete: {
      tags: ['Taxonomy'],
      summary: 'Delete a job category (admin)',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/industries': {
    get: {
      tags: ['Taxonomy'],
      summary: 'List industries',
      security: [],
      responses: { '200': { description: 'Industries' } },
    },
    post: {
      tags: ['Taxonomy'],
      summary: 'Create an industry (admin)',
      responses: { '201': { description: 'Industry created' } },
    },
  },
  '/industries/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Taxonomy'],
      summary: 'Get an industry',
      security: [],
      responses: { '200': { description: 'Industry' } },
    },
    patch: {
      tags: ['Taxonomy'],
      summary: 'Update an industry (admin)',
      responses: { '200': { description: 'Updated industry' } },
    },
    delete: {
      tags: ['Taxonomy'],
      summary: 'Delete an industry (admin)',
      responses: { '200': { description: 'Deleted' } },
    },
  },
  '/locations': {
    get: {
      tags: ['Taxonomy'],
      summary: 'Search locations',
      security: [],
      parameters: [
        { name: 'country', in: 'query', schema: { type: 'string' } },
        { name: 'province', in: 'query', schema: { type: 'string' } },
        { name: 'district', in: 'query', schema: { type: 'string' } },
        { name: 'city', in: 'query', schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'Locations' } },
    },
    post: {
      tags: ['Taxonomy'],
      summary: 'Create a location (admin)',
      responses: { '201': { description: 'Location created' } },
    },
  },
  '/locations/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Taxonomy'],
      summary: 'Get a location',
      security: [],
      responses: { '200': { description: 'Location' } },
    },
    patch: {
      tags: ['Taxonomy'],
      summary: 'Update a location (admin)',
      responses: { '200': { description: 'Updated location' } },
    },
    delete: {
      tags: ['Taxonomy'],
      summary: 'Delete a location (admin)',
      responses: { '200': { description: 'Deleted' } },
    },
  },
};

export default taxonomyPaths;
