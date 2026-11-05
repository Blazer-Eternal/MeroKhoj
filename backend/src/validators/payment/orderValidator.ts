import { z } from 'zod';
import { OrderStatus } from '../../enums';

/** Order validators (entity 34). */

export const createOrderSchema = z.object({
  company_id: z.string().uuid(),
  service_plan_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).optional(),
  discount_amount: z.coerce.number().min(0).optional(),
  tax_amount: z.coerce.number().min(0).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  perPage: z.coerce.number().int().min(1).max(100).optional(),
  status: z.nativeEnum(OrderStatus).optional(),
});

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
