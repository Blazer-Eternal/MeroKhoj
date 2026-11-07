import Link from 'next/link';
import { serverList } from '@/services/server-api';
import type { JobCategory, Job, Industry, Location } from '@/types';
import { excerpt } from '@/utils/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Job Categories' };

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-5 w-5">
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-5 w-5">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-5 w-5">
    <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

/** Taxonomy browser: functions, industries, and locations with live counts. */
export default async function JobCategoriesPage() {
  const [categoriesRes, jobsRes, industriesRes, locationsRes] = await Promise.allSettled([
    serverList<JobCategory>('/job-categories', { perPage: 100 }),
    serverList<Job>('/jobs', { perPage: 100 }),
    serverList<Industry>('/industries', { perPage: 100 }),
    serverList<Location>('/locations', { perPage: 100 }),
  ]);

  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [];
  const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.data : [];
  const industries = industriesRes.status === 'fulfilled' ? industriesRes.value.data : [];
  const locations = locationsRes.status === 'fulfilled' ? locationsRes.value.data : [];

  const countBy = (key: 'category_id' | 'industry_id' | 'location_id') => {
    const map = new Map<string, number>();
    for (const job of jobs) {
      const value = job[key];
      if (value) map.set(value, (map.get(value) ?? 0) + 1);
    }
    return map;
  };
  const categoryCounts = countBy('category_id');
  const industryCounts = countBy('industry_id');
  const locationCounts = countBy('location_id');

  return (
    <>
      <div className="border-b border-slate-100 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h1 className="font-display text-4xl font-extrabold text-slate-900">Job Categories</h1>
          <p className="mt-3 max-w-2xl text-lg text-slate-600">
            Every entry links straight into the live search, filtered to that field.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Functions */}
        <section>
          <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <FolderIcon />
            </span>
            Jobs by Function
          </h2>
          {categories.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
              <p className="font-semibold text-slate-700">No categories defined yet</p>
              <p className="mt-1 text-sm text-slate-500">
                Categories appear here as soon as they are added to the board.
              </p>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((category) => {
                const count = categoryCounts.get(category.id) ?? 0;
                return (
                  <Link
                    key={category.id}
                    href={`/jobs?category_id=${category.id}`}
                    className="group rounded-xl border border-slate-200 bg-white p-5 transition-colors hover:border-brand-300 hover:bg-brand-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900 group-hover:text-brand-700">
                        {category.name}
                      </h3>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                        {count} job{count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      {category.description
                        ? excerpt(category.description, 110)
                        : 'Browse open roles in this category.'}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Industries */}
        <section id="industries" className="mt-14 scroll-mt-24">
          <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <GridIcon />
            </span>
            Jobs by Industry
          </h2>
          <div className="mt-5 flex flex-wrap gap-3">
            {industries.map((industry) => (
              <Link
                key={industry.id}
                href={`/jobs?industry_id=${industry.id}`}
                className="group flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {industry.name}
                <span className="text-xs font-bold text-slate-400">
                  {industryCounts.get(industry.id) ?? 0}
                </span>
              </Link>
            ))}
            {industries.length === 0 && (
              <p className="text-sm text-slate-500">Industries will appear here shortly.</p>
            )}
          </div>
        </section>

        {/* Locations */}
        <section id="locations" className="mt-14 scroll-mt-24">
          <h2 className="flex items-center gap-2.5 font-display text-xl font-bold text-slate-900">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-600">
              <PinIcon />
            </span>
            Jobs by Location
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {locations.map((location) => (
              <Link
                key={location.id}
                href={`/jobs?location=${encodeURIComponent(location.city ?? location.name)}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50"
              >
                <span className="truncate text-sm font-semibold text-slate-700">
                  {location.city ?? location.name}
                </span>
                <span className="shrink-0 text-xs font-bold text-slate-400">
                  {locationCounts.get(location.id) ?? 0}
                </span>
              </Link>
            ))}
            {locations.length === 0 && (
              <p className="text-sm text-slate-500">Locations will appear here shortly.</p>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
