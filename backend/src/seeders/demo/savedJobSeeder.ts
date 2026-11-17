import type { QueryInterface } from 'sequelize';
import { ID, SAVED_JOBS, daysAgo, hasRows } from './seedData';

/** Saved-job bookmarks for the demo candidates. */
export const seedSavedJobs = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'saved_jobs')) {
    console.log('  • saved jobs already seeded, skipping');
    return;
  }

  await queryInterface.bulkInsert(
    'saved_jobs',
    SAVED_JOBS.map((saved, index) => ({
      id: ID(1900 + index),
      user_id: ID(saved.user),
      job_id: ID(saved.job),
      created_at: daysAgo(saved.daysAgo),
      updated_at: daysAgo(saved.daysAgo),
    })),
  );

  console.log(`  • seeded ${SAVED_JOBS.length} saved jobs`);
};
