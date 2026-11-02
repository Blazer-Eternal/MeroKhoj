import { Model, DataTypes, Sequelize, Optional, Op } from 'sequelize';
import { IPayment, IPaymentCreation } from '../../interfaces';
import { PaymentStatus } from '../../enums';
import { timestampAttributes } from '../modelHelpers';

/**
 * A payment transaction (entity 35).
 *
 * Idempotency: `transaction_reference` is UNIQUE when present (partial
 * index) so repeated provider callbacks resolve to the same row and
 * re-processing a COMPLETED payment is a no-op. Refunds are SEPARATE rows
 * (status REFUNDED) whose `provider_response.refund_of` points at the
 * original transaction — the original is never deleted or overwritten.
 */
class Payment extends Model<IPayment, IPaymentCreation> implements IPayment {
  public id!: string;
  public order_id!: string;
  public transaction_reference!: string | null;
  public provider!: string;
  public amount!: number;
  public currency!: string;
  public status!: PaymentStatus;
  public paid_at!: Date | null;
  public failure_reason!: string | null;
  public provider_response!: Record<string, unknown> | null;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly order?: unknown;
}

export type PaymentCreationAttributes = Optional<
  IPaymentCreation,
  'transaction_reference' | 'status' | 'paid_at' | 'failure_reason' | 'provider_response'
>;

export const initPaymentModel = (sequelize: Sequelize): typeof Payment => {
  Payment.init(
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
      transaction_reference: { type: DataTypes.STRING(255), allowNull: true },
      provider: { type: DataTypes.STRING(50), allowNull: false },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'NPR' },
      status: {
        type: DataTypes.ENUM(...Object.values(PaymentStatus)),
        allowNull: false,
        defaultValue: PaymentStatus.PENDING,
      },
      paid_at: { type: DataTypes.DATE, allowNull: true },
      failure_reason: { type: DataTypes.TEXT, allowNull: true },
      provider_response: { type: DataTypes.JSONB, allowNull: true },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'payments',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        // Unique only when a reference exists — idempotent callbacks.
        {
          unique: true,
          fields: ['transaction_reference'],
          name: 'payments_transaction_reference_unique',
          where: { transaction_reference: { [Op.ne]: null } },
        },
        { fields: ['order_id'] },
        { fields: ['status'] },
        { fields: ['provider'] },
      ],
    },
  );

  return Payment;
};

export default Payment;
