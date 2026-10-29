import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IReport, IReportCreation } from '../interfaces';
import { ReportEntityType, ReportStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * A report filed against a USER, COMPANY or JOB.
 *
 * `entity_id` is polymorphic (no single FK target), so existence is validated
 * at the application layer based on `entity_type`.
 */
class Report extends Model<IReport, IReportCreation> implements IReport {
  public id!: string;
  public reported_by!: string;
  public entity_type!: ReportEntityType;
  public entity_id!: string;
  public reason!: string;
  public description!: string | null;
  public status!: ReportStatus;
  public resolved_by!: string | null;
  public resolved_at!: Date | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly reporter?: unknown;
  public readonly resolver?: unknown;
}

export type ReportCreationAttributes = Optional<
  IReportCreation,
  'description' | 'status' | 'resolved_by' | 'resolved_at'
>;

export const initReportModel = (sequelize: Sequelize): typeof Report => {
  Report.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      reported_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      entity_type: {
        type: DataTypes.ENUM(...Object.values(ReportEntityType)),
        allowNull: false,
      },
      entity_id: { type: DataTypes.UUID, allowNull: false },
      reason: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(ReportStatus)),
        allowNull: false,
        defaultValue: ReportStatus.OPEN,
      },
      resolved_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      resolved_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'reports',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['reported_by'] },
        { fields: ['entity_type', 'entity_id'] },
        { fields: ['status'] },
        { fields: ['created_at'] },
      ],
    },
  );

  return Report;
};

export default Report;
