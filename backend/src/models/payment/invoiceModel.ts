import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IInvoice, IInvoiceCreation } from '../../interfaces';
import { InvoiceStatus } from '../../enums';
import { timestampAttributes } from '../modelHelpers';

/**
 * An invoice generated from an order (entity 36).
 *
 * Snapshot: subtotal/tax_amount/total_amount are copied from the order at
 * generation time — never recalculated from the plan's current price.
 * Status mirrors payment (PAID once the payment is confirmed) and lazily
 * flips ISSUED → OVERDUE past the due date. History is retained: invoices
 * are voided, not deleted.
 */
class Invoice extends Model<IInvoice, IInvoiceCreation> implements IInvoice {
  public id!: string;
  public order_id!: string;
  public invoice_number!: string;
  public issue_date!: Date | string;
  public due_date!: Date | string | null;
  public subtotal!: number;
  public tax_amount!: number;
  public total_amount!: number;
  public status!: InvoiceStatus;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly order?: unknown;
}

export type InvoiceCreationAttributes = Optional<
  IInvoiceCreation,
  'due_date' | 'status'
>;

export const initInvoiceModel = (sequelize: Sequelize): typeof Invoice => {
  Invoice.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'orders', key: 'id' },
        onDelete: 'RESTRICT',
      },
      invoice_number: { type: DataTypes.STRING(50), allowNull: false },
      issue_date: { type: DataTypes.DATEONLY, allowNull: false },
      due_date: { type: DataTypes.DATEONLY, allowNull: true },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      status: {
        type: DataTypes.ENUM(...Object.values(InvoiceStatus)),
        allowNull: false,
        defaultValue: InvoiceStatus.DRAFT,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'invoices',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['invoice_number'], name: 'invoices_invoice_number_unique' },
        { fields: ['order_id'] },
        { fields: ['status'] },
        { fields: ['issue_date'] },
      ],
    },
  );

  return Invoice;
};

export default Invoice;
