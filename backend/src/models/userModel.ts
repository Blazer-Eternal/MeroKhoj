import { Model, DataTypes, Sequelize, Optional, Op } from 'sequelize';
import { IUser, IUserCreation } from '../interfaces';
import { UserStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * The central authentication/account entity.
 *
 * A user is deliberately kept free of role columns — roles live in the
 * many-to-many `user_roles` table so one person can act as both a jobseeker
 * and a recruiter. Professional data lives in `jobseeker_profiles` (1:1).
 */
class User extends Model<IUser, IUserCreation> implements IUser {
  public id!: string;
  public email!: string;
  public password_hash!: string;
  public first_name!: string;
  public last_name!: string;
  public phone!: string | null;
  public status!: UserStatus;
  public email_verified!: boolean;
  public last_login_at!: Date | null;

  // Timestamps
  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  // ---- Associations (declared, populated in associations.ts) ----
  public readonly roles?: unknown;
  public readonly jobseeker_profile?: unknown;
  public readonly company_memberships?: unknown;
}

export type UserAttributes = IUser;
export type UserCreationAttributes = Optional<
  IUserCreation,
  'status' | 'email_verified' | 'last_login_at' | 'phone'
>;

export const initUserModel = (sequelize: Sequelize): typeof User => {
  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: { msg: 'Must be a valid email address' },
          notEmpty: { msg: 'Email is required' },
        },
      },
      password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: { msg: 'Password hash is required' } },
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: { msg: 'First name is required' } },
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: { notEmpty: { msg: 'Last name is required' } },
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
        unique: true,
        validate: { is: /^[\d+\-\s()]{6,30}$/ },
      },
      status: {
        type: DataTypes.ENUM(...Object.values(UserStatus)),
        allowNull: false,
        defaultValue: UserStatus.ACTIVE,
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'users',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['email'] },
        { unique: true, fields: ['phone'], where: { phone: { [Op.ne]: null } } },
        { fields: ['status'] },
      ],
      defaultScope: {
        // Never select the password hash unless explicitly requested.
        attributes: { exclude: ['password_hash'] },
      },
      scopes: {
        withPassword: { attributes: { include: ['password_hash'] } },
      },
    },
  );

  return User;
};

export default User;
