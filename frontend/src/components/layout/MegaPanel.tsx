'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { apiCollection } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import type { Company, Industry, Job, JobCategory, Location } from '@/types';

type TabKey = 'function' | 'organization' | 'industry' | 'title' | 'location';

interface TabItem {
  label: string;
  href: string;
  count: number;
}

type MenuItems = Record<TabKey, TabItem[]>;

const TABS: { key: TabKey; label: string; viewAll: string }[] = [
  { key: 'function', label: 'Jobs by Function', viewAll: '/job-categories' },
  { key: 'organization', label: 'Jobs by Organization', viewAll: '/companies' },
  { key: 'industry', label: 'Jobs by Industry', viewAll: '/job-categories#industries' },
  { key: 'title', label: 'Jobs by Title', viewAll: '/jobs' },
  { key: 'location', label: 'Jobs by Location', viewAll: '/job-categories#locations' },
];

const countBy = (
  jobs: Job[],
  key: 'category_id' | 'industry_id' | 'location_id' | 'company_id',
): Map<string, number> => {
  const map = new Map<string, number>();
  for (const job of jobs) {
    const value = job[key];
    if (value) map.set(value, (map.get(value) ?? 0) + 1);
  }
  return map;
};

function buildItems(
  jobs: Job[],
  categories: JobCategory[],
  industries: Industry[],
  locations: Location[],
  companies: Company[],
): MenuItems {
  const categoryCounts = countBy(jobs, 'category_id');
  const industryCounts = countBy(jobs, 'industry_id');
  const locationCounts = countBy(jobs, 'location_id');
  const companyCounts = countBy(jobs, 'company_id');

  const titleCounts = new Map<string, number>();
  for (const job of jobs) titleCounts.set(job.title, (titleCounts.get(job.title) ?? 0) + 1);

  // Locations can repeat across records; keep one entry per city with its total.
  const cityCounts = new Map<string, number>();
  for (const location of locations) {
    const city = location.city ?? location.name;
    cityCounts.set(city, (cityCounts.get(city) ?? 0) + (locationCounts.get(location.id) ?? 0));
  }

  return {
    function: categories.map((category) => ({
      label: category.name,
      href: `/jobs?category_id=${category.id}`,
      count: categoryCounts.get(category.id) ?? 0,
    })),
    organization: companies.map((company) => ({
      label: company.name,
      href: `/companies/${company.id}`,
      count: companyCounts.get(company.id) ?? 0,
    })),
    industry: industries.map((industry) => ({
      label: industry.name,
      href: `/jobs?industry_id=${industry.id}`,
      count: industryCounts.get(industry.id) ?? 0,
    })),
    title: [...titleCounts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 18)
      .map(([title, count]) => ({
        label: title,
        href: `/jobs?q=${encodeURIComponent(title)}`,
        count,
      })),
    location: [...cityCounts.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([city, count]) => ({
        label: city,
        href: `/jobs?location=${encodeURIComponent(city)}`,
        count,
      })),
  };
}

const ChevronRight = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-3 w-3 shrink-0">
    <path
      fillRule="evenodd"
      d="M7.2 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.58 10 7.2 5.7a1 1 0 0 1 0-1.4Z"
      clipRule="evenodd"
    />
  </svg>
);

/**
 * "Browse Jobs" mega menu (merojob-style): category rail on the left,
 * live counts computed from the published job board on the right.
 *
 * Data loads once per page load through a module-level cache so reopening
 * the panel is instant, and StrictMode's double-invoked effects cannot
 * cancel the only in-flight request.
 */
const EMPTY_MENU: MenuItems = {
  function: [],
  organization: [],
  industry: [],
  title: [],
  location: [],
};

let menuCache: Promise<MenuItems> | null = null;

function loadMenuItems(): Promise<MenuItems> {
  if (!menuCache) {
    menuCache = (async () => {
      const [jobsR, categoriesR, industriesR, locationsR, companiesR] = await Promise.allSettled([
        apiCollection<Job>(endpoints.jobs.search, { query: { perPage: 100 }, anonymous: true }),
        apiCollection<JobCategory>(endpoints.jobCategories.list, { anonymous: true }),
        apiCollection<Industry>(endpoints.industries.list, { anonymous: true }),
        apiCollection<Location>(endpoints.locations.list, { anonymous: true }),
        apiCollection<Company>(endpoints.companies.list, {
          query: { perPage: 100 },
          anonymous: true,
        }),
      ]);

      const jobs = jobsR.status === 'fulfilled' ? jobsR.value.data : [];
      const categories = categoriesR.status === 'fulfilled' ? categoriesR.value.data : [];
      const industries = industriesR.status === 'fulfilled' ? industriesR.value.data : [];
      const locations = locationsR.status === 'fulfilled' ? locationsR.value.data : [];
      const companies = companiesR.status === 'fulfilled' ? companiesR.value.data : [];
      return buildItems(jobs, categories, industries, locations, companies);
    })().catch((err) => {
      menuCache = null; // allow the next open to retry
      throw err;
    });
  }
  return menuCache;
}

export function MegaPanel({ onClose }: { onClose: () => void }) {
  const [active, setActive] = useState<TabKey>('function');
  const [items, setItems] = useState<MenuItems | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    loadMenuItems()
      .then((result) => {
        if (!cancelled) setItems(result);
      })
      .catch(() => {
        if (!cancelled) setItems(EMPTY_MENU);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const current = useMemo(() => TABS.find((tab) => tab.key === active) ?? TABS[0], [active]);
  const list = items?.[active] ?? [];

  return (
    <div className="fixed inset-x-0 top-[72px] z-50 hidden px-4 lg:block">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-b-2xl border border-t-0 border-slate-200 bg-white shadow-2xl">
        <div className="grid grid-cols-[260px_1fr]">
          <nav className="border-r border-slate-100 py-6 pl-6 pr-3" aria-label="Browse jobs by">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActive(tab.key)}
                aria-current={active === tab.key ? 'true' : undefined}
                className={`flex w-full items-center justify-between rounded-lg px-4 py-2.5 text-left text-sm font-semibold transition-colors ${
                  active === tab.key
                    ? 'text-brand-600'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-brand-600'
                }`}
              >
                {tab.label}
                {active === tab.key && <ChevronRight />}
              </button>
            ))}
          </nav>

          <div className="px-8 py-6">
            {items === null ? (
              <div className="grid gap-x-8 gap-y-3 md:grid-cols-2 xl:grid-cols-3" aria-hidden>
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="h-5 animate-pulse rounded bg-slate-100" />
                ))}
              </div>
            ) : list.length === 0 ? (
              <p className="py-6 text-sm text-slate-500">
                Nothing listed here yet. Check back soon.
              </p>
            ) : (
              <div className="grid max-h-[46vh] gap-x-8 gap-y-1 overflow-y-auto md:grid-cols-2 xl:grid-cols-3">
                {list.map((item) => (
                  <Link
                    key={`${item.href}-${item.label}`}
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-center justify-between gap-4 rounded-md px-3 py-2 hover:bg-brand-50"
                  >
                    <span className="flex min-w-0 items-center gap-2.5 text-sm font-medium text-slate-700 group-hover:text-brand-700">
                      <span className="text-slate-400 group-hover:text-brand-500">
                        <ChevronRight />
                      </span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-slate-900">{item.count}</span>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-4 flex justify-end border-t border-slate-100 pt-3">
              <Link
                href={current.viewAll}
                onClick={onClose}
                className="text-sm font-bold text-brand-600 hover:text-brand-700"
              >
                View All
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
