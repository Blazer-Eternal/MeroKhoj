'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { forgotPasswordSchema } from '@/lib/validations';
import { Button, Field, Input } from '@/components/ui';

/**
 * Forgot-password request form.
 * NOTE: the backend does not expose /auth/forgot-password yet — submitting
 * shows an honest "not available yet" notice instead of a fake success.
 */
export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid email');
      return;
    }
    setError('');
    setDone(true);
  };

  return (
    <div className="card">
      <h1 className="text-2xl font-bold text-slate-900">Forgot your password?</h1>
      <p className="mt-1 text-sm text-slate-500">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {done ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Password reset isn&apos;t available yet. Sign in with your current password, or{' '}
          <Link href="/contact" className="font-semibold underline">
            contact support
          </Link>
          .
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
          <Field label="Email address" error={error} htmlFor="fp-email">
            <Input
              id="fp-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              error={!!error}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Button type="submit" className="w-full">
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Remembered it?{' '}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Back to login
        </Link>
      </p>
    </div>
  );
}
