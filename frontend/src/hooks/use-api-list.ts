'use client';

/**
 * Generic list loader used by all dashboard pages.
 * Wraps apiCollection with loading/error state + manual refetch.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiCollection, ApiRequestError, type RequestOptions } from '@/services/api-client';

export interface ApiListState<T> {
  data: T[];
  meta: Record<string, unknown>;
  loading: boolean;
  error: string;
  refetch: () => void;
}

export function useApiList<T>(
  path: string | null,
  options: RequestOptions = {},
): ApiListState<T> {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(path !== null);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (path === null) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const res = await apiCollection<T>(path, optionsRef.current);
        if (cancelled) return;
        setData(res.data);
        setMeta(res.meta);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load data.');
        setData([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [path, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, meta, loading, error, refetch };
}

