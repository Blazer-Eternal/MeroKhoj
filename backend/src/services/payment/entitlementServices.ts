import { AppError } from '../../utils';
import { env } from '../../config';
import { IAuthUser, IOrder } from '../../interfaces';
import { orderRepository, jobRepository } from '../../repositories';
import { resolveCompanyForUser } from '../shared/accessControl';

/**
 * Publish-entitlement business logic (workflow rule 5).
 *
 * Before a job's FIRST publish, if a paid package is required
 * (COMPANY_BILLING_REQUIRED=true) the company's active paid orders are
 * summed into a posting allowance and checked against how many jobs it
 * has already published (published_at NOT NULL). With the flag off
 * (default) every verified company may publish freely.
 *
 * Allowance = Σ plan.job_posting_limit over active orders (CONFIRMED or
 * COMPLETED, not expired: created_at + duration_days > now). A NULL plan
 * limit means unlimited. Deactivating a plan never affects an active
 * order's entitlement — the order carries its own snapshot terms.
 */

/** The shape returned by GET /api/companies/:id/entitlement. */
export interface ICompanyEntitlement {
  billing_required: boolean;
  /** Jobs the company has published so far. */
  used: number;
  /** Total posting allowance from active orders; null = unlimited. */
  allowance: number | null;
  /** Postings left; null when unlimited. */
  remaining: number | null;
  unlimited: boolean;
  /** Number of active (non-expired, entitlement-granting) orders. */
  active_orders: number;
  /** Earliest expiry among active time-limited orders (YYYY-MM-DD) or null. */
  next_expiry: string | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

interface IPlanTerms {
  job_posting_limit: number | null;
  duration_days: number | null;
}

/** Compute the entitlement snapshot for a company. */
const computeEntitlement = async (companyId: string): Promise<ICompanyEntitlement> => {
  const orders = await orderRepository.listEntitlementOrders(companyId);
  const now = Date.now();

  let allowance = 0;
  let unlimited = false;
  let activeOrders = 0;
  let nextExpiryMs: number | null = null;

  for (const order of orders) {
    const plan = (order as IOrder & { service_plan?: IPlanTerms }).service_plan;
    if (!plan) continue;

    // Expiry = created_at + duration_days (NULL duration = never expires).
    let expiresMs: number | null = null;
    if (plan.duration_days != null) {
      expiresMs = new Date(order.created_at).getTime() + plan.duration_days * DAY_MS;
      if (expiresMs <= now) continue; // expired — grants nothing
    }

    activeOrders += 1;
    if (plan.job_posting_limit == null) {
      unlimited = true;
    } else {
      allowance += Number(plan.job_posting_limit);
    }
    if (expiresMs !== null && (nextExpiryMs === null || expiresMs < nextExpiryMs)) {
      nextExpiryMs = expiresMs;
    }
  }

  const used = await jobRepository.countPublishedByCompany(companyId);
  const effectiveAllowance = unlimited ? null : allowance;
  const remaining =
    effectiveAllowance === null ? null : Math.max(0, effectiveAllowance - used);

  return {
    billing_required: env.payment.billingRequired,
    used,
    allowance: effectiveAllowance,
    remaining,
    unlimited,
    active_orders: activeOrders,
    next_expiry: nextExpiryMs === null ? null : new Date(nextExpiryMs).toISOString().slice(0, 10),
  };
};

/** GET /api/companies/:id/entitlement — member/admin scoped. */
export const getEntitlement = async (
  user: IAuthUser,
  companyId: string,
): Promise<ICompanyEntitlement> => {
  await resolveCompanyForUser(user, companyId);
  return computeEntitlement(companyId);
};

/**
 * Called by jobServices right before a job's first publish.
 * No-op unless COMPANY_BILLING_REQUIRED=true; then a company without
 * remaining allowance is rejected (403).
 */
export const assertPublishAllowed = async (companyId: string): Promise<void> => {
  if (!env.payment.billingRequired) return;

  const entitlement = await computeEntitlement(companyId);
  if (entitlement.unlimited) return;

  if (entitlement.remaining !== null && entitlement.remaining <= 0) {
    throw AppError.forbidden(
      entitlement.active_orders === 0
        ? 'A paid service plan is required to publish jobs'
        : 'Job posting limit reached for your current plan — purchase more postings to continue',
    );
  }
};

export const entitlementServices = {
  getEntitlement,
  assertPublishAllowed,
  computeEntitlement,
};

export default entitlementServices;
