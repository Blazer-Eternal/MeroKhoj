import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverGet, serverList, ServerApiError } from '@/services/server-api';
import { Badge } from '@/components/ui';
import { JobCard } from '@/features/job/components/JobCard';
import type { Company, Job } from '@/types';
import { COMPANY_SIZE_LABELS } from '@/lib/constants';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  try {
    const { data } = await serverGet<{ company: Company }>(`/companies/${companyId}`);
    return { title: data.company.name };
  } catch {
    return { title: 'Company profile' };
  }
}

export default async function CompanyProfilePage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  let company: Company;
  try {
    const res = await serverGet<{ company: Company }>(`/companies/${companyId}`);
    company = res.data.company;
  } catch (err) {
    if (err instanceof ServerApiError && (err.status === 404 || err.status === 401)) notFound();
    throw err;
  }

  const jobsRes = await serverList<Job>('/jobs', {
    company_id: companyId,
    status: 'PUBLISHED',
    perPage: 20,
  }).catch(() => null);

  const jobs = jobsRes?.data ?? [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/companies" className="hover:text-brand-600">Companies</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{company.name}</span>
      </nav>

      {/* Header card */}
      <header className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-start gap-5">
          <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-50 text-2xl font-black text-brand-600">
            {company.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              {company.verification_status === 'VERIFIED' && <Badge tone="green">✓ Verified</Badge>}
              {company.status !== 'ACTIVE' && <Badge tone="red">{company.status}</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {company.industry ?? 'Industry'} · {company.city ?? company.country}
              {company.company_size
                ? ` · ${COMPANY_SIZE_LABELS[company.company_size] ?? company.company_size} employees`
                : ''}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-3.5 w-3.5">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" />
                  </svg>
                  Website
                </a>
              )}
              {company.email && (
                <a
                  href={`mailto:${company.email}`}
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-3.5 w-3.5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path d="M3 7.5l9 6 9-6" />
                  </svg>
                  {company.email}
                </a>
              )}
              {company.phone && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-3.5 w-3.5">
                    <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
                  </svg>
                  {company.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        {company.description && (
          <div className="mt-5 border-t border-slate-100 pt-5">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              About {company.name}
            </h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {company.description}
            </p>
          </div>
        )}
      </header>

      {/* Open positions */}
      <section className="mt-8">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Open positions</h2>
            <p className="mt-1 text-sm text-slate-500">
              {jobs.length} published job{jobs.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {jobs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
            <p className="font-semibold text-slate-700">No open positions right now</p>
            <p className="mt-1 text-sm text-slate-500">Check back later or save this company.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
