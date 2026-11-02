import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IServicePlan, IServicePlanCreation } from '../../interfaces';
import { CatalogStatus } from '../../enums';
import { timestampAttributes } from '../modelHelpers';

/**
 * A purchasable recruitment package (entity 33). Admin-managed catalog:
 * deactivation flips `status` only and never affects already-purchased
 * orders (they hold their own price/limit snapshots).
 */
class ServicePlan extends Model<IServicePlan, IServicePlanCreation> implements IServicePlan {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public price!: number;
  public currency!: string;
  public duration_days!: number | null;
  public job_posting_limit!: number | null;
  public featured_jobs_limit!: number;
  public status!: CatalogStatus;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

export type ServicePlanCreationAttributes = Optional<
  IServicePlanCreation,
  'description' | 'currency' | 'duration_days' | 'job_posting_limit' | 'featured_jobs_limit' | 'status'
>;

export const initServicePlanModel = (sequelize: Sequelize): typeof ServicePlan => {
  ServicePlan.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'NPR' },
      duration_days: { type: DataTypes.INTEGER, allowNull: true },
      // NULL = unlimited job postings.
      job_posting_limit: { type: DataTypes.INTEGER, allowNull: true },
      featured_jobs_limit: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM(...Object.values(CatalogStatus)),
        allowNull: false,
        defaultValue: CatalogStatus.ACTIVE,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'service_plans',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ fields: ['status'] }],
    },
  );

  return ServicePlan;
};

export default ServicePlan;
