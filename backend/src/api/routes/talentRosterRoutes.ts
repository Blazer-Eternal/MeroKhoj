import { Router } from 'express';
import { talentRosterControllers } from '../controllers';
import { requireAuth, requireEmployer, validate } from '../../middleware';
import {
  createRosterSchema,
  updateRosterSchema,
  addRosterMemberSchema,
  updateRosterMemberSchema,
} from '../../validators';

const router = Router();

/**
 * Talent rosters.
 * Company-scoped subroutes live under /companies/:companyId/rosters; the
 * roster+member subroutes are mounted at /rosters/:id. Membership and company
 * isolation are enforced in the service layer via resolveCompanyForUser.
 */
router.use(requireAuth, requireEmployer);

// Rosters
router.get('/companies/:companyId/rosters', talentRosterControllers.listRosters);
router.post(
  '/companies/:companyId/rosters',
  validate({ body: createRosterSchema }),
  talentRosterControllers.createRoster,
);
router.get('/rosters/:id', talentRosterControllers.getRoster);
router.patch(
  '/rosters/:id',
  validate({ body: updateRosterSchema }),
  talentRosterControllers.updateRoster,
);
router.delete('/rosters/:id', talentRosterControllers.deleteRoster);

// Members
router.get('/rosters/:rosterId/members', talentRosterControllers.listMembers);
router.post(
  '/rosters/:rosterId/members',
  validate({ body: addRosterMemberSchema }),
  talentRosterControllers.addMember,
);
router.patch(
  '/rosters/:rosterId/members/:jobseekerId',
  validate({ body: updateRosterMemberSchema }),
  talentRosterControllers.updateMemberNotes,
);
router.delete('/rosters/:rosterId/members/:jobseekerId', talentRosterControllers.removeMember);

export default router;
