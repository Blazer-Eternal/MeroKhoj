import { Response } from 'express';
import { ICustomRequest } from '../../interfaces';
import { asyncHandler } from '../../middleware';
import { locationServices } from '../../services';
import { createLocationSchema, updateLocationSchema, locationQuerySchema } from '../../validators';
import { parseId } from '../../utils';

const ok = (res: Response, data: unknown, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

/** GET /api/locations */
export const listLocations = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const query = locationQuerySchema.parse(req.query);
  const locations = await locationServices.listLocations(query);
  return ok(res, { locations });
});

/** GET /api/locations/:id */
export const getLocation = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const location = await locationServices.getLocationById(id);
  return ok(res, { location });
});

/** POST /api/locations */
export const createLocation = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const input = createLocationSchema.parse(req.body);
  const location = await locationServices.createLocation(input);
  return ok(res, { location }, 201);
});

/** PATCH /api/locations/:id */
export const updateLocation = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  const input = updateLocationSchema.parse(req.body);
  const location = await locationServices.updateLocation(id, input);
  return ok(res, { location });
});

/** DELETE /api/locations/:id */
export const deleteLocation = asyncHandler(async (req: ICustomRequest, res: Response) => {
  const id = parseId(req.params.id);
  await locationServices.deleteLocation(id);
  return ok(res, { message: 'Location deleted' });
});

export default { listLocations, getLocation, createLocation, updateLocation, deleteLocation };
