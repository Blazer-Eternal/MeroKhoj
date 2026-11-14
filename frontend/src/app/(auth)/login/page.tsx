'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { loginSchema } from '@/lib/validations';
import { primaryArea, AREA_HOME } from '@/lib/permissions';
import { Button, Field, Input } from '@/components/ui';
import { ApiRequestError, REMEMBER_COOKIE, deleteCookie, setCookie } from '@/services/api-client';

/** Flat illustration for the blue panel: job board, search, and a happy hire. */
function LoginArt() {
  return (
    <svg
      viewBox="0 0 520 320"
      fill="none"
      aria-hidden
      className="mt-8 w-full max-w-[440px]"
    >
      {/* browser window */}
      <rect x="60" y="40" width="240" height="170" rx="8" fill="#ffffff" />
      <rect x="60" y="40" width="240" height="26" rx="8" fill="#0f3fbf" />
      <circle cx="78" cy="53" r="4" fill="#8ec6ff" />
      <circle cx="92" cy="53" r="4" fill="#8ec6ff" />
      <circle cx="106" cy="53" r="4" fill="#8ec6ff" />
      {/* page columns */}
      <rect x="76" y="80" width="90" height="10" rx="3" fill="#d9ebff" />
      <rect x="76" y="98" width="70" height="8" rx="3" fill="#bcdcff" />
      <rect x="76" y="114" width="84" height="8" rx="3" fill="#bcdcff" />
      <rect x="76" y="130" width="60" height="8" rx="3" fill="#bcdcff" />
      <rect x="180" y="80" width="100" height="60" rx="4" fill="#eef6ff" />
      <rect x="190" y="92" width="60" height="8" rx="3" fill="#8ec6ff" />
      <rect x="190" y="106" width="80" height="6" rx="3" fill="#bcdcff" />
      <rect x="190" y="118" width="72" height="6" rx="3" fill="#bcdcff" />
      <rect x="180" y="150" width="100" height="44" rx="4" fill="#eef6ff" />
      <rect x="190" y="162" width="54" height="8" rx="3" fill="#8ec6ff" />
      <rect x="190" y="176" width="76" height="6" rx="3" fill="#bcdcff" />

      {/* JOB tags */}
      <g>
        <rect x="140" y="8" width="66" height="30" rx="6" fill="#2dd4bf" />
        <text x="173" y="29" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700" fontFamily="sans-serif">
          JOB
        </text>
        <rect x="252" y="52" width="66" height="30" rx="6" fill="#ffffff" />
        <text x="285" y="73" textAnchor="middle" fill="#1b64f5" fontSize="16" fontWeight="700" fontFamily="sans-serif">
          JOB
        </text>
        <rect x="18" y="96" width="66" height="30" rx="6" fill="#2dd4bf" />
        <text x="51" y="117" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="700" fontFamily="sans-serif">
          JOB
        </text>
      </g>

      {/* heart */}
      <path
        d="M356 60c8-12 26-8 26 6 0 12-14 20-26 28-12-8-26-16-26-28 0-14 18-18 26-6z"
        fill="#93c5fd"
      />

      {/* password bubble */}
      <rect x="240" y="150" width="150" height="34" rx="17" fill="#ffffff" />
      <g fill="#334155">
        <circle cx="262" cy="167" r="4" />
        <circle cx="278" cy="167" r="4" />
        <circle cx="294" cy="167" r="4" />
        <circle cx="310" cy="167" r="4" />
        <circle cx="326" cy="167" r="4" />
        <circle cx="342" cy="167" r="4" />
        <circle cx="358" cy="167" r="4" />
        <circle cx="374" cy="167" r="4" />
      </g>

      {/* magnifier over a profile */}
      <circle cx="150" cy="230" r="52" fill="#ffffff" stroke="#0f3fbf" strokeWidth="8" />
      <circle cx="150" cy="218" r="16" fill="#8ec6ff" />
      <path d="M124 252c6-14 46-14 52 0" stroke="#8ec6ff" strokeWidth="10" strokeLinecap="round" />
      <rect x="182" y="264" width="60" height="14" rx="7" transform="rotate(-40 182 264)" fill="#0f3fbf" />

      {/* desk + person at laptop */}
      <rect x="300" y="252" width="180" height="8" rx="4" fill="#e2e8f0" />
      <rect x="316" y="260" width="8" height="44" rx="4" fill="#cbd5e1" />
      <rect x="456" y="260" width="8" height="44" rx="4" fill="#cbd5e1" />
      <path d="M356 252l16-34h56l10 34z" fill="#cbd5e1" />
      <rect x="374" y="222" width="44" height="30" rx="3" fill="#e2e8f0" />
      {/* person */}
      <circle cx="440" cy="196" r="14" fill="#f6c8a8" />
      <path d="M426 192c0-10 8-16 16-16s14 6 14 14c-6 2-18 4-30 2z" fill="#3b2f63" />
      <path d="M424 252c0-24 8-44 24-44 14 0 22 12 24 30l4 14z" fill="#64748b" />
      <path d="M436 224c-10 4-18 12-22 22" stroke="#64748b" strokeWidth="9" strokeLinecap="round" />
      {/* chair */}
      <path d="M470 252c10-6 16-18 14-34" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" fill="none" />

      {/* plant */}
      <path d="M62 296c-10-14-6-30 6-38 6 14 4 28-6 38z" fill="#2dd4bf" />
      <path d="M70 296c10-10 12-26 6-38-10 10-12 26-6 38z" fill="#14b8a6" />
      <path d="M58 296h24l-4 16H62z" fill="#f6c8a8" />

      {/* ground line */}
      <rect x="40" y="308" width="440" height="3" rx="1.5" fill="#93c5fd" opacity="0.6" />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [googleNote, setGoogleNote] = useState('');
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

    // Remember Me decides whether tokens survive the browser session.
    if (remember) setCookie(REMEMBER_COOKIE, '1', 30);
    else deleteCookie(REMEMBER_COOKIE);

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
    <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-0 lg:grid-cols-2">
        {/* Blue pitch panel (image 1) */}
        <div className="flex flex-col justify-between rounded-xl bg-brand-600 px-8 py-10 text-white lg:px-10">
          <div>
            <h2 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Find job with MeroKhoj.
            </h2>
            <p className="mt-4 max-w-sm text-sm font-medium leading-relaxed text-brand-100 sm:text-base">
              Boost your visibility to over 40,000+ top employers now.
            </p>
          </div>
          <LoginArt />
        </div>

        {/* Form column */}
        <div className="px-6 py-8 sm:px-10 lg:py-10">
          <h1 className="font-display text-2xl font-bold text-brand-700 sm:text-[28px]">
            Jobseeker Login
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Login with your registered Email &amp; Password
          </p>

          {formError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-5" noValidate>
            <Field label="Email" error={errors.email} htmlFor="login-email">
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="Enter email address"
                value={email}
                error={!!errors.email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field label="Password" error={errors.password} htmlFor="login-password">
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your Password"
                  value={password}
                  error={!!errors.password}
                  className="pr-11"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={
                        showPassword
                          ? 'M3 3l18 18M10.6 10.7a2 2 0 002.8 2.8M9.9 5.2A9.6 9.6 0 0112 5c5 0 9 4.5 9 7a7.8 7.8 0 01-2.4 4M6.6 6.7C4.4 8.2 3 10.4 3 12c0 2.5 4 7 9 7 1.3 0 2.5-.3 3.6-.7'
                          : 'M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.5 12C4.3 8.6 8 5 12 5s7.7 3.6 9.5 7c-1.8 3.4-5.5 7-9.5 7s-7.7-3.6-9.5-7z'
                      }
                    />
                  </svg>
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                Remember Me
              </label>
              <Link href="/forgot-password" className="font-medium text-slate-500 hover:text-brand-600">
                Forgot Password?
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={submitting}>
              Login
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-sm text-slate-400">
            <span className="h-px flex-1 bg-slate-200" aria-hidden />
            OR
            <span className="h-px flex-1 bg-slate-200" aria-hidden />
          </div>

          <button
            type="button"
            onClick={() =>
              setGoogleNote('Google sign-in is not connected yet. Use your email and password for now.')
            }
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <svg viewBox="0 0 48 48" aria-hidden className="h-5 w-5">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z" />
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.6 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C36.9 40.2 44 35 44 24c0-1.3-.1-2.6-.4-3.9z" />
            </svg>
            Login with Google
          </button>
          {googleNote && (
            <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-center text-xs font-medium text-brand-700">
              {googleNote}
            </p>
          )}

          <p className="mt-8 text-center text-sm text-slate-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-brand-600 hover:text-brand-700">
              Register Now
            </Link>
          </p>
        </div>
      </div>
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
