'use client';

/**
 * Platform order list — every company's purchases.
 *
 *   GET  /orders?status=&perPage=   (admins see all orders)
 *   GET  /orders/:id
 *   POST /orders/:id/cancel         (PENDING orders only: confirmed and
 *                                    completed orders are financial history
 *                                    and must be refunded instead)
 *
 * The backend accepts platform admins on the orders routes, so cancelling a
 * pending order works from this page.
 */
import { useMemo, useState } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import { Button, StatusBadge, Spinner, EmptyState, Select, Modal } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { OrderStatus } from '@/enums';
import { formatMoney, timeAgo } from '@/utils/format';

/** Order row as the API returns it (money fields are *_amount columns). */
interface OrderRow {
  id: string;
  company_id: string;
  order_number: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  service_plan?: { id: string; name: string; status: string } | null;
}

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const orders = useApiList<OrderRow>(withQuery(endpoints.orders.list, { status, perPage: 100 }));
  const companies = useApiList<{ id: string; name: string }>(
    withQuery(endpoints.companies.list, { perPage: 100 }),
  );

  const companyName = useMemo(() => {
    const map = new Map<string, string>();
    for (const company of companies.data) map.set(company.id, company.name);
    return map;
  }, [companies.data]);

  const [target, setTarget] = useState<OrderRow | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const cancelOrder = async () => {
    if (!target) return;
    setCancelling(true);
    try {
      await apiPost(endpoints.orders.cancel(target.id), {});
      setMsg({ ok: true, text: `Order ${target.order_number} cancelled.` });
      setTarget(null);
      orders.refetch();
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof ApiRequestError ? err.message : 'Could not cancel the order.',
      });
      setTarget(null);
    } finally {
      setCancelling(false);
    }
  };

  const hasFilter = Boolean(status);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Orders</h1>
          <p className="mt-1 text-sm text-slate-500">
            {orders.data.length} order{orders.data.length === 1 ? '' : 's'} shown · plan
            purchases from every company.
          </p>
        </div>
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
          title={hasFilter ? 'No orders with that status' : 'No orders yet'}
          description={
            hasFilter
              ? 'Try a different status filter.'
              : 'Orders appear when companies purchase a service plan.'
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
                    {order.service_plan?.name ?? 'Plan'} × {order.quantity} ·{' '}
                    {companyName.get(order.company_id) ?? `company ${order.company_id.slice(0, 8)}`}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Placed {timeAgo(order.created_at)} · unit{' '}
                    {formatMoney(order.unit_price, order.currency)} · tax{' '}
                    {formatMoney(order.tax_amount, order.currency)}
                    {order.discount_amount > 0
                      ? ` · discount ${formatMoney(order.discount_amount, order.currency)}`
                      : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <p className="text-lg font-extrabold text-slate-900">
                    {formatMoney(order.total_amount, order.currency)}
                  </p>
                  {order.status === OrderStatus.PENDING ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setTarget(order)}
                    >
                      Cancel order
                    </Button>
                  ) : (
                    <span className="text-xs text-slate-400">
                      {order.status === OrderStatus.CANCELLED
                        ? 'Cancelled'
                        : 'Financial history, cannot cancel'}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Cancel confirmation */}
      <Modal
        open={target !== null}
        title="Cancel order"
        onClose={() => setTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTarget(null)} disabled={cancelling}>
              Keep order
            </Button>
            <Button variant="danger" loading={cancelling} onClick={() => void cancelOrder()}>
              Cancel order
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <span className="font-mono font-semibold text-slate-800">
              {target?.order_number}
            </span>{' '}
            will be cancelled. The company loses the pending reservation and can order again.
          </p>
          <p>
            Only pending orders can be cancelled. Confirmed and completed orders are kept as
            financial history; their payments are handled on the payments page.
          </p>
        </div>
      </Modal>
    </div>
  );
}
