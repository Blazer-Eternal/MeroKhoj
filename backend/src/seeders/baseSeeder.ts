import type { QueryInterface } from 'sequelize';

/**
 * Base seeder — reference data only: platform roles, taxonomy and the
 * purchasable service-plan catalog. Run by `sequelize-cli db:seed:all`.
 *
 * This file is intentionally SELF-CONTAINED: sequelize-cli loads `.ts` seeders
 * via dynamic `import()` (ESM), which cannot resolve directory/index imports
 * like `../enums` or `../config`. All values are therefore inlined here, and
 * only third-party type imports are used.
 *
 * Accounts live in `adminSeeder.ts`; the demo dataset lives in
 * `demo/seedDemo.ts` (run via `npm run seed:demo`).
 *
 * Idempotent: every block inserts only rows whose id is missing, so repeated
 * runs (and runs against databases seeded before the taxonomy grew) are safe.
 */

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
  { id: TAXONOMY_ID(109), name: 'Human Resources', slug: 'human-resources', parent_id: null },
  { id: TAXONOMY_ID(110), name: 'Graphic Design', slug: 'graphic-design', parent_id: null },
  { id: TAXONOMY_ID(111), name: 'Project Management', slug: 'project-management', parent_id: null },
];

const SEEDED_INDUSTRIES = [
  { id: TAXONOMY_ID(201), name: 'Information Technology', slug: 'information-technology' },
  { id: TAXONOMY_ID(202), name: 'Banking & Finance', slug: 'banking-finance' },
  { id: TAXONOMY_ID(203), name: 'Healthcare', slug: 'healthcare-industry' },
  { id: TAXONOMY_ID(204), name: 'Education', slug: 'education-industry' },
  { id: TAXONOMY_ID(205), name: 'Telecommunications', slug: 'telecommunications' },
  { id: TAXONOMY_ID(206), name: 'Retail & E-Commerce', slug: 'retail-ecommerce' },
  { id: TAXONOMY_ID(207), name: 'Digital Marketing', slug: 'digital-marketing' },
  { id: TAXONOMY_ID(208), name: 'Construction', slug: 'construction' },
  { id: TAXONOMY_ID(209), name: 'Consulting', slug: 'consulting' },
];

const SEEDED_LOCATIONS = [
  { id: TAXONOMY_ID(301), country: 'Nepal', province: 'Bagmati', district: 'Kathmandu', city: 'Kathmandu' },
  { id: TAXONOMY_ID(302), country: 'Nepal', province: 'Bagmati', district: 'Lalitpur', city: 'Lalitpur' },
  { id: TAXONOMY_ID(303), country: 'Nepal', province: 'Bagmati', district: 'Bhaktapur', city: 'Bhaktapur' },
  { id: TAXONOMY_ID(304), country: 'Nepal', province: 'Gandaki', district: 'Kaski', city: 'Pokhara' },
  { id: TAXONOMY_ID(305), country: 'Nepal', province: 'Lumbini', district: 'Rupandehi', city: 'Bhairahawa' },
  { id: TAXONOMY_ID(306), country: 'Nepal', province: 'Koshi', district: 'Morang', city: 'Biratnagar' },
  { id: TAXONOMY_ID(307), country: 'Nepal', province: 'Bagmati', district: 'Chitwan', city: 'Chitwan' },
  { id: TAXONOMY_ID(308), country: 'Nepal', province: 'Lumbini', district: 'Rupandehi', city: 'Butwal' },
  { id: TAXONOMY_ID(309), country: 'Nepal', province: 'Koshi', district: 'Sunsari', city: 'Dharan' },
];

/** Starter catalog of purchasable packages (entity 33). Free fixed-ID range 401+. */
const SEEDED_SERVICE_PLANS = [
  {
    id: TAXONOMY_ID(401),
    name: 'Basic',
    description: 'Free tier — try posting a single job.',
    price: 0,
    currency: 'NPR',
    duration_days: null,
    job_posting_limit: 1,
    featured_jobs_limit: 0,
  },
  {
    id: TAXONOMY_ID(402),
    name: 'Pro',
    description: '30 days of active hiring with featured slots.',
    price: 4999,
    currency: 'NPR',
    duration_days: 30,
    job_posting_limit: 10,
    featured_jobs_limit: 2,
  },
  {
    id: TAXONOMY_ID(403),
    name: 'Enterprise',
    description: 'Unlimited postings for a full year.',
    price: 19999,
    currency: 'NPR',
    duration_days: 365,
    job_posting_limit: null,
    featured_jobs_limit: 10,
  },
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

/** Insert only the rows whose id is not already present. */
const insertMissing = async <T extends { id: string }>(
  queryInterface: QueryInterface,
  table: string,
  rows: T[],
): Promise<number> => {
  const sequelize = queryInterface.sequelize;
  const ids = rows.map((row) => row.id);
  const [existing] = (await sequelize.query(
    `SELECT id FROM "${table}" WHERE id IN (:ids)`,
    { replacements: { ids } },
  )) as unknown as [Array<{ id: string }>];

  const present = new Set(existing.map((row) => row.id));
  const missing = rows.filter((row) => !present.has(row.id));
  if (missing.length === 0) return 0;

  await queryInterface.bulkInsert(table, missing);
  return missing.length;
};

const seedRoles = async (queryInterface: QueryInterface): Promise<void> => {
  const sequelize = queryInterface.sequelize;
  const [existing] = (await sequelize.query(
    `SELECT name FROM roles WHERE name IN (:names)`,
    { replacements: { names: [...ROLE_NAMES] } },
  )) as unknown as [Array<{ name: string }>];

  const present = new Set(existing.map((row) => row.name));
  const missing = ROLE_NAMES.filter((name) => !present.has(name));
  if (missing.length === 0) {
    console.log('  • roles already seeded, skipping');
    return;
  }

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
  console.log(`  • seeded ${missing.length} roles`);
};

const seedTaxonomy = async (queryInterface: QueryInterface): Promise<void> => {
  const now = new Date();

  const categories = await insertMissing(
    queryInterface,
    'job_categories',
    SEEDED_CATEGORIES.map((c) => ({
      ...c,
      description: null,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    })),
  );
  console.log(
    categories > 0 ? `  • seeded ${categories} job categories` : '  • job categories already seeded, skipping',
  );

  const industries = await insertMissing(
    queryInterface,
    'industries',
    SEEDED_INDUSTRIES.map((i) => ({
      ...i,
      description: null,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    })),
  );
  console.log(
    industries > 0 ? `  • seeded ${industries} industries` : '  • industries already seeded, skipping',
  );

  const locations = await insertMissing(
    queryInterface,
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
  console.log(
    locations > 0 ? `  • seeded ${locations} locations` : '  • locations already seeded, skipping',
  );

  const plans = await insertMissing(
    queryInterface,
    'service_plans',
    SEEDED_SERVICE_PLANS.map((p) => ({
      ...p,
      status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    })),
  );
  console.log(
    plans > 0 ? `  • seeded ${plans} service plans` : '  • service plans already seeded, skipping',
  );
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  console.log('Seeding MeroKhoj reference data...');
  await seedRoles(queryInterface);
  await seedTaxonomy(queryInterface);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  // Reference data only — safe to remove wholesale when nothing depends on it.
  await queryInterface.bulkDelete('service_plans', {});
  await queryInterface.bulkDelete('locations', {});
  await queryInterface.bulkDelete('industries', {});
  await queryInterface.bulkDelete('job_categories', {});
  await queryInterface.bulkDelete('roles', {});
};

export default { up, down };
