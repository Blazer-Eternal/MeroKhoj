import { Op, fn, col, Sequelize } from 'sequelize';
import Job from '../../models/job/jobModel';
import Company from '../../models/company/companyModel';
import JobCategory from '../../models/job/jobCategoryModel';
import Industry from '../../models/job/industryModel';
import Location from '../../models/job/locationModel';
import Skill from '../../models/job/skillModel';
import { IJob, IJobCreation, IJobSearchQuery } from '../../interfaces';
import { JobStatus, EmploymentType, ExperienceLevel } from '../../enums';
import { plain, IPaginationParams, buildPaginationMeta } from '../../utils';

export interface IPaginatedJobs {
  data: IJob[];
  meta: ReturnType<typeof buildPaginationMeta>;
}

/**
 * Sort keys the public search accepts. The map doubles as the allow-list:
 * a request can only ever pick one of these fixed fragments, so no request
 * value reaches SQL. `NULLS LAST` keeps rows without a deadline or a salary
 * from floating above the ones a candidate can act on.
 */
const JOB_SORTS: Record<string, string> = {
  newest: '"published_at" DESC NULLS LAST',
  oldest: '"published_at" ASC',
  deadline: '"application_deadline" ASC NULLS LAST',
  salary: 'COALESCE("salary_max", "salary_min") DESC NULLS LAST',
};

/** Data-access layer for the `jobs` table. */
class JobRepository {
  async findById(id: string): Promise<IJob | null> {
    const job = await Job.findByPk(id);
    return job ? (plain(job) as IJob) : null;
  }

  /** Batch load (for scoring): returns a map keyed by job id. */
  async findByIds(ids: string[]): Promise<Map<string, IJob>> {
    if (ids.length === 0) return new Map();
    const rows = await Job.findAll({ where: { id: { [Op.in]: ids } } });
    const map = new Map<string, IJob>();
    for (const row of rows as unknown as Record<string, unknown>[]) {
      const job = plain<IJob>(row);
      map.set(job.id, job);
    }
    return map;
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
      order: [Sequelize.literal(JOB_SORTS[query.sort ?? 'newest'] ?? JOB_SORTS.newest)],
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

  /**
   * Published jobs open for applications (optionally excluding ones the
   * candidate already applied to), with everything needed to score them:
   * company, classification, location and the job's skills.
   */
  async listOpenForCandidate(
    excludeJobIds: string[],
  ): Promise<
    Array<
      IJob & {
        category?: { id: string; name: string } | null;
        skills?: Array<{ id: string; name: string }>;
      }
    >
  > {
    const where: Record<string, unknown> = {
      status: JobStatus.PUBLISHED,
      [Op.or as unknown as string]: [
        { application_deadline: null },
        { application_deadline: { [Op.gte]: new Date() } },
      ],
    };
    if (excludeJobIds.length > 0) where.id = { [Op.notIn]: excludeJobIds };

    const rows = await Job.findAll({
      where,
      include: [
        { model: Company, as: 'company', attributes: ['id', 'name', 'slug', 'logo_url'] },
        { model: JobCategory, as: 'category', attributes: ['id', 'name', 'slug'] },
        { model: Industry, as: 'industry', attributes: ['id', 'name', 'slug'] },
        {
          model: Location,
          as: 'job_location',
          attributes: ['id', 'country', 'province', 'district', 'city'],
        },
        {
          model: Skill,
          as: 'skills',
          attributes: ['id', 'name'],
          through: { attributes: [] },
        },
      ],
      order: [['published_at', 'DESC']],
    });

    return plain(rows as unknown as Record<string, unknown>[]) as Array<
      IJob & {
        category?: { id: string; name: string } | null;
        skills?: Array<{ id: string; name: string }>;
      }
    >;
  }

  /**
   * Published jobs matching an alert's filter set (smart job alerts).
   * Unlike `search`, free-text `terms` are OR'd word-by-word: a saved search
   * for "react typescript frontend" should match any job containing at least
   * one of those words, not the single literal phrase.
   */
  async findPublishedMatching(filters: {
    terms?: string[];
    category_id?: string | null;
    location_id?: string | null;
    employment_type?: string | null;
    since?: Date | null;
    excludeJobIds?: string[];
  }): Promise<IJob[]> {
    const where: Record<string, unknown> = { status: JobStatus.PUBLISHED };

    if (filters.terms && filters.terms.length > 0) {
      const termWhere = filters.terms.map((term) => {
        const pattern = `%${term}%`;
        return [
          { title: { [Op.iLike]: pattern } },
          { description: { [Op.iLike]: pattern } },
        ];
      });
      where[Op.or as unknown as string] = termWhere.flat();
    }
    if (filters.category_id) where.category_id = filters.category_id;
    if (filters.location_id) where.location_id = filters.location_id;
    if (filters.employment_type) where.employment_type = filters.employment_type;
    if (filters.since) where.published_at = { [Op.gte]: filters.since };
    if (filters.excludeJobIds && filters.excludeJobIds.length > 0) {
      where.id = { [Op.notIn]: filters.excludeJobIds };
    }

    const rows = await Job.findAll({ where, order: [['published_at', 'DESC']] });
    return plain<IJob[]>(rows as unknown as Record<string, unknown>[]);
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

  /** How many of the company's jobs have ever been published (entitlement usage). */
  async countPublishedByCompany(companyId: string): Promise<number> {
    return Job.count({
      where: { company_id: companyId, published_at: { [Op.ne]: null } },
    });
  }

  /** Count applications per status for a given job (funnel building block). */  async countByStatusForJob(jobId: string): Promise<Record<JobStatus, number>> {
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
