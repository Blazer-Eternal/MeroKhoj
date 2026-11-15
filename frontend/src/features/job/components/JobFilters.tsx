'use client';

import { useState } from 'react';
import Link from 'next/link';
import { EMPLOYMENT_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '@/lib/constants';
import type { Industry, JobCategory } from '@/types';

export interface JobFilterValues {
  q?: string;
  location?: string;
  employment_type?: string;
  experience_level?: string;
  category_id?: string;
  industry_id?: string;
  salary_min?: string;
  salary_max?: string;
}

interface Props {
  values: JobFilterValues;
  categories: JobCategory[];
  industries: Industry[];
  /** Preserved across an apply so a sort choice survives filtering. */
  sort?: string;
  /** Number of active filters, shown on the mobile toggle. */
  activeCount: number;
}

/**
 * Filter sidebar. Collapses behind a toggle on small screens (where a full
 * stacked form otherwise pushes every result below the fold) and is always
 * open from `lg` up. Submits as a plain GET, so results stay shareable.
 */
export function JobFilters({ values, categories, industries, sort, activeCount }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <div className="lg:sticky lg:top-20 lg:self-start">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls="job-filters"
        className="btn-secondary w-full justify-between lg:hidden"
      >
        <span className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.9} aria-hidden className="h-4 w-4">
            <path strokeLinecap="round" d="M4 7h16M7 12h10M10 17h4" />
          </svg>
          Filters
          {activeCount > 0 && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold text-white">
              {activeCount}
            </span>
          )}
        </span>
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path
            fillRule="evenodd"
            d="M5.3 7.3a1 1 0 0 1 1.4 0L10 10.6l3.3-3.3a1 1 0 1 1 1.4 1.4l-4 4a1 1 0 0 1-1.4 0l-4-4a1 1 0 0 1 0-1.4z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      <div
        id="job-filters"
        className={`${open ? 'block' : 'hidden'} mt-3 rounded-xl border border-slate-200 bg-white p-5 lg:mt-0 lg:block`}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-bold text-slate-900">Filters</h2>
          {activeCount > 0 && (
            <Link href="/jobs" className="text-xs font-bold text-brand-600 hover:text-brand-700">
              Clear all
            </Link>
          )}
        </div>

        <form method="GET" action="/jobs" className="space-y-4">
          {sort && <input type="hidden" name="sort" value={sort} />}

          <div>
            <label htmlFor="f-q" className="label">Keyword</label>
            <input
              id="f-q"
              type="search"
              name="q"
              defaultValue={values.q ?? ''}
              placeholder="Title, skill, keyword"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="f-location" className="label">Location</label>
            <input
              id="f-location"
              type="text"
              name="location"
              defaultValue={values.location ?? ''}
              placeholder="e.g. Kathmandu"
              className="input"
            />
          </div>

          <div>
            <label htmlFor="f-employment" className="label">Job type</label>
            <select
              id="f-employment"
              name="employment_type"
              defaultValue={values.employment_type ?? ''}
              className="input"
            >
              <option value="">Any type</option>
              {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-experience" className="label">Experience level</label>
            <select
              id="f-experience"
              name="experience_level"
              defaultValue={values.experience_level ?? ''}
              className="input"
            >
              <option value="">Any level</option>
              {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-category" className="label">Category</label>
            <select
              id="f-category"
              name="category_id"
              defaultValue={values.category_id ?? ''}
              className="input"
            >
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="f-industry" className="label">Industry</label>
            <select
              id="f-industry"
              name="industry_id"
              defaultValue={values.industry_id ?? ''}
              className="input"
            >
              <option value="">All industries</option>
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>{industry.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="f-salary-min" className="label">Min salary</label>
              <input
                id="f-salary-min"
                type="number"
                name="salary_min"
                min={0}
                defaultValue={values.salary_min ?? ''}
                placeholder="0"
                className="input"
              />
            </div>
            <div>
              <label htmlFor="f-salary-max" className="label">Max salary</label>
              <input
                id="f-salary-max"
                type="number"
                name="salary_max"
                min={0}
                defaultValue={values.salary_max ?? ''}
                placeholder="Any"
                className="input"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" className="btn-primary flex-1">Apply filters</button>
            <Link href="/jobs" className="btn-secondary">Reset</Link>

          </div>
        </form>
      </div>
    </div>
  );
}
