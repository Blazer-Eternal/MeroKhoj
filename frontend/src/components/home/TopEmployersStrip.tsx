import Link from 'next/link';
import type { Company } from '@/types';

/** White logo strip under the hero (matches the reference Top Employers row). */
export function TopEmployersStrip({ companies }: { companies: Company[] }) {
  if (companies.length === 0) return null;

  return (
    <section className="border-y border-slate-100 bg-white">
      <div className="mx-auto flex max-w-7xl items-center gap-8 px-4 py-6 sm:px-6">
        <h2 className="shrink-0 font-display text-lg font-bold text-slate-900">Top Employers</h2>
        <div className="flex flex-1 items-center gap-5 overflow-x-auto">
          {companies.slice(0, 14).map((company) => (
            <Link
              key={company.id}
              href={`/companies/${company.id}`}
              title={company.name}
              className="flex h-11 shrink-0 items-center gap-2.5 rounded-lg border border-slate-100 bg-white px-4 shadow-sm transition-colors hover:border-brand-200"
            >
              {company.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={company.logo_url} alt="" className="h-6 w-6 object-contain" />
              ) : (
                <span className="grid h-6 w-6 place-items-center rounded bg-brand-600 text-[11px] font-black text-white">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              )}
              <span className="max-w-[120px] truncate text-xs font-semibold text-slate-500">
                {company.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
