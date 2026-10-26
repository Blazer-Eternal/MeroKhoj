import { Router } from 'express';
import { skillControllers } from '../controllers';
import { requireAuth, requireAdmin, validate } from '../../middleware';
import { createSkillSchema } from '../../validators';

const router = Router();

/** /api/skills */
router.get('/', skillControllers.listSkills);
router.get('/search', skillControllers.searchSkills);
router.post('/', requireAuth, requireAdmin, validate({ body: createSkillSchema }), skillControllers.createSkill);

export default router;
