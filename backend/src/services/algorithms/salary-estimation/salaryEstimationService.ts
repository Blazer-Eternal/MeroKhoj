import { ExperienceLevel } from '../../../enums';
import { analyticsRepository, ISalaryRow } from '../../../repositories';

/**
 * Salary estimation algorithm (Phase 1).
 *
 * Estimates a pay range from the board's own published postings using a
 * progressive filter-widening strategy:
 *
 *   category + location + level → drop level → drop location → drop category
 *                                → global sample
 *
 * The first tier that still leaves at least MIN_SAMPLE postings wins, so a
 * narrow query degrades gracefully instead of returning an empty "estimate".
 * Output mirrors the salary-insights UI: min / average / max plus a
 * distribution histogram the caller can render as bars.
 */

/** Smallest sample we accept before widening the filters. */
export const MIN_SAMPLE = 3;

/** Number of histogram buckets in the returned distribution. */
export const HISTOGRAM_BUCKETS = 8;

export interface ISalaryFilters {
  category_id?: string | null;
  location_id?: string | null;
  experience_level?: ExperienceLevel | null;
}

export interface ISalaryBucket {
  from: number;
  to: number;
  count: number;
}

export interface ISalaryEstimate {
  salary_min: number;
  salary_max: number;
  salary_avg: number;
  currency: string;
  sample_size: number;
  /** Filters actually used after widening (empty array = global sample). */
  applied_filters: Array<'category' | 'location' | 'experience_level'>;
  histogram: ISalaryBucket[];
}

/** Round to whole thousands — salary UIs never show 47,231. */
const roundMoney = (value: number): number => Math.round(value / 1000) * 1000;

const histogramOf = (midpoints: number[], from: number, to: number): ISalaryBucket[] => {
  const buckets: ISalaryBucket[] = [];
  const width = (to - from) / HISTOGRAM_BUCKETS || 1;
  for (let index = 0; index < HISTOGRAM_BUCKETS; index += 1) {
    const lower = from + width * index;
    const upper = index === HISTOGRAM_BUCKETS - 1 ? to : from + width * (index + 1);
    buckets.push({ from: Math.round(lower), to: Math.round(upper), count: 0 });
  }
  for (const value of midpoints) {
    const index = Math.min(HISTOGRAM_BUCKETS - 1, Math.max(0, Math.floor((value - from) / width)));
    buckets[index].count += 1;
  }
  return buckets;
};

/**
 * Widening ladder for a request: every requested filter first, then each one
 * dropped in turn (experience → location → category) down to the global sample.
 * Duplicated tiers (already-widest filters) are collapsed.
 */
export const buildSalaryTiers = (filters: ISalaryFilters): ISalaryFilters[] => {
  const base: ISalaryFilters = {
    category_id: filters.category_id ?? null,
    location_id: filters.location_id ?? null,
    experience_level: filters.experience_level ?? null,
  };

  const ladder: ISalaryFilters[] = [base];
  if (base.experience_level) ladder.push({ ...base, experience_level: null });
  if (base.location_id) {
    ladder.push({ ...base, experience_level: null, location_id: null });
  }
  if (base.category_id || base.location_id || base.experience_level) {
    ladder.push({ category_id: null, location_id: null, experience_level: null });
  }

  return ladder.filter(
    (tier, index) => index === 0 || JSON.stringify(tier) !== JSON.stringify(ladder[index - 1]),
  );
};

/**
 * Estimate a salary range for the given filters.
 * Returns null only when the board has no published salary data at all.
 */
export const estimateSalary = async (filters: ISalaryFilters): Promise<ISalaryEstimate | null> => {
  let samples: ISalaryRow[] = [];
  let usedTier: ISalaryFilters = { category_id: null, location_id: null, experience_level: null };

  for (const tier of buildSalaryTiers(filters)) {
    samples = await analyticsRepository.salaryRows(tier);
    usedTier = tier;
    if (samples.length >= MIN_SAMPLE) break;
  }
  if (samples.length === 0) return null;

  const lows = samples.map((row) => Number(row.salary_min));
  const highs = samples.map((row) => Number(row.salary_max));
  const midpoints = samples.map((row) => (Number(row.salary_min) + Number(row.salary_max)) / 2);

  const salaryMin = Math.min(...lows);
  const salaryMax = Math.max(...highs);
  const salaryAvg = midpoints.reduce((sum, value) => sum + value, 0) / midpoints.length;

  const appliedFilters: ISalaryEstimate['applied_filters'] = [];
  if (usedTier.category_id) appliedFilters.push('category');
  if (usedTier.location_id) appliedFilters.push('location');
  if (usedTier.experience_level) appliedFilters.push('experience_level');

  return {
    salary_min: roundMoney(salaryMin),
    salary_max: roundMoney(salaryMax),
    salary_avg: roundMoney(salaryAvg),
    currency: samples[0]?.salary_currency ?? 'NPR',
    sample_size: samples.length,
    applied_filters: appliedFilters,
    histogram: histogramOf(midpoints, salaryMin, salaryMax),
  };
};

export const salaryEstimationService = {
  estimateSalary,
  buildSalaryTiers,
  MIN_SAMPLE,
  HISTOGRAM_BUCKETS,
};

export default salaryEstimationService;
