import type { QueryInterface } from 'sequelize';
import { HIRING_DECISIONS, ID, daysAgo, hasRows } from './seedData';

/** Hiring decisions (841-843): one HIRED, two REJECTED. */
export const seedHiringDecisions = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'hiring_decisions')) {
    console.log('  • hiring decisions already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'hiring_decisions',
    HIRING_DECISIONS.map((decision) => ({
      id: ID(decision.n),
      application_id: ID(decision.application),
      decided_by: ID(decision.decided_by),
      outcome: decision.outcome,
      notes: decision.notes,
      decided_at: daysAgo(decision.daysAgo),
      created_at: daysAgo(decision.daysAgo),
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${HIRING_DECISIONS.length} hiring decisions`);
};
