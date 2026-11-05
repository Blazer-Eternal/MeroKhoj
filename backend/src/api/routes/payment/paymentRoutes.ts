import { Router } from 'express';
import { paymentControllers, entitlementControllers } from '../../controllers';
import { requireAuth, requireEmployer, requireAdmin } from '../../../middleware';

const router = Router();

/**
 * Payment router spanning three mount points (hub mounts it at '/'):
 *   POST /payments/webhook          — UNAUTHENTICATED provider callback
 *   /orders/:id/payments            — initiate + history (employer)
 *   /payments/*                     — reads (scoped) + admin confirm/refund
 *   /companies/:id/entitlement      — publish-entitlement snapshot
 *
 * The webhook is verified by HMAC-SHA256 in the service (fail closed with
 * 503 when PAYMENT_WEBHOOK_SECRET is unset) — no session auth here.
 */
router.post('/payments/webhook', paymentControllers.handleWebhook);

// Session guard, scoped by prefix so public routes mounted elsewhere
// (e.g. /service-plans) still pass through this router untouched.
router.use('/payments', requireAuth);
router.use('/orders', requireAuth);
router.use('/companies', requireAuth);

// Order payments — initiation requires company job-management power
// (assertCanManageCompany in the service).
router.post('/orders/:id/payments', requireEmployer, paymentControllers.initiatePayment);
router.get('/orders/:id/payments', paymentControllers.listOrderPayments);

// Payment reads — the service scopes non-admins to their companies.
router.get('/payments', paymentControllers.listPayments);
router.get('/payments/:id', paymentControllers.getPayment);

// Admin financial actions: manual confirmation (same completion path as
// the webhook) and refunds (separate linked transaction — rule 6).
router.post('/payments/:id/confirm', requireAdmin, paymentControllers.confirmPayment);
router.post('/payments/:id/refund', requireAdmin, paymentControllers.refundPayment);

// Publish-entitlement snapshot (member-or-admin scoping in the service).
router.get('/companies/:companyId/entitlement', entitlementControllers.getEntitlement);

export default router;
