import { Op, Transaction, WhereOptions } from 'sequelize';
import Payment from '../../models/payment/paymentModel';
import Order from '../../models/payment/orderModel';
import { IPayment, IPaymentCreation } from '../../interfaces';
import { PaymentStatus } from '../../enums';
import { plain, IPaginationParams, buildPaginationMeta, toMoney } from '../../utils';

/** Map a row, coercing DECIMAL amount to a JSON number. */
const mapPayment = (row: IPayment): IPayment => ({
  ...row,
  amount: toMoney(row.amount),
});

/**
 * Data-access layer for the `payments` table (entity 35).
 *
 * Idempotency lives in the partial unique index on transaction_reference;
 * findByTransactionReference() is how repeated callbacks resolve to the
 * same row. Refunds are separate rows found via provider_response @>
 * { refund_of: <original id> } — originals are never mutated into refunds.
 */
class PaymentRepository {
  async findById(id: string): Promise<IPayment | null> {
    const row = await Payment.findByPk(id);
    return row ? mapPayment(plain<IPayment>(row)) : null;
  }

  async findByTransactionReference(reference: string): Promise<IPayment | null> {
    const row = await Payment.findOne({ where: { transaction_reference: reference } });
    return row ? mapPayment(plain<IPayment>(row)) : null;
  }

  async listByOrder(orderId: string): Promise<IPayment[]> {
    const rows = await Payment.findAll({
      where: { order_id: orderId },
      order: [['created_at', 'DESC']],
    });
    return plain<IPayment[]>(rows).map(mapPayment);
  }

  /**
   * Listing across orders. `companyIds` restricts the result to those
   * companies (employer view); omit it for the unscoped admin view.
   */
  async list(
    status: PaymentStatus | undefined,
    provider: string | undefined,
    companyIds: string[] | undefined,
    pagination: IPaginationParams,
  ): Promise<{ data: IPayment[]; meta: ReturnType<typeof buildPaginationMeta> }> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (provider) where.provider = provider;

    if (companyIds && companyIds.length === 0) {
      return { data: [], meta: buildPaginationMeta(0, pagination.page, pagination.perPage) };
    }

    const include = [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'order_number', 'company_id', 'currency', 'total_amount'],
        ...(companyIds ? { where: { company_id: { [Op.in]: companyIds } } } : {}),
      },
    ];

    const { count, rows } = await Payment.findAndCountAll({
      where,
      include,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['created_at', 'DESC']],
    });

    return {
      data: plain<IPayment[]>(rows).map(mapPayment),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  async create(
    payload: IPaymentCreation,
    options?: { transaction?: Transaction },
  ): Promise<IPayment> {
    const row = await Payment.create(payload, { transaction: options?.transaction });
    return mapPayment(plain<IPayment>(row));
  }

  async update(
    id: string,
    updates: Partial<IPayment>,
    options?: { transaction?: Transaction },
  ): Promise<IPayment | null> {
    const row = await Payment.findByPk(id, { transaction: options?.transaction });
    if (!row) return null;
    await row.update(updates, { transaction: options?.transaction });
    return mapPayment(plain<IPayment>(row));
  }

  /** Refund rows already recorded against an original transaction. */
  async listRefundsFor(originalPaymentId: string): Promise<IPayment[]> {
    // JSONB @> containment — the generic where-type can't express it.
    const where = {
      status: PaymentStatus.REFUNDED,
      provider_response: { [Op.contains]: { refund_of: originalPaymentId } },
    } as unknown as WhereOptions<IPayment>;
    const rows = await Payment.findAll({
      where,
      order: [['created_at', 'DESC']],
    });
    return plain<IPayment[]>(rows).map(mapPayment);
  }
}

export default new PaymentRepository();
