'use client';

/**
 * Admin company directory — read-only overview of every company on the
 * platform.
 *
 *   GET /companies?q=&status=&verification_status=&page=&perPage=
 *
 * Admin callers see the full catalog (the backend only forces
 * ACTIVE+VERIFIED for anonymous visitors), so all filters are optional and
 * a blank filter set means "every company".
 *
 * There is no admin company status action on the backend (see
 * companyRoutes.ts): status/verification changes happen through the
 * verification review queue, which this page deep-links to.
 */
import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { endpoints, withQuery } from '@/services/api-endpoints';
import { Button, Badge, StatusBadge, Spinner, EmptyState, Input, Select } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { CompanyStatus, CompanyVerificationStatus } from '@/enums';
import type { Company } from '@/types';
import { timeAgo } from '@/utils/format';

const STATUS_TONES: Record<CompanyStatus, 'green' | 'slate' | 'red'> = {
  [CompanyStatus.ACTIVE]: 'green',
  [CompanyStatus.INACTIVE]: 'slate',
  [CompanyStatus.SUSPENDED]: 'red',
};

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminCompaniesPage() {
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [status, setStatus] = useState('');
  const [verification, setVerification] = useState('');

  const companies = useApiList<Company>(
    withQuery(endpoints.companies.list, {
      q,
      status,
      verification_status: verification,
      perPage: 100,
    }),
  );

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setQ(draft.trim());
  };

  const hasFilters = Boolean(q || status || verification);

  const clearFilters = () => {
    setQ('');
    setDraft('');
    setStatus('');
    setVerification('');
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Companies</h1>
          <p className="mt-1 text-sm text-slate-500">
            {companies.data.length} compan{companies.data.length === 1 ? 'y' : 'ies'} shown ·
            admins see every company regardless of status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={submitSearch} className="flex items-center gap-2">
            <div className="w-56">
              <Input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Search company name"
                aria-label="Search companies"
              />
            </div>
            <Button type="submit" variant="secondary">
              Search
            </Button>
          </form>
          <Link href="/admin/company-verifications" className="btn-secondary">
            Verification queue
          </Link>
        </div>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by company status"
          >
            <option value="">All statuses</option>
            {Object.values(CompanyStatus).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <Select
            value={verification}
            onChange={(e) => setVerification(e.target.value)}
            aria-label="Filter by verification status"
          >
            <option value="">All verification states</option>
            {Object.values(CompanyVerificationStatus).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
      </div>

      {companies.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading companies…
        </div>
      ) : companies.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {companies.error}
        </div>
      ) : companies.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="building" className="h-10 w-10" />}
          title={hasFilters ? 'No companies match those filters' : 'No companies yet'}
          description={
            hasFilters
              ? 'Try a different name, status or verification state.'
              : 'Employer companies appear here once they register.'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {companies.data.map((company, index) => (
            <li
              key={company.id}
              className="card lift mk-rise"
              style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <NavIcon name="building" className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{company.name}</p>
                      <Badge tone={STATUS_TONES[company.status]}>{humanize(company.status)}</Badge>
                      <StatusBadge kind="verification" value={company.verification_status} />
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">
                      {company.industry ?? 'Industry not set'} · {company.city ?? company.country}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Joined {timeAgo(company.created_at)}
                      {company.website ? ` · ${company.website}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/companies/${company.id}`} className="btn-secondary px-3 py-1.5 text-xs">
                    Public profile
                  </Link>
                  <Link
                    href={`/admin/jobs?company=${company.id}`}
                    className="btn-secondary px-3 py-1.5 text-xs"
                  >
                    Jobs
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-400">
        Company status changes are not exposed as an admin action. Verification
        decisions are made in the verification queue, and they update the
        company verification state directly.
      </p>
    </div>
  );
}
