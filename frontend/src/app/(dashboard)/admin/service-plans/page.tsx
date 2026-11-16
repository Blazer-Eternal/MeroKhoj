'use client';

/**
 * Service plan catalog CRUD (workflow rule 1: admin CRUD; deactivation never
 * touches purchased orders, those live on the orders themselves).
 *
 *   GET    /service-plans?status=&perPage=  (optionalAuth: admins see the
 *          full catalog, everyone else only ACTIVE)
 *   POST   /service-plans   { name, description?, price, currency?,
 *                             duration_days?, job_posting_limit?,
 *                             featured_jobs_limit?, status? }
 *   PATCH  /service-plans/:id  (same fields, all optional)
 *   DELETE /service-plans/:id  (409 when the plan has been ordered)
 */
import { useState, type FormEvent } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiDelete, apiPatch, apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  Field,
  Input,
  Select,
  Textarea,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { CatalogStatus } from '@/enums';
import type { ServicePlan } from '@/types';
import { formatMoney, timeAgo } from '@/utils/format';

interface PlanFormState {
  name: string;
  description: string;
  price: string;
  currency: string;
  durationDays: string;
  jobLimit: string;
  featuredLimit: string;
  status: CatalogStatus;
}

const EMPTY_FORM: PlanFormState = {
  name: '',
  description: '',
  price: '',
  currency: 'NPR',
  durationDays: '',
  jobLimit: '',
  featuredLimit: '',
  status: CatalogStatus.ACTIVE,
};

const formFromPlan = (plan: ServicePlan): PlanFormState => ({
  name: plan.name,
  description: plan.description ?? '',
  price: String(plan.price),
  currency: plan.currency,
  durationDays: plan.duration_days === null ? '' : String(plan.duration_days),
  jobLimit: plan.job_posting_limit === null ? '' : String(plan.job_posting_limit),
  featuredLimit: String(plan.featured_jobs_limit),
  status:
    plan.status === CatalogStatus.INACTIVE ? CatalogStatus.INACTIVE : CatalogStatus.ACTIVE,
});

export default function AdminServicePlansPage() {
  const [status, setStatus] = useState('');
  const plans = useApiList<ServicePlan>(
    withQuery(endpoints.servicePlans.list, { status, perPage: 100 }),
  );

  // Create/edit modal
  const [editing, setEditing] = useState<ServicePlan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<PlanFormState>(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Row actions
  const [busyId, setBusyId] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<ServicePlan | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (plan: ServicePlan) => {
    setEditing(plan);
    setForm(formFromPlan(plan));
    setFormError('');
    setModalOpen(true);
  };

  const update = (patch: Partial<PlanFormState>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const validate = (): string => {
    if (!form.name.trim()) return 'Name is required.';
    const price = Number(form.price);
    if (form.price.trim() === '' || Number.isNaN(price) || price < 0) {
      return 'Price must be a number of 0 or more.';
    }
    if (form.durationDays.trim() !== '') {
      const days = Number(form.durationDays);
      if (!Number.isInteger(days) || days <= 0) {
        return 'Duration must be a whole number of days, or blank to never expire.';
      }
    }
    if (form.jobLimit.trim() !== '') {
      const limit = Number(form.jobLimit);
      if (!Number.isInteger(limit) || limit < 0) {
        return 'Job posting limit must be 0 or more, or blank for unlimited.';
      }
    }
    if (form.featuredLimit.trim() !== '') {
      const featured = Number(form.featuredLimit);
      if (!Number.isInteger(featured) || featured < 0) {
        return 'Featured jobs limit must be 0 or more.';
      }
    }
    return '';
  };

  const submitPlan = async (e: FormEvent) => {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setFormError(problem);
      return;
    }
    setSaving(true);
    setFormError('');
    const body = {
      name: form.name.trim(),
      description: form.description.trim() ? form.description.trim() : null,
      price: Number(form.price),
      currency: form.currency.trim() || 'NPR',
      duration_days: form.durationDays.trim() === '' ? null : Number(form.durationDays),
      job_posting_limit: form.jobLimit.trim() === '' ? null : Number(form.jobLimit),
      featured_jobs_limit:
        form.featuredLimit.trim() === '' ? 0 : Number(form.featuredLimit),
      status: form.status,
    };
    try {
      if (editing) {
        await apiPatch(endpoints.servicePlans.byId(editing.id), body);
        setMsg({ ok: true, text: `Plan “${body.name}” updated.` });
      } else {
        await apiPost(endpoints.servicePlans.create, body);
        setMsg({ ok: true, text: `Plan “${body.name}” created.` });
      }
      setModalOpen(false);
      plans.refetch();
    } catch (err) {
      setFormError(
        err instanceof ApiRequestError ? err.message : 'Could not save the plan.',
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (plan: ServicePlan) => {
    const next =
      plan.status === CatalogStatus.ACTIVE ? CatalogStatus.INACTIVE : CatalogStatus.ACTIVE;
    setBusyId(plan.id);
    setMsg(null);
    try {
      await apiPatch(endpoints.servicePlans.byId(plan.id), { status: next });
      setMsg({
        ok: true,
        text:
          next === CatalogStatus.INACTIVE
            ? `“${plan.name}” deactivated. Existing orders keep their entitlements.`
            : `“${plan.name}” is active again.`,
      });
      plans.refetch();
    } catch (err) {
      setMsg({
        ok: false,
        text: err instanceof ApiRequestError ? err.message : 'Could not update the plan.',
      });
    } finally {
      setBusyId('');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiDelete(endpoints.servicePlans.byId(deleteTarget.id));
      setMsg({ ok: true, text: `Plan “${deleteTarget.name}” deleted.` });
      setDeleteTarget(null);
      plans.refetch();
    } catch (err) {
      setMsg({
        ok: false,
        text:
          err instanceof ApiRequestError
            ? err.message
            : 'Could not delete the plan.',
      });
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Service plans</h1>
          <p className="mt-1 text-sm text-slate-500">
            {plans.data.length} plan{plans.data.length === 1 ? '' : 's'} shown · prices,
            limits and status for the order catalog.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-48">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="Filter plans by status"
            >
              <option value="">All statuses</option>
              <option value={CatalogStatus.ACTIVE}>Active</option>
              <option value={CatalogStatus.INACTIVE}>Inactive</option>
            </Select>
          </div>
          <Button onClick={openCreate}>New plan</Button>
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

      {plans.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading plans…
        </div>
      ) : plans.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {plans.error}
        </div>
      ) : plans.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="package" className="h-10 w-10" />}
          title={status ? 'No plans with that status' : 'No service plans yet'}
          description={
            status
              ? 'Try a different status filter.'
              : 'Plans define what companies can buy: duration, job posting limits and featured slots.'
          }
          action={
            status ? (
              <Button variant="secondary" onClick={() => setStatus('')}>
                Clear filter
              </Button>
            ) : (
              <Button onClick={openCreate}>Create the first plan</Button>
            )
          }
        />
      ) : (
        <ul className="space-y-4">
          {plans.data.map((plan, index) => {
            const active = plan.status === CatalogStatus.ACTIVE;
            return (
              <li
                key={plan.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{plan.name}</p>
                      <Badge tone={active ? 'green' : 'slate'}>
                        {active ? 'Active' : 'Inactive'}
                      </Badge>
                      <span className="text-sm font-bold text-slate-900">
                        {formatMoney(plan.price, plan.currency)}
                      </span>
                    </div>
                    {plan.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {plan.description}
                      </p>
                    )}
                    <p className="mt-1.5 text-xs text-slate-400">
                      {plan.duration_days === null
                        ? 'Never expires'
                        : `${plan.duration_days} days`}{' '}
                      ·{' '}
                      {plan.job_posting_limit === null
                        ? 'Unlimited job postings'
                        : `${plan.job_posting_limit} job posting${plan.job_posting_limit === 1 ? '' : 's'}`}{' '}
                      · {plan.featured_jobs_limit} featured slot
                      {plan.featured_jobs_limit === 1 ? '' : 's'} · updated{' '}
                      {timeAgo(plan.updated_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openEdit(plan)}>
                      Edit
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busyId === plan.id}
                      onClick={() => void toggleStatus(plan)}
                    >
                      {active ? 'Deactivate' : 'Activate'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(plan)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-slate-400">
        Deactivating hides a plan from new purchases. Companies that already ordered it keep
        their entitlements: purchased orders are never touched by catalog changes.
      </p>

      {/* Create / edit modal */}
      <Modal
        open={modalOpen}
        title={editing ? 'Edit service plan' : 'New service plan'}
        onClose={() => setModalOpen(false)}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="plan-form" loading={saving}>
              {editing ? 'Save changes' : 'Create plan'}
            </Button>
          </>
        }
      >
        <form id="plan-form" onSubmit={submitPlan} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required htmlFor="sp-name">
              <Input
                id="sp-name"
                value={form.name}
                maxLength={150}
                onChange={(e) => update({ name: e.target.value })}
                placeholder="Pro"
              />
            </Field>
            <Field label="Status" htmlFor="sp-status">
              <Select
                id="sp-status"
                value={form.status}
                onChange={(e) => update({ status: e.target.value as CatalogStatus })}
              >
                <option value={CatalogStatus.ACTIVE}>Active</option>
                <option value={CatalogStatus.INACTIVE}>Inactive</option>
              </Select>
            </Field>
          </div>

          <Field label="Description" htmlFor="sp-desc">
            <Textarea
              id="sp-desc"
              rows={2}
              maxLength={5000}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="What does this plan include?"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price" required hint="0 or more" htmlFor="sp-price">
              <Input
                id="sp-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => update({ price: e.target.value })}
              />
            </Field>
            <Field label="Currency" hint="Up to 10 characters" htmlFor="sp-currency">
              <Input
                id="sp-currency"
                value={form.currency}
                maxLength={10}
                onChange={(e) => update({ currency: e.target.value })}
              />
            </Field>
            <Field
              label="Duration (days)"
              hint="Blank means the entitlement never expires"
              htmlFor="sp-duration"
            >
              <Input
                id="sp-duration"
                type="number"
                min={1}
                step={1}
                value={form.durationDays}
                onChange={(e) => update({ durationDays: e.target.value })}
              />
            </Field>
            <Field
              label="Job posting limit"
              hint="Blank means unlimited postings"
              htmlFor="sp-jobs"
            >
              <Input
                id="sp-jobs"
                type="number"
                min={0}
                step={1}
                value={form.jobLimit}
                onChange={(e) => update({ jobLimit: e.target.value })}
              />
            </Field>
            <Field label="Featured jobs limit" hint="0 or more" htmlFor="sp-featured">
              <Input
                id="sp-featured"
                type="number"
                min={0}
                step={1}
                value={form.featuredLimit}
                onChange={(e) => update({ featuredLimit: e.target.value })}
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

      {/* Delete confirmation */}
      <Modal
        open={deleteTarget !== null}
        title="Delete service plan"
        onClose={() => setDeleteTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" loading={deleting} onClick={() => void confirmDelete()}>
              Delete plan
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-sm text-slate-600">
          <p>
            <span className="font-semibold text-slate-800">{deleteTarget?.name}</span> will be
            removed from the catalog for good.
          </p>
          <p>
            Plans that have been ordered cannot be deleted, only deactivated, so purchase
            history stays intact. Deactivation is always safe for existing orders.
          </p>
        </div>
      </Modal>
    </div>
  );
}
