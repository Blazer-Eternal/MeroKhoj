'use client';

/**
 * Employer orders — plan purchases and their payment trail.
 *
 *   GET   /orders?status=&perPage=          this company's orders
 *   POST  /orders { company_id, service_plan_id, quantity }
 *   POST  /orders/:id/cancel                PENDING orders only
 *   POST  /orders/:id/payments { provider } start (or reuse) a payment
 *   GET   /orders/:id/payments              { payments } for one order
 *
 * Amounts are computed server-side from the plan price; the client only picks
 * the plan and the quantity. A started payment stays PENDING until a provider
 * callback or an admin confirmation completes it.
 */
import { useState, type FormEvent } from 'react';
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
  Select,
  Modal,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { OrderStatus } from '@/enums';
import type { ServicePlan } from '@/types';
import { formatMoney, formatDate, timeAgo, humanize } from '@/utils/format';

/** Order row as the API returns it (money fields are *_amount columns). */
interface OrderRow {
  id: string;
  company_id: string;
  order_number: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
  discount_amount: number | string;
  tax_amount: number | string;
  total_amount: number | string;
  currency: string;
  status: OrderStatus;
  created_at: string;
  service_plan?: { id: string; name: string; status: string } | null;
}

interface OrderPaymentRow {
  id: string;
  order_id: string;
  provider: string;
  amount: number | string;
  currency: string;
  status: string;
  transaction_reference: string | null;
  paid_at: string | null;
  created_at: string;
}

const PROVIDERS = ['esewa', 'khalti', 'connectips', 'manual'];

export default function EmployerOrdersPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  const companyId = company?.id ?? null;

  const [status, setStatus] = useState('');
  const orders = useApiList<OrderRow>(
    withQuery(endpoints.orders.list, { status, perPage: 100 }),
  );
  const plans = useApiList<ServicePlan>(endpoints.servicePlans.list, {
    query: { perPage: 100 },
  });

  // Create order
  const [createOpen, setCreateOpen] = useState(false);
  const [planId, setPlanId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Pay
  const [payTarget, setPayTarget] = useState<OrderRow | null>(null);
  const [provider, setProvider] = useState('manual');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  // Cancel
  const [cancelTarget, setCancelTarget] = useState<OrderRow | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState('');

  // Payment history
  const [historyTarget, setHistoryTarget] = useState<OrderRow | null>(null);
  const [historyRows, setHistoryRows] = useState<OrderPaymentRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openCreate = () => {
    setPlanId(plans.data.find((row) => row.status === 'ACTIVE')?.id ?? '');
    setQuantity('1');
    setCreateError('');
    setCreateOpen(true);
  };

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    if (!planId) {
      setCreateError('Pick a plan.');
      return;
    }
    const qty = Number(quantity || '1');
    if (!Number.isInteger(qty) || qty < 1) {
      setCreateError('Quantity must be a whole number of at least 1.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const res = await apiPost<{ order: OrderRow }>(endpoints.orders.create, {
        company_id: companyId,
        service_plan_id: planId,
        quantity: qty,
      });
      setCreateOpen(false);
      setMsg({
        ok: res.order.status !== OrderStatus.PENDING,
        text:
          res.order.status === OrderStatus.PENDING
            ? `Order ${res.order.order_number} created and waiting for payment.`
            : `Order ${res.order.order_number} confirmed.`,
      });
      orders.refetch();
    } catch (err) {
      setCreateError(err instanceof ApiRequestError ? err.message : 'Could not place the order.');
    } finally {
      setCreating(false);
    }
  };

  const openPay = (order: OrderRow) => {
    setPayTarget(order);
    setProvider('manual');
    setPayError('');
  };

  const submitPay = async (e: FormEvent) => {
    e.preventDefault();
    if (!payTarget) return;
    setPaying(true);
    setPayError('');
    try {
      const res = await apiPost<{ payment: OrderPaymentRow }>(
        endpoints.orders.initiatePayment(payTarget.id),
        { provider },
      );
      setPayTarget(null);
      setMsg({
        ok: true,
        text: `Payment ${res.payment.transaction_reference ?? ''} started with ${res.payment.provider} for ${payTarget.order_number}.`,
      });
      orders.refetch();
    } catch (err) {
      setPayError(err instanceof ApiRequestError ? err.message : 'Could not start the payment.');
    } finally {
      setPaying(false);
    }
  };

  const submitCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError('');
    try {
      await apiPost(endpoints.orders.cancel(cancelTarget.id), {});
      setCancelTarget(null);
      setMsg({ ok: true, text: `Order ${cancelTarget.order_number} cancelled.` });
      orders.refetch();
    } catch (err) {
      setCancelError(err instanceof ApiRequestError ? err.message : 'Could not cancel the order.');
    } finally {
      setCancelling(false);
    }
  };

  const openHistory = async (order: OrderRow) => {
    setHistoryTarget(order);
    setHistoryRows([]);
    setHistoryError('');
    setHistoryLoading(true);
    try {
      const res = await apiGet<{ payments: OrderPaymentRow[] }>(
        endpoints.orders.payments(order.id),
      );
      setHistoryRows(res.payments);
    } catch (err) {
      setHistoryError(
        err instanceof ApiRequestError ? err.message : 'Could not load the payments.',
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading orders…
      </div>
    );
  }

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Orders</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? `${orders.data.length} order${orders.data.length === 1 ? '' : 's'} for ${company.name}.`
            : 'Create a company to purchase plans.'}
        </p>
      </div>
      {company && <Button onClick={openCreate}>New order</Button>}
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
          description="Orders belong to a company profile. Create yours first."
        />
      </div>
    );
  }

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

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-52">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter orders by status"
          >
            <option value="">All statuses</option>
            {Object.values(OrderStatus).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
        {status && (
          <Button variant="ghost" onClick={() => setStatus('')}>
            Clear filter
          </Button>
        )}
      </div>

      {orders.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading orders…
        </div>
      ) : orders.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {orders.error}
        </div>
      ) : orders.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="receipt" className="h-10 w-10" />}
          title={status ? 'No orders with that status' : 'No orders yet'}
          description={
            status
              ? 'Try a different status filter.'
              : 'Purchase a service plan to grow your publishing allowance.'
          }
          action={
            status ? (
              <Button variant="secondary" onClick={() => setStatus('')}>
                Clear filter
              </Button>
            ) : (
              <Button onClick={openCreate}>Place an order</Button>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {orders.data.map((order, index) => (
            <li
              key={order.id}
              className="card lift mk-rise"
              style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {order.order_number}
                    </p>
                    <StatusBadge kind="order" value={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    {order.service_plan?.name ?? 'Plan'} × {order.quantity} · placed{' '}
                    {timeAgo(order.created_at)}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Unit {formatMoney(order.unit_price, order.currency)} · tax{' '}
                    {formatMoney(order.tax_amount, order.currency)}
                    {Number(order.discount_amount) > 0
                      ? ` · discount ${formatMoney(order.discount_amount, order.currency)}`
                      : ''}{' '}
                    · {formatDate(order.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-lg font-extrabold text-slate-900">
                    {formatMoney(order.total_amount, order.currency)}
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => void openHistory(order)}>
                      Payments
                    </Button>
                    {order.status === OrderStatus.PENDING && (
                      <>
                        <Button size="sm" onClick={() => openPay(order)}>
                          Pay now
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setCancelError('');
                            setCancelTarget(order);
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                  {order.status !== OrderStatus.PENDING && (
                    <span className="text-xs text-slate-400">
                      {order.status === OrderStatus.CANCELLED
                        ? 'Cancelled order'
                        : 'Confirmed, kept as financial history'}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* New order */}
      <Modal
        open={createOpen}
        title="New order"
        onClose={() => setCreateOpen(false)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" form="order-create-form" loading={creating}>
              Place order
            </Button>
          </>
        }
      >
        <form id="order-create-form" onSubmit={submitCreate} className="space-y-4" noValidate>
          <Field label="Plan" required htmlFor="o-plan">
            <Select id="o-plan" value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">Select a plan</option>
              {plans.data
                .filter((row) => row.status === 'ACTIVE')
                .map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.name} · {formatMoney(row.price, row.currency)}
                  </option>
                ))}
            </Select>
          </Field>
          <Field label="Quantity" required htmlFor="o-qty">
            <Input
              id="o-qty"
              type="number"
              min={1}
              step={1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </Field>
          <p className="text-xs text-slate-400">
            Totals are calculated by the server from the plan price.
          </p>
          {createError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {createError}
            </div>
          )}
        </form>
      </Modal>

      {/* Pay */}
      <Modal
        open={payTarget !== null}
        title="Start payment"
        onClose={() => setPayTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setPayTarget(null)} disabled={paying}>
              Cancel
            </Button>
            <Button type="submit" form="order-pay-form" loading={paying}>
              Start payment
            </Button>
          </>
        }
      >
        <form id="order-pay-form" onSubmit={submitPay} className="space-y-4" noValidate>
          {payTarget && (
            <div className="rounded-xl border border-slate-200 px-4 py-3">
              <p className="font-mono text-sm font-bold text-slate-900">
                {payTarget.order_number}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                {formatMoney(payTarget.total_amount, payTarget.currency)} ·{' '}
                {payTarget.service_plan?.name ?? 'Plan'}
              </p>
            </div>
          )}
          <Field label="Provider" required hint="Recorded on the payment row." htmlFor="o-provider">
            <Select
              id="o-provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
            >
              {PROVIDERS.map((value) => (
                <option key={value} value={value}>
                  {humanize(value)}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-slate-400">
            The amount comes from the order total. An outstanding payment for the same order is
            reused instead of duplicated.
          </p>
          {payError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {payError}
            </div>
          )}
        </form>
      </Modal>

      {/* Cancel */}
      <Modal
        open={cancelTarget !== null}
        title="Cancel order"
        onClose={() => setCancelTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              Keep order
            </Button>
            <Button variant="danger" type="submit" form="order-cancel-form" loading={cancelling}>
              Cancel order
            </Button>
          </>
        }
      >
        <form
          id="order-cancel-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submitCancel();
          }}
          className="space-y-3"
        >
          <p className="text-sm text-slate-600">
            <span className="font-mono font-semibold text-slate-800">
              {cancelTarget?.order_number}
            </span>{' '}
            will be cancelled. Only pending orders can be cancelled; confirmed orders stay as
            financial history.
          </p>
          {cancelError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {cancelError}
            </div>
          )}
        </form>
      </Modal>

      {/* Payment history */}
      <Modal
        open={historyTarget !== null}
        title="Order payments"
        onClose={() => setHistoryTarget(null)}
        footer={
          <Button variant="secondary" onClick={() => setHistoryTarget(null)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          {historyTarget && (
            <p className="text-sm text-slate-600">
              <span className="font-mono font-semibold text-slate-800">
                {historyTarget.order_number}
              </span>{' '}
              · {formatMoney(historyTarget.total_amount, historyTarget.currency)}
            </p>
          )}
          {historyLoading ? (
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <Spinner /> Loading payments…
            </div>
          ) : historyError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {historyError}
            </div>
          ) : historyRows.length === 0 ? (
            <p className="text-sm text-slate-500">
              No payments on this order yet. Start one while it is pending.
            </p>
          ) : (
            <ul className="space-y-3">
              {historyRows.map((payment, index) => (
                <li
                  key={payment.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                  style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">
                        {humanize(payment.provider)}
                      </p>
                      <Badge tone="slate">
                        {payment.transaction_reference ?? 'No reference'}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">
                      Started {timeAgo(payment.created_at)}
                      {payment.paid_at ? ` · paid ${formatDate(payment.paid_at)}` : ''}
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
        </div>
      </Modal>
    </div>
  );
}
