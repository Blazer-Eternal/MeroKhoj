'use client';

/**
 * Employer notification inbox — application, interview, moderation, billing
 * and verification updates for this account.
 *
 *   GET   /notifications?unread_only=true|false&perPage=
 *   GET   /notifications/unread-count      → { unread_count }
 *   PATCH /notifications/:id/read          → { message }
 *   PATCH /notifications/read-all          → { updated }
 *
 * Both read actions are PATCH on this API (the jobseeker page posts to the
 * same paths and gets a 404, so it is deliberately not copied here).
 */
import { useCallback, useEffect, useState } from 'react';
import { useCompany } from '@/hooks/use-company';
import { useApiList } from '@/hooks/use-api-list';
import { apiGet, apiPatch, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import { Button, Badge, Spinner, EmptyState, Select } from '@/components/ui';
import { NavIcon, type NavIconName } from '@/components/ui/icons';
import { timeAgo } from '@/utils/format';
import type { Notification } from '@/types';

const TYPE_ICONS: Record<string, NavIconName> = {
  APPLICATION_STATUS: 'envelope',
  INTERVIEW_SCHEDULED: 'calendar',
  INTERVIEW_REMINDER: 'bell',
  NEW_MESSAGE: 'envelope',
  JOB_ALERT: 'bell',
  SAVED_JOB_CLOSED: 'bookmark',
  COMPANY_VERIFICATION: 'shield-check',
  JOB_MODERATION: 'shield',
  REPORT_UPDATE: 'flag',
  PAYMENT_UPDATE: 'card',
  SYSTEM: 'settings',
};

export default function EmployerNotificationsPage() {
  const { loading: companyLoading } = useCompany();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const notifications = useApiList<Notification>(
    withQuery(endpoints.notifications.list, {
      unread_only: filter === 'unread' ? 'true' : undefined,
      perPage: 100,
    }),
  );

  const [unreadCount, setUnreadCount] = useState(0);
  const [busyId, setBusyId] = useState('');
  const [allBusy, setAllBusy] = useState(false);
  const [error, setError] = useState('');

  const loadUnreadCount = useCallback(async () => {
    try {
      const res = await apiGet<{ unread_count: number }>(endpoints.notifications.unreadCount);
      setUnreadCount(res.unread_count);
    } catch {
      // The list itself still carries the unread state; keep the old count.
    }
  }, []);

  useEffect(() => {
    void loadUnreadCount();
  }, [loadUnreadCount]);

  const markRead = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      await apiPatch(endpoints.notifications.markRead(id), {});
      notifications.refetch();
      void loadUnreadCount();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not mark as read.');
    } finally {
      setBusyId('');
    }
  };

  const markAllRead = async () => {
    setAllBusy(true);
    setError('');
    try {
      await apiPatch(endpoints.notifications.markAllRead, {});
      notifications.refetch();
      void loadUnreadCount();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not mark all as read.');
    } finally {
      setAllBusy(false);
    }
  };

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
        <p className="mt-1 text-sm text-slate-500">
          {unreadCount} unread · {notifications.data.length} shown
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'unread')}
          aria-label="Filter notifications"
          className="w-40"
        >
          <option value="all">All</option>
          <option value="unread">Unread only</option>
        </Select>
        <Button
          variant="secondary"
          loading={allBusy}
          disabled={unreadCount === 0}
          onClick={() => void markAllRead()}
        >
          Mark all read
        </Button>
      </div>
    </header>
  );

  if (companyLoading) {
    return (
      <div className="space-y-6">
        {header}
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading notifications…
        </div>
      </div>
    );
  }

  const items = notifications.data;
  const unreadShown = items.filter((row) => !row.is_read).length;

  return (
    <div className="space-y-6">
      {header}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {notifications.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading notifications…
        </div>
      ) : notifications.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {notifications.error}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="speaker" className="h-10 w-10" />}
          title={filter === 'unread' ? 'Nothing unread' : 'No notifications yet'}
          description={
            filter === 'unread'
              ? 'Every notification has been read.'
              : 'Application updates, interviews, moderation and billing land here.'
          }
          action={
            filter === 'unread' ? (
              <Button variant="secondary" onClick={() => setFilter('all')}>
                Show all
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <p className="text-xs text-slate-400">
            {unreadShown} of {items.length} shown unread
          </p>
          <ul className="space-y-3">
            {items.map((row, index) => (
              <li
                key={row.id}
                className={`card lift mk-rise flex items-start justify-between gap-3 ${
                  row.is_read ? '' : 'border-l-4 border-l-brand-500 bg-brand-50/40'
                }`}
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex min-w-0 gap-3">
                  <span className="text-brand-600">
                    <NavIcon name={TYPE_ICONS[row.type] ?? 'speaker'} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900">{row.title}</p>
                      {!row.is_read && <Badge tone="blue">New</Badge>}
                    </div>
                    {row.body && <p className="mt-0.5 text-sm text-slate-600">{row.body}</p>}
                    <p className="mt-1 text-xs text-slate-400">{timeAgo(row.created_at)}</p>
                  </div>
                </div>
                {!row.is_read && (
                  <div className="shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={busyId === row.id}
                      onClick={() => void markRead(row.id)}
                    >
                      Mark read
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
