import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IRole } from '../interfaces';
import { RoleName } from '../enums';
import { timestampAttributes } from './modelHelpers';

/** Platform roles (JOBSEEKER, RECRUITER, ADMIN, ...). Seeded once. */
class Role extends Model<IRole, Optional<IRole, 'id' | 'created_at' | 'updated_at'>> implements IRole {
  public id!: string;
  public name!: RoleName;
  public description!: string | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly users?: unknown;
}

export const initRoleModel = (sequelize: Sequelize): typeof Role => {
  Role.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.ENUM(...Object.values(RoleName)),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'roles',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [{ unique: true, fields: ['name'] }],
    },
  );

  return Role;
};

export default Role;
