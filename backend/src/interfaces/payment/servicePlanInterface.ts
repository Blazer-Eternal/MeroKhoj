import { CatalogStatus } from '../../enums';
import { ITimestamps } from '../shared/commonInterface';

/**
 * A purchasable recruitment package (entity 33).
 *
 * Admin-managed catalog. Deactivating a plan never affects the price or
 * terms of previously purchased orders (those live on as snapshots).
 * `job_posting_limit` NULL means unlimited postings; `duration_days` NULL
 * means the entitlement never expires.
 */
export interface IServicePlan extends ITimestamps {
  id: string;
  name: string;
  description: string | null;
  /** DECIMAL(12,2) — never floating point in the database. */
  price: number;
  currency: string;
  duration_days: number | null;
  /** NULL = unlimited job postings. */
  job_posting_limit: number | null;
  featured_jobs_limit: number;
  status: CatalogStatus;
}

export interface IServicePlanCreation {
  name: string;
  description?: string | null;
  price: number;
  currency?: string;
  duration_days?: number | null;
  job_posting_limit?: number | null;
  featured_jobs_limit?: number;
  status?: CatalogStatus;
}
