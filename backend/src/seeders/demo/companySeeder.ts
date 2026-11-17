import type { QueryInterface } from 'sequelize';
import { COMPANIES, ID, daysAgo, hasRows } from './seedData';

/** The 8 demo employers (501-508) with their verification status snapshot. */
export const seedCompanies = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'companies')) {
    console.log('  • companies already seeded, skipping');
    return;
  }

  await queryInterface.bulkInsert(
    'companies',
    COMPANIES.map((company) => ({
      id: ID(company.n),
      name: company.name,
      slug: company.slug,
      description: company.description,
      logo_url: null,
      website: company.website,
      email: company.email,
      phone: company.phone,
      industry: company.industry,
      industry_id: company.industry_id,
      company_size: company.company_size,
      address: null,
      city: company.city,
      country: 'Nepal',
      verification_status: company.verification_status,
      status: 'ACTIVE',
      // Older companies registered earlier so the directory has history.
      created_at: daysAgo(140 - (company.n - 501) * 5),
      updated_at: daysAgo(30),
    })),
  );

  console.log(`  • seeded ${COMPANIES.length} companies`);
};
