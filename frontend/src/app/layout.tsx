import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'MeroKhoj — Find what\'s yours',
    template: '%s | MeroKhoj',
  },
  description:
    'MeroKhoj: discover jobs, top employers and career opportunities in Nepal. Khoj is a function, not a channel.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
