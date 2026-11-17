import type { QueryInterface } from 'sequelize';
import { AUDIT_LOGS, ID, daysAgo, hasRows } from './seedData';

/**
 * Audit trail (1141-1160) using the exact action names the services write
 * (ORDER_CREATED, PAYMENT_REFUNDED, COMPANY_VERIFICATION_REJECTED, ...).
 * `entity_id` mirrors the deterministic id of the row it refers to.
 */
export const seedAuditLogs = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'audit_logs')) {
    console.log('  • audit logs already seeded, skipping');
    return;
  }

  await queryInterface.bulkInsert(
    'audit_logs',
    AUDIT_LOGS.map((log) => ({
      id: ID(log.n),
      user_id: log.user === null ? null : ID(log.user),
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity === null ? null : ID(log.entity),
      old_values: log.old_values === null ? null : JSON.stringify(log.old_values),
      new_values: log.new_values === null ? null : JSON.stringify(log.new_values),
      ip_address: log.ip_address,
      created_at: daysAgo(log.daysAgo),
    })),
  );

  console.log(`  • seeded ${AUDIT_LOGS.length} audit logs`);
};
