import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverGet, serverList, ServerApiError } from '@/services/server-api';
import { StatusBadge } from '@/components/ui';
import { Watermark } from '@/components/home/Watermark';
import {
  ApplyToJobButton,
  SaveJobButton,
  ShareJobButton,
} from '@/features/job/components/JobActions';
import { CompanyLogo, JobCard } from '@/features/job/components/JobCard';
import type { Company, Industry, Job, JobCategory, JobSkillWithSkill } from '@/types';
import {
  EMPLOYMENT_TYPE_LABELS,
  EXPERIENCE_LEVEL_LABELS,
} from '@/lib/constants';
import { formatDate, formatSalaryRange, timeAgo } from '@/utils/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await params;
  try {
    const { data } = await serverGet<Job>(`/jobs/${jobId}`);
    return { title: data.title };
  } catch {
    return { title: 'Job details' };
  }
}

const metaIcon = (path: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden className="h-4 w-4">
    {path}
  </svg>
);

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;

  let job: Job;
  try {
    const res = await serverGet<{ job: Job }>(`/jobs/${jobId}`);
    job = res.data.job;
  } catch (err) {
    if (err instanceof ServerApiError && err.status === 404) notFound();
    throw err;
  }

  const similarQuery = job.category_id
    ? { category_id: job.category_id, perPage: 5 }
    : { employment_type: job.employment_type, perPage: 5 };

  const [skillsRes, companyRes, categoriesRes, industriesRes, similarRes] = await Promise.allSettled([
    serverList<JobSkillWithSkill>(`/jobs/${jobId}/skills`, undefined, 'skills'),
    serverGet<{ company: Company }>(`/companies/${job.company_id}`),
    serverList<JobCategory>('/job-categories', { perPage: 100 }),
    serverList<Industry>('/industries', { perPage: 100 }),
    serverList<Job>('/jobs', similarQuery),
  ]);

  const skills = skillsRes.status === 'fulfilled' ? skillsRes.value.data : [];
  const company = companyRes.status === 'fulfilled' ? companyRes.value.data.company : null;
  const categories = categoriesRes.status === 'fulfilled' ? categoriesRes.value.data : [];
  const industries = industriesRes.status === 'fulfilled' ? industriesRes.value.data : [];
  const accepting = job.status === 'PUBLISHED';

  const category = categories.find((item) => item.id === job.category_id) ?? null;
  const industry = industries.find((item) => item.id === job.industry_id) ?? null;
  const similar = (similarRes.status === 'fulfilled' ? similarRes.value.data : [])
    .filter((item) => item.id !== job.id)
    .slice(0, 4);

  const place = job.location ?? company?.city ?? company?.country ?? 'Remote';

  const details: { label: string; value: React.ReactNode; icon: React.ReactNode }[] = [
    category && { label: 'Category', value: <Link href={`/jobs?category_id=${category.id}`} className="hover:text-brand-600">{category.name}</Link>, icon: metaIcon(<><rect x="4" y="4" width="7" height="7" rx="1.5" /><rect x="13" y="4" width="7" height="7" rx="1.5" /><rect x="4" y="13" width="7" height="7" rx="1.5" /><rect x="13" y="13" width="7" height="7" rx="1.5" /></>) },
    industry && { label: 'Industry', value: industry.name, icon: metaIcon(<><path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v16M15 21V9h4a2 2 0 0 1 2 2v10" /><path strokeLinecap="round" d="M9 7h2M9 11h2M9 15h2" /></>) },
    { label: 'Job type', value: EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type, icon: metaIcon(<><rect x="3" y="7.5" width="18" height="12.5" rx="2" /><path d="M8.5 7.5V6a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v1.5" /></>) },
    job.experience_level && { label: 'Level', value: EXPERIENCE_LEVEL_LABELS[job.experience_level] ?? job.experience_level, icon: metaIcon(<path strokeLinecap="round" d="M4 20V11M10 20V4.5M16 20v-6.5M2 20h20" />) },
    { label: 'Location', value: place, icon: metaIcon(<><path strokeLinecap="round" strokeLinejoin="round" d="M12 21s-6.5-5.2-6.5-10.5a6.5 6.5 0 1 1 13 0C18.5 15.8 12 21 12 21z" /><circle cx="12" cy="10.5" r="2.4" /></>) },
    { label: 'Openings', value: `${job.vacancies} ${job.vacancies === 1 ? 'position' : 'positions'}`, icon: metaIcon(<><circle cx="9" cy="8.5" r="3.4" /><path strokeLinecap="round" d="M2.8 20c0-3.3 2.8-5.4 6.2-5.4s6.2 2.1 6.2 5.4" /><path strokeLinecap="round" d="M16.2 5.7a3.4 3.4 0 0 1 0 6.6M18.4 20c0-2.3-.9-4.1-2.4-5.2" /></>) },
    { label: 'Salary', value: formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency), icon: metaIcon(<><circle cx="12" cy="12" r="8.5" /><path strokeLinecap="round" d="M14.6 9.6c-.6-.7-1.5-1.1-2.6-1.1-1.4 0-2.4.7-2.4 1.8 0 2.6 5.2 1.3 5.2 4 0 1.2-1.1 2-2.7 2-1.2 0-2.3-.4-3-1.3M12 6.6v10.8" /></>) },
    job.experience_requirement && { label: 'Experience', value: job.experience_requirement, icon: metaIcon(<><path strokeLinecap="round" strokeLinejoin="round" d="M4 17.5h16M6 17.5v-2a6 6 0 0 1 12 0v2M10 6.5h4M12 6.5v-2" /></>) },
    job.education_requirement && { label: 'Education', value: job.education_requirement, icon: metaIcon(<><path strokeLinecap="round" strokeLinejoin="round" d="M3 9l9-4 9 4-9 4-9-4z" /><path strokeLinecap="round" strokeLinejoin="round" d="M7 11.2V16c0 1.4 2.2 2.6 5 2.6s5-1.2 5-2.6v-4.8" /></>) },
    job.application_deadline && { label: 'Apply before', value: formatDate(job.application_deadline), icon: metaIcon(<><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path strokeLinecap="round" d="M3.5 9.5h17M8 3.5v3M16 3.5v3" /></>) },
  ].filter(Boolean) as { label: string; value: React.ReactNode; icon: React.ReactNode }[];

  return (
    <>
      {/* Branded cover */}
      <div className="relative overflow-hidden bg-navy-900">
        <Watermark className="text-white/[0.07]" />
        <div className="relative mx-auto max-w-7xl px-4 pb-24 pt-7 sm:px-6">
          <nav className="flex flex-wrap items-center gap-2 text-sm" aria-label="Breadcrumb">
            <Link href="/jobs" className="font-semibold text-white/75 hover:text-white">
              Jobs
            </Link>
            <span aria-hidden className="text-white/35">/</span>
            {category && (
              <>
                <Link
                  href={`/jobs?category_id=${category.id}`}
                  className="text-white/60 hover:text-white"
                >
                  {category.name}
                </Link>
                <span aria-hidden className="text-white/35">/</span>
              </>
            )}
            <span className="truncate text-white/90">{job.title}</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Header, pulled up over the cover */}
        <div
          className="mk-rise relative z-10 -mt-16 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_28px_56px_-36px_rgba(15,23,42,0.55)]"
          style={{ '--mk-delay': '40ms' } as React.CSSProperties}
        >
          <div className="flex flex-wrap items-start gap-5">
            <CompanyLogo
              name={company?.name}
              logoUrl={company?.logo_url}
              size="h-20 w-20"
              letterClass="text-3xl"
            />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="font-display text-2xl font-extrabold leading-tight text-slate-900 sm:text-3xl">
                  {job.title}
                </h1>
                {!accepting && <StatusBadge kind="job" value={job.status} />}
              </div>
              <p className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-slate-500">
                {company ? (
                  <Link
                    href={`/companies/${company.id}`}
                    className="font-semibold text-brand-600 hover:text-brand-700"
                  >
                    {company.name}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-600">Company</span>
                )}
                <span aria-hidden className="text-slate-300">·</span>
                <span>{place}</span>
                <span aria-hidden className="text-slate-300">·</span>
                <span>Posted {timeAgo(job.published_at ?? job.created_at)}</span>
              </p>
            </div>

            <div className="flex w-full shrink-0 flex-col gap-2 sm:w-40">
              <SaveJobButton jobId={job.id} />
              <ShareJobButton title={job.title} path={`/jobs/${job.id}`} />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          {/* Main */}
          <article className="space-y-6">
            {/* Vertical icon meta list */}
            <section
              className="mk-rise card"
              style={{ '--mk-delay': '120ms' } as React.CSSProperties}
            >
              <h2 className="text-lg font-semibold text-slate-900">Job details</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {details.map((row) => (
                  <div key={row.label} className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"
                    >
                      {row.icon}
                    </span>
                    <div className="min-w-0">
                      <dt className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        {row.label}
                      </dt>
                      <dd className="mt-0.5 text-sm font-semibold leading-snug text-slate-800">
                        {row.value}
                      </dd>
                    </div>
                  </div>
                ))}
              </dl>
            </section>

            <section className="card">
              <h2 className="text-lg font-semibold text-slate-900">Job description</h2>
              <div className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {job.description}
              </div>
            </section>

            {(job.education_requirement || job.experience_requirement) && (
              <section className="card">
                <h2 className="text-lg font-semibold text-slate-900">Requirements</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {job.education_requirement && (
                    <div className="flex gap-3">
                      <dt className="w-40 shrink-0 font-medium text-slate-500">Education</dt>
                      <dd className="text-slate-700">{job.education_requirement}</dd>
                    </div>
                  )}
                  {job.experience_requirement && (
                    <div className="flex gap-3">
                      <dt className="w-40 shrink-0 font-medium text-slate-500">Experience</dt>
                      <dd className="text-slate-700">{job.experience_requirement}</dd>
                    </div>
                  )}
                </dl>
              </section>
            )}

            {skills.length > 0 && (
              <section className="card">
                <h2 className="text-lg font-semibold text-slate-900">Skills</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <span
                      key={s.skill_id}
                      className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                        s.importance === 'REQUIRED'
                          ? 'bg-brand-50 text-brand-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {s.skill?.name ?? s.skill_id}
                      {s.years_required ? ` · ${s.years_required}y` : ''}
                    </span>
                  ))}
                </div>
              </section>
            )}
          </article>

          {/* Sidebar */}
          <aside className="h-fit space-y-4 lg:sticky lg:top-20">
            <div
              className="mk-rise card space-y-3"
              style={{ '--mk-delay': '180ms' } as React.CSSProperties}
            >
              <ApplyToJobButton jobId={job.id} disabled={!accepting} />
              <p className="text-center text-xs text-slate-400">
                Applies directly through MeroKhoj
              </p>
            </div>

            {company && (
              <div className="card">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                  About the company
                </h3>
                <div className="mt-3 flex items-center gap-3">
                  <CompanyLogo name={company.name} logoUrl={company.logo_url} size="h-11 w-11" />
                  <div className="min-w-0">
                    <Link
                      href={`/companies/${company.id}`}
                      className="block truncate font-semibold text-slate-900 hover:text-brand-600"
                    >
                      {company.name}
                    </Link>
                    <p className="truncate text-xs text-slate-500">
                      {company.industry ?? 'Industry'} · {company.city ?? company.country}
                    </p>
                  </div>
                </div>
                {company.verification_status === 'VERIFIED' && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700">
                    <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-4 w-4">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.7-9.3a1 1 0 0 0-1.4-1.4L9 10.6 7.7 9.3a1 1 0 0 0-1.4 1.4l2 2a1 1 0 0 0 1.4 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Verified employer
                  </p>
                )}
                {company.description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {company.description}
                  </p>
                )}
                <Link
                  href={`/companies/${company.id}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-700"
                >
                  View company profile
                  <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden className="h-3.5 w-3.5">
                    <path
                      fillRule="evenodd"
                      d="M7.3 4.3a1 1 0 0 1 1.4 0l5 5a1 1 0 0 1 0 1.4l-5 5a1 1 0 1 1-1.4-1.4L11.6 11H4a1 1 0 1 1 0-2h7.6L7.3 5.7a1 1 0 0 1 0-1.4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Link>
              </div>
            )}
          </aside>
        </div>

        {/* Similar jobs */}
        {similar.length > 0 && (
          <section className="py-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-xl font-extrabold text-slate-900">
                  Similar jobs
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {category
                    ? `More openings in ${category.name}`
                    : `More ${EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? 'matching'} roles`}
                </p>
              </div>
              <Link
                href={category ? `/jobs?category_id=${category.id}` : '/jobs'}
                className="text-sm font-bold text-brand-600 hover:text-brand-700"
              >
                View all
              </Link>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {similar.map((item) => (
                <JobCard key={item.id} job={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
