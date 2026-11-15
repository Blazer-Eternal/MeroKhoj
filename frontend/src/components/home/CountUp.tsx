'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Eases a number up from zero the first time it scrolls into view.
 * Runs once per mount, respects reduced-motion (paints the final value
 * immediately), and never animates a value the user cannot see.
 */
export function CountUp({
  value,
  duration = 1100,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const hostRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      setDisplay(value);
      return;
    }

    let frame = 0;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();

        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          setDisplay(Math.round(value * eased));
          if (t < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.35 },
    );

    observer.observe(host);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [value, duration]);

  return <span ref={hostRef}>{display.toLocaleString('en-US')}</span>;
}
