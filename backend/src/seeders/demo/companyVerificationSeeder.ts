import type { QueryInterface } from 'sequelize';
import { EMPLOYER_OWNERS, ID, VERIFICATIONS, daysAgo, hasRows } from './seedData';

const ADMIN_ID = ID(1);

/**
 * Verification history: 5 VERIFIED, 2 PENDING (review fields NULL),
 * 1 REJECTED with a realistic remarks reason.
 */
export const seedCompanyVerifications = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'company_verifications')) {
    console.log('  • company verifications already seeded, skipping');
    return;
  }

  const ownerByCompany = new Map(EMPLOYER_OWNERS.map((owner) => [owner.company, owner.n]));
  const now = new Date();

  const rows = VERIFICATIONS.map((verification) => {
    const reviewed = verification.reviewedDaysAgo !== null;
    return {
      id: ID(verification.n),
      company_id: ID(verification.company),
      submitted_by: ID(ownerByCompany.get(verification.company) ?? 1),
      reviewed_by: reviewed ? ADMIN_ID : null,
      status: verification.status,
      document_url: `https://docs.merokhoj.example.com/verifications/${verification.n}.pdf`,
      remarks: verification.remarks,
      submitted_at: daysAgo(verification.submittedDaysAgo),
      reviewed_at: reviewed ? daysAgo(verification.reviewedDaysAgo as number) : null,
      created_at: daysAgo(verification.submittedDaysAgo),
      updated_at: reviewed ? daysAgo(verification.reviewedDaysAgo as number) : now,
    };
  });

  await queryInterface.bulkInsert('company_verifications', rows);
  console.log(`  • seeded ${rows.length} company verifications`);
};
