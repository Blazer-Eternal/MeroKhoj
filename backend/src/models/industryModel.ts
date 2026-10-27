import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IIndustry, IIndustryCreation } from '../interfaces';
import { CatalogStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/** Industry classification used by companies and jobs. */
class Industry extends Model<IIndustry, IIndustryCreation> implements IIndustry {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public status!: CatalogStatus;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export type IndustryCreationAttributes = Optional<
  IIndustryCreation,
  'description' | 'status'
>;

export const initIndustryModel = (sequelize: Sequelize): typeof Industry => {
  Industry.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: DataTypes.STRING(150), allowNull: false, unique: true },
      slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(CatalogStatus)),
        allowNull: false,
        defaultValue: CatalogStatus.ACTIVE,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'industries',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['name'] },
        { unique: true, fields: ['slug'] },
        { fields: ['status'] },
      ],
    },
  );

  return Industry;
};

export default Industry;
