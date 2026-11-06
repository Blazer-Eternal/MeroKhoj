/** Presentation helpers — formatting only, no business logic. */

/** Format a money amount with its currency (NPR default). */
export const formatMoney = (amount: number, currency = 'NPR'): string => {
  const symbol = currency === 'NPR' ? 'Rs. ' : '';
  return `${symbol}${amount.toLocaleString('en-US')}`;
}

/** Salary range label for job cards (falls back to "Negotiable"). */
export const formatSalaryRange = (
  min: number | null | undefined,
  max: number | null | undefined,
  currency = 'NPR',
): string => {
  if (min == null && max == null) return 'Negotiable';
  if (min != null && max != null) {
    return min === max
      ? formatMoney(min, currency)
      : `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  }
  if (min != null) return `From ${formatMoney(min, currency)}`;
  return `Up to ${formatMoney(max!, currency)}`;
};

/** Human date: "Jan 5, 2026". */
export const formatDate = (value: string | Date | null | undefined): string => {
  if (!value) return '—';
  const date = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/** Relative time: "3 days ago" / "in 2 hours". */
export const timeAgo = (value: string | Date | null | undefined): string => {
  if (!value) return '';
  const date = typeof value === 'string' ? new Date(value) : value;
  const diff = Date.now() - date.getTime();
  const abs = Math.abs(diff);
  const minutes = Math.floor(abs / 60000);
  const hours = Math.floor(abs / 3600000);
  const days = Math.floor(abs / 86400000);
  const suffix = diff >= 0 ? 'ago' : 'from now';
  if (minutes < 1) return 'just now';
  if (hours < 1) return `${minutes}m ${suffix}`;
  if (days < 1) return `${hours}h ${suffix}`;
  if (days < 30) return `${days}d ${suffix}`;
  return formatDate(date);
};

/** Truncate long descriptions for cards. */
export const truncate = (text: string, max = 180): string => {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}…`;
};

/** Plain-text excerpt from HTML/long text. */
export const excerpt = (text: string, max = 200): string =>
  truncate(text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(), max);

/** "FULL_TIME" → "Full Time" fallback label. */
export const humanize = (value: string): string =>
  value
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

/** Display name from a PublicUser (backend stores first_name/last_name). */
export const displayName = (user: { first_name: string; last_name: string } | null | undefined): string =>
  user ? `${user.first_name} ${user.last_name}`.trim() : '';
