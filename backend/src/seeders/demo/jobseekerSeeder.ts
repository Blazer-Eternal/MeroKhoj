import type { QueryInterface } from 'sequelize';
import { ID, PROFILES, hasRows } from './seedData';

/** Jobseeker profiles (201-210) keyed to the 10 demo jobseeker accounts. */
export const seedJobseekerProfiles = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'jobseeker_profiles')) {
    console.log('  • jobseeker profiles already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'jobseeker_profiles',
    PROFILES.map((profile) => ({
      id: ID(profile.n),
      user_id: ID(profile.user),
      headline: profile.headline,
      professional_summary: profile.professional_summary,
      date_of_birth: null,
      gender: null,
      address: null,
      city: profile.city,
      country: 'Nepal',
      profile_photo_url: null,
      expected_salary: profile.expected_salary,
      availability: profile.availability,
      profile_visibility: 'PUBLIC',
      created_at: now,
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${PROFILES.length} jobseeker profiles`);
};
