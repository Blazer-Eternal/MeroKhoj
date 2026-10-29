import { Op, fn, col } from 'sequelize';
import Job from '../models/jobModel';
import Company from '../models/companyModel';
import JobCategory from '../models/jobCategoryModel';
import Industry from '../models/industryModel';
import Location from '../models/locationModel';
import { IJob, IJobCreation, IJobSearchQuery } from '../interfaces';
import { JobStatus, EmploymentType, ExperienceLevel } from '../enums';
import { plain, IPaginationParams, buildPaginationMeta } from '../utils';

export interface IPaginatedJobs {
  data: IJob[];
  meta: ReturnType<typeof buildPaginationMeta>;
}

/** Data-access layer for the `jobs` table. */
class JobRepository {
  async findById(id: string): Promise<IJob | null> {
    const job = await Job.findByPk(id);
    return job ? (plain(job) as IJob) : null;
  }

  async findBySlug(slug: string): Promise<IJob | null> {
    const job = await Job.findOne({ where: { slug } });
    return job ? (plain(job) as IJob) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await Job.count({ where: { slug } });
    return count > 0;
  }

  async create(payload: IJobCreation): Promise<IJob> {
    const job = await Job.create(payload);
    return plain(job) as IJob;
  }

  async update(id: string, updates: Partial<IJob>): Promise<IJob | null> {
    const job = await Job.findByPk(id);
    if (!job) return null;
    await job.update(updates);
    return plain(job) as IJob;
  }

  /** Hard delete (used for drafts). Published jobs should be CLOSED instead. */
  async destroy(id: string): Promise<boolean> {
    const deleted = await Job.destroy({ where: { id } });
    return deleted > 0;
  }

  /**
   * Search published jobs with filters + pagination.
   * Supports free-text over title/description, plus structured filters.
   */
  async search(query: IJobSearchQuery, pagination: IPaginationParams): Promise<IPaginatedJobs> {
    const where: Record<string, unknown> = { status: JobStatus.PUBLISHED };

    if (query.q) {
      const term = `%${query.q}%`;
      where[Op.or as unknown as string] = [
        { title: { [Op.iLike]: term } },
        { description: { [Op.iLike]: term } },
      ];
    }
    if (query.company_id) where.company_id = query.company_id;
    if (query.employment_type) where.employment_type = query.employment_type;
    if (query.experience_level) where.experience_level = query.experience_level;
    if (query.location) where.location = { [Op.iLike]: `%${query.location}%` };
    if (query.status) where.status = query.status;
    if (query.salary_min) where.salary_max = { [Op.gte]: query.salary_min };
    if (query.salary_max) where.salary_min = { [Op.lte]: query.salary_max };
    if (query.category_id) where.category_id = query.category_id;
    if (query.industry_id) where.industry_id = query.industry_id;
    if (query.location_id) where.location_id = query.location_id;

    const { count, rows } = await Job.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['published_at', 'DESC']],
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name', 'slug', 'logo_url'] },
        { model: JobCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Industry, as: 'industry', attributes: ['id', 'name', 'slug'] },
        {
          model: Location,
          as: 'job_location',
          attributes: ['id', 'country', 'province', 'district', 'city'],
        },
      ],
    });

    return {
      data: plain<IJob[]>(rows as unknown as Record<string, unknown>[]),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  /** List jobs belonging to a company (any status), with pagination. */
  async listByCompany(
    companyId: string,
    status: JobStatus | undefined,
    pagination: IPaginationParams,
  ): Promise<IPaginatedJobs> {
    const where: Record<string, unknown> = { company_id: companyId };
    if (status) where.status = status;

    const { count, rows } = await Job.findAndCountAll({
      where,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['created_at', 'DESC']],
    });

    return {
      data: plain<IJob[]>(rows as unknown as Record<string, unknown>[]),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  /** Count applications per status for a given job (funnel building block). */
  async countByStatusForJob(jobId: string): Promise<Record<JobStatus, number>> {
    const results = (await Job.sequelize?.query(
      `SELECT status, COUNT(*)::int AS count
       FROM applications
       WHERE job_id = :jobId
       GROUP BY status`,
      { replacements: { jobId }, type: 'SELECT' as const },
    )) ?? [];
    const counts = {} as Record<JobStatus, number>;
    for (const status of Object.values(JobStatus)) {
      counts[status] = 0;
    }
    for (const row of results as Array<{ status: JobStatus; count: number }>) {
      counts[row.status] = row.count;
    }
    return counts;
  }

  /** Distinct active employment types (for filter UI). */
  async listEmploymentTypes(): Promise<EmploymentType[]> {
    const rows = (await Job.findAll({
      attributes: [[fn('DISTINCT', col('employment_type')), 'employment_type']],
      where: { status: JobStatus.PUBLISHED },
      raw: true,
    })) as Array<{ employment_type: EmploymentType }>;
    return rows.map((r) => r.employment_type);
  }

  /** Distinct active experience levels (for filter UI). */
  async listExperienceLevels(): Promise<ExperienceLevel[]> {
    const rows = (await Job.findAll({
      attributes: [[fn('DISTINCT', col('experience_level')), 'experience_level']],
      where: { status: JobStatus.PUBLISHED, experience_level: { [Op.ne]: null } },
      raw: true,
    })) as Array<{ experience_level: ExperienceLevel }>;
    return rows.map((r) => r.experience_level);
  }
}

export default new JobRepository();
