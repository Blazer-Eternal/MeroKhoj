import { getSequelize } from '../../config';

/**
 * Data access for `interview_practice_sessions` + `interview_practice_questions`
 * (Phase 2, interview preparation). Sessions own a generated question set;
 * answers, scores and feedback are written back per question.
 */

export interface IInterviewSessionRow {
  id: string;
  user_id: string;
  job_title: string;
  industry: string | null;
  skills: string[] | null;
  question_count: number;
  created_at: Date;
  updated_at: Date;
}

export interface IInterviewQuestionRow {
  id: string;
  session_id: string;
  sort_order: number;
  category: string | null;
  question: string;
  answer: string | null;
  score: number | null;
  feedback: unknown;
  answered_at: Date | null;
}

export interface IGeneratedQuestion {
  category: string;
  question: string;
}

class InterviewPracticeRepository {
  /** Create a session and its generated questions in one transaction. */
  async createSession(
    userId: string,
    input: {
      job_title: string;
      industry?: string | null;
      skills?: string[];
      question_count: number;
      questions: IGeneratedQuestion[];
    },
  ): Promise<IInterviewSessionRow> {
    const sequelize = getSequelize();
    const transaction = await sequelize.transaction();
    try {
      const [sessionRows] = await sequelize.query(
        `INSERT INTO interview_practice_sessions (user_id, job_title, industry, skills, question_count)
         VALUES (:userId, :jobTitle, :industry, :skills::jsonb, :questionCount)
         RETURNING id, user_id, job_title, industry, skills, question_count, created_at, updated_at`,
        {
          replacements: {
            userId,
            jobTitle: input.job_title,
            industry: input.industry ?? null,
            skills: JSON.stringify(input.skills ?? []),
            questionCount: input.question_count,
          },
          type: 'SELECT' as const,
          transaction,
        },
      );
      const session = (sessionRows as IInterviewSessionRow[])[0];

      if (input.questions.length > 0) {
        const values = input.questions.map((question, index) => ({
          sessionId: session.id,
          sortOrder: index,
          category: question.category,
          question: question.question,
        }));
        // Multi-row insert with numbered replacements keeps user text bound,
        // never interpolated.
        const placeholders = values.map(
          (_, index) =>
            `(:sessionId${index}, :sortOrder${index}, :category${index}, :question${index})`,
        );
        const replacements: Record<string, unknown> = {};
        values.forEach((value, index) => {
          replacements[`sessionId${index}`] = value.sessionId;
          replacements[`sortOrder${index}`] = value.sortOrder;
          replacements[`category${index}`] = value.category;
          replacements[`question${index}`] = value.question;
        });
        await sequelize.query(
          `INSERT INTO interview_practice_questions (session_id, sort_order, category, question)
           VALUES ${placeholders.join(', ')}`,
          { replacements, transaction },
        );
      }

      await transaction.commit();
      return session;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /** One session owned by the user, or null. */
  async findSession(sessionId: string, userId: string): Promise<IInterviewSessionRow | null> {
    const rows = (await getSequelize().query(
      `SELECT id, user_id, job_title, industry, skills, question_count, created_at, updated_at
       FROM interview_practice_sessions
       WHERE id = :sessionId AND user_id = :userId`,
      { replacements: { sessionId, userId }, type: 'SELECT' as const },
    )) as IInterviewSessionRow[];
    return rows[0] ?? null;
  }

  /** A user's sessions, newest first. */
  async listSessions(userId: string, limit = 20): Promise<IInterviewSessionRow[]> {
    const rows = (await getSequelize().query(
      `SELECT id, user_id, job_title, industry, skills, question_count, created_at, updated_at
       FROM interview_practice_sessions
       WHERE user_id = :userId
       ORDER BY created_at DESC
       LIMIT :limit`,
      { replacements: { userId, limit }, type: 'SELECT' as const },
    )) as IInterviewSessionRow[];
    return rows;
  }

  /** Every question of a session in generation order. */
  async listQuestions(sessionId: string): Promise<IInterviewQuestionRow[]> {
    const rows = (await getSequelize().query(
      `SELECT id, session_id, sort_order, category, question, answer, score, feedback, answered_at
       FROM interview_practice_questions
       WHERE session_id = :sessionId
       ORDER BY sort_order ASC`,
      { replacements: { sessionId }, type: 'SELECT' as const },
    )) as IInterviewQuestionRow[];
    return rows;
  }

  /** One question of a session (ownership proven by the parent session). */
  async findQuestion(
    questionId: string,
    sessionId: string,
  ): Promise<IInterviewQuestionRow | null> {
    const rows = (await getSequelize().query(
      `SELECT id, session_id, sort_order, category, question, answer, score, feedback, answered_at
       FROM interview_practice_questions
       WHERE id = :questionId AND session_id = :sessionId`,
      { replacements: { questionId, sessionId }, type: 'SELECT' as const },
    )) as IInterviewQuestionRow[];
    return rows[0] ?? null;
  }

  /** Store the practice answer plus AI score/feedback. */
  async saveAnswer(
    questionId: string,
    input: { answer: string; score: number; feedback: Record<string, unknown> },
  ): Promise<void> {
    await getSequelize().query(
      `UPDATE interview_practice_questions
       SET answer = :answer,
           score = :score,
           feedback = :feedback::jsonb,
           answered_at = NOW(),
           updated_at = NOW()
       WHERE id = :questionId`,
      {
        replacements: {
          questionId,
          answer: input.answer,
          score: input.score,
          feedback: JSON.stringify(input.feedback),
        },
      },
    );
  }
}

export default new InterviewPracticeRepository();
