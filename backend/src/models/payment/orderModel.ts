import { Model, DataTypes, Sequelize, Optional } from 'sequelize';
import { IOrder, IOrderCreation } from '../../interfaces';
import { OrderStatus } from '../../enums';
import { timestampAttributes } from '../modelHelpers';

/**
 * An order for a service plan (entity 34).
 *
 * Financial snapshot: unit_price/currency are copied from the plan at
 * creation; subtotal = quantity * unit_price;
 * total = subtotal - discount_amount + tax_amount. Totals are computed
 * SERVER-SIDE — plan price changes or deactivation never rewrite this row.
 * All FKs are RESTRICT: financial history survives plan/company deletes.
 */
class Order extends Model<IOrder, IOrderCreation> implements IOrder {
  public id!: string;
  public company_id!: string;
  public service_plan_id!: string;
  public created_by!: string;
  public order_number!: string;
  public quantity!: number;
  public unit_price!: number;
  public subtotal!: number;
  public discount_amount!: number;
  public tax_amount!: number;
  public total_amount!: number;
  public currency!: string;
  public status!: OrderStatus;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;

  public readonly company?: unknown;
  public readonly service_plan?: unknown;
  public readonly creator?: unknown;
  public readonly payments?: unknown[];
  public readonly invoices?: unknown[];
}

export type OrderCreationAttributes = Optional<
  IOrderCreation,
  'discount_amount' | 'tax_amount' | 'status'
>;

export const initOrderModel = (sequelize: Sequelize): typeof Order => {
  Order.init(
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
        onDelete: 'RESTRICT',
      },
      service_plan_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'service_plans', key: 'id' },
        onDelete: 'RESTRICT',
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'RESTRICT',
      },
      order_number: { type: DataTypes.STRING(50), allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      unit_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      discount_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      tax_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      currency: { type: DataTypes.STRING(10), allowNull: false, defaultValue: 'NPR' },
      status: {
        type: DataTypes.ENUM(...Object.values(OrderStatus)),
        allowNull: false,
        defaultValue: OrderStatus.PENDING,
      },
      ...timestampAttributes,
    },
    {
      sequelize,
      tableName: 'orders',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { unique: true, fields: ['order_number'], name: 'orders_order_number_unique' },
        { fields: ['company_id'] },
        { fields: ['service_plan_id'] },
        { fields: ['created_by'] },
        { fields: ['status'] },
      ],
    },
  );

  return Order;
};

export default Order;
