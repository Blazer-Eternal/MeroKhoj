import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ICompanyMember, ICompanyMemberCreation } from '../interfaces';
import { CompanyRole, CompanyMemberStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * A user's membership in a company.
 *
 * UNIQUE(company_id, user_id) guarantees a person cannot join the same company
 * twice. `role` is the person's power *within that company only* (distinct from
 * the global role in user_roles).
 */
class CompanyMember
  extends Model<ICompanyMember, ICompanyMemberCreation>
  implements ICompanyMember
{
  public id!: string;
  public company_id!: string;
  public user_id!: string;
  public role!: CompanyRole;
  public status!: CompanyMemberStatus;
  public joined_at!: Date | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly company?: unknown;
  public readonly user?: unknown;
}

export type CompanyMemberCreationAttributes = Optional<
  ICompanyMemberCreation,
  'status' | 'joined_at'
>;

export const initCompanyMemberModel = (sequelize: Sequelize): typeof CompanyMember => {
  CompanyMember.init(
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
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      role: {
        type: DataTypes.ENUM(...Object.values(CompanyRole)),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(CompanyMemberStatus)),
        allowNull: false,
        defaultValue: CompanyMemberStatus.ACTIVE,
      },
      joined_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'company_members',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['company_id', 'user_id'] },
        { fields: ['user_id'] },
        { fields: ['company_id', 'role'] },
      ],
    },
  );

  return CompanyMember;
};

export default CompanyMember;
