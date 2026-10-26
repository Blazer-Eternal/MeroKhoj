import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ISkill, ISkillCreation } from '../interfaces';
import { SkillStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * A reusable skill in the catalog (e.g. "JavaScript", "SQL").
 *
 * Skills are normalized so both jobs and candidates reference the same row,
 * which makes skill-based search and matching far more reliable than storing
 * arbitrary strings.
 */
class Skill extends Model<ISkill, ISkillCreation> implements ISkill {
  public id!: string;
  public name!: string;
  public description!: string | null;
  public status!: SkillStatus;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly jobs?: unknown;
}

export type SkillCreationAttributes = Optional<ISkillCreation, 'status' | 'description'>;

export const initSkillModel = (sequelize: Sequelize): typeof Skill => {
  Skill.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { notEmpty: { msg: 'Skill name is required' } },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      status: {
        type: DataTypes.ENUM(...Object.values(SkillStatus)),
        allowNull: false,
        defaultValue: SkillStatus.ACTIVE,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'skills',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['name'] }, { fields: ['status'] }],
    },
  );

  return Skill;
};

export default Skill;
