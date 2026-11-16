'use client';

/**
 * Admin account settings — same account surface as the jobseeker page
 * (PATCH /users/me for name/phone, PATCH /users/me/password for credentials),
 * plus the roles granted to this administrative account.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiPatch, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Field, Input, Spinner, Badge } from '@/components/ui';
import { changePasswordSchema } from '@/lib/validations';
import { displayName } from '@/utils/format';

const humanize = (value: string): string =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminSettingsPage() {
  const { user, roles, refresh } = useAuth();

  // Account form
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [acctSaving, setAcctSaving] = useState(false);
  const [acctMsg, setAcctMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Password form
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setPhone(user.phone ?? '');
  }, [user]);

  const saveAccount = async (e: FormEvent) => {
    e.preventDefault();
    setAcctMsg(null);
    if (!firstName.trim() || !lastName.trim()) {
      setAcctMsg({ ok: false, text: 'First and last name are required.' });
      return;
    }
    setAcctSaving(true);
    try {
      await apiPatch(endpoints.users.me, {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim() || null,
      });
      await refresh();
      setAcctMsg({ ok: true, text: 'Account details saved ✓' });
    } catch (err) {
      setAcctMsg({
        ok: false,
        text: err instanceof ApiRequestError ? err.message : 'Could not save.',
      });
    } finally {
      setAcctSaving(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwMsg('');
    const parsed = changePasswordSchema.safeParse({
      current_password: current,
      new_password: next,
      confirm,
    });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setPwError(issue ? issue.message : 'Check the password fields.');
      return;
    }
    setPwSaving(true);
    try {
      await apiPatch(endpoints.users.mePassword, {
        current_password: parsed.data.current_password,
        new_password: parsed.data.new_password,
      });
      setCurrent('');
      setNext('');
      setConfirm('');
      setPwMsg('Password updated ✓');
    } catch (err) {
      setPwError(err instanceof ApiRequestError ? err.message : 'Could not update password.');
    } finally {
      setPwSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading account…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Administrative account details and security.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account details */}
        <form
          onSubmit={saveAccount}
          className="card lift mk-rise space-y-4"
          style={{ '--mk-delay': '0ms' } as React.CSSProperties}
          noValidate
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Account details</h2>
            <Badge tone="slate">{user.status}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required htmlFor="a-first">
              <Input
                id="a-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name" required htmlFor="a-last">
              <Input
                id="a-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field label="Email" hint="Email changes are not supported yet" htmlFor="a-email">
            <Input id="a-email" value={user.email} disabled className="bg-slate-50" />
          </Field>

          <Field label="Phone" htmlFor="a-phone">
            <Input
              id="a-phone"
              type="tel"
              placeholder="+977 98XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>

          {acctMsg && (
            <div
              className={`rounded-lg border px-4 py-3 text-sm ${
                acctMsg.ok
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border-red-200 bg-red-50 text-red-700'
              }`}
            >
              {acctMsg.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={acctSaving}>
              Save changes
            </Button>
          </div>
        </form>

        {/* Password */}
        <form
          onSubmit={savePassword}
          className="card lift mk-rise space-y-4"
          style={{ '--mk-delay': '90ms' } as React.CSSProperties}
          noValidate
        >
          <h2 className="text-lg font-bold text-slate-900">Change password</h2>

          <Field label="Current password" required htmlFor="a-current">
            <Input
              id="a-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field
            label="New password"
            required
            hint="8+ characters with a letter and a number"
            htmlFor="a-new"
          >
            <Input
              id="a-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" required htmlFor="a-confirm">
            <Input
              id="a-confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </Field>

          {pwError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {pwError}
            </div>
          )}
          {pwMsg && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {pwMsg}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" loading={pwSaving}>
              Update password
            </Button>
          </div>
        </form>
      </div>

      {/* Session info */}
      <section
        className="card lift mk-rise"
        style={{ '--mk-delay': '180ms' } as React.CSSProperties}
      >
        <h2 className="text-lg font-bold text-slate-900">Session</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-400">Signed in as</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{displayName(user)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Email verified</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {user.email_verified ? 'Yes' : 'No'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Last login</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-400">Granted roles</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {roles.length === 0 ? (
              <span className="text-sm text-slate-400">No roles granted</span>
            ) : (
              roles.map((roleName) => (
                <Badge key={roleName} tone={roleName.includes('ADMIN') ? 'blue' : 'slate'}>
                  {humanize(roleName)}
                </Badge>
              ))
            )}
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Roles control which dashboard areas this account can reach. Ask a
            super admin to change them.
          </p>
        </div>
      </section>
    </div>
  );
}
