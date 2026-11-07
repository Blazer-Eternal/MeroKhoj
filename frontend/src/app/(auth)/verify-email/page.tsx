import Link from 'next/link';

/**
 * Email verification landing page. Explains the current state honestly
 * without exposing implementation details.
 */
export default function VerifyEmailPage() {
  return (
    <div className="card text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-600">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="h-6 w-6">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 7.5l9 6 9-6" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
      <p className="mt-2 text-sm text-slate-500">
        Email confirmation is not active on this board yet. Your account is ready to use as
        soon as you sign in.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link href="/login" className="btn-primary">
          Continue to login
        </Link>
        <Link href="/" className="btn-secondary">
          Go home
        </Link>
      </div>
    </div>
  );
}
