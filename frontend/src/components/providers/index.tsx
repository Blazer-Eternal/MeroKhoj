'use client';

import type { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';

/** Root client provider bundle mounted in src/app/layout.tsx. */
export function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
