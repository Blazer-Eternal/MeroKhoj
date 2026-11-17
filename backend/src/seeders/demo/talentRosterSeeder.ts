import type { QueryInterface } from 'sequelize';
import { ID, ROSTERS, daysAgo, hasRows } from './seedData';

/**
 * Talent rosters (1111-1112) + their member rows (1113-1116).
 * `jobseeker_id` references jobseeker_profiles, `added_by` the roster owner.
 */
export const seedTalentRosters = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'talent_rosters')) {
    console.log('  • talent rosters already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'talent_rosters',
    ROSTERS.map((roster) => ({
      id: ID(roster.n),
      company_id: ID(roster.company),
      name: roster.name,
      description: roster.description,
      created_by: ID(roster.created_by),
      created_at: daysAgo(roster.createdDaysAgo),
      updated_at: now,
    })),
  );

  const memberRows: Array<{
    id: string;
    roster_id: string;
    jobseeker_id: string;
    added_by: string;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
  }> = [];
  let seq = 1113;
  for (const roster of ROSTERS) {
    for (const member of roster.members) {
      memberRows.push({
        id: ID(seq++),
        roster_id: ID(roster.n),
        jobseeker_id: ID(member.profile),
        added_by: ID(roster.created_by),
        notes: member.notes,
        created_at: daysAgo(roster.createdDaysAgo),
        updated_at: now,
      });
    }
  }
  await queryInterface.bulkInsert('talent_roster_members', memberRows);

  console.log(`  • seeded ${ROSTERS.length} talent rosters + ${memberRows.length} members`);
};
