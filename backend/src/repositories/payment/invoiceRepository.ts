import { Op, Transaction } from 'sequelize';
import Invoice from '../../models/payment/invoiceModel';
import Order from '../../models/payment/orderModel';
import { IInvoice, IInvoiceCreation } from '../../interfaces';
import { InvoiceStatus } from '../../enums';
import { plain, IPaginationParams, buildPaginationMeta, toMoney } from '../../utils';

const MONEY_FIELDS = ['subtotal', 'tax_amount', 'total_amount'] as const;

/** Map a row, coercing every DECIMAL money column to a JSON number. */
const mapInvoice = (row: IInvoice): IInvoice => {
  const mapped = { ...row } as Record<string, unknown>;
  for (const field of MONEY_FIELDS) mapped[field] = toMoney(row[field]);
  return mapped as unknown as IInvoice;
};

/**
 * Data-access layer for the `invoices` table (entity 36).
 *
 * Invoices snapshot the order's financials at generation and are voided
 * rather than deleted (history retained). At most one non-VOID invoice
 * exists per order — enforced by findActiveByOrder() checks in the
 * service layer.
 */
class InvoiceRepository {
  async findById(id: string): Promise<IInvoice | null> {
    const row = await Invoice.findByPk(id, {
      include: [{ model: Order, as: 'order' }],
    });
    return row ? mapInvoice(plain<IInvoice>(row)) : null;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<IInvoice | null> {
    const row = await Invoice.findOne({ where: { invoice_number: invoiceNumber } });
    return row ? mapInvoice(plain<IInvoice>(row)) : null;
  }

  /** The order's live (non-VOID) invoice, if one exists. */
  async findActiveByOrder(orderId: string): Promise<IInvoice | null> {
    const row = await Invoice.findOne({
      where: { order_id: orderId, status: { [Op.ne]: InvoiceStatus.VOID } },
      order: [['created_at', 'DESC']],
    });
    return row ? mapInvoice(plain<IInvoice>(row)) : null;
  }

  /**
   * Invoice listing. `companyIds` restricts to orders of those companies
   * (employer view); omit for the unscoped admin view.
   */
  async list(
    status: InvoiceStatus | undefined,
    companyIds: string[] | undefined,
    pagination: IPaginationParams,
  ): Promise<{ data: IInvoice[]; meta: ReturnType<typeof buildPaginationMeta> }> {
    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    if (companyIds && companyIds.length === 0) {
      return { data: [], meta: buildPaginationMeta(0, pagination.page, pagination.perPage) };
    }

    const include = [
      {
        model: Order,
        as: 'order',
        attributes: ['id', 'order_number', 'company_id', 'currency'],
        ...(companyIds ? { where: { company_id: { [Op.in]: companyIds } } } : {}),
      },
    ];

    const { count, rows } = await Invoice.findAndCountAll({
      where,
      include,
      limit: pagination.limit,
      offset: pagination.offset,
      order: [['created_at', 'DESC']],
    });

    return {
      data: plain<IInvoice[]>(rows).map(mapInvoice),
      meta: buildPaginationMeta(count, pagination.page, pagination.perPage),
    };
  }

  async create(
    payload: IInvoiceCreation,
    options?: { transaction?: Transaction },
  ): Promise<IInvoice> {
    const row = await Invoice.create(payload, { transaction: options?.transaction });
    return mapInvoice(plain<IInvoice>(row));
  }

  async update(
    id: string,
    updates: Partial<IInvoice>,
    options?: { transaction?: Transaction },
  ): Promise<IInvoice | null> {
    const row = await Invoice.findByPk(id, { transaction: options?.transaction });
    if (!row) return null;
    await row.update(updates, { transaction: options?.transaction });
    return mapInvoice(plain<IInvoice>(row));
  }

  /** Flip the order's live invoice to PAID (called inside the payment tx). */
  async markPaidByOrder(
    orderId: string,
    options?: { transaction?: Transaction },
  ): Promise<IInvoice | null> {
    const row = await Invoice.findOne({
      where: { order_id: orderId, status: { [Op.in]: [InvoiceStatus.ISSUED, InvoiceStatus.OVERDUE, InvoiceStatus.DRAFT] } },
      order: [['created_at', 'DESC']],
      transaction: options?.transaction,
    });
    if (!row) return null;
    await row.update({ status: InvoiceStatus.PAID }, { transaction: options?.transaction });
    return mapInvoice(plain<IInvoice>(row));
  }
}

export default new InvoiceRepository();
