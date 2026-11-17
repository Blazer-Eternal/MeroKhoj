import type { QueryInterface } from 'sequelize';
import { EMPLOYER_OWNERS, EXTRA_MEMBERS, ID, daysAgo, hasRows } from './seedData';

/**
 * Company membership: 8 owners (OWNER) + 4 extra members with mixed
 * RECRUITER / HIRING_MANAGER / ADMIN roles, all ACTIVE.
 */
export const seedCompanyMembers = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'company_members')) {
    console.log('  • company members already seeded, skipping');
    return;
  }

  const now = new Date();
  const rows = [
    ...EMPLOYER_OWNERS.map((owner, index) => ({
      id: ID(551 + index),
      company_id: ID(owner.company),
      user_id: ID(owner.n),
      role: 'OWNER',
      status: 'ACTIVE',
      joined_at: daysAgo(140 - index * 6),
      created_at: now,
      updated_at: now,
    })),
    ...EXTRA_MEMBERS.map((member, index) => ({
      id: ID(559 + index),
      company_id: ID(member.company),
      user_id: ID(member.n),
      role: member.member_role,
      status: 'ACTIVE',
      joined_at: daysAgo(70 - index * 8),
      created_at: now,
      updated_at: now,
    })),
  ];

  await queryInterface.bulkInsert('company_members', rows);
  console.log(`  • seeded ${rows.length} company members`);
};
