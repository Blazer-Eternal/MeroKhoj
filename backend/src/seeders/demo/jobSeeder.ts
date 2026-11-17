import type { QueryInterface } from 'sequelize';
import { COMPANIES, EMPLOYER_OWNERS, JOBS, MODERATIONS, ID, daysAgo, daysFromNow, hasRows, skillId, slugify } from './seedData';

const ADMIN_ID = ID(1);

/**
 * 28 published jobs (601-628), 1 PENDING_REVIEW (629) and 1 DRAFT (630),
 * each with 3-6 job_skills rows. `created_by` is the owning company's
 * owner account so employer dashboards see their own postings.
 */
export const seedJobs = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'jobs')) {
    console.log('  • jobs already seeded, skipping');
    return;
  }

  const ownerByCompany = new Map(EMPLOYER_OWNERS.map((owner) => [owner.company, owner.n]));
  const industryByCompany = new Map(COMPANIES.map((company) => [company.n, company.industry_id]));
  const now = new Date();

  const jobRows = JOBS.map((job) => {
    const published = job.status === 'PUBLISHED';
    const publishedAt = published ? daysAgo(job.ageDays) : null;
    const companySlug = COMPANIES.find((company) => company.n === job.company)?.slug ?? 'company';
    return {
      id: ID(job.n),
      company_id: ID(job.company),
      created_by: ID(ownerByCompany.get(job.company) ?? 1),
      title: job.title,
      slug: `${companySlug}-${slugify(job.title)}-${job.n}`,
      description: job.description,
      employment_type: job.employment_type,
      experience_level: job.experience_level,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: 'NPR',
      vacancies: job.vacancies,
      education_requirement: job.education_requirement,
      experience_requirement: job.experience_requirement,
      location: job.city,
      application_deadline: daysFromNow(21),
      status: job.status,
      published_at: publishedAt,
      closed_at: null,
      category_id: job.category_id,
      industry_id: industryByCompany.get(job.company) ?? null,
      location_id: job.location_id,
      created_at: publishedAt ?? now,
      updated_at: publishedAt ?? now,
    };
  });

  await queryInterface.bulkInsert('jobs', jobRows);

  const skillRows: Array<{
    id: string;
    job_id: string;
    skill_id: string;
    importance: string;
    minimum_experience: number | null;
    created_at: Date;
  }> = [];
  let seq = 1700;
  for (const job of JOBS) {
    for (const link of job.skills) {
      skillRows.push({
        id: ID(seq++),
        job_id: ID(job.n),
        skill_id: skillId(link.skill),
        importance: link.importance,
        minimum_experience: null,
        created_at: now,
      });
    }
  }
  await queryInterface.bulkInsert('job_skills', skillRows);

  // Moderation history (the PENDING_REVIEW and DRAFT jobs stay unreviewed).
  const moderationRows = MODERATIONS.map((entry) => ({
    id: ID(entry.n),
    job_id: ID(entry.job),
    reviewed_by: ADMIN_ID,
    action: entry.action,
    reason: entry.reason,
    created_at: daysAgo(entry.daysAgo),
  }));
  await queryInterface.bulkInsert('job_moderation', moderationRows);

  console.log(
    `  • seeded ${jobRows.length} jobs + ${skillRows.length} job skills + ${moderationRows.length} moderation rows`,
  );
};
