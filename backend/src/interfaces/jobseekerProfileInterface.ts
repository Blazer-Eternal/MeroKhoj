import { ProfileVisibility, Availability } from '../enums';
import { ITimestamps } from './commonInterface';

/** Professional profile, one per user (1:1 with users). */
export interface IJobseekerProfile extends ITimestamps {
  id: string;
  user_id: string;
  headline: string | null;
  professional_summary: string | null;
  date_of_birth: Date | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  profile_photo_url: string | null;
  expected_salary: number | null;
  availability: Availability | null;
  profile_visibility: ProfileVisibility;
}

export interface IJobseekerProfileCreation {
  user_id: string;
  headline?: string | null;
  professional_summary?: string | null;
  date_of_birth?: Date | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  profile_photo_url?: string | null;
  expected_salary?: number | null;
  availability?: Availability | null;
  profile_visibility?: ProfileVisibility;
}

/** Partial update payload for a jobseeker profile. */
export type IJobseekerProfileUpdate = Partial<Omit<IJobseekerProfileCreation, 'user_id'>>;
