import { closeConnection, getSequelize } from '../../config';
import { up as runAdminSeeder } from '../adminSeeder';
import { up as runBaseSeeder } from '../baseSeeder';
import { seedUsers } from './userSeeder';
import { seedJobseekerProfiles } from './jobseekerSeeder';
import { seedEducations } from './educationSeeder';
import { seedWorkExperiences } from './workExperienceSeeder';
import { seedResumes } from './resumeSeeder';
import { seedJobseekerSkills } from './jobseekerSkillSeeder';
import { seedCompanies } from './companySeeder';
import { seedCompanyMembers } from './companyMemberSeeder';
import { seedCompanyVerifications } from './companyVerificationSeeder';
import { seedJobs } from './jobSeeder';
import { seedApplications } from './applicationSeeder';
import { seedInterviews } from './interviewSeeder';
import { seedHiringDecisions } from './hiringSeeder';
import { seedSavedJobs } from './savedJobSeeder';
import { seedJobAlerts } from './jobAlertSeeder';
import { seedNotifications } from './notificationSeeder';
import { seedOrders } from './orderSeeder';
import { seedPayments } from './paymentSeeder';
import { seedInvoices } from './invoiceSeeder';
import { seedTalentRosters } from './talentRosterSeeder';
import { seedReports } from './reportSeeder';
import { seedAuditLogs } from './auditSeeder';

/**
 * Demo dataset runner.
 *
 *   npm run seed:demo          idempotent — inserts only what is missing
 *   npm run seed:demo:reset    wipes ALL demo content first, then reseeds
 *
 * `--reset` truncates every base table except pure reference data (roles,
 * job categories, industries, locations, service plans) and `SequelizeMeta`.
 * The table list is read from information_schema at runtime, so content
 * tables without a user FK (like `companies`) are always included; the
 * admin account is recreated immediately afterwards by `adminSeeder`.
 *
 * Every demo seeder is individually idempotent, so running this twice
 * without `--reset` is safe and prints "already seeded, skipping".
 */

/**
 * Tables that survive `--reset` (plus SequelizeMeta, managed by migrations).
 * `service_plans` is NOT preserved: baseSeeder recreates its 3 canonical
 * plans right after the wipe, which also clears stray test-created plans.
 */
const REFERENCE_TABLES = new Set([
  'SequelizeMeta',
  'roles',
  'job_categories',
  'industries',
  'locations',
]);

const wipeContent = async (): Promise<void> => {
  const sequelize = getSequelize();
  const [rows] = (await sequelize.query(
    `SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`,
  )) as unknown as [Array<{ tablename: string }>];

  const tables = rows
    .map((row) => row.tablename)
    .filter((name) => name && !REFERENCE_TABLES.has(name));
  if (tables.length === 0) return;

  const list = tables.map((name) => `"${name}"`).join(', ');
  await sequelize.query(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE`);
  console.log(`  • truncated ${tables.length} content tables (reference data kept)`);
};

const main = async (): Promise<void> => {
  const reset = process.argv.includes('--reset');
  const sequelize = getSequelize();
  const queryInterface = sequelize.getQueryInterface();

  if (reset) {
    console.log('Resetting demo content (reference data + admin are kept)...');
    await wipeContent();
  }

  console.log('Seeding platform admin + reference data...');
  await runAdminSeeder(queryInterface);
  await runBaseSeeder(queryInterface);

  console.log('Seeding demo dataset (FK order)...');
  await seedUsers(queryInterface);
  await seedJobseekerProfiles(queryInterface);
  await seedEducations(queryInterface);
  await seedWorkExperiences(queryInterface);
  await seedResumes(queryInterface);
  await seedJobseekerSkills(queryInterface);
  await seedCompanies(queryInterface);
  await seedCompanyMembers(queryInterface);
  await seedCompanyVerifications(queryInterface);
  await seedJobs(queryInterface);
  await seedApplications(queryInterface);
  await seedInterviews(queryInterface);
  await seedHiringDecisions(queryInterface);
  await seedSavedJobs(queryInterface);
  await seedJobAlerts(queryInterface);
  await seedNotifications(queryInterface);
  await seedOrders(queryInterface);
  await seedPayments(queryInterface);
  await seedInvoices(queryInterface);
  await seedTalentRosters(queryInterface);
  await seedReports(queryInterface);
  await seedAuditLogs(queryInterface);

  console.log('Demo seeding complete.');
};

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => closeConnection());
