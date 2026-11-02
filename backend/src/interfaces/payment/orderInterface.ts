import { OrderStatus } from '../../enums';
import { ITimestamps } from '../shared/commonInterface';

/**
 * An order for a service plan (entity 34).
 *
 * Financial snapshot: `unit_price`, `currency` and every total are computed
 * SERVER-SIDE at creation from the plan's price at that moment — later plan
 * price changes or deactivation never rewrite this row.
 *
 * total_amount = subtotal - discount_amount + tax_amount
 * subtotal     = quantity * unit_price
 */
export interface IOrder extends ITimestamps {
  id: string;
  company_id: string;
  service_plan_id: string;
  created_by: string;
  order_number: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  currency: string;
  status: OrderStatus;
}

export interface IOrderCreation {
  company_id: string;
  service_plan_id: string;
  created_by: string;
  order_number: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  currency: string;
  status?: OrderStatus;
}

/** Order listing filters. */
export interface IOrderQuery {
  company_id?: string;
  status?: OrderStatus;
}
