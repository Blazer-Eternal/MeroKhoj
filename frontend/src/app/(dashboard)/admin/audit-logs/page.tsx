'use client';

/**
 * Admin / audit logs — every recorded platform action with the values before
 * and after it.
 *
 *   GET /audit-logs?action=&entity_type=
 *
 * The query schema only knows action/entity_type/entity_id/user_id (page and
 * perPage are stripped), so the response is always the full matching set and
 * this page reveals rows 50 at a time. Filter options are collected from an
 * unfiltered copy of the same feed.
 */
import { useMemo, useState, type FormEvent } from 'react';
import { useApiList } from '@/hooks/use-api-list';
import { endpoints, withQuery } from '@/services/api-endpoints';
import { Button, Badge, Field, Input, Select, Spinner, EmptyState } from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import type { AdminUserRow } from '@/types';
import { displayName, timeAgo } from '@/utils/format';

/** Log row exactly as the API returns it (the actor key is `user_id`). */
interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const shortId = (id: string): string => `${id.slice(0, 8)}…`;

export default function AdminAuditLogsPage() {
  // Applied filters (the path is rebuilt, which refetches the list).
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  // Search box draft value; the server matches actions exactly.
  const [draft, setDraft] = useState('');

  const [expandedId, setExpandedId] = useState('');
  const [shown, setShown] = useState(50);

  const catalog = useApiList<AuditLogRow>(endpoints.admin.auditLogs.list);
  const logs = useApiList<AuditLogRow>(
    withQuery(endpoints.admin.auditLogs.list, { action, entity_type: entityType }),
  );
  const users = useApiList<AdminUserRow>(withQuery(endpoints.admin.users, { perPage: 100 }));

  const actorNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of users.data) map.set(row.id, displayName(row));
    return map;
  }, [users.data]);

  const actionOptions = useMemo(
    () => [...new Set(catalog.data.map((row) => row.action))].sort(),
    [catalog.data],
  );
  const entityOptions = useMemo(
    () => [...new Set(catalog.data.map((row) => row.entity_type))].sort(),
    [catalog.data],
  );

  const hasFilter = Boolean(action || entityType);
  const visible = logs.data.slice(0, shown);

  const applyAction = (e: FormEvent) => {
    e.preventDefault();
    setAction(draft.trim().toUpperCase());
    setShown(50);
    setExpandedId('');
  };

  const clearFilters = () => {
    setAction('');
    setEntityType('');
    setDraft('');
    setShown(50);
    setExpandedId('');
  };

  const actorLabel = (userId: string | null): string => {
    if (!userId) return 'System';
    return actorNames.get(userId) ?? shortId(userId);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Audit logs</h1>
          <p className="mt-1 text-sm text-slate-500">
            {logs.data.length} of {catalog.data.length} record
            {catalog.data.length === 1 ? '' : 's'} shown · every administrative
            action, with the values before and after.
          </p>
        </div>
      </header>

      {/* Filters */}
      <form
        onSubmit={applyAction}
        className="card flex flex-wrap items-end gap-4"
      >
        <div className="w-60">
          <Field label="Action" hint="Exact action name, e.g. ORDER_CREATED">
            <Input
              list="audit-action-options"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ORDER_CREATED"
            />
          </Field>
          <datalist id="audit-action-options">
            {actionOptions.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <div className="w-56">
          <Field label="Entity type">
            <Select
              value={entityType}
              onChange={(e) => {
                setEntityType(e.target.value);
                setShown(50);
                setExpandedId('');
              }}
              aria-label="Filter audit logs by entity type"
            >
              <option value="">All entities</option>
              {entityOptions.map((name) => (
                <option key={name} value={name}>
                  {humanize(name)}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button variant="secondary" type="submit">
          Apply
        </Button>
        {hasFilter && (
          <Button variant="ghost" onClick={clearFilters}>
            Clear filters
          </Button>
        )}
        <p className="ml-auto pb-2.5 text-xs text-slate-400">
          {actionOptions.length} action{actionOptions.length === 1 ? '' : 's'} ·{' '}
          {entityOptions.length} entit{entityOptions.length === 1 ? 'y' : 'ies'} recorded
        </p>
      </form>

      {logs.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading audit logs…
        </div>
      ) : logs.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {logs.error}
        </div>
      ) : logs.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="list" className="h-10 w-10" />}
          title={hasFilter ? 'No audit entries match' : 'No audit entries yet'}
          description={
            hasFilter
              ? 'No recorded action matches those filters.'
              : 'Administrative actions appear here as soon as they are performed.'
          }
          action={
            hasFilter ? (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="space-y-4">
            {visible.map((log, index) => {
              const isOpen = expandedId === log.id;
              const before = isObject(log.old_values) ? log.old_values : null;
              const after = isObject(log.new_values) ? log.new_values : null;
              return (
                <li
                  key={log.id}
                  className="card lift mk-rise"
                  style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="blue">{log.action}</Badge>
                    <span className="text-sm font-semibold text-slate-800">
                      {humanize(log.entity_type)}
                    </span>
                    {log.entity_id && (
                      <span
                        className="font-mono text-xs text-slate-400"
                        title={log.entity_id}
                      >
                        {shortId(log.entity_id)}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-slate-400">
                      {log.ip_address ?? 'No IP recorded'}
                    </span>
                    <span
                      className="text-xs text-slate-500"
                      title={new Date(log.created_at).toLocaleString()}
                    >
                      {timeAgo(log.created_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(isOpen ? '' : log.id)}
                      aria-expanded={isOpen}
                    >
                      {isOpen ? 'Hide changes' : 'Show changes'}
                    </Button>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    By <span className="font-medium text-slate-700">{actorLabel(log.user_id)}</span>
                    {' · '}
                    {before || after
                      ? `${new Set([
                          ...Object.keys(before ?? {}),
                          ...Object.keys(after ?? {}),
                        ]).size} field(s) changed`
                      : 'No value changes recorded'}
                  </p>

                  {isOpen && (
                    <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
                      <dl className="grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs uppercase text-slate-400">Actor id</dt>
                          <dd className="mt-0.5 font-mono text-xs text-slate-600">
                            {log.user_id ?? 'system'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase text-slate-400">Entity id</dt>
                          <dd className="mt-0.5 font-mono text-xs text-slate-600">
                            {log.entity_id ?? 'none'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase text-slate-400">Recorded</dt>
                          <dd className="mt-0.5 text-xs text-slate-600">
                            {new Date(log.created_at).toLocaleString()}
                          </dd>
                        </div>
                      </dl>

                      {before && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            Before
                          </p>
                          <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                            {JSON.stringify(before, null, 2)}
                          </pre>
                        </div>
                      )}
                      {after && (
                        <div>
                          <p className="text-xs font-semibold uppercase text-slate-400">
                            After
                          </p>
                          <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                            {JSON.stringify(after, null, 2)}
                          </pre>
                        </div>
                      )}
                      {!before && !after && (
                        <p className="text-sm text-slate-500">
                          This action recorded no value changes.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {shown < logs.data.length && (
            <div className="flex justify-center">
              <Button
                variant="secondary"
                onClick={() => setShown((n) => Math.min(n + 50, logs.data.length))}
              >
                Show 50 more ({logs.data.length - shown} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
