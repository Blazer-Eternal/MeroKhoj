import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IJobCategory, IJobCategoryCreation } from '../interfaces';
import { CatalogStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * Job category taxonomy. Supports a single level of nesting via `parent_id`;
 * self-parenting and circular hierarchies are blocked in the service layer.
 */
class JobCategory extends Model<IJobCategory, IJobCategoryCreation> implements IJobCategory {
  public id!: string;
  public name!: string;
  public slug!: string;
  public parent_id!: string | null;
  public description!: string | null;
  public status!: CatalogStatus;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly parent?: unknown;
  public readonly children?: unknown;
}

export type JobCategoryCreationAttributes = Optional<
  IJobCategoryCreation,
  'parent_id' | 'description' | 'status'
>;

export const initJobCategoryModel = (sequelize: Sequelize): typeof JobCategory => {
  JobCategory.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
      parent_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'job_categories', key: 'id' },
        onDelete: 'SET NULL',
      },
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
      tableName: 'job_categories',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['parent_id'] },
        { fields: ['status'] },
      ],
    },
  );

  return JobCategory;
};

export default JobCategory;
