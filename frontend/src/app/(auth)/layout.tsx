import type { ReactNode } from 'react';
import Link from 'next/link';

/** Centered card chrome for login/register/forgot/reset/verify pages. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-extrabold">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-black text-white">
            M
          </span>
          <span className="text-slate-900">
            Mero<span className="text-brand-600">Khoj</span>
          </span>
        </Link>
        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-brand-600">
          ← Back to home
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md">{children}</div>
      </main>
      <footer className="py-6 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} MeroKhoj
      </footer>
    </div>
  );
}
