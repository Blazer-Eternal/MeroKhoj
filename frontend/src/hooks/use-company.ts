'use client';

/**
 * Company context for the employer area.
 *
 * Every employer page is scoped to the caller's company, so this hook wraps
 * `GET /companies/mine` once per page and exposes the first company the user
 * belongs to (the same record `GET /dashboard/employer` uses).
 *   - `loading` is true while the membership lookup is in flight, so pages can
 *     show their loading card instead of an empty-state flash.
 *   - `company === null` after loading means the account has no company yet:
 *     pages render their "create a company" state.
 */
import { useCallback, useEffect, useState } from 'react';
import { apiGet, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import type { Company } from '@/types';

export interface CompanyState {
  company: Company | null;
  loading: boolean;
  error: string;
  refetch: () => void;
}

export function useCompany(): CompanyState {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const res = await apiGet<{ companies: Company[] }>(endpoints.companies.mine);
        if (cancelled) return;
        setCompany(res.companies[0] ?? null);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiRequestError ? err.message : 'Could not load your company.',
        );
        setCompany(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { company, loading, error, refetch };
}

export default useCompany;
