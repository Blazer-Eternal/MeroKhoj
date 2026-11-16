'use client';

/**
 * Payment transactions across the platform.
 *
 *   GET  /payments?status=&perPage=    (admins see every company)
 *   POST /payments/:id/confirm         manual confirmation, the exact same
 *                                      completion path as the provider webhook
 *   POST /payments/:id/refund { reason? }  a SEPARATE linked refund
 *                                      transaction: the original row is never
 *                                      mutated (rule 6)
 *
 * Refund rows carry `provider_response.refund_of` pointing at the original,
 * which this page resolves back to its transaction reference.
 */
import { useMemo, useState } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  StatusBadge,
  Spinner,
  EmptyState,
  Select,
  Modal,
  Field,
  Textarea,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { PaymentStatus } from '@/enums';
import { formatMoney, timeAgo } from '@/utils/format';

/** Payment row as the API returns it (refunds live in provider_response). */
interface PaymentRow {
  id: string;
  order_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_reference: string | null;
  paid_at: string | null;
  failure_reason: string | null;
  provider_response?: { refund_of?: string; reason?: string } | null;
  created_at: string;
  updated_at: string;
  order?: {
    id: string;
    order_number: string;
    company_id: string;
    currency: string;
    total_amount: string | number;
  } | null;
}

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminPaymentsPage() {
  const [status, setStatus] = useState('');
  const payments = useApiList<PaymentRow>(
    withQuery(endpoints.payments.list, { status, perPage: 100 }),
  );

  // Refund linkage, resolved inside the loaded list.
  const refundOriginalIds = useMemo(() => {
    const ids = new Set<string>();
    for (const row of payments.data) {
      const original = row.provider_response?.refund_of;
      if (original) ids.add(original);
    }
    return ids;
  }, [payments.data]);

  const referenceById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of payments.data) {
      if (row.transaction_reference) map.set(row.id, row.transaction_reference);
    }
    return map;
  }, [payments.data]);

  // Confirmation modal (confirm or refund)
  const [mode, setMode] = useState<'confirm' | 'refund'>('confirm');
  const [target, setTarget] = useState<PaymentRow | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openConfirm = (row: PaymentRow) => {
    setMode('confirm');
    setTarget(row);
    setReason('');
    setFormError('');
  };

  const openRefund = (row: PaymentRow) => {
    setMode('refund');
    setTarget(row);
    setReason('');
    setFormError('');
  };

  const submit = async () => {
    if (!target) return;
    setBusy(true);
    setFormError('');
    try {
      if (mode === 'confirm') {
        await apiPost(endpoints.payments.confirm(target.id));
        setMsg({
          ok: true,
          text: target.transaction_reference
            ? `Payment ${target.transaction_reference} confirmed and the order completed.`
            : 'Payment confirmed and the order completed.',
        });
      } else {
        const trimmed = reason.trim();
        await apiPost(endpoints.payments.refund(target.id), trimmed ? { reason: trimmed } : {});
        setMsg({
          ok: true,
          text: `Refund created for ${target.transaction_reference ?? 'this payment'}.`,
        });
      }
      setTarget(null);
      payments.refetch();
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError
          ? err.message
          : mode === 'confirm'
            ? 'Could not confirm the payment.'
            : 'Could not refund the payment.',
      );
    } finally {
      setBusy(false);
    }
  };

  const hasFilter = Boolean(status);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Payments</h1>
          <p className="mt-1 text-sm text-slate-500">
            {payments.data.length} transaction{payments.data.length === 1 ? '' : 's'} shown ·
            refunds appear as linked rows.
          </p>
        </div>
        <div className="w-52">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter payments by status"
          >
            <option value="">All statuses</option>
            {Object.values(PaymentStatus).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
      </header>

      {msg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {msg.text}
        </div>
      )}

      {payments.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading payments…
        </div>
      ) : payments.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {payments.error}
        </div>
      ) : payments.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="card" className="h-10 w-10" />}
          title={hasFilter ? 'No payments with that status' : 'No payments yet'}
          description={
            hasFilter
              ? 'Try a different status filter.'
              : 'Transactions appear when companies pay for an order, either through the provider or a manual confirmation.'
          }
          action={
            hasFilter ? (
              <Button variant="secondary" onClick={() => setStatus('')}>
                Clear filter
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {payments.data.map((row, index) => {
            const refundOf = row.provider_response?.refund_of ?? null;
            const originalRef =
              refundOf !== null ? referenceById.get(refundOf) ?? refundOf.slice(0, 8) : null;
            const isRefunded = refundOriginalIds.has(row.id);
            const canConfirm =
              row.status === PaymentStatus.PENDING || row.status === PaymentStatus.PROCESSING;
            const canRefund = row.status === PaymentStatus.COMPLETED && !isRefunded;
            return (
              <li
                key={row.id}
                className={`card lift mk-rise ${
                  refundOf !== null ? 'border-l-4 border-l-slate-400 bg-slate-50/50' : ''
                }`}
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-bold text-slate-900">
                        {row.transaction_reference ?? 'No reference'}
                      </p>
                      <StatusBadge kind="payment" value={row.status} />
                      <Badge tone="slate">{row.provider}</Badge>
                      {refundOf !== null && <Badge tone="purple">Refund</Badge>}
                      {isRefunded && row.status === PaymentStatus.COMPLETED && (
                        <Badge tone="amber">Refunded</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Order {row.order?.order_number ?? row.order_id.slice(0, 8)} ·{' '}
                      {row.paid_at ? `paid ${timeAgo(row.paid_at)}` : `created ${timeAgo(row.created_at)}`}
                    </p>
                    {refundOf !== null && (
                      <p className="mt-1 text-xs text-slate-400">
                        Linked to original {originalRef}
                        {row.provider_response?.reason
                          ? ` · ${row.provider_response.reason}`
                          : ''}
                      </p>
                    )}
                    {row.failure_reason && (
                      <p className="mt-1 text-xs text-red-600">{row.failure_reason}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <p className="text-lg font-extrabold text-slate-900">
                      {formatMoney(row.amount, row.currency)}
                    </p>
                    <div className="flex gap-2">
                      {canConfirm && (
                        <Button variant="primary" size="sm" onClick={() => openConfirm(row)}>
                          Confirm
                        </Button>
                      )}
                      {canRefund && (
                        <Button variant="secondary" size="sm" onClick={() => openRefund(row)}>
                          Refund
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Confirm / refund modal */}
      <Modal
        open={target !== null}
        title={mode === 'confirm' ? 'Confirm payment' : 'Refund payment'}
        onClose={() => setTarget(null)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant={mode === 'confirm' ? 'primary' : 'danger'}
              loading={busy}
              onClick={() => void submit()}
            >
              {mode === 'confirm' ? 'Confirm payment' : 'Refund payment'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            {mode === 'confirm'
              ? 'Manual confirmation runs the same completion path as the provider webhook: the payment completes and the order is confirmed.'
              : 'A refund creates a new linked transaction with its own reference. The original payment row is never changed, and a payment can only be refunded once.'}
          </p>
          {target && (
            <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              <p>
                <span className="font-mono font-semibold text-slate-800">
                  {target.transaction_reference ?? 'No reference'}
                </span>{' '}
                · {formatMoney(target.amount, target.currency)} · {target.provider}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Order {target.order?.order_number ?? target.order_id.slice(0, 8)}
              </p>
            </div>
          )}
          {mode === 'refund' && (
            <Field
              label="Refund reason"
              hint="Optional. Stored with the refund transaction and in the audit trail."
              htmlFor="pay-reason"
            >
              <Textarea
                id="pay-reason"
                rows={2}
                maxLength={1000}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Why is this payment being refunded?"
              />
            </Field>
          )}
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
