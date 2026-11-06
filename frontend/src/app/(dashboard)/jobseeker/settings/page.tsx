'use client';

/**
 * Account settings — PATCH /users/me (name/phone) and
 * PATCH /users/me/password ({ current_password, new_password }).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiPatch, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Field, Input, Spinner, Badge } from '@/components/ui';
import { changePasswordSchema } from '@/lib/validations';
import { displayName } from '@/utils/format';

export default function SettingsPage() {
  const { user, refresh } = useAuth();

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
        <p className="mt-1 text-sm text-slate-500">Account details and security.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Account details */}
        <form onSubmit={saveAccount} className="card space-y-4" noValidate>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Account details</h2>
            <Badge tone="slate">{user.status}</Badge>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" required htmlFor="s-first">
              <Input
                id="s-first"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                autoComplete="given-name"
              />
            </Field>
            <Field label="Last name" required htmlFor="s-last">
              <Input
                id="s-last"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                autoComplete="family-name"
              />
            </Field>
          </div>

          <Field label="Email" hint="Email changes are not supported yet" htmlFor="s-email">
            <Input id="s-email" value={user.email} disabled className="bg-slate-50" />
          </Field>

          <Field label="Phone" htmlFor="s-phone">
            <Input
              id="s-phone"
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
        <form onSubmit={savePassword} className="card space-y-4" noValidate>
          <h2 className="text-lg font-bold text-slate-900">Change password</h2>

          <Field label="Current password" required htmlFor="s-current">
            <Input
              id="s-current"
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
            />
          </Field>
          <Field label="New password" required hint="8+ characters with a letter and a number" htmlFor="s-new">
            <Input
              id="s-new"
              type="password"
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </Field>
          <Field label="Confirm new password" required htmlFor="s-confirm">
            <Input
              id="s-confirm"
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
      <section className="card">
        <h2 className="text-lg font-bold text-slate-900">Session</h2>
        <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate-400">Signed in as</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{displayName(user)}</dd>
          </div>
          <div>
            <dt className="text-slate-400">Email verified</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {user.email_verified ? 'Yes' : 'No (verification endpoint pending)'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-400">Last login</dt>
            <dd className="mt-0.5 font-medium text-slate-800">
              {user.last_login_at ? new Date(user.last_login_at).toLocaleString() : '—'}
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
