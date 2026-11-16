'use client';

/**
 * Company members — who can work inside this company and with which role.
 *
 *   GET    /companies/:id/members            list memberships
 *   POST   /companies/:id/members            { user_id, role }
 *   PATCH  /companies/:id/members/:memberId  { role }
 *   DELETE /companies/:id/members/:memberId
 *
 * The backend guards ownership rules: the last OWNER cannot be demoted or
 * removed, and no member can hand out a role above their own. Those conflicts
 * come back as 409 and are surfaced verbatim in the modal.
 *
 * Invitations work by user id today (there is no invite endpoint), so the add
 * form offers a picker built from the candidates that already applied to your
 * jobs alongside a raw id field.
 */
import { useMemo, useState, type FormEvent } from 'react';
import { useCompany } from '@/hooks/use-company';
import { useApiList } from '@/hooks/use-api-list';
import { useAuth } from '@/context/auth-context';
import { apiDelete, apiPatch, apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints, withQuery } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  Spinner,
  EmptyState,
  Field,
  Input,
  Select,
  Modal,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { CompanyMemberStatus, CompanyRole } from '@/enums';
import { formatDate, timeAgo, humanize } from '@/utils/format';
import type { CompanyMember } from '@/types';

/** Applications only expose the applicant user record the picker needs. */
interface ApplicationRow {
  id: string;
  jobseeker?: { id: string; first_name: string; last_name: string; email: string } | null;
}

const ROLE_TONE: Record<CompanyRole, 'blue' | 'slate'> = {
  [CompanyRole.OWNER]: 'blue',
  [CompanyRole.ADMIN]: 'blue',
  [CompanyRole.RECRUITER]: 'slate',
  [CompanyRole.HIRING_MANAGER]: 'slate',
  [CompanyRole.VIEWER]: 'slate',
};

const shortId = (id: string): string => `${id.slice(0, 8)}…${id.slice(-4)}`;

export default function CompanyMembersPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  const { user } = useAuth();
  const companyId = company?.id ?? null;

  const members = useApiList<CompanyMember>(companyId ? endpoints.companies.members(companyId) : null);
  const applications = useApiList<ApplicationRow>(
    companyId ? withQuery(endpoints.companies.applications(companyId), { perPage: 100 }) : null,
  );

  // Add member
  const [addOpen, setAddOpen] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<CompanyRole>(CompanyRole.RECRUITER);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Role change
  const [roleTarget, setRoleTarget] = useState<CompanyMember | null>(null);
  const [nextRole, setNextRole] = useState<CompanyRole>(CompanyRole.RECRUITER);
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleError, setRoleError] = useState('');

  // Removal
  const [removeTarget, setRemoveTarget] = useState<CompanyMember | null>(null);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState('');

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  /** Unique applicants (by user id) usable as candidates for a membership. */
  const candidates = useMemo(() => {
    const map = new Map<string, { name: string; email: string }>();
    for (const app of applications.data) {
      const person = app.jobseeker;
      if (!person || map.has(person.id)) continue;
      map.set(person.id, {
        name: `${person.first_name} ${person.last_name}`.trim(),
        email: person.email,
      });
    }
    return Array.from(map.entries()).map(([id, info]) => ({ id, ...info }));
  }, [applications.data]);

  const openAdd = () => {
    setUserId('');
    setRole(CompanyRole.RECRUITER);
    setAddError('');
    setAddOpen(true);
  };

  const submitAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    const id = userId.trim();
    if (!/^[0-9a-f-]{36}$/i.test(id)) {
      setAddError('Enter a valid user id (a UUID with dashes).');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      await apiPost(endpoints.companies.members(companyId), { user_id: id, role });
      setAddOpen(false);
      setMsg({ ok: true, text: `Member added as ${humanize(role)}.` });
      members.refetch();
    } catch (err) {
      setAddError(err instanceof ApiRequestError ? err.message : 'Could not add the member.');
    } finally {
      setAdding(false);
    }
  };

  const openRole = (member: CompanyMember) => {
    setRoleTarget(member);
    setNextRole(member.role);
    setRoleError('');
  };

  const submitRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyId || !roleTarget) return;
    if (nextRole === roleTarget.role) {
      setRoleError('Pick a different role.');
      return;
    }
    setRoleSaving(true);
    setRoleError('');
    try {
      await apiPatch(endpoints.companies.member(companyId, roleTarget.id), { role: nextRole });
      setRoleTarget(null);
      setMsg({ ok: true, text: `Role updated to ${humanize(nextRole)}.` });
      members.refetch();
    } catch (err) {
      setRoleError(err instanceof ApiRequestError ? err.message : 'Could not change the role.');
    } finally {
      setRoleSaving(false);
    }
  };

  const submitRemove = async () => {
    if (!companyId || !removeTarget) return;
    setRemoving(true);
    setRemoveError('');
    try {
      await apiDelete(endpoints.companies.member(companyId, removeTarget.id));
      setRemoveTarget(null);
      setMsg({ ok: true, text: 'Member removed from the company.' });
      members.refetch();
    } catch (err) {
      setRemoveError(err instanceof ApiRequestError ? err.message : 'Could not remove the member.');
    } finally {
      setRemoving(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading members…
      </div>
    );
  }

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Company members</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? `Who can manage ${company.name}, its jobs and applicants.`
            : 'Create a company to invite teammates.'}
        </p>
      </div>
      {company && (
        <Button onClick={openAdd}>Add member</Button>
      )}
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
          icon={<NavIcon name="users" className="h-10 w-10" />}
          title="No company yet"
          description="Members belong to a company. Create your company first, then add teammates here."
        />
      </div>
    );
  }

  const loading = members.loading || applications.loading;
  const listError = members.error || applications.error;

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

      {loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading members…
        </div>
      ) : listError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {listError}
        </div>
      ) : members.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="users" className="h-10 w-10" />}
          title="No members yet"
          description="Add the people who post jobs, review applicants and run interviews."
          action={<Button onClick={openAdd}>Add member</Button>}
        />
      ) : (
        <ul className="space-y-4">
          {members.data.map((member, index) => {
            const isSelf = member.user_id === user?.id;
            return (
              <li
                key={member.id}
                className="card lift mk-rise"
                style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-bold text-slate-900" title={member.user_id}>
                        {shortId(member.user_id)}
                      </span>
                      <Badge tone={ROLE_TONE[member.role]}>{humanize(member.role)}</Badge>
                      <Badge tone={member.status === CompanyMemberStatus.ACTIVE ? 'green' : 'slate'}>
                        {humanize(member.status)}
                      </Badge>
                      {isSelf && <Badge tone="blue">You</Badge>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      {member.joined_at
                        ? `Joined ${formatDate(member.joined_at)} · ${timeAgo(member.joined_at)}`
                        : 'Not joined yet'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => openRole(member)}>
                      Change role
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => {
                      setRemoveError('');
                      setRemoveTarget(member);
                    }}>
                      Remove
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-slate-400">
        The last OWNER can never be demoted or removed, and nobody can grant a role above
        their own. The backend answers those attempts with a conflict.
      </p>

      {/* Add member */}
      <Modal
        open={addOpen}
        title="Add company member"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button type="submit" form="member-add-form" loading={adding}>
              Add member
            </Button>
          </>
        }
      >
        <form id="member-add-form" onSubmit={submitAdd} className="space-y-4" noValidate>
          <Field
            label="User id"
            required
            hint="Paste the account id, or pick an applicant below to fill it in."
            htmlFor="m-user"
          >
            <Input
              id="m-user"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="14cc4441-a1c1-4430-946c-f43ad877f7af"
            />
          </Field>

          <Field label="Role" required htmlFor="m-role">
            <Select
              id="m-role"
              value={role}
              onChange={(e) => setRole(e.target.value as CompanyRole)}
            >
              {Object.values(CompanyRole).map((value) => (
                <option key={value} value={value}>
                  {humanize(value)}
                </option>
              ))}
            </Select>
          </Field>

          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">
              Pick from your applicants
            </p>
            {applications.loading ? (
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500">
                <Spinner /> Loading candidates…
              </div>
            ) : candidates.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500">
                No applicants yet. Once candidates apply to your jobs they appear here.
              </p>
            ) : (
              <ul className="max-h-44 space-y-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
                {candidates.map((person) => (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => setUserId(person.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                        userId === person.id
                          ? 'bg-brand-50 text-brand-700 ring-1 ring-brand-200'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium">{person.name}</span>
                        <span className="block truncate text-xs text-slate-400">
                          {person.email}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold">
                        {userId === person.id ? 'Selected' : 'Use id'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {addError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {addError}
            </div>
          )}
        </form>
      </Modal>

      {/* Change role */}
      <Modal
        open={roleTarget !== null}
        title="Change role"
        onClose={() => setRoleTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRoleTarget(null)} disabled={roleSaving}>
              Cancel
            </Button>
            <Button type="submit" form="member-role-form" loading={roleSaving}>
              Save role
            </Button>
          </>
        }
      >
        <form id="member-role-form" onSubmit={submitRole} className="space-y-4" noValidate>
          {roleTarget && (
            <p className="text-sm text-slate-600">
              Member <span className="font-mono font-semibold text-slate-800">{shortId(roleTarget.user_id)}</span>{' '}
              is currently {humanize(roleTarget.role)}.
            </p>
          )}
          <Field label="New role" required htmlFor="mr-role">
            <Select
              id="mr-role"
              value={nextRole}
              onChange={(e) => {
                setNextRole(e.target.value as CompanyRole);
                setRoleError('');
              }}
            >
              {Object.values(CompanyRole).map((value) => (
                <option key={value} value={value}>
                  {humanize(value)}
                </option>
              ))}
            </Select>
          </Field>
          {roleError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {roleError}
            </div>
          )}
        </form>
      </Modal>

      {/* Remove confirmation */}
      <Modal
        open={removeTarget !== null}
        title="Remove member"
        onClose={() => setRemoveTarget(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveTarget(null)} disabled={removing}>
              Keep member
            </Button>
            <Button variant="danger" type="submit" form="member-remove-form" loading={removing}>
              Remove member
            </Button>
          </>
        }
      >
        <form
          id="member-remove-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submitRemove();
          }}
          className="space-y-3"
        >
          <p className="text-sm text-slate-600">
            <span className="font-mono font-semibold text-slate-800">
              {removeTarget ? shortId(removeTarget.user_id) : ''}
            </span>{' '}
            will lose access to this company. Their past actions stay in the audit trail.
          </p>
          {removeError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {removeError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
