import { Op } from 'sequelize';
import JobseekerProfile from '../../models/jobseeker/jobseekerProfileModel';
import User from '../../models/user/userModel';
import { IJobseekerProfile, IJobseekerProfileCreation } from '../../interfaces';
import { ProfileVisibility } from '../../enums';
import { plain } from '../../utils';

/** Data-access layer for `jobseeker_profiles` (1:1 with users). */
class JobseekerProfileRepository {
  async findByUserId(userId: string): Promise<IJobseekerProfile | null> {
    const profile = await JobseekerProfile.findOne({ where: { user_id: userId } });
    return profile ? (plain(profile) as IJobseekerProfile) : null;
  }

  async findById(id: string): Promise<IJobseekerProfile | null> {
    const profile = await JobseekerProfile.findByPk(id);
    return profile ? (plain(profile) as IJobseekerProfile) : null;
  }

  /**
   * Batch load (recommendation/matching): profiles keyed by user id, each
   * joined with its user row (name/headline) — the public-facing candidates.
   */
  async listByUserIds(
    userIds: string[],
    options: { includeUser?: boolean } = {},
  ): Promise<Map<string, IJobseekerProfile & { user?: unknown }>> {
    const map = new Map<string, IJobseekerProfile & { user?: unknown }>();
    if (userIds.length === 0) return map;

    const rows = await JobseekerProfile.findAll({
      where: { user_id: { [Op.in]: userIds } },
      include: options.includeUser
        ? [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }]
        : [],
    });

    for (const row of rows as unknown as Array<
      IJobseekerProfile & { user?: unknown }
    >) {
      map.set(row.user_id, row);
    }
    return map;
  }

  /**
   * All searchable candidates for the talent pool (public profiles only),
   * joined with their user row. Batch-loaded so ranking happens in memory.
   */
  async listPublicWithUser(
    options: { limit?: number } = {},
  ): Promise<Array<IJobseekerProfile & { user?: unknown }>> {
    const rows = await JobseekerProfile.findAll({
      where: { profile_visibility: ProfileVisibility.PUBLIC },
      include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }],
      order: [['updated_at', 'DESC']],
      ...(options.limit ? { limit: options.limit } : {}),
    });
    return rows as unknown as Array<IJobseekerProfile & { user?: unknown }>;
  }

  /** Create the profile if absent, otherwise update it (upsert on user_id). */
  async upsertByUserId(payload: IJobseekerProfileCreation): Promise<IJobseekerProfile> {
    const [profile] = await JobseekerProfile.findOrCreate({
      where: { user_id: payload.user_id },
      defaults: payload,
    });
    // If it already existed, apply the incoming fields (excluding the key).
    const updates: Record<string, unknown> = { ...payload };
    delete updates.user_id;
    if (Object.keys(updates).length > 0) {
      await profile.update(updates);
    }
    return plain(profile) as IJobseekerProfile;
  }

  async updateByUserId(
    userId: string,
    updates: Partial<IJobseekerProfile>,
  ): Promise<IJobseekerProfile | null> {
    const profile = await JobseekerProfile.findOne({ where: { user_id: userId } });
    if (!profile) return null;
    await profile.update(updates);
    return plain(profile) as IJobseekerProfile;
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    const deleted = await JobseekerProfile.destroy({ where: { user_id: userId } });
    return deleted > 0;
  }
}

export default new JobseekerProfileRepository();
