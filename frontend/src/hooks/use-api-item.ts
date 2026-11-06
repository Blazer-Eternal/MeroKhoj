'use client';

/** Single-resource loader (wrapped reads like `{ profile }` or bare objects). */
import { useCallback, useEffect, useRef, useState } from 'react';
import { apiGet, ApiRequestError, type RequestOptions } from '@/services/api-client';

export interface ApiItemState<T> {
  data: T | null;
  loading: boolean;
  error: string;
  refetch: () => void;
}

export function useApiItem<T>(path: string | null, options: RequestOptions = {}): ApiItemState<T> {
  const [data, setData] = useState<T | null>(null);
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
        const res = await apiGet<T>(path, optionsRef.current);
        if (!cancelled) setData(res);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiRequestError ? err.message : 'Could not load.');
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, tick]);

  const refetch = useCallback(() => setTick((t) => t + 1), []);
  return { data, loading, error, refetch };
}
