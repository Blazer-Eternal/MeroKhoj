import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ITalentRoster, ITalentRosterCreation } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/**
 * A company-owned talent shortlist. Every access path is scoped to the owning
 * company's members (company isolation), enforced in the service layer.
 */
class TalentRoster extends Model<ITalentRoster, ITalentRosterCreation> implements ITalentRoster {
  public id!: string;
  public company_id!: string;
  public name!: string;
  public description!: string | null;
  public created_by!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly company?: unknown;
  public readonly creator?: unknown;
  public readonly members?: unknown[];
}

export type TalentRosterCreationAttributes = Optional<ITalentRosterCreation, 'description'>;

export const initTalentRosterModel = (sequelize: Sequelize): typeof TalentRoster => {
  TalentRoster.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      company_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'companies', key: 'id' },
        onDelete: 'CASCADE',
      },
      name: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'talent_rosters',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['company_id'] },
        // Roster names are unique within a company.
        {
          unique: true,
          fields: ['company_id', 'name'],
          name: 'talent_rosters_company_name_unique',
        },
      ],
    },
  );

  return TalentRoster;
};

export default TalentRoster;
