import { Router } from 'express';
import { companyControllers, jobControllers, companyVerificationControllers } from '../controllers';
import { requireAuth, requireEmployer, validate } from '../../middleware';
import {
  createCompanySchema,
  updateCompanySchema,
  addCompanyMemberSchema,
  updateCompanyMemberSchema,
  submitVerificationSchema,
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

// Nested company verification workflow (entity 29)
router.post(
  '/:companyId/verifications',
  validate({ body: submitVerificationSchema }),
  companyVerificationControllers.submitVerification,
);
router.get('/:companyId/verifications', companyVerificationControllers.listVerifications);
router.get(
  '/:companyId/verifications/latest',
  companyVerificationControllers.getLatestVerification,
);

export default router;
