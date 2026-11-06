'use client';

import { Button } from './Button';

/**
 * Pagination control bound to the backend envelope meta
 * (`page`, `totalPages`, `hasNextPage`, `hasPrevPage`).
 */
export function Pagination({
  page,
  totalPages,
  hasNextPage,
  hasPrevPage,
  onChange,
}: {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasPrevPage}
        onClick={() => onChange(page - 1)}
      >
        ← Previous
      </Button>
      <span className="text-sm text-slate-500">
        Page <span className="font-semibold text-slate-700">{page}</span> of {totalPages}
      </span>
      <Button
        variant="secondary"
        size="sm"
        disabled={!hasNextPage}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </Button>
    </div>
  );
}
