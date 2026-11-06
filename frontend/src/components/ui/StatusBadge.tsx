'use client';

import { Badge } from './Badge';

/** Human label + tone per status enum (single place for all status chips).
 *  Keys mirror backend/src/enums values. */

const application: Record<string, { label: string; tone: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'teal' }> = {
  APPLIED: { label: 'Applied', tone: 'blue' },
  UNDER_REVIEW: { label: 'Under review', tone: 'amber' },
  SHORTLISTED: { label: 'Shortlisted', tone: 'purple' },
  INTERVIEW: { label: 'Interview', tone: 'teal' },
  SELECTED: { label: 'Selected', tone: 'green' },
  HIRED: { label: 'Hired', tone: 'green' },
  REJECTED: { label: 'Rejected', tone: 'red' },
  WITHDRAWN: { label: 'Withdrawn', tone: 'slate' },
};

const job: Record<string, { label: string; tone: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'teal' }> = {
  DRAFT: { label: 'Draft', tone: 'slate' },
  PENDING_REVIEW: { label: 'Pending review', tone: 'amber' },
  PUBLISHED: { label: 'Published', tone: 'green' },
  PAUSED: { label: 'Paused', tone: 'amber' },
  CLOSED: { label: 'Closed', tone: 'slate' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
};

const order: Record<string, { label: string; tone: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'teal' }> = {
  PENDING: { label: 'Pending', tone: 'amber' },
  CONFIRMED: { label: 'Confirmed', tone: 'green' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
  COMPLETED: { label: 'Completed', tone: 'blue' },
};

const payment: Record<string, { label: string; tone: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'teal' }> = {
  PENDING: { label: 'Pending', tone: 'amber' },
  PROCESSING: { label: 'Processing', tone: 'blue' },
  COMPLETED: { label: 'Completed', tone: 'green' },
  FAILED: { label: 'Failed', tone: 'red' },
  REFUNDED: { label: 'Refunded', tone: 'purple' },
};

const invoice: Record<string, { label: string; tone: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'teal' }> = {
  DRAFT: { label: 'Draft', tone: 'slate' },
  ISSUED: { label: 'Issued', tone: 'blue' },
  PAID: { label: 'Paid', tone: 'green' },
  VOID: { label: 'Void', tone: 'red' },
  OVERDUE: { label: 'Overdue', tone: 'amber' },
};

const interview: Record<string, { label: string; tone: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'teal' }> = {
  SCHEDULED: { label: 'Scheduled', tone: 'blue' },
  CONFIRMED: { label: 'Confirmed', tone: 'green' },
  COMPLETED: { label: 'Completed', tone: 'slate' },
  CANCELLED: { label: 'Cancelled', tone: 'red' },
  RESCHEDULED: { label: 'Rescheduled', tone: 'amber' },
  NO_SHOW: { label: 'No show', tone: 'red' },
};

const verification: Record<string, { label: string; tone: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'teal' }> = {
  PENDING: { label: 'Pending', tone: 'amber' },
  VERIFIED: { label: 'Verified', tone: 'green' },
  REJECTED: { label: 'Rejected', tone: 'red' },
  SUSPENDED: { label: 'Suspended', tone: 'red' },
};

const report: Record<string, { label: string; tone: 'slate' | 'green' | 'blue' | 'amber' | 'red' | 'purple' | 'teal' }> = {
  OPEN: { label: 'Open', tone: 'amber' },
  UNDER_REVIEW: { label: 'Under review', tone: 'blue' },
  RESOLVED: { label: 'Resolved', tone: 'green' },
  DISMISSED: { label: 'Dismissed', tone: 'slate' },
};

const MAPS = {
  application,
  job,
  order,
  payment,
  invoice,
  interview,
  verification,
  report,
} as const;

export type StatusKind = keyof typeof MAPS;

export function StatusBadge({ kind, value }: { kind: StatusKind; value: string }) {
  const entry = MAPS[kind][value] ?? { label: value, tone: 'slate' as const };
  return <Badge tone={entry.tone}>{entry.label}</Badge>;
}
