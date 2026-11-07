'use client';

/**
 * Job alerts manager — list/create/edit/pause/delete.
 * Taxonomy fields are ids (location_id, category_id) per createJobAlertSchema.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, apiPatch, apiDelete, apiCollection, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Field, Input, Select, Spinner, EmptyState, Modal, Badge } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { JobAlertFrequency, EmploymentType } from '@/enums';
import type { JobAlert, Location as GeoLocation, JobCategory } from '@/types';
import { humanize, timeAgo } from '@/utils/format';

const EMPTY = {
  name: '',
  keywords: '',
  location_id: '',
  category_id: '',
  employment_type: '',
  frequency: JobAlertFrequency.DAILY as JobAlertFrequency,
};

export default function JobAlertsPage() {
  const alerts = useApiList<JobAlert>(endpoints.jobAlerts.list, { query: { perPage: 100 } });
  const [locations, setLocations] = useState<GeoLocation[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobAlert | null>(null);
  const [form, setForm] = useState(EMPTY);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const [locs, cats] = await Promise.all([
          apiCollection<GeoLocation>(endpoints.locations.list, {
            anonymous: true,
            query: { perPage: 200 },
          }),
          apiCollection<JobCategory>(endpoints.jobCategories.list, {
            anonymous: true,
            query: { perPage: 200 },
          }),
        ]);
        setLocations(locs.data);
        setCategories(cats.data);
      } catch {
        // optional data
      }
    })();
  }, []);

  const startNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setFormError('');
    setOpen(true);
  };

  const startEdit = (alert: JobAlert) => {
    setEditing(alert);
    setForm({
      name: alert.name,
      keywords: alert.keywords ?? '',
      location_id: alert.location_id ?? '',
      category_id: alert.category_id ?? '',
      employment_type: alert.employment_type ?? '',
      frequency: alert.frequency,
    });
    setFormError('');
    setOpen(true);
  };

  const set = (key: keyof typeof EMPTY) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError('Give your alert a name.');
      return;
    }
    setFormError('');
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      keywords: form.keywords.trim() || null,
      location_id: form.location_id || null,
      category_id: form.category_id || null,
      employment_type: form.employment_type || null,
      frequency: form.frequency,
      is_active: true,
    };
    try {
      if (editing) {
        await apiPatch(endpoints.jobAlerts.byId(editing.id), payload);
      } else {
        await apiPost(endpoints.jobAlerts.list, payload);
      }
      setOpen(false);
      alerts.refetch();
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Could not save the alert.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (alert: JobAlert) => {
    setBusyId(alert.id);
    try {
      await apiPatch(endpoints.jobAlerts.byId(alert.id), { is_active: !alert.is_active });
      alerts.refetch();
    } catch {
      // list stays as-is
    } finally {
      setBusyId('');
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await apiDelete(endpoints.jobAlerts.byId(id));
      alerts.refetch();
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Job alerts</h1>
          <p className="mt-1 text-sm text-slate-500">
            {alerts.data.filter((a) => a.is_active).length} active ·{' '}
            {alerts.data.length} total. Matched jobs arrive as notifications.
          </p>
        </div>
        <Button onClick={startNew}>+ New alert</Button>
      </header>

      {alerts.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading alerts…
        </div>
      ) : alerts.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {alerts.error}
        </div>
      ) : alerts.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="bell" className="h-10 w-10" />}
          title="No alerts yet"
          description="Create an alert and we'll notify you when matching jobs are posted."
          action={<Button onClick={startNew}>+ New alert</Button>}
        />
      ) : (
        <ul className="space-y-4">
          {alerts.data.map((alert) => (
            <li key={alert.id} className="card flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold text-slate-900">{alert.name}</h2>
                  <Badge tone={alert.is_active ? 'green' : 'slate'}>
                    {alert.is_active ? 'Active' : 'Paused'}
                  </Badge>
                  <Badge tone="blue">{humanize(alert.frequency)}</Badge>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {alert.keywords ? `Keywords: ${alert.keywords}` : 'No keywords'}
                  {alert.employment_type ? ` · ${humanize(alert.employment_type)}` : ''}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {alert.last_sent_at
                    ? `Last sent ${timeAgo(alert.last_sent_at)}`
                    : 'Never sent yet'}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busyId === alert.id}
                  onClick={() => void toggleActive(alert)}
                >
                  {alert.is_active ? 'Pause' : 'Resume'}
                </Button>
                <Button variant="secondary" size="sm" onClick={() => startEdit(alert)}>
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  loading={busyId === alert.id}
                  onClick={() => void remove(alert.id)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={open}
        title={editing ? 'Edit alert' : 'New job alert'}
        onClose={() => setOpen(false)}
      >
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <Field label="Alert name" required htmlFor="ja-name">
            <Input
              id="ja-name"
              placeholder="React jobs in Kathmandu"
              value={form.name}
              onChange={set('name')}
            />
          </Field>
          <Field label="Keywords" hint="Comma-separated" htmlFor="ja-keywords">
            <Input
              id="ja-keywords"
              placeholder="react, node"
              value={form.keywords}
              onChange={set('keywords')}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Location" htmlFor="ja-location">
              <Select id="ja-location" value={form.location_id} onChange={set('location_id')}>
                <option value="">Any location</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                    {loc.city ? ` · ${loc.city}` : ''}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category" htmlFor="ja-category">
              <Select id="ja-category" value={form.category_id} onChange={set('category_id')}>
                <option value="">Any category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Job type" htmlFor="ja-type">
              <Select id="ja-type" value={form.employment_type} onChange={set('employment_type')}>
                <option value="">Any type</option>
                {Object.values(EmploymentType).map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Frequency" htmlFor="ja-frequency">
              <Select id="ja-frequency" value={form.frequency} onChange={set('frequency')}>
                <option value={JobAlertFrequency.INSTANT}>Instant</option>
                <option value={JobAlertFrequency.DAILY}>Daily digest</option>
                <option value={JobAlertFrequency.WEEKLY}>Weekly digest</option>
              </Select>
            </Field>
          </div>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save changes' : 'Create alert'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
