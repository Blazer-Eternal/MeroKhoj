import { Op } from 'sequelize';
import Location from '../models/locationModel';
import { ILocation, ILocationCreation, ILocationSearchQuery } from '../interfaces';
import { plain } from '../utils';

/** Data-access layer for the `locations` table. */
class LocationRepository {
  async findById(id: string): Promise<ILocation | null> {
    const row = await Location.findByPk(id);
    return row ? (plain(row) as ILocation) : null;
  }

  async listAll(): Promise<ILocation[]> {
    const rows = await Location.findAll({
      order: [
        ['country', 'ASC'],
        ['province', 'ASC'],
        ['district', 'ASC'],
        ['city', 'ASC'],
      ],
    });
    return plain<ILocation[]>(rows as unknown as Record<string, unknown>[]);
  }

  async search(query: ILocationSearchQuery): Promise<ILocation[]> {
    const where: Record<string, unknown> = {};

    if (query.country) where.country = query.country;
    if (query.province) where.province = query.province;
    if (query.district) where.district = query.district;
    if (query.city) where.city = query.city;

    if (query.q) {
      const term = `%${query.q}%`;
      where[Op.or as unknown as string] = [
        { country: { [Op.iLike]: term } },
        { province: { [Op.iLike]: term } },
        { district: { [Op.iLike]: term } },
        { city: { [Op.iLike]: term } },
        { address: { [Op.iLike]: term } },
      ];
    }

    const rows = await Location.findAll({
      where,
      order: [
        ['country', 'ASC'],
        ['province', 'ASC'],
        ['district', 'ASC'],
        ['city', 'ASC'],
      ],
    });
    return plain<ILocation[]>(rows as unknown as Record<string, unknown>[]);
  }

  async create(payload: ILocationCreation): Promise<ILocation> {
    const row = await Location.create(payload);
    return plain(row) as ILocation;
  }

  async update(id: string, updates: Partial<ILocation>): Promise<ILocation | null> {
    const row = await Location.findByPk(id);
    if (!row) return null;
    await row.update(updates);
    return plain(row) as ILocation;
  }

  async destroy(id: string): Promise<boolean> {
    const deleted = await Location.destroy({ where: { id } });
    return deleted > 0;
  }
}

export default new LocationRepository();
