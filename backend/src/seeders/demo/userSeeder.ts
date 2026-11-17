import type { QueryInterface } from 'sequelize';
import bcrypt from 'bcryptjs';
import { DEMO_PASSWORD, EMPLOYER_OWNERS, EXTRA_MEMBERS, ID, JOBSEEKER_USERS } from './seedData';

/**
 * Users + role grants: 10 jobseekers, 8 employer owners, 4 extra members.
 * The platform admin is created by `adminSeeder` (run first by seedDemo).
 *
 * Idempotent: skipped when the first demo jobseeker already exists.
 */
export const seedUsers = async (queryInterface: QueryInterface): Promise<void> => {
  const sequelize = queryInterface.sequelize;

  const [marker] = (await sequelize.query(
    `SELECT COUNT(*)::int AS count FROM users WHERE email = 'aarav.sharma@example.com'`,
  )) as unknown as [Array<{ count: number }>];
  if (marker[0].count > 0) {
    console.log('  • demo users already seeded, skipping');
    return;
  }

  const [roleRows] = (await sequelize.query(
    `SELECT id, name FROM roles WHERE name IN ('JOBSEEKER','COMPANY_ADMIN','RECRUITER')`,
  )) as unknown as [Array<{ id: string; name: string }>];
  const roleByName = new Map(roleRows.map((row) => [row.name, row.id]));
  const jobseekerRole = roleByName.get('JOBSEEKER');
  const companyAdminRole = roleByName.get('COMPANY_ADMIN');
  const recruiterRole = roleByName.get('RECRUITER');
  if (!jobseekerRole || !companyAdminRole || !recruiterRole) {
    throw new Error('Missing platform roles — run adminSeeder/baseSeeder first');
  }

  const hash = await bcrypt.hash(DEMO_PASSWORD, Number(process.env.BCRYPT_SALT_ROUNDS || 10));
  const now = new Date();

  const allUsers = [
    ...JOBSEEKER_USERS.map((user, index) => ({ ...user, role: jobseekerRole, created: index * 4 + 30 })),
    ...EMPLOYER_OWNERS.map((user, index) => ({ ...user, role: companyAdminRole, created: 120 - index * 6 })),
    ...EXTRA_MEMBERS.map((user, index) => ({ ...user, role: recruiterRole, created: 45 - index * 5 })),
  ];

  await queryInterface.bulkInsert(
    'users',
    allUsers.map((user) => ({
      id: ID(user.n),
      email: user.email,
      password_hash: hash,
      first_name: user.first_name,
      last_name: user.last_name,
      phone: user.phone,
      status: 'ACTIVE',
      email_verified: true,
      last_login_at: null,
      created_at: new Date(Date.now() - user.created * 86_400_000),
      updated_at: now,
    })),
  );

  await queryInterface.bulkInsert(
    'user_roles',
    allUsers.map((user, index) => ({
      id: ID(1200 + index),
      user_id: ID(user.n),
      role_id: user.role,
      created_at: now,
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${allUsers.length} demo users + role grants`);
};
