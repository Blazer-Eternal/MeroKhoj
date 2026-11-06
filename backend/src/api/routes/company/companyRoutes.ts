import { Router } from 'express';
import {
  companyControllers,
  jobControllers,
  applicationControllers,
  companyVerificationControllers,
} from '../../controllers';
import { requireAuth, requireEmployer, optionalAuth, validate } from '../../../middleware';
import {
  createCompanySchema,
  updateCompanySchema,
  addCompanyMemberSchema,
  updateCompanyMemberSchema,
  submitVerificationSchema,
} from '../../../validators';

const router = Router();

/**
 * /api/companies
 * Public reads (directory + company profile) use optionalAuth so anonymous
 * visitors see the ACTIVE+VERIFIED catalog while admins see everything.
 * Every write/membership route explicitly requires authentication; company
 * level authorization happens inside the service layer.
 */
router.use(optionalAuth);

// Public reads
router.get('/', companyControllers.listCompanies);

// Member-scoped discovery — MUST be registered before '/:id' or Express
// would match the literal segment "mine" as a company id.
router.get('/mine', requireAuth, requireEmployer, companyControllers.listMyCompanies);

router.get('/:id', companyControllers.getCompany);

// Company lifecycle (employer)
router.post(
  '/',
  requireAuth,
  requireEmployer,
  validate({ body: createCompanySchema }),
  companyControllers.createCompany,
);
router.patch('/:id', requireAuth, validate({ body: updateCompanySchema }), companyControllers.updateCompany);

// Members
router.get('/:companyId/members', requireAuth, companyControllers.listMembers);
router.post(
  '/:companyId/members',
  requireAuth,
  validate({ body: addCompanyMemberSchema }),
  companyControllers.addMember,
);
router.patch(
  '/:companyId/members/:memberId',
  requireAuth,
  validate({ body: updateCompanyMemberSchema }),
  companyControllers.updateMember,
);
router.delete('/:companyId/members/:memberId', requireAuth, companyControllers.removeMember);

// Nested jobs belonging to the company (recruiter-scoped in the service)
router.get('/:companyId/jobs', requireAuth, jobControllers.listCompanyJobs);

// Applicant pipeline (member-scoped in the service)
router.get('/:companyId/applications', requireAuth, applicationControllers.listCompanyApplications);

// Nested company verification workflow (entity 29)
router.post(
  '/:companyId/verifications',
  requireAuth,
  validate({ body: submitVerificationSchema }),
  companyVerificationControllers.submitVerification,
);
router.get('/:companyId/verifications', requireAuth, companyVerificationControllers.listVerifications);
router.get(
  '/:companyId/verifications/latest',
  requireAuth,
  companyVerificationControllers.getLatestVerification,
);

export default router;
