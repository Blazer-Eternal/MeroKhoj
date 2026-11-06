import type { ReactNode } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

/** Public site chrome: navbar + footer around all (public) pages. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  );
}
