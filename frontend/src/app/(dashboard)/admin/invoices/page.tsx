'use client';

/**
 * Invoices for platform orders (workflow rule 4: invoices are generated from
 * the order's financials, their totals are snapshotted and never
 * recalculated from the plan; status syncs on payment).
 *
 *   GET  /invoices?status=&perPage=  (admins see every company)
 *   POST /invoices { order_id, issue_date?, due_date? }   DRAFT creation
 *   POST /invoices/:id/issue   DRAFT → ISSUED (fills a missing due date)
 *   POST /invoices/:id/void    unpaid → VOID (PAID invoices are immutable)
 */
import { useMemo, useState, type FormEvent } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  StatusBadge,
  Spinner,
  EmptyState,
  Select,
  Modal,
  Field,
  Input,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { InvoiceStatus, OrderStatus } from '@/enums';
import { formatMoney, formatDate, timeAgo } from '@/utils/format';

/** Invoice row as the API returns it (money columns are *_amount). */
interface InvoiceRow {
  id: string;
  order_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
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

/** Light order shape used to pick an order when creating an invoice. */
interface OrderOption {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
}

/** Mirrors INVOICE_STATUS_TRANSITIONS (backend enum). */
const CAN_ISSUE: InvoiceStatus[] = [InvoiceStatus.DRAFT];
const CAN_VOID: InvoiceStatus[] = [
  InvoiceStatus.DRAFT,
  InvoiceStatus.ISSUED,
  InvoiceStatus.OVERDUE,
];

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminInvoicesPage() {
  const [status, setStatus] = useState('');
  const invoices = useApiList<InvoiceRow>(
    withQuery(endpoints.invoices.list, { status, perPage: 100 }),
  );
  const orders = useApiList<OrderOption>(withQuery(endpoints.orders.list, { perPage: 100 }));

  // Orders without an active (non-VOID) invoice can receive a new draft.
  const orderOptions = useMemo(() => {
    const used = new Set(
      invoices.data.filter((inv) => inv.status !== InvoiceStatus.VOID).map((inv) => inv.order_id),
    );
    return orders.data.filter((order) => !used.has(order.id));
  }, [invoices.data, orders.data]);

  // Row actions
  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [voidTarget, setVoidTarget] = useState<InvoiceRow | null>(null);
  const [voiding, setVoiding] = useState(false);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const runAction = async (invoice: InvoiceRow, mode: 'issue') => {
    setBusyId(invoice.id);
    setMsg(null);
    try {
      if (mode === 'issue') {
        await apiPost(endpoints.invoices.issue(invoice.id));
        setMsg({ ok: true, text: `Invoice ${invoice.invoice_number} issued.` });
      }
      invoices.refetch();
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof ApiRequestError ? err.message : 'Could not issue the invoice.',
      });
    } finally {
      setBusyId('');
    }
  };

  const voidInvoice = async () => {
    if (!voidTarget) return;
    setVoiding(true);
    try {
      await apiPost(endpoints.invoices.void(voidTarget.id));
      setMsg({ ok: true, text: `Invoice ${voidTarget.invoice_number} voided.` });
      setVoidTarget(null);
      invoices.refetch();
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof ApiRequestError ? err.message : 'Could not void the invoice.',
      });
      setVoidTarget(null);
    } finally {
      setVoiding(false);
    }
  };

  const openCreate = () => {
    setOrderId(orderOptions[0]?.id ?? '');
    setIssueDate('');
    setDueDate('');
    setFormError('');
    setCreateOpen(true);
  };

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      setFormError('Pick an order. Orders that already have an active invoice are excluded.');
      return;
    }
    if (dueDate && issueDate && dueDate < issueDate) {
      setFormError('Due date must be on or after the issue date.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await apiPost(endpoints.invoices.create, {
        order_id: orderId,
        ...(issueDate ? { issue_date: issueDate } : {}),
        ...(dueDate ? { due_date: dueDate } : {}),
      });
      setCreateOpen(false);
      setMsg({ ok: true, text: 'Draft invoice created from the order totals.' });
      invoices.refetch();
      orders.refetch();
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : 'Could not create the invoice.',
      );
    } finally {
      setSaving(false);
    }
  };

  const hasFilter = Boolean(status);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Invoices</h1>
          <p className="mt-1 text-sm text-slate-500">
            {invoices.data.length} invoice{invoices.data.length === 1 ? '' : 's'} shown ·
            totals are copied from each order at creation.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter invoices by status"
            >
              <option value="">All statuses</option>
              {Object.values(InvoiceStatus).map((value) => (
                <option key={value} value={value}>
                  {humanize(value)}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={openCreate} disabled={orders.loading}>
            New invoice
          </Button>
        </div>
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

      {invoices.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading invoices…
        </div>
      ) : invoices.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {invoices.error}
        </div>
      ) : invoices.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="document" className="h-10 w-10" />}
          title={hasFilter ? 'No invoices with that status' : 'No invoices yet'}
          description={
            hasFilter
              ? 'Try a different status filter.'
              : 'Invoices are generated when orders are confirmed, or created manually here.'
          }
          action={
            hasFilter ? (
              <Button variant="secondary" onClick={() => setStatus('')}>
                Clear filter
              </Button>
            ) : (
              <Button onClick={openCreate}>Create an invoice</Button>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {invoices.data.map((invoice, index) => (
            <li
              key={invoice.id}
              className="card lift mk-rise"
              style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-bold text-slate-900">
                      {invoice.invoice_number}
                    </p>
                    <StatusBadge kind="invoice" value={invoice.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Order {invoice.order?.order_number ?? invoice.order_id.slice(0, 8)} ·
                    issued {formatDate(invoice.issue_date)}
                    {invoice.due_date ? ` · due ${formatDate(invoice.due_date)}` : ''}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Subtotal {formatMoney(invoice.subtotal, invoice.currency)} · tax{' '}
                    {formatMoney(invoice.tax_amount, invoice.currency)} · created{' '}
                    {timeAgo(invoice.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-lg font-extrabold text-slate-900">
                    {formatMoney(invoice.total_amount, invoice.currency)}
                  </p>
                  <div className="flex gap-2">
                    {CAN_ISSUE.includes(invoice.status) && (
                      <Button
                        variant="primary"
                        size="sm"
                        loading={busyId === invoice.id}
                        onClick={() => void runAction(invoice, 'issue')}
                      >
                        Issue
                      </Button>
                    )}
                    {CAN_VOID.includes(invoice.status) ? (
                      <Button variant="secondary" size="sm" onClick={() => setVoidTarget(invoice)}>
                        Void
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">
                        {invoice.status === InvoiceStatus.PAID
                          ? 'Paid invoices are immutable'
                          : 'No actions available'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-400">
        Invoice totals mirror the order they were created from. Payments mark invoices paid
        automatically, so manual edits to totals never happen here.
      </p>

      {/* Create modal */}
      <Modal
        open={createOpen}
        title="New invoice"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="invoice-form" loading={saving}>
              Create draft
            </Button>
          </>
        }
      >
        <form id="invoice-form" onSubmit={submitCreate} className="space-y-4" noValidate>
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            The invoice snapshots the order&apos;s subtotal, tax and total. Numbers are never
            recalculated from the plan, and an order can only have one active invoice.
          </div>
          <Field label="Order" required htmlFor="inv-order">
            <Select
              id="inv-order"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
            >
              {orderOptions.length === 0 ? (
                <option value="">No orders available</option>
              ) : (
                <>
                  <option value="">Pick an order</option>
                  {orderOptions.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.order_number} · {formatMoney(order.total_amount, order.currency)} ·{' '}
                      {humanize(order.status)}
                    </option>
                  ))}
                </>
              )}
            </Select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Issue date"
              hint="Blank means today"
              htmlFor="inv-issue"
            >
              <Input
                id="inv-issue"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
              />
            </Field>
            <Field label="Due date" hint="Blank means no due date yet" htmlFor="inv-due">
              <Input
                id="inv-due"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </Field>
          </div>
          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}
        </form>
      </Modal>

      {/* Void confirmation */}
      <Modal
        open={voidTarget !== null}
        title="Void invoice"
        onClose={() => setVoidTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setVoidTarget(null)} disabled={voiding}>
              Keep invoice
            </Button>
            <Button variant="danger" loading={voiding} onClick={() => void voidInvoice()}>
              Void invoice
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <span className="font-mono font-semibold text-slate-800">
              {voidTarget?.invoice_number}
            </span>{' '}
            is voided and kept for history. A new invoice can then be created for the same
            order.
          </p>
          <p>Paid invoices cannot be voided. Refund the payment instead.</p>
        </div>
      </Modal>
    </div>
  );
}
