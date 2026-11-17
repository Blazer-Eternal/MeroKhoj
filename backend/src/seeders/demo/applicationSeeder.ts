import type { QueryInterface } from 'sequelize';
import { APPLICATIONS, ID, RESUMES, daysAgo, hasRows } from './seedData';

/** Default resume file URL for a jobseeker user (user 101 → profile 201). */
const defaultResumeUrl = (user: number): string => {
  const profile = user + 100;
  const resume =
    RESUMES.find((entry) => entry.profile === profile && entry.is_default) ??
    RESUMES.find((entry) => entry.profile === profile);
  return resume
    ? `https://cdn.merokhoj.example.com/resumes/${resume.file_name}`
    : 'https://cdn.merokhoj.example.com/resumes/placeholder.pdf';
};

/**
 * Applications (801-814) spanning all 8 statuses, plus the matching
 * application_status_history chains (initial APPLIED row has the applicant
 * as changed_by, exactly like applicationServices.applyToJob writes it).
 */
export const seedApplications = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'applications')) {
    console.log('  • applications already seeded, skipping');
    return;
  }

  const now = new Date();

  const appRows = APPLICATIONS.map((application) => ({
    id: ID(application.n),
    job_id: ID(application.job),
    jobseeker_id: ID(application.user),
    resume_url: defaultResumeUrl(application.user),
    cover_letter: application.cover_letter,
    status: application.status,
    source: application.source,
    applied_at: daysAgo(application.appliedDaysAgo),
    withdrawn_at: application.withdrawnDaysAgo ? daysAgo(application.withdrawnDaysAgo) : null,
    created_at: daysAgo(application.appliedDaysAgo),
    updated_at: now,
  }));
  await queryInterface.bulkInsert('applications', appRows);

  const historyRows: Array<{
    id: string;
    application_id: string;
    old_status: string | null;
    new_status: string;
    changed_by: string;
    reason: string | null;
    created_at: Date;
    updated_at: Date;
  }> = [];
  let seq = 1800;
  for (const application of APPLICATIONS) {
    let previous: string | null = null;
    for (const step of application.history) {
      const changedBy = step.by === 'candidate' ? ID(application.user) : ID(step.by);
      const at = daysAgo(step.daysAgo);
      historyRows.push({
        id: ID(seq++),
        application_id: ID(application.n),
        old_status: previous,
        new_status: step.to,
        changed_by: changedBy,
        reason: step.reason,
        created_at: at,
        updated_at: at,
      });
      previous = step.to;
    }
  }
  await queryInterface.bulkInsert('application_status_history', historyRows);

  console.log(
    `  • seeded ${appRows.length} applications + ${historyRows.length} status history rows`,
  );
};
