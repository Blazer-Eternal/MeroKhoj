import type { QueryInterface } from 'sequelize';
import { EDUCATIONS, ID, hasRows } from './seedData';

/** Education history for every demo profile (dates are `YYYY-MM-DD`). */
export const seedEducations = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'educations')) {
    console.log('  • educations already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'educations',
    EDUCATIONS.map((entry, index) => ({
      id: ID(1300 + index),
      jobseeker_id: ID(entry.profile),
      institution: entry.institution,
      degree: entry.degree,
      field_of_study: entry.field_of_study,
      start_date: `${entry.start}-01`,
      end_date: entry.is_current ? null : `${entry.end}-01`,
      is_current: entry.is_current,
      grade: entry.grade,
      description: null,
      created_at: now,
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${EDUCATIONS.length} educations`);
};
