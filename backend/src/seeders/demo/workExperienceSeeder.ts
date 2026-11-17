import type { QueryInterface } from 'sequelize';
import { EXPERIENCES, ID, hasRows } from './seedData';

/** Work experience rows for every demo profile. */
export const seedWorkExperiences = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'work_experiences')) {
    console.log('  • work experiences already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'work_experiences',
    EXPERIENCES.map((entry, index) => ({
      id: ID(1400 + index),
      jobseeker_id: ID(entry.profile),
      company_name: entry.company_name,
      job_title: entry.job_title,
      employment_type: entry.employment_type,
      location: entry.location,
      start_date: `${entry.start}-01`,
      end_date: entry.is_current ? null : `${entry.end}-01`,
      is_current: entry.is_current,
      description: entry.description,
      created_at: now,
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${EXPERIENCES.length} work experiences`);
};
