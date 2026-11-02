import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ITalentRosterMember, ITalentRosterMemberCreation } from '../../interfaces';
import { timestampAttributes } from '../modelHelpers';

/**
 * A jobseeker added to a talent roster. UNIQUE (roster_id, jobseeker_id)
 * prevents adding the same person twice to one roster.
 */
class TalentRosterMember
  extends Model<ITalentRosterMember, ITalentRosterMemberCreation>
  implements ITalentRosterMember
{
  public id!: string;
  public roster_id!: string;
  public jobseeker_id!: string;
  public added_by!: string;
  public notes!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly roster?: unknown;
  public readonly jobseeker_profile?: unknown;
  public readonly adder?: unknown;
}

export type TalentRosterMemberCreationAttributes = Optional<
  ITalentRosterMemberCreation,
  'notes'
>;

export const initTalentRosterMemberModel = (
  sequelize: Sequelize,
): typeof TalentRosterMember => {
  TalentRosterMember.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      roster_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'talent_rosters', key: 'id' },
        onDelete: 'CASCADE',
      },
      jobseeker_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'jobseeker_profiles', key: 'id' },
        onDelete: 'CASCADE',
      },
      added_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      notes: { type: DataTypes.TEXT, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'talent_roster_members',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // No duplicate members per roster.
        {
          unique: true,
          fields: ['roster_id', 'jobseeker_id'],
          name: 'talent_roster_members_unique',
        },
        { fields: ['jobseeker_id'] },
      ],
    },
  );

  return TalentRosterMember;
};

export default TalentRosterMember;
