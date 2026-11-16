'use client';

/**
 * Talent rosters — company-owned shortlists of jobseeker profiles.
 *
 *   GET    /companies/:id/rosters          list this company's rosters
 *   POST   /companies/:id/rosters          { name, description? }
 *   DELETE /rosters/:id                    remove a roster
 *   GET    /rosters/:rosterId/members      { members }
 *   POST   /rosters/:rosterId/members      { jobseeker_id, notes? }
 *   PATCH  /rosters/:rosterId/members/:jobseekerId  { notes }
 *   DELETE /rosters/:rosterId/members/:jobseekerId
 *
 * A roster member is keyed by the jobseeker PROFILE id (jobseeker_profiles.id),
 * not the account id used everywhere else, and there is no endpoint that lists
 * profiles for an employer. The add form therefore takes the profile id as a
 * paste-in value with a hint on where to find it.
 */
import { useState, type FormEvent } from 'react';
import { useCompany } from '@/hooks/use-company';
import { useApiList } from '@/hooks/use-api-list';
import { apiDelete, apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  Spinner,
  EmptyState,
  Field,
  Input,
  Textarea,
  Modal,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { formatDate } from '@/utils/format';
import type { TalentRoster } from '@/types';

/** Roster member row (the shared type has `note`, the API sends `notes`). */
interface RosterMemberRow {
  id?: string;
  roster_id: string;
  jobseeker_id: string;
  added_by?: string | null;
  notes: string | null;
}

const shortId = (id: string): string => `${id.slice(0, 8)}…${id.slice(-4)}`;

export default function TalentRosterPage() {
  const { company, loading: companyLoading, error: companyError } = useCompany();
  const companyId = company?.id ?? null;

  const rosters = useApiList<TalentRoster>(
    companyId ? endpoints.companies.rosters(companyId) : null,
  );
  const [selected, setSelected] = useState<string | null>(null);
  const members = useApiList<RosterMemberRow>(
    selected ? endpoints.rosters.members(selected) : null,
  );

  // Create roster
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Add member
  const [addOpen, setAddOpen] = useState(false);
  const [jobseekerId, setJobseekerId] = useState('');
  const [notes, setNotes] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Remove confirmations
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [removeMemberBusy, setRemoveMemberBusy] = useState(false);
  const [removeMemberError, setRemoveMemberError] = useState('');

  const [removeRoster, setRemoveRoster] = useState<TalentRoster | null>(null);
  const [removeRosterBusy, setRemoveRosterBusy] = useState(false);
  const [removeRosterError, setRemoveRosterError] = useState('');

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const openCreate = () => {
    setName('');
    setDescription('');
    setCreateError('');
    setCreateOpen(true);
  };

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!companyId) return;
    const rosterName = name.trim();
    if (!rosterName) {
      setCreateError('Give the roster a name.');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await apiPost(endpoints.companies.rosters(companyId), {
        name: rosterName,
        description: description.trim() || null,
      });
      setCreateOpen(false);
      setMsg({ ok: true, text: 'Roster created.' });
      rosters.refetch();
    } catch (err) {
      setCreateError(err instanceof ApiRequestError ? err.message : 'Could not create the roster.');
    } finally {
      setCreating(false);
    }
  };

  const openAdd = () => {
    setJobseekerId('');
    setNotes('');
    setAddError('');
    setAddOpen(true);
  };

  const submitAdd = async (e: FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const profileId = jobseekerId.trim();
    if (!/^[0-9a-f-]{36}$/i.test(profileId)) {
      setAddError('Enter a valid profile id (a UUID with dashes).');
      return;
    }
    setAdding(true);
    setAddError('');
    try {
      await apiPost(endpoints.rosters.members(selected), {
        jobseeker_id: profileId,
        notes: notes.trim() || null,
      });
      setAddOpen(false);
      setMsg({ ok: true, text: 'Candidate added to the roster.' });
      members.refetch();
    } catch (err) {
      setAddError(err instanceof ApiRequestError ? err.message : 'Could not add the candidate.');
    } finally {
      setAdding(false);
    }
  };

  const submitRemoveMember = async () => {
    if (!selected || !removeMemberId) return;
    setRemoveMemberBusy(true);
    setRemoveMemberError('');
    try {
      await apiDelete(endpoints.rosters.member(selected, removeMemberId));
      setRemoveMemberId(null);
      setMsg({ ok: true, text: 'Candidate removed from the roster.' });
      members.refetch();
    } catch (err) {
      setRemoveMemberError(
        err instanceof ApiRequestError ? err.message : 'Could not remove the candidate.',
      );
    } finally {
      setRemoveMemberBusy(false);
    }
  };

  const submitRemoveRoster = async () => {
    if (!removeRoster) return;
    setRemoveRosterBusy(true);
    setRemoveRosterError('');
    try {
      await apiDelete(endpoints.rosters.byId(removeRoster.id));
      if (selected === removeRoster.id) setSelected(null);
      setRemoveRoster(null);
      setMsg({ ok: true, text: 'Roster deleted.' });
      rosters.refetch();
    } catch (err) {
      setRemoveRosterError(
        err instanceof ApiRequestError ? err.message : 'Could not delete the roster.',
      );
    } finally {
      setRemoveRosterBusy(false);
    }
  };

  if (companyLoading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading rosters…
      </div>
    );
  }

  const header = (
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Talent roster</h1>
        <p className="mt-1 text-sm text-slate-500">
          {company
            ? `Keep promising candidates close, ${company.name}.`
            : 'Create a company to build rosters.'}
        </p>
      </div>
      {company && <Button onClick={openCreate}>New roster</Button>}
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
          description="Rosters belong to a company profile. Create yours first."
        />
      </div>
    );
  }

  const selectedRoster = rosters.data.find((row) => row.id === selected) ?? null;

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

      {rosters.loading ? (
        <div className="card flex items-center gap-3 text-sm text-slate-500">
          <Spinner /> Loading rosters…
        </div>
      ) : rosters.error ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {rosters.error}
        </div>
      ) : rosters.data.length === 0 ? (
        <EmptyState
          icon={<NavIcon name="users" className="h-10 w-10" />}
          title="No rosters yet"
          description="Group candidates by skill, seniority or the role you keep hiring for."
          action={<Button onClick={openCreate}>Create a roster</Button>}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rosters.data.map((roster, index) => (
            <li
              key={roster.id}
              style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => setSelected(roster.id)}
                className={`card lift mk-rise flex h-full w-full flex-col items-start gap-2 text-left ${
                  selected === roster.id
                    ? 'ring-2 ring-brand-500'
                    : 'ring-1 ring-transparent hover:bg-slate-50'
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">{roster.name}</span>
                  {selected === roster.id && <Badge tone="blue">Open</Badge>}
                </span>
                <span className="line-clamp-2 text-sm text-slate-500">
                  {roster.description || 'No description'}
                </span>
                <span className="mt-auto text-xs text-slate-400">
                  Created {formatDate(roster.created_at)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* Selected roster detail */}
      {selectedRoster && (
        <section
          className="card lift mk-rise"
          style={{ '--mk-delay': '60ms' } as React.CSSProperties}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-slate-900">{selectedRoster.name}</h2>
              <p className="text-sm text-slate-500">
                {members.data.length} candidate{members.data.length === 1 ? '' : 's'} on this
                roster
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={openAdd}>
                Add candidate
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelected(null)}
              >
                Close roster
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  setRemoveRosterError('');
                  setRemoveRoster(selectedRoster);
                }}
              >
                Delete roster
              </Button>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            {members.loading ? (
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <Spinner /> Loading candidates…
              </div>
            ) : members.error ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {members.error}
              </div>
            ) : members.data.length === 0 ? (
              <p className="text-sm text-slate-500">
                No candidates on this roster yet. Add a jobseeker profile id to start the
                shortlist.
              </p>
            ) : (
              <ul className="space-y-3">
                {members.data.map((member, index) => (
                  <li
                    key={member.jobseeker_id}
                    className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                    style={{ '--mk-delay': `${Math.min(index, 8) * 60}ms` } as React.CSSProperties}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-bold text-slate-900" title={member.jobseeker_id}>
                        {shortId(member.jobseeker_id)}
                      </p>
                      <p className="mt-0.5 text-sm text-slate-600">
                        {member.notes || 'No notes for this candidate.'}
                      </p>
                      {member.added_by && (
                        <p className="mt-1 text-xs text-slate-400">
                          Added by {shortId(member.added_by)}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setRemoveMemberError('');
                        setRemoveMemberId(member.jobseeker_id);
                      }}
                    >
                      Remove
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      )}

      <p className="text-xs text-slate-400">
        Roster members are stored by jobseeker profile id, which is different from the
        account id used for company members.
      </p>

      {/* Create roster */}
      <Modal
        open={createOpen}
        title="New roster"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={creating}>
              Cancel
            </Button>
            <Button type="submit" form="roster-create-form" loading={creating}>
              Create roster
            </Button>
          </>
        }
      >
        <form id="roster-create-form" onSubmit={submitCreate} className="space-y-4" noValidate>
          <Field label="Roster name" required htmlFor="r-name">
            <Input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Frontend shortlist"
            />
          </Field>
          <Field label="Description" hint="Optional." htmlFor="r-desc">
            <Textarea
              id="r-desc"
              rows={3}
              maxLength={2000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          {createError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {createError}
            </div>
          )}
        </form>
      </Modal>

      {/* Add member */}
      <Modal
        open={addOpen}
        title="Add candidate to roster"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAddOpen(false)} disabled={adding}>
              Cancel
            </Button>
            <Button type="submit" form="roster-member-form" loading={adding}>
              Add candidate
            </Button>
          </>
        }
      >
        <form id="roster-member-form" onSubmit={submitAdd} className="space-y-4" noValidate>
          <Field
            label="Jobseeker profile id"
            required
            hint="The profile id from the candidate profile, not their account email. It is a UUID such as fe2547e1-8e11-41bd-8d6a-59bc20ede7ed."
            htmlFor="rm-id"
          >
            <Input
              id="rm-id"
              value={jobseekerId}
              onChange={(e) => setJobseekerId(e.target.value)}
              placeholder="fe2547e1-8e11-41bd-8d6a-59bc20ede7ed"
            />
          </Field>
          <Field
            label="Notes"
            hint="Optional. Why this candidate fits the roster."
            htmlFor="rm-notes"
          >
            <Textarea
              id="rm-notes"
              rows={3}
              maxLength={2000}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          {addError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {addError}
            </div>
          )}
        </form>
      </Modal>

      {/* Remove member */}
      <Modal
        open={removeMemberId !== null}
        title="Remove candidate"
        onClose={() => setRemoveMemberId(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveMemberId(null)} disabled={removeMemberBusy}>
              Keep candidate
            </Button>
            <Button
              variant="danger"
              type="submit"
              form="roster-member-remove-form"
              loading={removeMemberBusy}
            >
              Remove candidate
            </Button>
          </>
        }
      >
        <form
          id="roster-member-remove-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submitRemoveMember();
          }}
          className="space-y-3"
        >
          <p className="text-sm text-slate-600">
            This candidate will be removed from{' '}
            <span className="font-semibold text-slate-800">{selectedRoster?.name}</span>. They
            stay in the pipeline if they already applied.
          </p>
          {removeMemberError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {removeMemberError}
            </div>
          )}
        </form>
      </Modal>

      {/* Delete roster */}
      <Modal
        open={removeRoster !== null}
        title="Delete roster"
        onClose={() => setRemoveRoster(null)}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setRemoveRoster(null)} disabled={removeRosterBusy}>
              Keep roster
            </Button>
            <Button
              variant="danger"
              type="submit"
              form="roster-remove-form"
              loading={removeRosterBusy}
            >
              Delete roster
            </Button>
          </>
        }
      >
        <form
          id="roster-remove-form"
          onSubmit={(e) => {
            e.preventDefault();
            void submitRemoveRoster();
          }}
          className="space-y-3"
        >
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-800">{removeRoster?.name}</span> and its{' '}
            {members.data.length} member{members.data.length === 1 ? '' : 's'} will be removed.
          </p>
          {removeRosterError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {removeRosterError}
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
