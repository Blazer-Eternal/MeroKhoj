import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IHiringDecision, IHiringDecisionCreation } from '../../interfaces';
import { HiringDecisionOutcome } from '../../enums';
import { timestampAttributes } from '../modelHelpers';

/**
 * The hiring decision for an application. UNIQUE (application_id) enforces
 * exactly one current decision; the service writes this row AND the resulting
 * application status change in one transaction, plus an audit entry.
 */
class HiringDecision
  extends Model<IHiringDecision, IHiringDecisionCreation>
  implements IHiringDecision
{
  public id!: string;
  public application_id!: string;
  public decided_by!: string;
  public outcome!: HiringDecisionOutcome;
  public notes!: string | null;
  public decided_at!: Date;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly application?: unknown;
  public readonly decider?: unknown;
}

export type HiringDecisionCreationAttributes = Optional<
  IHiringDecisionCreation,
  'notes' | 'decided_at'
>;

export const initHiringDecisionModel = (sequelize: Sequelize): typeof HiringDecision => {
  HiringDecision.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'applications', key: 'id' },
        onDelete: 'CASCADE',
      },
      decided_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      outcome: {
        type: DataTypes.ENUM(...Object.values(HiringDecisionOutcome)),
        allowNull: false,
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      decided_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'hiring_decisions',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // Exactly one current decision per application.
        {
          unique: true,
          fields: ['application_id'],
          name: 'hiring_decisions_application_unique',
        },
        { fields: ['decided_by'] },
        { fields: ['outcome'] },
      ],
    },
  );

  return HiringDecision;
};

export default HiringDecision;
