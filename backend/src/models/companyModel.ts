import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ICompany, ICompanyCreation } from '../interfaces';
import { CompanyStatus, CompanyVerificationStatus, CompanySize } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * An employer organization.
 *
 * Companies do NOT store a single recruiter_id — membership is modelled
 * separately in `company_members` so a company can have an owner, HR managers,
 * multiple recruiters and hiring managers.
 */
class Company extends Model<ICompany, ICompanyCreation> implements ICompany {
  public id!: string;
  public name!: string;
  public slug!: string;
  public description!: string | null;
  public logo_url!: string | null;
  public website!: string | null;
  public email!: string | null;
  public phone!: string | null;
  public industry!: string | null;
  public company_size!: CompanySize | null;
  public address!: string | null;
  public city!: string | null;
  public country!: string;
  public verification_status!: CompanyVerificationStatus;
  public status!: CompanyStatus;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly members?: unknown;
  public readonly jobs?: unknown;
  public readonly owner?: unknown;
}

export type CompanyCreationAttributes = Optional<
  ICompanyCreation,
  'country' | 'verification_status' | 'status'
>;

export const initCompanyModel = (sequelize: Sequelize): typeof Company => {
  Company.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: { notEmpty: { msg: 'Company name is required' } },
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      description: { type: DataTypes.TEXT, allowNull: true },
      logo_url: { type: DataTypes.TEXT, allowNull: true },
      website: { type: DataTypes.STRING(500), allowNull: true },
      email: { type: DataTypes.STRING(255), allowNull: true },
      phone: { type: DataTypes.STRING(30), allowNull: true },
      industry: { type: DataTypes.STRING(150), allowNull: true },
      company_size: {
        type: DataTypes.ENUM(...Object.values(CompanySize)),
        allowNull: true,
      },
      address: { type: DataTypes.TEXT, allowNull: true },
      city: { type: DataTypes.STRING(100), allowNull: true },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: 'Nepal',
      },
      verification_status: {
        type: DataTypes.ENUM(...Object.values(CompanyVerificationStatus)),
        allowNull: false,
        defaultValue: CompanyVerificationStatus.PENDING,
      },
      status: {
        type: DataTypes.ENUM(...Object.values(CompanyStatus)),
        allowNull: false,
        defaultValue: CompanyStatus.ACTIVE,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'companies',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['verification_status'] },
        { fields: ['status'] },
        { fields: ['city'] },
      ],
    },
  );

  return Company;
};

export default Company;
