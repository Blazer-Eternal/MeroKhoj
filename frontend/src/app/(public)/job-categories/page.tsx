import Link from 'next/link';
import { serverList } from '@/services/server-api';
import type { JobCategory, Job } from '@/types';
import { excerpt } from '@/utils/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Job Categories' };

/** Category grid with live job counts (counted from published jobs). */
export default async function JobCategoriesPage() {
  const [categoriesRes, jobsRes] = await Promise.allSettled([
    serverList<JobCategory>('/job-categories', { perPage: 100 }),
    serverList<Job>('/jobs', { perPage: 100 }),
  ]);

  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [];
  const jobs = jobsRes.status === 'fulfilled' ? jobsRes.value.data : [];

  const countByCategory = new Map<string, number>();
  for (const job of jobs) {
    if (job.category_id) {
      countByCategory.set(job.category_id, (countByCategory.get(job.category_id) ?? 0) + 1);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-2xl font-bold text-slate-900">Job Categories</h1>
        <p className="mt-2 text-sm text-slate-500">
          Browse openings by field — every category links straight into the live search
          filtered to that category.
        </p>
      </div>

      {categories.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <p className="font-semibold text-slate-700">No categories defined yet</p>
          <p className="mt-1 text-sm text-slate-500">The platform admin can add them in the admin area.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => {
            const count = countByCategory.get(category.id) ?? 0;
            return (
              <Link
                key={category.id}
                href={`/jobs?category_id=${category.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-lg">
                    📂
                  </span>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                    {count} job{count === 1 ? '' : 's'}
                  </span>
                </div>
                <h2 className="mt-3 font-semibold text-slate-900 group-hover:text-brand-600">
                  {category.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {category.description ? excerpt(category.description, 110) : 'Browse open roles in this category.'}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
