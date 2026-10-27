import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ILocation, ILocationCreation } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/**
 * A geographic location referenced by jobs and alerts.
 * latitude/longitude are validated to valid WGS-84 ranges.
 */
class Location extends Model<ILocation, ILocationCreation> implements ILocation {
  public id!: string;
  public country!: string;
  public province!: string | null;
  public district!: string | null;
  public city!: string | null;
  public address!: string | null;
  public postal_code!: string | null;
  public latitude!: number | null;
  public longitude!: number | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export type LocationCreationAttributes = Optional<
  ILocationCreation,
  'province' | 'district' | 'city' | 'address' | 'postal_code' | 'latitude' | 'longitude'
>;

export const initLocationModel = (sequelize: Sequelize): typeof Location => {
  Location.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      country: { type: DataTypes.STRING(100), allowNull: false },
      province: { type: DataTypes.STRING(150), allowNull: true },
      district: { type: DataTypes.STRING(150), allowNull: true },
      city: { type: DataTypes.STRING(150), allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      postal_code: { type: DataTypes.STRING(20), allowNull: true },
      latitude: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true,
        validate: { min: -90, max: 90 },
      },
      longitude: {
        type: DataTypes.DECIMAL(9, 6),
        allowNull: true,
        validate: { min: -180, max: 180 },
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'locations',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['country'] },
        { fields: ['province'] },
        { fields: ['district'] },
        { fields: ['city'] },
        // Composite index for the common "jobs in this district" join.
        { fields: ['country', 'province', 'district', 'city'] },
      ],
    },
  );

  return Location;
};

export default Location;
