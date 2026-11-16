'use client';

/**
 * Admin user directory — search/filter platform accounts and toggle their
 * status.
 *
 *   GET  /admin/users?q=&role=&status=&page=&perPage= → AdminUserRow[]
 *   PATCH /admin/users/:id/status { status }           (self-suspend is
 *   blocked server-side, so the action is disabled for the current account)
 */
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { useApiList } from '@/hooks/use-api-list';
import { apiPatch, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import { Button, Badge, Spinner, EmptyState, Input, Select } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { RoleName, UserStatus } from '@/enums';
import type { AdminUserRow } from '@/types';
import { displayName, timeAgo } from '@/utils/format';

const STATUS_TONES: Record<UserStatus, 'green' | 'amber' | 'red' | 'slate'> = {
  [UserStatus.ACTIVE]: 'green',
  [UserStatus.PENDING_VERIFICATION]: 'amber',
  [UserStatus.SUSPENDED]: 'red',
  [UserStatus.DEACTIVATED]: 'slate',
};

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminUsersPage() {
  const { user } = useAuth();

  // Applied filter values (the query string is rebuilt on submit/change).
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');

  // Search box draft value.
  const [draft, setDraft] = useState('');

  const [busyId, setBusyId] = useState('');
  const [msg, setMsg] = useState<{ id: string; text: string; ok: boolean } | null>(null);

  const users = useApiList<AdminUserRow>(
    withQuery(endpoints.admin.users, { q, role, status, perPage: 100 }),
  );

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    setQ(draft.trim());
  };

  const changeStatus = async (id: string, next: UserStatus) => {
    setBusyId(id);
    setMsg(null);
    try {
      await apiPatch(endpoints.admin.userStatus(id), { status: next });
      setMsg({
        id,
        text:
          next === UserStatus.SUSPENDED
            ? 'Account suspended.'
            : 'Account is active again.',
        ok: true,
      });
      users.refetch();
    } catch (err) {
      setMsg({
        id,
        text:
          err instanceof ApiRequestError
            ? err.message
            : 'Could not update the account status.',
        ok: false,
      });
    } finally {
      setBusyId('');
    }
  };

  const hasFilters = Boolean(q || role || status);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Users</h1>
          <p className="mt-1 text-sm text-slate-500">
            {users.data.length} account{users.data.length === 1 ? '' : 's'} shown ·
            suspend or reactivate accounts, roles are managed elsewhere.
          </p>
        </div>
        <form onSubmit={submitSearch} className="flex items-center gap-2">
          <div className="w-56">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search name or email"
              aria-label="Search users"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </header>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-48">
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            aria-label="Filter by role"
          >
            <option value="">All roles</option>
            {Object.values(RoleName).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-52">
          <Select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            {Object.values(UserStatus).map((value) => (
              <option key={value} value={value}>
                {humanize(value)}
              </option>
            ))}
          </Select>
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setQ('');
              setRole('');
              setStatus('');
              setDraft('');
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {users.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading users…
        </div>
      ) : users.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {users.error}
        </div>
      ) : users.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="user" className="h-10 w-10" />}
          title={hasFilters ? 'No accounts match those filters' : 'No accounts yet'}
          description={
            hasFilters
              ? 'Try a different search term, role or status.'
              : 'Registered users appear here as soon as they sign up.'
          }
          action={
            hasFilters ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQ('');
                  setRole('');
                  setStatus('');
                  setDraft('');
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {users.data.map((row, index) => {
            const isSelf = row.id === user?.id;
            return (
              <li
                key={row.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                      {displayName(row).charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-slate-900">{displayName(row)}</p>
                        <Badge tone={STATUS_TONES[row.status]}>{humanize(row.status)}</Badge>
                        {isSelf && <Badge tone="blue">You</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-slate-500">{row.email}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {row.roles.length === 0 ? (
                          <span className="text-xs text-slate-400">No roles granted</span>
                        ) : (
                          row.roles.map((roleName) => (
                            <Badge key={roleName} tone="slate">
                              {humanize(roleName)}
                            </Badge>
                          ))
                        )}
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">
                        Joined {timeAgo(row.created_at)} · last login{' '}
                        {row.last_login_at ? timeAgo(row.last_login_at) : 'never'}
                      </p>
                      {msg?.id === row.id && (
                        <p
                          className={`mt-2 text-xs font-semibold ${
                            msg.ok ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {msg.text}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {row.status === UserStatus.ACTIVE ? (
                      <Button
                        variant="danger"
                        size="sm"
                        loading={busyId === row.id}
                        disabled={isSelf}
                        title={
                          isSelf
                            ? 'You cannot suspend your own account'
                            : `Suspend ${displayName(row)}`
                        }
                        onClick={() => void changeStatus(row.id, UserStatus.SUSPENDED)}
                      >
                        Suspend
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={busyId === row.id}
                        disabled={isSelf}
                        title={`Reactivate ${displayName(row)}`}
                        onClick={() => void changeStatus(row.id, UserStatus.ACTIVE)}
                      >
                        Reactivate
                      </Button>
                    )}
                  </div>
                </div>
                {isSelf && (
                  <p className="mt-2 text-xs text-slate-400">
                    Your own account cannot be suspended from here.
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
