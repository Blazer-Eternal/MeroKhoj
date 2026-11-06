import Link from 'next/link';
import { notFound } from 'next/navigation';
import { serverGet, serverList, ServerApiError } from '@/services/server-api';
import { Badge, StatusBadge } from '@/components/ui';
import { ApplyToJobButton, SaveJobButton } from '@/features/job/components/JobActions';
import type { Company, Job, JobSkillWithSkill } from '@/types';
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

  const [skillsRes, companyRes] = await Promise.allSettled([
    serverList<JobSkillWithSkill>(`/jobs/${jobId}/skills`, undefined, 'skills'),
    serverGet<{ company: Company }>(`/companies/${job.company_id}`),
  ]);

  const skills = skillsRes.status === 'fulfilled' ? skillsRes.value.data : [];
  const company = companyRes.status === 'fulfilled' ? companyRes.value.data.company : null;
  const accepting = job.status === 'PUBLISHED';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <nav className="mb-6 text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/jobs" className="hover:text-brand-600">Jobs</Link>
        <span className="mx-2">/</span>
        <span className="text-slate-700">{job.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <article className="space-y-6">
          <header className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900">{job.title}</h1>
                  {!accepting && <StatusBadge kind="job" value={job.status} />}
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  {company ? (
                    <Link href={`/companies/${company.id}`} className="font-semibold text-brand-600 hover:text-brand-700">
                      {company.name}
                    </Link>
                  ) : (
                    'Company'
                  )}
                  {' · '}{job.location ?? 'Remote'}
                  {' · '}Posted {timeAgo(job.published_at ?? job.created_at)}
                </p>
              </div>
              <div className="w-40">
                <SaveJobButton jobId={job.id} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="green">
                {formatSalaryRange(job.salary_min, job.salary_max, job.salary_currency)}
              </Badge>
              <Badge tone="blue">
                {EMPLOYMENT_TYPE_LABELS[job.employment_type] ?? job.employment_type}
              </Badge>
              {job.experience_level && (
                <Badge tone="purple">
                  {EXPERIENCE_LEVEL_LABELS[job.experience_level] ?? job.experience_level}
                </Badge>
              )}
              {job.vacancies > 1 && <Badge tone="teal">{job.vacancies} openings</Badge>}
              {job.application_deadline && (
                <Badge tone="amber">Deadline {formatDate(job.application_deadline)}</Badge>
              )}
            </div>
          </header>

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
                  <Badge key={s.skill_id} tone={s.importance === 'REQUIRED' ? 'red' : 'slate'}>
                    {s.skill?.name ?? s.skill_id}
                    {s.years_required ? ` · ${s.years_required}y` : ''}
                  </Badge>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sidebar */}
        <aside className="h-fit space-y-4 lg:sticky lg:top-20">
          <div className="card space-y-3">
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
                <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-lg font-bold text-brand-600">
                  {company.name.charAt(0).toUpperCase()}
                </span>
                <div>
                  <Link
                    href={`/companies/${company.id}`}
                    className="font-semibold text-slate-900 hover:text-brand-600"
                  >
                    {company.name}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {company.industry ?? 'Industry'} · {company.city ?? company.country}
                  </p>
                </div>
              </div>
              {company.verification_status === 'VERIFIED' && (
                <div className="mt-3">
                  <Badge tone="green">✓ Verified employer</Badge>
                </div>
              )}
              {company.description && (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{company.description}</p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
