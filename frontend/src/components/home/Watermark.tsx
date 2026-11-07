const WORDS = ['HIRING', 'JOBS', 'MATCHING', 'SEARCH'];

/**
 * Faint tiled word pattern used behind light-blue hero sections
 * (matches the reference homepage watermark).
 */
export function Watermark() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      {Array.from({ length: 9 }).map((_, row) => (
        <div
          key={row}
          className="flex gap-10 whitespace-nowrap px-2 pt-5 text-xs font-bold uppercase tracking-[0.3em] text-brand-100"
        >
          {Array.from({ length: 16 }).map((__, col) => (
            <span key={col}>{WORDS[(row + col) % WORDS.length]} @</span>
          ))}
        </div>
      ))}
    </div>
  );
}
