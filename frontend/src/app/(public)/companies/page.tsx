import Link from 'next/link';
import { serverList } from '@/services/server-api';
import { Badge } from '@/components/ui';
import type { Company } from '@/types';
import { COMPANY_SIZE_LABELS } from '@/lib/constants';
import { excerpt } from '@/utils/format';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'Companies' };

interface SearchParams {
  q?: string;
  page?: string;
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const res = await serverList<Company>('/companies', { q: params.q, page, perPage: 12 }).catch(
    () => null,
  );
  const companies = res?.data ?? [];
  const meta = (res?.meta ?? {}) as Record<string, number>;
  const failed = res === null;

  const buildHref = (overrides: Partial<SearchParams>): string => {
    const merged = { ...params, ...overrides };
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(merged)) {
      if (!value || key === 'page') continue;
      search.set(key, String(value));
    }
    const qs = search.toString();
    return qs ? `/companies?${qs}` : '/companies';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Company Directory</h1>
        <p className="mt-1 text-sm text-slate-500">
          {meta.total != null
            ? `${meta.total} verified compan${meta.total === 1 ? 'y' : 'ies'}`
            : 'Explore employers on MeroKhoj'}
        </p>
      </div>

      <form method="GET" action="/companies" className="mb-8 flex max-w-xl gap-2">
        <input
          type="search"
          name="q"
          defaultValue={params.q ?? ''}
          placeholder="Search companies by name…"
          className="input"
          aria-label="Search companies"
        />
        <button type="submit" className="btn-primary shrink-0">Search</button>
      </form>

      {failed ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
          The company directory is unavailable right now. Please try again in a moment.
        </div>
      ) : companies.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
          <p className="font-semibold text-slate-700">
            {params.q ? 'No companies match your search' : 'No companies listed yet'}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {params.q ? 'Try a different name.' : 'Employers appear here once they join.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-50 text-xl font-bold text-brand-600">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900 group-hover:text-brand-600">
                      {company.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {company.industry ?? 'Industry'} · {company.city ?? company.country}
                    </p>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 min-h-[3rem] text-sm text-slate-600">
                  {company.description ? excerpt(company.description, 140) : 'No description yet.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {company.verification_status === 'VERIFIED' && (
                    <Badge tone="green">✓ Verified</Badge>
                  )}
                  {company.company_size && (
                    <Badge tone="blue">
                      {COMPANY_SIZE_LABELS[company.company_size] ?? company.company_size} employees
                    </Badge>
                  )}
                  {company.website && <Badge tone="slate">Website</Badge>}
                </div>
              </Link>
            ))}
          </div>

          {(meta.totalPages ?? 1) > 1 && (
            <nav className="mt-8 flex items-center justify-between" aria-label="Pagination">
              <Link
                href={buildHref({ page: String(Math.max(1, page - 1)) })}
                className={`btn-secondary ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
              >
                ← Previous
              </Link>
              <span className="text-sm text-slate-500">
                Page {page} of {meta.totalPages}
              </span>
              <Link
                href={buildHref({ page: String(page + 1) })}
                className={`btn-secondary ${meta.hasNextPage ? '' : 'pointer-events-none opacity-50'}`}
              >
                Next →
              </Link>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
