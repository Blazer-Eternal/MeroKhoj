import type { QueryInterface } from 'sequelize';
import { ID, REPORTS, daysAgo, hasRows } from './seedData';

const ADMIN_ID = ID(1);

/**
 * Reports (1121-1123): one OPEN, one UNDER_REVIEW, one RESOLVED by the
 * platform admin (`resolved_by`/`resolved_at` only set when resolved).
 */
export const seedReports = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'reports')) {
    console.log('  • reports already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'reports',
    REPORTS.map((report) => {
      const resolved = report.resolvedDaysAgo !== null;
      return {
        id: ID(report.n),
        reported_by: ID(report.reported_by),
        entity_type: report.entity_type,
        entity_id: ID(report.entity),
        reason: report.reason,
        description: report.description,
        status: report.status,
        resolved_by: resolved ? ADMIN_ID : null,
        resolved_at: resolved ? daysAgo(report.resolvedDaysAgo as number) : null,
        created_at: daysAgo(report.createdDaysAgo),
        updated_at: resolved ? daysAgo(report.resolvedDaysAgo as number) : now,
      };
    }),
  );

  console.log(`  • seeded ${REPORTS.length} reports`);
};
