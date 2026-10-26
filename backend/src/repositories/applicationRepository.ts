import { Op } from 'sequelize';
import Application from '../models/applicationModel';
import Job from '../models/jobModel';
import User from '../models/userModel';
import { IApplication, IApplicationCreation } from '../interfaces';
import { ApplicationStatus } from '../enums';
import { plain, IPaginationParams, buildPaginationMeta } from '../utils';

export interface IPaginatedApplications {
  data: IApplication[];
  meta: ReturnType<typeof buildPaginationMeta>;
}

/** Data-access layer for the `applications` table. */
class ApplicationRepository {
  async findById(id: string): Promise<IApplication | null> {
    const app = await Application.findByPk(id);
    return app ? (plain(app) as IApplication) : null;
  }

  /** Fetch an application along with its job + applicant for authorization checks. */
  async findByIdWithJobAndJobseeker(
    id: string,
  ): Promise<(IApplication & { job?: unknown; jobseeker?: unknown }) | null> {
    const app = await Application.findByPk(id, {
      include: [
        { model: Job, as: 'job', attributes: ['id', 'company_id', 'title', 'status'] },
        {
          model: User,
          as: 'jobseeker',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });
    return app ? (plain(app) as IApplication & { job?: unknown; jobseeker?: unknown }) : null;
  }

  async findByJobAndJobseeker(jobId: string, jobseekerId: string): Promise<IApplication | null> {
    const app = await Application.findOne({
      where: { job_id: jobId, jobseeker_id: jobseekerId },
    });
    return app ? (plain(app) as IApplication) : null;
  }

  async create(payload: IApplicationCreation): Promise<IApplication> {
    const app = await Application.create(payload);
    return plain(app) as IApplication;
  }

  async update(id: string, updates: Partial<IApplication>): Promise<IApplication | null> {
    const app = await Application.findByPk(id);
    if (!app) return null;
    await app.update(updates);
    return plain(app) as IApplication;
  }

  /** List a jobseeker's applications (optionally filtered by status). */
  async listByJobseeker(
    jobseekerId: string,
    status: ApplicationStatus | undefined,
    pagination: IPaginationParams,
  ): Promise<IPaginatedApplications> {
    const where: Record<string, unknown> = { jobseeker_id: jobseekerId };
    if (status) where.status = status;

    const { count, rows } = await Application.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['applied_at', 'DESC']],
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'slug', 'company_id', 'location', 'status'],
        },
      ],
    });

    return {
      data: plain<IApplication[]>(rows as unknown as Record<string, unknown>[]),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  /** List applications to a company's jobs (recruiter pipeline view). */
  async listByCompany(
    companyId: string,
    filters: { job_id?: string; status?: ApplicationStatus },
    pagination: IPaginationParams,
  ): Promise<IPaginatedApplications> {
    const where: Record<string, unknown> = {};
    if (filters.job_id) where.job_id = filters.job_id;
    if (filters.status) where.status = filters.status;

    const { count, rows } = await Application.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['applied_at', 'DESC']],
      include: [
        { model: Job, as: 'job', attributes: ['id', 'title', 'company_id'], where: { company_id: companyId } },
        {
          model: User,
          as: 'jobseeker',
          attributes: ['id', 'first_name', 'last_name', 'email'],
        },
      ],
    });

    return {
      data: plain<IApplication[]>(rows as unknown as Record<string, unknown>[]),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  /** Count applications per status for a job (funnel). */
  async countByStatusForJob(jobId: string): Promise<Record<ApplicationStatus, number>> {
    return this.countByStatus({ job_id: jobId });
  }

  /** Count applications per status across an arbitrary where clause. */
  async countByStatus(where: Record<string, unknown>): Promise<Record<ApplicationStatus, number>> {
    const rows = (await Application.findAll({
      attributes: ['status', [Application.sequelize!.fn('COUNT', Application.sequelize!.col('id')), 'count']],
      where,
      group: ['status'],
      raw: true,
    })) as unknown as Array<{ status: ApplicationStatus; count: string | number }>;

    const counts = {} as Record<ApplicationStatus, number>;
    for (const status of Object.values(ApplicationStatus)) {
      counts[status] = 0;
    }
    for (const row of rows) {
      counts[row.status] = Number(row.count);
    }
    return counts;
  }

  /** Total application count matching a where clause. */
  async count(where: Record<string, unknown>): Promise<number> {
    return Application.count({ where });
  }

  /** Whether a candidate already applied to a job. */
  async exists(jobId: string, jobseekerId: string): Promise<boolean> {
    const count = await Application.count({
      where: { job_id: jobId, jobseeker_id: jobseekerId },
    });
    return count > 0;
  }

  /** IDs of applications in a given status set (used by the funnel service). */
  async findIdsByStatuses(statuses: ApplicationStatus[]): Promise<string[]> {
    const rows = await Application.findAll({
      where: { status: { [Op.in]: statuses } },
      attributes: ['id'],
      raw: true,
    });
    return rows.map((r) => r.id);
  }
}

export default new ApplicationRepository();
