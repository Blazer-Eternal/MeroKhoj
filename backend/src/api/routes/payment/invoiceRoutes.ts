import { Router } from 'express';
import { invoiceControllers } from '../../controllers';
import { requireAuth, requireAdmin } from '../../../middleware';

const router = Router();

/**
 * /api/invoices
 * Reads: authenticated (service scopes to the user's companies; admins see
 * all). Writes: admin-only — invoices are generated from order financials
 * and their status syncs on payment (workflow rule 4).
 */
router.use(requireAuth);

router.get('/', invoiceControllers.listInvoices);
router.get('/:id', invoiceControllers.getInvoice);

router.post('/', requireAdmin, invoiceControllers.createInvoice);
router.post('/:id/issue', requireAdmin, invoiceControllers.issueInvoice);
router.post('/:id/void', requireAdmin, invoiceControllers.voidInvoice);

export default router;
