import type { QueryInterface } from 'sequelize';
import { INTERVIEWS, ID, daysAgo, daysFromNow, hasRows } from './seedData';

/** Interviews (821-823) + one completed feedback review (831). */
export const seedInterviews = async (queryInterface: QueryInterface): Promise<void> => {
  if (await hasRows(queryInterface, 'interviews')) {
    console.log('  • interviews already seeded, skipping');
    return;
  }

  const now = new Date();

  const interviewRows = INTERVIEWS.map((interview) => {
    const scheduledAt =
      interview.scheduledDaysAgo !== null
        ? daysAgo(interview.scheduledDaysAgo)
        : daysFromNow(interview.scheduledInDays ?? 3);
    return {
      id: ID(interview.n),
      application_id: ID(interview.application),
      scheduled_by: ID(interview.scheduled_by),
      interview_type: interview.interview_type,
      scheduled_at: scheduledAt,
      duration_minutes: interview.duration_minutes,
      location: interview.location,
      meeting_url: interview.meeting_url,
      status: interview.status,
      notes: interview.notes,
      created_at: scheduledAt,
      updated_at: now,
    };
  });
  await queryInterface.bulkInsert('interviews', interviewRows);

  const feedbackRows = INTERVIEWS.filter((interview) => interview.feedback).map((interview) => {
    const feedback = interview.feedback!;
    return {
      id: ID(feedback.n),
      interview_id: ID(interview.n),
      reviewer_id: ID(feedback.reviewer),
      communication_score: feedback.communication,
      technical_score: feedback.technical,
      cultural_fit_score: feedback.cultural,
      overall_score: feedback.overall,
      strengths: feedback.strengths,
      weaknesses: feedback.weaknesses,
      comments: feedback.comments,
      recommendation: feedback.recommendation,
      created_at: daysAgo(16),
      updated_at: daysAgo(16),
    };
  });
  if (feedbackRows.length > 0) {
    await queryInterface.bulkInsert('interview_feedback', feedbackRows);
  }

  console.log(
    `  • seeded ${interviewRows.length} interviews + ${feedbackRows.length} feedback rows`,
  );
};
