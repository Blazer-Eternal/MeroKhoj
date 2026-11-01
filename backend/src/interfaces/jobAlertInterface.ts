import { JobAlertFrequency } from '../enums';
import { ITimestamps } from './commonInterface';

/**
 * A saved search ("job alert") that periodically matches new jobs.
 * `keywords` is a free-text search string; the classification fields narrow
 * matches to a category / location / employment type.
 */
export interface IJobAlert extends ITimestamps {
  id: string;
  user_id: string;
  name: string;
  keywords: string | null;
  category_id: string | null;
  location_id: string | null;
  employment_type: string | null;
  is_active: boolean;
  frequency: JobAlertFrequency;
  last_sent_at: Date | null;
}

export interface IJobAlertCreation {
  user_id: string;
  name: string;
  keywords?: string | null;
  category_id?: string | null;
  location_id?: string | null;
  employment_type?: string | null;
  is_active?: boolean;
  frequency?: JobAlertFrequency;
  last_sent_at?: Date | null;
}

export type IJobAlertUpdate = Partial<Omit<IJobAlertCreation, 'user_id'>>;
