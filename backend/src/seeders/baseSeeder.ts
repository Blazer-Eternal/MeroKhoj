import type { QueryInterface } from 'sequelize';
import bcrypt from 'bcryptjs';

/**
 * Base seeder — the single entry point run by `sequelize-cli db:seed:all`.
 *
 * This file is intentionally SELF-CONTAINED: sequelize-cli loads `.ts` seeders
 * via dynamic `import()` (ESM), which cannot resolve directory/index imports
 * like `../enums` or `../config`. All values are therefore inlined here, and
 * only third-party packages are imported.
 *
 * Seeds, in order:
 *   1. Platform roles
 *   2. A SUPER_ADMIN platform account
 *   3. A demo VERIFIED company owned by that admin
 *
 * Idempotent: each step is skipped if its data already exists.
 */

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';
const DEMO_COMPANY_ID = '00000000-0000-4000-8000-000000000003';
const ADMIN_COMPANY_MEMBER_ID = '00000000-0000-4000-8000-000000000004';

/** Deterministic UUIDs for seeded taxonomy so FKs stay stable across runs. */
const TAXONOMY_ID = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

const SEEDED_CATEGORIES = [
  { id: TAXONOMY_ID(101), name: 'Software & IT', slug: 'software-it', parent_id: null },
  { id: TAXONOMY_ID(102), name: 'Frontend Development', slug: 'frontend-development', parent_id: TAXONOMY_ID(101) },
  { id: TAXONOMY_ID(103), name: 'Backend Development', slug: 'backend-development', parent_id: TAXONOMY_ID(101) },
  { id: TAXONOMY_ID(104), name: 'Data & Analytics', slug: 'data-analytics', parent_id: null },
  { id: TAXONOMY_ID(105), name: 'Marketing', slug: 'marketing', parent_id: null },
  { id: TAXONOMY_ID(106), name: 'Finance & Accounting', slug: 'finance-accounting', parent_id: null },
  { id: TAXONOMY_ID(107), name: 'Healthcare', slug: 'healthcare', parent_id: null },
  { id: TAXONOMY_ID(108), name: 'Education', slug: 'education', parent_id: null },
];

const SEEDED_INDUSTRIES = [
  { id: TAXONOMY_ID(201), name: 'Information Technology', slug: 'information-technology' },
  { id: TAXONOMY_ID(202), name: 'Banking & Finance', slug: 'banking-finance' },
  { id: TAXONOMY_ID(203), name: 'Healthcare', slug: 'healthcare-industry' },
  { id: TAXONOMY_ID(204), name: 'Education', slug: 'education-industry' },
  { id: TAXONOMY_ID(205), name: 'Telecommunications', slug: 'telecommunications' },
  { id: TAXONOMY_ID(206), name: 'Retail & E-Commerce', slug: 'retail-ecommerce' },
];

const SEEDED_LOCATIONS = [
  { id: TAXONOMY_ID(301), country: 'Nepal', province: 'Bagmati', district: 'Kathmandu', city: 'Kathmandu' },
  { id: TAXONOMY_ID(302), country: 'Nepal', province: 'Bagmati', district: 'Lalitpur', city: 'Lalitpur' },
  { id: TAXONOMY_ID(303), country: 'Nepal', province: 'Bagmati', district: 'Bhaktapur', city: 'Bhaktapur' },
  { id: TAXONOMY_ID(304), country: 'Nepal', province: 'Gandaki', district: 'Kaski', city: 'Pokhara' },
  { id: TAXONOMY_ID(305), country: 'Nepal', province: 'Lumbini', district: 'Rupandehi', city: 'Bhairahawa' },
  { id: TAXONOMY_ID(306), country: 'Nepal', province: 'Koshi', district: 'Morang', city: 'Biratnagar' },
];

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

const seedRoles = async (queryInterface: QueryInterface): Promise<void> => {
  const [existing] = (await queryInterface.sequelize.query(
    'SELECT COUNT(*)::int AS count FROM roles',
  )) as unknown as [Array<{ count: number }>];

  if (existing[0].count > 0) {
    console.log('  • roles already seeded, skipping');
    return;
  }

  const now = new Date();
  const rows = ROLE_NAMES.map((name) => ({
    name,
    description: ROLE_DESCRIPTIONS[name] ?? null,
    created_at: now,
    updated_at: now,
  }));

  await queryInterface.bulkInsert('roles', rows);
  console.log(`  • seeded ${rows.length} roles`);
};

const seedAdmin = async (queryInterface: QueryInterface): Promise<void> => {
  const sequelize = queryInterface.sequelize;

  // Skip if the admin already exists.
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

  // 1. The admin user.
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

  // 2. Resolve role ids and grant SUPER_ADMIN + ADMIN.
  const [roles] = (await sequelize.query(
    `SELECT id, name FROM roles WHERE name IN ('SUPER_ADMIN','ADMIN')`,
  )) as unknown as [Array<{ id: string; name: string }>];

  const userRoleRows = roles.map((role, index) => ({
    id: `00000000-0000-4000-8000-00000000002${index}`,
    user_id: ADMIN_ID,
    role_id: role.id,
    created_at: now,
    updated_at: now,
  }));
  await queryInterface.bulkInsert('user_roles', userRoleRows);

  // 3. A demo VERIFIED company.
  await queryInterface.bulkInsert('companies', [
    {
      id: DEMO_COMPANY_ID,
      name: 'MeroKhoj Labs',
      slug: 'merokhoj-labs',
      description: 'Demo verified company used for local development.',
      logo_url: null,
      website: 'https://merokhoj.com',
      email: 'hello@merokhoj.com',
      phone: null,
      industry: 'Technology',
      company_size: 'SMALL',
      address: null,
      city: 'Kathmandu',
      country: 'Nepal',
      verification_status: 'VERIFIED',
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    },
  ]);

  // 4. The admin becomes OWNER of the demo company.
  await queryInterface.bulkInsert('company_members', [
    {
      id: ADMIN_COMPANY_MEMBER_ID,
      company_id: DEMO_COMPANY_ID,
      user_id: ADMIN_ID,
      role: 'OWNER',
      status: 'ACTIVE',
      joined_at: now,
      created_at: now,
      updated_at: now,
    },
  ]);

  console.log('  • seeded admin account + demo company');
};

const seedTaxonomy = async (queryInterface: QueryInterface): Promise<void> => {
  const sequelize = queryInterface.sequelize;
  const now = new Date();

  // ---- Job categories ---------------------------------------------------
  const [catCount] = (await sequelize.query(
    'SELECT COUNT(*)::int AS count FROM job_categories',
  )) as unknown as [Array<{ count: number }>];
  if (catCount[0].count === 0) {
    await queryInterface.bulkInsert(
      'job_categories',
      SEEDED_CATEGORIES.map((c) => ({
        ...c,
        description: null,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      })),
    );
    console.log(`  • seeded ${SEEDED_CATEGORIES.length} job categories`);
  } else {
    console.log('  • job categories already seeded, skipping');
  }

  // ---- Industries -------------------------------------------------------
  const [indCount] = (await sequelize.query(
    'SELECT COUNT(*)::int AS count FROM industries',
  )) as unknown as [Array<{ count: number }>];
  if (indCount[0].count === 0) {
    await queryInterface.bulkInsert(
      'industries',
      SEEDED_INDUSTRIES.map((i) => ({
        ...i,
        description: null,
        status: 'ACTIVE',
        created_at: now,
        updated_at: now,
      })),
    );
    console.log(`  • seeded ${SEEDED_INDUSTRIES.length} industries`);
  } else {
    console.log('  • industries already seeded, skipping');
  }

  // ---- Locations --------------------------------------------------------
  const [locCount] = (await sequelize.query(
    'SELECT COUNT(*)::int AS count FROM locations',
  )) as unknown as [Array<{ count: number }>];
  if (locCount[0].count === 0) {
    await queryInterface.bulkInsert(
      'locations',
      SEEDED_LOCATIONS.map((l) => ({
        ...l,
        address: null,
        postal_code: null,
        latitude: null,
        longitude: null,
        created_at: now,
        updated_at: now,
      })),
    );
    console.log(`  • seeded ${SEEDED_LOCATIONS.length} locations`);
  } else {
    console.log('  • locations already seeded, skipping');
  }
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  console.log('Seeding MeroKhoj reference data...');
  await seedRoles(queryInterface);
  await seedAdmin(queryInterface);
  await seedTaxonomy(queryInterface);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Remove seeded demo data (children first to satisfy FK order).
  await queryInterface.bulkDelete('company_members', { id: ADMIN_COMPANY_MEMBER_ID });
  await queryInterface.bulkDelete('companies', { id: DEMO_COMPANY_ID });
  await queryInterface.bulkDelete('user_roles', { user_id: ADMIN_ID });
  await queryInterface.bulkDelete('users', { id: ADMIN_ID });
  await queryInterface.bulkDelete('roles', {});
  await queryInterface.bulkDelete('locations', {});
  await queryInterface.bulkDelete('industries', {});
  await queryInterface.bulkDelete('job_categories', {});
};

export default { up, down };
