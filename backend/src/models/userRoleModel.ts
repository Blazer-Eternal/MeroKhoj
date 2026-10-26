import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IUserRole } from '../interfaces';
import { timestampAttributes } from './modelHelpers';

/** Join table for the users ↔ roles many-to-many relationship. */
class UserRole
  extends Model<IUserRole, Optional<IUserRole, 'id' | 'created_at' | 'updated_at'>>
  implements IUserRole
{
  public id!: string;
  public user_id!: string;
  public role_id!: string;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly user?: unknown;
  public readonly role?: unknown;
}

export const initUserRoleModel = (sequelize: Sequelize): typeof UserRole => {
  UserRole.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'roles', key: 'id' },
        onDelete: 'CASCADE',
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'user_roles',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['user_id', 'role_id'] },
        { fields: ['role_id'] },
      ],
    },
  );

  return UserRole;
};

export default UserRole;
