/**
 * Append-only audit log entry. `user_id` is null for system actions.
 * `old_values`/`new_values` capture before/after snapshots (JSONB).
 */
export interface IAuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: Date;
}

export interface IAuditLogCreation {
  user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  old_values?: Record<string, unknown> | null;
  new_values?: Record<string, unknown> | null;
  ip_address?: string | null;
}

/** Filters accepted when querying the audit trail. */
export interface IAuditLogQuery {
  user_id?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
}
