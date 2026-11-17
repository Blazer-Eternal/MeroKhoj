import type { QueryInterface } from 'sequelize';
import { ID, NOTIFICATIONS, daysAgo, hasRows } from './seedData';

/** Notifications for candidates, employers and the platform admin. */
export const seedNotifications = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'notifications')) {
    console.log('  • notifications already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'notifications',
    NOTIFICATIONS.map((notification) => ({
      id: ID(notification.n),
      user_id: ID(notification.user),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data === null ? null : JSON.stringify(notification.data),
      is_read: notification.is_read,
      read_at: notification.is_read ? daysAgo(notification.createdDaysAgo - 1) : null,
      created_at: daysAgo(notification.createdDaysAgo),
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${NOTIFICATIONS.length} notifications`);
};
