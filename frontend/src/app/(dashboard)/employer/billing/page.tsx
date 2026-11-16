'use client';

/**
 * Billing — publish entitlement, plan purchases and the money trail.
 *
 *   GET  /companies/:id/entitlement → { entitlement }
 *   GET  /service-plans             (public catalog, ACTIVE plans for callers)
 *   POST /orders { company_id, service_plan_id, quantity }
 *   GET  /invoices?perPage=         recent invoices for this company
 *   GET  /payments?perPage=         recent payments for this company
 *
 * Free plans confirm immediately and issue a PAID invoice; paid plans stay
 * PENDING until a payment is started on the orders page.
 */
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useCompany } from '@/hooks/use-company';
import { useApiList } from '@/hooks/use-api-list';
import { apiGet, apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  StatusBadge,
  Spinner,
  EmptyState,
  Field,
  Input,
  Modal,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import type { InvoiceStatus, PaymentStatus } from '@/enums';
import type { PublishEntitlement, ServicePlan } from '@/types';
import { formatMoney, formatDate, timeAgo, humanize } from '@/utils/format';

/** Invoice row: no top-level currency, it lives on the embedded order. */
interface InvoiceRow {
  id: string;
  invoice_number: string;
  issue_date: string | null;
  due_date: string | null;
  subtotal: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  status: InvoiceStatus;
  created_at: string;
  order?: { id: string; order_number: string; company_id: string; currency: string } | null;
}

interface PaymentRow {
  id: string;
  order_id: string;
  provider: string;
  amount: number | string;
  currency: string;
  status: PaymentStatus;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string;
  order?: {
    id: string;
    order_number: string;
    company_id: string;
    currency: string;
    total_amount: number | string;
  } | null;
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-xl border border-slate-200 px-4 py-3">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 text-xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{hint}</p>
    </div>
  );
}

export default function EmployerBillingPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  const companyId = company?.id ?? null;

  const [entitlement, setEntitlement] = useState<PublishEntitlement | null>(null);
  const [entitlementLoading, setEntitlementLoading] = useState(false);

  const plans = useApiList<ServicePlan>(endpoints.servicePlans.list, { query: { perPage: 100 } });
  const invoices = useApiList<InvoiceRow>(withQuery(endpoints.invoices.list, { perPage: 6 }));
  const payments = useApiList<PaymentRow>(withQuery(endpoints.payments.list, { perPage: 6 }));

  // Purchase modal
  const [plan, setPlan] = useState<ServicePlan | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const loadEntitlement = useCallback(async () => {
    if (!companyId) return;
    setEntitlementLoading(true);
    try {
      const res = await apiGet<{ entitlement: PublishEntitlement }>(
        endpoints.companies.entitlement(companyId),
      );
      setEntitlement(res.entitlement);
    } catch {
      setEntitlement(null);
    } finally {
      setEntitlementLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void loadEntitlement();
  }, [loadEntitlement]);

  const openBuy = (selected: ServicePlan) => {
    setPlan(selected);
    setQuantity('1');
    setBuyError('');
  };

  const submitBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId || !plan) return;
    const qty = Number(quantity || '1');
    if (!Number.isInteger(qty) || qty < 1) {
      setBuyError('Quantity must be a whole number of at least 1.');
      return;
    }
    setBuying(true);
    setBuyError('');
    try {
      const res = await apiPost<{ order: { id: string; status: string; order_number: string } }>(
        endpoints.orders.create,
        {
          company_id: companyId,
          service_plan_id: plan.id,
          quantity: qty,
        },
      );
      setPlan(null);
      if (res.order.status === 'PENDING') {
        setMsg({
          ok: true,
          text: `Order ${res.order.order_number} created. Start the payment from the orders page to activate it.`,
        });
      } else {
        setMsg({
          ok: true,
          text: `Order ${res.order.order_number} confirmed. Your entitlement is active.`,
        });
      }
      void loadEntitlement();
      invoices.refetch();
      payments.refetch();
    } catch (err) {
      setBuyError(err instanceof ApiRequestError ? err.message : 'Could not place the order.');
    } finally {
      setBuying(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading billing…
      </div>
    );
  }

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? `Publishing entitlement, plan purchases and documents for ${company.name}.`
            : 'Create a company to manage billing.'}
        </p>
      </div>
      <Link href="/employer/orders" className="btn-secondary">
        Orders and payments
      </Link>
    </header>
  );

  if (companyError) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {companyError}
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="space-y-6">
        {header}
        <EmptyState
          icon={<NavIcon name="receipt" className="h-10 w-10" />}
          title="No company yet"
          description="Billing is attached to a company profile."
        />
      </div>
    );
  }

  const allowanceLabel = entitlement?.unlimited
    ? 'Unlimited'
    : entitlement
      ? `${entitlement.allowance}`
      : '-';
  const outOfAllowance = entitlement !== null && entitlement.remaining <= 0;

  return (
    <div className="space-y-6">
      {header}

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

      {outOfAllowance && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your current plan is used up. Purchase a plan below to publish more jobs.
        </div>
      )}

      {/* Entitlement */}
      <section
        className="card lift mk-rise"
        style={{ '--mk-delay': '0ms' } as React.CSSProperties}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Publishing entitlement</h2>
            <p className="text-sm text-slate-500">
              How many jobs you can push live right now.
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => void loadEntitlement()}>
            Refresh
          </Button>
        </div>

        {entitlementLoading ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Spinner /> Loading entitlement…
          </div>
        ) : !entitlement ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Could not load the entitlement snapshot. Refresh to try again.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat
              label="Jobs posted"
              value={`${entitlement.used}`}
              hint="Used against the allowance"
            />
            <Stat label="Allowance" value={allowanceLabel} hint="From active orders" />
            <Stat
              label="Remaining"
              value={entitlement.unlimited ? '∞' : `${entitlement.remaining}`}
              hint={entitlement.billing_required ? 'Billing required to publish' : 'Ready to publish'}
            />
            <Stat
              label="Active orders"
              value={`${entitlement.active_orders}`}
              hint={
                entitlement.next_expiry
                  ? `Next expiry ${formatDate(entitlement.next_expiry)}`
                  : 'No expiry scheduled'
              }
            />
          </div>
        )}
      </section>

      {/* Plans */}
      <section
        className="card lift mk-rise"
        style={{ '--mk-delay': '80ms' } as React.CSSProperties}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Service plans</h2>
            <p className="text-sm text-slate-500">
              Buy an allowance for job postings and featured slots.
            </p>
          </div>
        </div>

        {plans.loading ? (
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Spinner /> Loading plans…
          </div>
        ) : plans.error ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {plans.error}
          </div>
        ) : plans.data.length === 0 ? (
          <p className="text-sm text-slate-500">No plans are available right now.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.data.map((planRow, index) => (
              <li
                key={planRow.id}
                className="flex flex-col rounded-xl border border-slate-200 p-4"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold text-slate-900">{planRow.name}</p>
                  {planRow.status === 'ACTIVE' ? (
                    <Badge tone="green">Active</Badge>
                  ) : (
                    <Badge tone="slate">{humanize(planRow.status)}</Badge>
                  )}
                </div>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {formatMoney(planRow.price, planRow.currency)}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {planRow.duration_days
                    ? `${planRow.duration_days} days from purchase`
                    : 'No expiry'}
                </p>
                <p className="mt-3 text-sm text-slate-600">
                  {planRow.job_posting_limit === null
                    ? 'Unlimited job postings'
                    : `${planRow.job_posting_limit} job posting${planRow.job_posting_limit === 1 ? '' : 's'}`}
                  {' · '}
                  {planRow.featured_jobs_limit} featured slot
                  {planRow.featured_jobs_limit === 1 ? '' : 's'}
                </p>
                {planRow.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-slate-500">{planRow.description}</p>
                )}
                <div className="mt-4 pt-1">
                  <Button className="w-full" size="sm" onClick={() => openBuy(planRow)}>
                    {planRow.price > 0 ? 'Purchase plan' : 'Activate free plan'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Money trail */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section
          className="card lift mk-rise"
          style={{ '--mk-delay': '160ms' } as React.CSSProperties}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent invoices</h2>
            <Link
              href="/employer/orders"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              All orders →
            </Link>
          </div>
          {invoices.loading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Spinner /> Loading invoices…
            </div>
          ) : invoices.error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {invoices.error}
            </div>
          ) : invoices.data.length === 0 ? (
            <p className="text-sm text-slate-500">
              No invoices yet. They appear as soon as an order is placed.
            </p>
          ) : (
            <ul className="space-y-3">
              {invoices.data.map((invoice, index) => (
                <li
                  key={invoice.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                  style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
                >
                  <div className="min-w-0">
                    <p className="truncate font-mono text-sm font-bold text-slate-900">
                      {invoice.invoice_number}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {invoice.order?.order_number ?? 'Order'} · issued{' '}
                      {formatDate(invoice.issue_date ?? invoice.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="font-bold text-slate-900">
                      {formatMoney(invoice.total_amount, invoice.order?.currency ?? 'NPR')}
                    </p>
                    <StatusBadge kind="invoice" value={invoice.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          className="card lift mk-rise"
          style={{ '--mk-delay': '230ms' } as React.CSSProperties}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Recent payments</h2>
            <Link
              href="/employer/orders"
              className="text-xs font-semibold text-brand-600 hover:text-brand-700"
            >
              Payment history →
            </Link>
          </div>
          {payments.loading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Spinner /> Loading payments…
            </div>
          ) : payments.error ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {payments.error}
            </div>
          ) : payments.data.length === 0 ? (
            <p className="text-sm text-slate-500">
              No payments yet. Paid plans start their payment from the orders page.
            </p>
          ) : (
            <ul className="space-y-3">
              {payments.data.map((payment, index) => (
                <li
                  key={payment.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                  style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {payment.provider} · {payment.order?.order_number ?? 'Order'}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {payment.transaction_reference ?? 'No reference'} ·{' '}
                      {timeAgo(payment.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="font-bold text-slate-900">
                      {formatMoney(payment.amount, payment.currency)}
                    </p>
                    <StatusBadge kind="payment" value={payment.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Purchase modal */}
      <Modal
        open={plan !== null}
        title="Purchase plan"
        onClose={() => setPlan(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPlan(null)} disabled={buying}>
              Cancel
            </Button>
            <Button type="submit" form="plan-buy-form" loading={buying}>
              Place order
            </Button>
          </>
        }
      >
        <form id="plan-buy-form" onSubmit={submitBuy} className="space-y-4" noValidate>
          {plan && (
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="font-semibold text-slate-900">{plan.name}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {formatMoney(plan.price, plan.currency)} per unit ·{' '}
                {plan.duration_days ? `${plan.duration_days} days` : 'no expiry'}
              </p>
            </div>
          )}
          <Field
            label="Quantity"
            required
            hint="How many units of this plan you want."
            htmlFor="buy-qty"
          >
            <Input
              id="buy-qty"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <p className="text-xs text-slate-400">
            Free orders confirm immediately. Paid orders wait for a payment on the orders page.
          </p>
          {buyError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {buyError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
