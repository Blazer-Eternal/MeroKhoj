import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { ICompanyVerification, ICompanyVerificationCreation } from '../interfaces';
import { CompanyVerificationStatus } from '../enums';
import { timestampAttributes } from './modelHelpers';

/**
 * Company verification submission/review record.
 *
 * Multiple rows per company form the audit history: re-verification appends a
 * new PENDING row rather than overwriting the previous decision. The company's
 * current verification_status is kept in sync by the service layer.
 */
class CompanyVerification
  extends Model<ICompanyVerification, ICompanyVerificationCreation>
  implements ICompanyVerification
{
  public id!: string;
  public company_id!: string;
  public submitted_by!: string;
  public reviewed_by!: string | null;
  public status!: CompanyVerificationStatus;
  public document_url!: string | null;
  public remarks!: string | null;
  public submitted_at!: Date;
  public reviewed_at!: Date | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly company?: unknown;
  public readonly submitter?: unknown;
  public readonly reviewer?: unknown;
}

export type CompanyVerificationCreationAttributes = Optional<
  ICompanyVerificationCreation,
  'reviewed_by' | 'status' | 'document_url' | 'remarks' | 'submitted_at' | 'reviewed_at'
>;

export const initCompanyVerificationModel = (
  sequelize: Sequelize,
): typeof CompanyVerification => {
  CompanyVerification.init(
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
      submitted_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onDelete: 'SET NULL',
      },
      status: {
        type: DataTypes.ENUM(...Object.values(CompanyVerificationStatus)),
        allowNull: false,
        defaultValue: CompanyVerificationStatus.PENDING,
      },
      document_url: { type: DataTypes.TEXT, allowNull: true },
      remarks: { type: DataTypes.TEXT, allowNull: true },
      submitted_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      reviewed_at: { type: DataTypes.DATE, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'company_verifications',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['company_id'] },
        { fields: ['status'] },
        // Supports "latest verification per company" ordering.
        { fields: ['company_id', 'submitted_at'] },
      ],
    },
  );

  return CompanyVerification;
};

export default CompanyVerification;
