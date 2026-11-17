import type { QueryInterface } from 'sequelize';
import { ID, PROFILES, SKILLS, skillId, hasRows } from './seedData';

/**
 * Skills catalog + each candidate's profile skills (the signal behind
 * GET /jobs/recommended skill-overlap scoring).
 *
 * The catalog is inserted idempotently by id; profile links are skipped
 * when jobseeker_profile_skills already holds rows.
 */
export const seedJobseekerSkills = async (queryInterface: QueryInterface): Promise<void> => {
  const now = new Date();

  const [existing] = (await queryInterface.sequelize.query(
    'SELECT id FROM skills',
  )) as unknown as [Array<{ id: string }>];
  const present = new Set(existing.map((row) => row.id));

  const toInsert = SKILLS.filter((skill) => !present.has(ID(skill.n)));
  if (toInsert.length > 0) {
    await queryInterface.bulkInsert(
      'skills',
      toInsert.map((skill) => ({
        id: ID(skill.n),
        name: skill.name,
        description: null,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      })),
    );
    console.log(`  • seeded ${toInsert.length} skills`);
  } else {
    console.log('  • skills catalog already present, skipping');
  }

  if (await hasRows(queryInterface, 'jobseeker_profile_skills')) {
    console.log('  • profile skills already seeded, skipping');
    return;
  }

  const rows: Array<{ id: string; jobseeker_id: string; skill_id: string; created_at: Date }> = [];
  let seq = 1600;
  for (const profile of PROFILES) {
    for (const name of profile.skills) {
      rows.push({
        id: ID(seq++),
        jobseeker_id: ID(profile.n),
        skill_id: skillId(name),
        created_at: now,
      });
    }
  }
  await queryInterface.bulkInsert('jobseeker_profile_skills', rows);
  console.log(`  • seeded ${rows.length} profile skill links`);
};
