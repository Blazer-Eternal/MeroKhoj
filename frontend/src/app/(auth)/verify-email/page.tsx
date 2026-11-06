import Link from 'next/link';

/**
 * Email verification landing page. The backend does not expose an email
 * verification flow yet, so this page explains the state honestly.
 */
export default function VerifyEmailPage() {
  return (
    <div className="card text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-2xl">
        📧
      </div>
      <h1 className="text-2xl font-bold text-slate-900">Verify your email</h1>
      <p className="mt-2 text-sm text-slate-500">
        Email verification isn&apos;t wired up yet — the backend endpoint is pending.
        Your account works immediately for local development.
      </p>
      <div className="mt-6 flex justify-center gap-3">
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
