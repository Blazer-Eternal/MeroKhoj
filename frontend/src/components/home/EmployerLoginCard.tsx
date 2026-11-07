'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { loginSchema } from '@/lib/validations';
import { primaryArea, AREA_HOME } from '@/lib/permissions';
import { Button, Field, Input } from '@/components/ui';
import { ApiRequestError } from '@/services/api-client';

type Tab = 'login' | 'sales';

/**
 * Employer-zone login card (merojob employer page): Employer Login tab with
 * a real sign-in form, plus a Talk to Sales tab for buyers.
 */
export function EmployerLoginCard() {
  const router = useRouter();
  const { login } = useAuth();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const payload = await login(parsed.data.email, parsed.data.password);
      const area = primaryArea(payload.roles);
      router.replace(area ? AREA_HOME[area] : '/login');
      if (!area) setFormError('Your account has no dashboard area yet.');
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Login failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
      <div className="flex gap-6 border-b border-slate-200" role="tablist" aria-label="Employer options">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'login'}
          onClick={() => setTab('login')}
          className={`-mb-px border-b-2 pb-3 font-display text-sm font-bold transition-colors ${
            tab === 'login'
              ? 'border-brand-600 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Employer Login
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'sales'}
          onClick={() => setTab('sales')}
          className={`-mb-px border-b-2 pb-3 font-display text-sm font-bold transition-colors ${
            tab === 'sales'
              ? 'border-brand-600 text-slate-900'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          Talk to Sales
        </button>
      </div>

      {tab === 'login' ? (
        <div className="pt-5">
          <p className="text-sm text-slate-500">Login with your registered Email &amp; Password</p>

          {formError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-5 space-y-4" noValidate>
            <Field label="Email" error={errors.email} htmlFor="ez-email">
              <Input
                id="ez-email"
                type="email"
                autoComplete="email"
                placeholder="Enter email address"
                value={email}
                error={!!errors.email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password" error={errors.password} htmlFor="ez-password">
              <div className="relative">
                <Input
                  id="ez-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your Password"
                  value={password}
                  error={!!errors.password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                      <path strokeLinecap="round" d="M3 3l18 18M10.6 10.7a2 2 0 0 0 2.8 2.8" />
                      <path strokeLinecap="round" d="M16.7 16.7A9.5 9.5 0 0 1 12 18c-5 0-9-6-9-6a17.8 17.8 0 0 1 4.1-4.6m3.2-1.7A9.5 9.5 0 0 1 12 5c5 0 9 6 9 6a17.6 17.6 0 0 1-2.2 3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                      <path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6-10-6-10-6z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-brand-600" />
                Remember Me
              </label>
              <Link href="/forgot-password" className="font-semibold text-slate-500 hover:text-brand-600">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={submitting}>
              Login
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-brand-600 hover:text-brand-700">
              Register Now
            </Link>
          </p>
        </div>
      ) : (
        <div className="pt-6">
          <h2 className="font-display text-lg font-bold text-slate-900">Talk to Sales</h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Tell us what you are hiring for, how many roles you open each quarter, and what your
            team needs from a pipeline. We reply within one business day.
          </p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Email</dt>
              <dd className="font-semibold text-brand-600">hello@merokhoj.com</dd>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
              <dt className="text-slate-500">Office</dt>
              <dd className="font-semibold text-slate-700">Kathmandu, Nepal</dd>
            </div>
          </dl>
          <Link
            href="/contact"
            className="mt-6 flex w-full items-center justify-center rounded-lg bg-brand-600 px-6 py-3 font-display text-sm font-bold text-white transition-colors hover:bg-brand-700"
          >
            Send a message
          </Link>
        </div>
      )}
    </div>
  );
}
