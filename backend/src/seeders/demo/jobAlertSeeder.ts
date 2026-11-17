import type { QueryInterface } from 'sequelize';
import { ID, JOB_ALERTS, daysAgo, hasRows } from './seedData';

/** Job alerts: three active (various frequencies) + one paused. */
export const seedJobAlerts = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'job_alerts')) {
    console.log('  • job alerts already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'job_alerts',
    JOB_ALERTS.map((alert) => ({
      id: ID(alert.n),
      user_id: ID(alert.user),
      name: alert.name,
      keywords: alert.keywords,
      category_id: alert.category_id,
      location_id: alert.location_id,
      employment_type: alert.employment_type,
      is_active: alert.is_active,
      frequency: alert.frequency,
      last_sent_at: alert.lastSentDaysAgo !== null ? daysAgo(alert.lastSentDaysAgo) : null,
      created_at: daysAgo(30),
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${JOB_ALERTS.length} job alerts`);
};
