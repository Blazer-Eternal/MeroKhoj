import { AppError } from '../utils';
import { ILocation, ILocationCreation, ILocationUpdate, ILocationSearchQuery } from '../interfaces';
import { locationRepository } from '../repositories';

/** Location business logic (geographic reference data). */

export const listLocations = async (query: ILocationSearchQuery): Promise<ILocation[]> =>
  locationRepository.search(query);

export const getLocationById = async (id: string): Promise<ILocation> => {
  const location = await locationRepository.findById(id);
  if (!location) throw AppError.notFound('Location not found');
  return location;
};

export const createLocation = async (input: ILocationCreation): Promise<ILocation> => {
  assertValidCoordinates(input.latitude, input.longitude);
  return locationRepository.create(input);
};

export const updateLocation = async (
  id: string,
  updates: ILocationUpdate,
): Promise<ILocation> => {
  const existing = await locationRepository.findById(id);
  if (!existing) throw AppError.notFound('Location not found');

  assertValidCoordinates(
    updates.latitude !== undefined ? updates.latitude : existing.latitude,
    updates.longitude !== undefined ? updates.longitude : existing.longitude,
  );

  const updated = await locationRepository.update(id, updates);
  if (!updated) throw AppError.notFound('Location not found');
  return updated;
};

export const deleteLocation = async (id: string): Promise<void> => {
  const existing = await locationRepository.findById(id);
  if (!existing) throw AppError.notFound('Location not found');
  await locationRepository.destroy(id);
};

function assertValidCoordinates(latitude: number | null | undefined, longitude: number | null | undefined): void {
  if (latitude != null && (latitude < -90 || latitude > 90)) {
    throw AppError.badRequest('latitude must be between -90 and 90');
  }
  if (longitude != null && (longitude < -180 || longitude > 180)) {
    throw AppError.badRequest('longitude must be between -180 and 180');
  }
}

export const locationServices = {
  listLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};

export default locationServices;
