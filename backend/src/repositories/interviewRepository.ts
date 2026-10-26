import { Op } from 'sequelize';
import Interview from '../models/interviewModel';
import Application from '../models/applicationModel';
import Job from '../models/jobModel';
import { IInterview, IInterviewCreation } from '../interfaces';
import { InterviewStatus, INTERVIEW_UPCOMING_STATUSES } from '../enums';
import { plain } from '../utils';

/** Data-access layer for the `interviews` table. */
class InterviewRepository {
  async findById(id: string): Promise<IInterview | null> {
    const interview = await Interview.findByPk(id);
    return interview ? (plain(interview) as IInterview) : null;
  }

  async create(payload: IInterviewCreation): Promise<IInterview> {
    const interview = await Interview.create(payload);
    return plain(interview) as IInterview;
  }

  async update(id: string, updates: Partial<IInterview>): Promise<IInterview | null> {
    const interview = await Interview.findByPk(id);
    if (!interview) return null;
    await interview.update(updates);
    return plain(interview) as IInterview;
  }

  /** All interviews scheduled for one application. */
  async listByApplication(applicationId: string): Promise<IInterview[]> {
    const rows = await Interview.findAll({
      where: { application_id: applicationId },
      order: [['scheduled_at', 'ASC']],
    });
    return plain<IInterview[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Upcoming (scheduled/confirmed) interviews for a company's jobs. */
  async listUpcomingByCompany(companyId: string, limit = 50): Promise<IInterview[]> {
    const rows = await Interview.findAll({
      where: { status: { [Op.in]: INTERVIEW_UPCOMING_STATUSES } },
      order: [['scheduled_at', 'ASC']],
      limit,
      include: [
        {
          model: Application,
          as: 'application',
          attributes: ['id', 'job_id', 'jobseeker_id'],
          include: [
            {
              model: Job,
              as: 'job',
              attributes: ['id', 'title', 'company_id'],
              where: { company_id: companyId },
            },
          ],
        },
      ],
    });
    return plain<IInterview[]>(rows as unknown as Record<string, unknown>[]);
  }

  /** Count interviews by status for a job (funnel). */
  async countByStatusForJob(jobId: string): Promise<Record<InterviewStatus, number>> {
    const rows = (await Interview.findAll({
      attributes: [
        'status',
        [Interview.sequelize!.fn('COUNT', Interview.sequelize!.col('Interview.id')), 'count'],
      ],
      include: [
        {
          model: Application,
          as: 'application',
          attributes: [],
          where: { job_id: jobId },
        },
      ],
      group: ['Interview.status'],
      raw: true,
    })) as unknown as Array<{ status: InterviewStatus; count: string | number }>;

    const counts = {} as Record<InterviewStatus, number>;
    for (const status of Object.values(InterviewStatus)) {
      counts[status] = 0;
    }
    for (const row of rows) {
      counts[row.status] = Number(row.count);
    }
    return counts;
  }

  /** Total interview count for a job (used in the funnel). */
  async countForJob(jobId: string): Promise<number> {
    return Interview.count({
      include: [
        {
          model: Application,
          as: 'application',
          attributes: [],
          where: { job_id: jobId },
        },
      ],
    });
  }
}

export default new InterviewRepository();
