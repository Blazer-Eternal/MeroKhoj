import type { ReactNode } from 'react';

type Tone =
  | 'slate'
  | 'green'
  | 'blue'
  | 'amber'
  | 'red'
  | 'purple'
  | 'teal'
  | 'gray';

const tones: Record<Tone, string> = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  gray: 'bg-gray-100 text-gray-700 ring-gray-200',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  purple: 'bg-violet-50 text-violet-700 ring-violet-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
};

export function Badge({
  children,
  tone = 'slate',
  className = '',
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
