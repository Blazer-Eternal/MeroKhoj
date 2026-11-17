import type { QueryInterface } from 'sequelize';
import { ID, RESUMES, hasRows } from './seedData';

/** Resume documents for every demo profile (one default each, Aarav has two). */
export const seedResumes = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'resumes')) {
    console.log('  • resumes already seeded, skipping');
    return;
  }

  const now = new Date();
  await queryInterface.bulkInsert(
    'resumes',
    RESUMES.map((resume, index) => ({
      id: ID(1500 + index),
      jobseeker_id: ID(resume.profile),
      title: resume.title,
      file_url: `https://cdn.merokhoj.example.com/resumes/${resume.file_name}`,
      file_name: resume.file_name,
      file_type: 'application/pdf',
      file_size_bytes: resume.file_size_bytes,
      is_default: resume.is_default,
      created_at: now,
      updated_at: now,
    })),
  );

  console.log(`  • seeded ${RESUMES.length} resumes`);
};
