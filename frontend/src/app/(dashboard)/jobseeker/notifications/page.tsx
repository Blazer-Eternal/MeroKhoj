'use client';

/** Notifications — list, mark one read, mark all read. */
import { useState } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { apiPost, apiDelete, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Spinner, EmptyState, Badge, Select } from '@/components/ui';
import type { Notification } from '@/types';
import { timeAgo } from '@/utils/format';

const TYPE_ICONS: Record<string, string> = {
  APPLICATION_STATUS: '📨',
  INTERVIEW_SCHEDULED: '📅',
  INTERVIEW_REMINDER: '⏰',
  NEW_MESSAGE: '💬',
  JOB_ALERT: '🔔',
  SAVED_JOB_CLOSED: '🔖',
  COMPANY_VERIFICATION: '✅',
  JOB_MODERATION: '🛡️',
  REPORT_UPDATE: '🚩',
  PAYMENT_UPDATE: '💳',
  SYSTEM: '⚙️',
};

export default function NotificationsPage() {
  const notifications = useApiList<Notification>(endpoints.notifications.list, {
    query: { perPage: 100 },
  });
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [busyId, setBusyId] = useState('');
  const [allBusy, setAllBusy] = useState(false);
  const [error, setError] = useState('');

  const items =
    filter === 'unread'
      ? notifications.data.filter((n) => !n.is_read)
      : notifications.data;
  const unreadCount = notifications.data.filter((n) => !n.is_read).length;

  const markRead = async (id: string) => {
    setBusyId(id);
    setError('');
    try {
      await apiPost(endpoints.notifications.markRead(id));
      notifications.refetch();
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
      await apiPost(endpoints.notifications.markAllRead);
      notifications.refetch();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not mark all as read.');
    } finally {
      setAllBusy(false);
    }
  };

  const remove = async (id: string) => {
    setBusyId(id);
    try {
      await apiDelete(endpoints.notifications.remove(id));
      notifications.refetch();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not delete.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          <p className="mt-1 text-sm text-slate-500">
            {unreadCount} unread · {notifications.data.length} total
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
          icon="📣"
          title={filter === 'unread' ? 'You’re all caught up' : 'No notifications yet'}
          description={
            filter === 'unread'
              ? 'No unread notifications right now.'
              : 'Application updates, interview schedules and alerts land here.'
          }
        />
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n.id}
              className={`card flex items-start justify-between gap-3 ${
                n.is_read ? '' : 'border-l-4 border-l-brand-500 bg-brand-50/40'
              }`}
            >
              <div className="flex min-w-0 gap-3">
                <span className="text-xl">{TYPE_ICONS[n.type] ?? '📢'}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{n.title}</p>
                    {!n.is_read && <Badge tone="blue">New</Badge>}
                  </div>
                  {n.body && <p className="mt-0.5 text-sm text-slate-600">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-400">{timeAgo(n.created_at)}</p>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {!n.is_read && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={busyId === n.id}
                    onClick={() => void markRead(n.id)}
                  >
                    Mark read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  loading={busyId === n.id}
                  onClick={() => void remove(n.id)}
                  aria-label="Delete notification"
                >
                  ✕
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
