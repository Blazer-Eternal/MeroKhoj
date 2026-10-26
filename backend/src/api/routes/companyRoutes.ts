import { Router } from 'express';
import { companyControllers, jobControllers } from '../controllers';
import { requireAuth, requireEmployer, validate } from '../../middleware';
import {
  createCompanySchema,
  updateCompanySchema,
  addCompanyMemberSchema,
  updateCompanyMemberSchema,
} from '../../validators';

const router = Router();

/**
 * /api/companies
 * Company creation requires an employer role; membership routes are guarded by
 * company-level permissions inside the service layer.
 */
router.use(requireAuth);

router.post('/', requireEmployer, validate({ body: createCompanySchema }), companyControllers.createCompany);
router.get('/:id', companyControllers.getCompany);
router.patch('/:id', validate({ body: updateCompanySchema }), companyControllers.updateCompany);

// Members
router.get('/:companyId/members', companyControllers.listMembers);
router.post(
  '/:companyId/members',
  validate({ body: addCompanyMemberSchema }),
  companyControllers.addMember,
);
router.patch(
  '/:companyId/members/:memberId',
  validate({ body: updateCompanyMemberSchema }),
  companyControllers.updateMember,
);
router.delete('/:companyId/members/:memberId', companyControllers.removeMember);

// Nested jobs belonging to the company
router.get('/:companyId/jobs', jobControllers.listCompanyJobs);

export default router;
