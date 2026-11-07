import InterviewFeedback from '../../models/interview/interviewFeedbackModel';
import { IInterviewFeedback, IInterviewFeedbackCreation, IInterviewFeedbackUpdate } from '../../interfaces';
import { plain } from '../../utils';

/** Data-access layer for the `interview_feedback` table. */
class InterviewFeedbackRepository {
  async findById(id: string): Promise<IInterviewFeedback | null> {
    const row = await InterviewFeedback.findByPk(id);
    return row ? (plain(row) as IInterviewFeedback) : null;
  }

  /** The one feedback row a specific reviewer wrote for an interview. */
  async findByInterviewAndReviewer(
    interviewId: string,
    reviewerId: string,
  ): Promise<IInterviewFeedback | null> {
    const row = await InterviewFeedback.findOne({
      where: { interview_id: interviewId, reviewer_id: reviewerId },
    });
    return row ? (plain(row) as IInterviewFeedback) : null;
  }

  async create(payload: IInterviewFeedbackCreation): Promise<IInterviewFeedback> {
    const row = await InterviewFeedback.create(payload);
    return plain(row) as IInterviewFeedback;
  }

  async update(
    id: string,
    updates: IInterviewFeedbackUpdate,
  ): Promise<IInterviewFeedback | null> {
    const row = await InterviewFeedback.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as IInterviewFeedback;
  }

  async destroy(id: string): Promise<number> {
    return InterviewFeedback.destroy({ where: { id } });
  }

  /** All feedback for an interview. */
  async listByInterview(interviewId: string): Promise<IInterviewFeedback[]> {
    const rows = await InterviewFeedback.findAll({
      where: { interview_id: interviewId },
      order: [['created_at', 'DESC']],
    });
    return plain<IInterviewFeedback[]>(rows as unknown as Record<string, unknown>[]);
  }
}

export default new InterviewFeedbackRepository();


