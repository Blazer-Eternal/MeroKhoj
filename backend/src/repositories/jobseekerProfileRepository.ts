import JobseekerProfile from '../models/jobseekerProfileModel';
import { IJobseekerProfile, IJobseekerProfileCreation } from '../interfaces';
import { plain } from '../utils';

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
