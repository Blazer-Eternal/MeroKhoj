'use client';

/**
 * Company verification review queue.
 *
 *   GET  /admin/verifications/pending → { verifications: CompanyVerification[] }
 *   PATCH /admin/verifications/:id/review { status: VERIFIED | REJECTED, remarks? }
 *
 * Approving marks the company VERIFIED; rejecting sets REJECTED and the
 * company can resubmit its documents. The queue only ever contains PENDING
 * entries, so rows disappear after a decision.
 */
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiPatch, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  StatusBadge,
  Spinner,
  EmptyState,
  Modal,
  Field,
  Textarea,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { CompanyVerificationStatus } from '@/enums';
import type { Company, CompanyVerification } from '@/types';
import { timeAgo } from '@/utils/format';

type Decision = CompanyVerificationStatus.VERIFIED | CompanyVerificationStatus.REJECTED;

export default function CompanyVerificationsPage() {
  const queue = useApiList<CompanyVerification>(endpoints.admin.pendingVerifications);
  const companies = useApiList<Company>(withQuery(endpoints.companies.list, { perPage: 100 }));

  const companyNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const company of companies.data) map.set(company.id, company.name);
    return map;
  }, [companies.data]);

  const [target, setTarget] = useState<CompanyVerification | null>(null);
  const [decision, setDecision] = useState<Decision>(CompanyVerificationStatus.VERIFIED);
  const [remarks, setRemarks] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openReview = (verification: CompanyVerification, next: Decision) => {
    setTarget(verification);
    setDecision(next);
    setRemarks('');
    setError('');
    setMsg(null);
  };

  const submitReview = async () => {
    if (!target) return;
    setBusy(true);
    setError('');
    try {
      await apiPatch(endpoints.companies.reviewVerification(target.id), {
        status: decision,
        remarks: remarks.trim() ? remarks.trim() : null,
      });
      setTarget(null);
      setMsg({
        ok: true,
        text:
          decision === CompanyVerificationStatus.VERIFIED
            ? 'Company verified.'
            : 'Verification rejected. The company can resubmit its documents.',
      });
      queue.refetch();
      companies.refetch();
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : 'Could not submit the review.',
      );
    } finally {
      setBusy(false);
    }
  };

  const pendingCount = queue.data.length;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Company verifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {pendingCount} request{pendingCount === 1 ? '' : 's'} waiting for review ·
            decisions take effect immediately.
          </p>
        </div>
        <Link href="/admin/companies" className="btn-secondary">
          All companies
        </Link>
      </header>

      {msg && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            msg.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {msg.text}
        </div>
      )}

      {queue.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading the review queue…
        </div>
      ) : queue.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {queue.error}
        </div>
      ) : queue.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="shield-check" className="h-10 w-10" />}
          title="No pending verifications"
          description="When a company submits documents for review they appear here. Nothing needs your attention right now."
          action={
            <Link href="/admin/companies" className="btn-secondary">
              Browse companies
            </Link>
          }
        />
      ) : (
        <ul className="space-y-4">
          {queue.data.map((verification, index) => (
            <li
              key={verification.id}
              className="card lift mk-rise"
              style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">
                      {companyNames.get(verification.company_id) ?? 'Company'}
                    </p>
                    <StatusBadge kind="verification" value={verification.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Submitted {timeAgo(verification.created_at)}
                  </p>
                  {verification.note && (
                    <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                      “{verification.note}”
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {verification.document_url ? (
                      <a
                        href={verification.document_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-semibold text-brand-600 hover:text-brand-700"
                      >
                        Open document →
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">No document attached</span>
                    )}
                    <span className="text-xs text-slate-400">
                      Company id {verification.company_id.slice(0, 8)}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() =>
                      openReview(verification, CompanyVerificationStatus.VERIFIED)
                    }
                  >
                    Approve
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() =>
                      openReview(verification, CompanyVerificationStatus.REJECTED)
                    }
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Review confirmation */}
      <Modal
        open={target !== null}
        title={
          decision === CompanyVerificationStatus.VERIFIED
            ? 'Approve verification'
            : 'Reject verification'
        }
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={decision === CompanyVerificationStatus.VERIFIED ? 'primary' : 'danger'}
              loading={busy}
              onClick={() => void submitReview()}
            >
              {decision === CompanyVerificationStatus.VERIFIED
                ? 'Approve company'
                : 'Reject submission'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {decision === CompanyVerificationStatus.VERIFIED
              ? 'The company becomes VERIFIED and its profile shows the verified mark.'
              : 'The verification is set to REJECTED. The company can fix its documents and submit again.'}
          </p>
          {target && (
            <p className="text-sm text-slate-500">
              Company:{' '}
              <span className="font-semibold text-slate-800">
                {companyNames.get(target.company_id) ?? target.company_id}
              </span>
            </p>
          )}
          <Field
            label="Review remarks"
            hint="Optional. Stored on the verification record and visible to the company."
            htmlFor="ver-remarks"
          >
            <Textarea
              id="ver-remarks"
              rows={3}
              maxLength={2000}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder={
                decision === CompanyVerificationStatus.VERIFIED
                  ? 'Looks good.'
                  : 'Tell the company what needs fixing.'
              }
            />
          </Field>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
