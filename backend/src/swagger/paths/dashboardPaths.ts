/**
 * Dashboard read-model paths: one aggregate endpoint per role.
 */
export const dashboardPaths = {
  '/dashboard/jobseeker': {
    get: {
      tags: ['Dashboard'],
      summary: 'Jobseeker dashboard aggregate',
      description:
        'Counters (applications, saved jobs, alerts, unread notifications), ' +
        'profile completion, recommended jobs and recent applications.',
      responses: { '200': { description: '{ dashboard }' } },
    },
  },
  '/dashboard/employer': {
    get: {
      tags: ['Dashboard'],
      summary: 'Employer dashboard aggregate',
      description:
        'Company stats, application funnel, upcoming interviews, recent ' +
        'postings and applicants. Returns `company: null` with zeroed ' +
        'stats when the caller has no company membership yet.',
      responses: { '200': { description: '{ dashboard }' } },
    },
  },
  '/dashboard/admin': {
    get: {
      tags: ['Dashboard'],
      summary: 'Admin dashboard aggregate',
      description:
        'Platform-wide counters, job/application breakdowns by status and ' +
        'the newest postings across the board.',
      responses: { '200': { description: '{ dashboard }' } },
    },
  },
};

export default dashboardPaths;
