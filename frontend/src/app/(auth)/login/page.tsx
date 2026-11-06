'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { loginSchema } from '@/lib/validations';
import { primaryArea, AREA_HOME } from '@/lib/permissions';
import { Button, Field, Input } from '@/components/ui';
import { ApiRequestError } from '@/services/api-client';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const next = searchParams.get('next');
      if (next && next.startsWith('/')) {
        router.replace(next);
        return;
      }
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
    <div className="card">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-500">
          Log in to continue your job search or hire great talent.
        </p>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Email address" error={errors.email} htmlFor="login-email">
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            error={!!errors.email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Password" error={errors.password} htmlFor="login-password">
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            error={!!errors.password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" loading={submitting}>
          Log in
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        New to MeroKhoj?{' '}
        <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Create an account
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
