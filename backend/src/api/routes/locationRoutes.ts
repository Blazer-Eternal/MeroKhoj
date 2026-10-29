import { Router } from 'express';
import { locationControllers } from '../controllers';
import { requireAuth, requireAdmin, validate } from '../../middleware';
import { createLocationSchema, updateLocationSchema } from '../../validators';

const router = Router();

/** Location routes (public read; admin write). */
router.get('/', locationControllers.listLocations);
router.get('/:id', locationControllers.getLocation);
router.post(
  '/',
  requireAuth,
  requireAdmin,
  validate({ body: createLocationSchema }),
  locationControllers.createLocation,
);
router.patch(
  '/:id',
  requireAuth,
  requireAdmin,
  validate({ body: updateLocationSchema }),
  locationControllers.updateLocation,
);
router.delete('/:id', requireAuth, requireAdmin, locationControllers.deleteLocation);

export default router;
