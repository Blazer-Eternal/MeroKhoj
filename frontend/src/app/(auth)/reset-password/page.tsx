'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { resetPasswordSchema } from '@/lib/validations';
import { Button, Field, Input } from '@/components/ui';

/**
 * Reset-password form (arrives via an emailed token in the future).
 * Backend endpoint pending — same honest notice as forgot-password.
 */
export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setNotice('');
    const parsed = resetPasswordSchema.safeParse({ password, confirm });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setNotice('Password reset is not wired up yet — the backend endpoint is pending.');
  };

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-slate-900">Set a new password</h1>
      <p className="mt-1 text-sm text-slate-500">Choose a strong password you don&apos;t use elsewhere.</p>

      {notice && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {notice}
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <Field label="New password" error={errors.password} htmlFor="rp-password">
          <Input
            id="rp-password"
            type="password"
            autoComplete="new-password"
            placeholder="8+ characters, letter & number"
            value={password}
            error={!!errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        <Field label="Confirm password" error={errors.confirm} htmlFor="rp-confirm">
          <Input
            id="rp-confirm"
            type="password"
            autoComplete="new-password"
            placeholder="Repeat your password"
            value={confirm}
            error={!!errors.confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </Field>
        <Button type="submit" className="w-full">
          Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </div>
  );
}
