import type { QueryInterface } from 'sequelize';
import bcrypt from 'bcryptjs';

/**
 * Admin seeder — the single platform administrator account.
 *
 * Like `baseSeeder`, this file is intentionally SELF-CONTAINED: sequelize-cli
 * loads `.ts` seeders via dynamic `import()` (ESM), which cannot resolve
 * directory imports. Only third-party packages are imported.
 *
 * Runs before `baseSeeder` alphabetically and creates the roles itself when
 * they are missing, so it never depends on another seeder having run first.
 *
 * Idempotent: skipped when `admin@merokhoj.com` already exists.
 */

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';

const ROLE_NAMES = [
  'JOBSEEKER',
  'RECRUITER',
  'COMPANY_ADMIN',
  'MODERATOR',
  'ADMIN',
  'SUPER_ADMIN',
] as const;

const ROLE_DESCRIPTIONS: Record<string, string> = {
  JOBSEEKER: 'A candidate searching for and applying to jobs.',
  RECRUITER: 'Posts jobs and manages applications on behalf of a company.',
  COMPANY_ADMIN: 'Manages a company account, its settings and members.',
  MODERATOR: 'Reviews and moderates jobs, companies and reported content.',
  ADMIN: 'Platform administrator with full back-office access.',
  SUPER_ADMIN: 'Top-level administrator, including other admins.',
};

/** Create any platform roles that are not present yet (order-independent). */
const ensureRoles = async (queryInterface: QueryInterface): Promise<void> => {
  const sequelize = queryInterface.sequelize;
  const [existing] = (await sequelize.query(
    `SELECT name FROM roles WHERE name IN (:names)`,
    { replacements: { names: [...ROLE_NAMES] } },
  )) as unknown as [Array<{ name: string }>];

  const present = new Set(existing.map((row) => row.name));
  const missing = ROLE_NAMES.filter((name) => !present.has(name));
  if (missing.length === 0) return;

  const now = new Date();
  await queryInterface.bulkInsert(
    'roles',
    missing.map((name) => ({
      name,
      description: ROLE_DESCRIPTIONS[name] ?? null,
      created_at: now,
      updated_at: now,
    })),
  );
  console.log(`  • seeded ${missing.length} missing roles`);
};

const seedAdmin = async (queryInterface: QueryInterface): Promise<void> => {
  const sequelize = queryInterface.sequelize;

  const [users] = (await sequelize.query(
    'SELECT COUNT(*)::int AS count FROM users WHERE email = :email',
    { replacements: { email: 'admin@merokhoj.com' } },
  )) as unknown as [Array<{ count: number }>];
  if (users[0].count > 0) {
    console.log('  • admin already seeded, skipping');
    return;
  }

  const now = new Date();
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || 10);
  const passwordHash = await bcrypt.hash('Admin@123', saltRounds);

  await queryInterface.bulkInsert('users', [
    {
      id: ADMIN_ID,
      email: 'admin@merokhoj.com',
      password_hash: passwordHash,
      first_name: 'MeroKhoj',
      last_name: 'Administrator',
      phone: null,
      status: 'ACTIVE',
      email_verified: true,
      last_login_at: null,
      created_at: now,
      updated_at: now,
    },
  ]);

  const [roles] = (await sequelize.query(
    `SELECT id, name FROM roles WHERE name IN ('SUPER_ADMIN','ADMIN')`,
  )) as unknown as [Array<{ id: string; name: string }>];

  await queryInterface.bulkInsert(
    'user_roles',
    roles.map((role, index) => ({
      id: `00000000-0000-4000-8000-00000000002${index}`,
      user_id: ADMIN_ID,
      role_id: role.id,
      created_at: now,
      updated_at: now,
    })),
  );

  console.log('  • seeded admin account');
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  console.log('Seeding platform admin...');
  await ensureRoles(queryInterface);
  await seedAdmin(queryInterface);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.bulkDelete('user_roles', { user_id: ADMIN_ID });
  await queryInterface.bulkDelete('users', { id: ADMIN_ID });
};

export default { up, down };
