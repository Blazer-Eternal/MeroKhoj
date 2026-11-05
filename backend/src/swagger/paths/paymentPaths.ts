/**
 * Billing paths: service plans, orders, payments, invoices and the
 * company publish-entitlement snapshot (Phase 5, entities 33–36).
 */
export const paymentPaths = {
  // ---- Service plans (entity 33) ----------------------------------------
  '/service-plans': {
    get: {
      tags: ['Service Plans'],
      summary: 'List service plans',
      description:
        'Public catalog. Anonymous callers only ever see ACTIVE plans; admins may pass ?status=INACTIVE.',
      security: [],
      parameters: [
        { $ref: '#/components/parameters/Page' },
        { $ref: '#/components/parameters/PerPage' },
        {
          name: 'status',
          in: 'query',
          schema: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
          description: 'Admin-only filter (others are forced to ACTIVE).',
        },
      ],
      responses: {
        '200': { description: 'Plans (paginated)' },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
    post: {
      tags: ['Service Plans'],
      summary: 'Create a service plan (admin)',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'price'],
              properties: {
                name: { type: 'string', maxLength: 150 },
                description: { type: 'string', nullable: true },
                price: { type: 'number', minimum: 0, example: 4999 },
                currency: { type: 'string', default: 'NPR', maxLength: 10 },
                duration_days: { type: 'integer', minimum: 1, nullable: true },
                job_posting_limit: {
                  type: 'integer',
                  minimum: 0,
                  nullable: true,
                  description: 'NULL = unlimited postings.',
                },
                featured_jobs_limit: { type: 'integer', minimum: 0, default: 0 },
                status: { type: 'string', enum: ['ACTIVE', 'INACTIVE'] },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Plan created' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/service-plans/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Service Plans'],
      summary: 'Get a service plan',
      security: [],
      responses: {
        '200': { description: 'Plan' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
    patch: {
      tags: ['Service Plans'],
      summary: 'Update a service plan (admin)',
      description:
        'Price/status edits affect FUTURE orders only — purchased orders keep their snapshots.',
      responses: {
        '200': { description: 'Updated plan' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
    delete: {
      tags: ['Service Plans'],
      summary: 'Delete a service plan (admin)',
      description:
        'Only allowed when no order ever referenced it (409 otherwise — deactivate instead).',
      responses: {
        '200': { description: 'Deleted' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },

  // ---- Orders (entity 34) -----------------------------------------------
  '/orders': {
    get: {
      tags: ['Orders'],
      summary: 'List orders',
      description: 'Admins see all orders; employers see their companies\u2019 only.',
      parameters: [
        { $ref: '#/components/parameters/Page' },
        { $ref: '#/components/parameters/PerPage' },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
          },
        },
      ],
      responses: { '200': { description: 'Orders (paginated)' } },
    },
    post: {
      tags: ['Orders'],
      summary: 'Create an order',
      description:
        'Server-side snapshot: unit_price/currency copied from the plan; ' +
        'subtotal = quantity × unit_price; total = subtotal − discount + tax.',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['company_id', 'service_plan_id'],
              properties: {
                company_id: { type: 'string', format: 'uuid' },
                service_plan_id: { type: 'string', format: 'uuid' },
                quantity: { type: 'integer', minimum: 1, default: 1 },
                discount_amount: { type: 'number', minimum: 0, default: 0 },
                tax_amount: { type: 'number', minimum: 0, default: 0 },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Order created (PENDING)' },
        '400': { $ref: '#/components/responses/BadRequest' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/orders/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Orders'],
      summary: 'Get an order',
      responses: {
        '200': { description: 'Order' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/orders/{id}/cancel': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    post: {
      tags: ['Orders'],
      summary: 'Cancel a PENDING order',
      description: 'Confirmed/completed orders are financial history — refund instead.',
      responses: {
        '200': { description: 'Order cancelled' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },

  // ---- Payments (entity 35) ---------------------------------------------
  '/orders/{id}/payments': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Payments'],
      summary: 'List an order\u2019s payments',
      responses: { '200': { description: 'Payments (newest first)' } },
    },
    post: {
      tags: ['Payments'],
      summary: 'Initiate a payment for an order',
      description:
        'Amount is the ORDER\u2019s total (server-side). One outstanding PENDING ' +
        'payment per order — re-initiating returns it (idempotent).',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                provider: { type: 'string', maxLength: 50, default: 'manual' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'PENDING payment created (or existing one returned)' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/payments': {
    get: {
      tags: ['Payments'],
      summary: 'List payments',
      description: 'Admins see all; employers see payments on their companies\u2019 orders.',
      parameters: [
        { $ref: '#/components/parameters/Page' },
        { $ref: '#/components/parameters/PerPage' },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REFUNDED'],
          },
        },
        { name: 'provider', in: 'query', schema: { type: 'string' } },
      ],
      responses: { '200': { description: 'Payments (paginated)' } },
    },
  },
  '/payments/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Payments'],
      summary: 'Get a payment',
      responses: {
        '200': { description: 'Payment' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/payments/webhook': {
    post: {
      tags: ['Payments'],
      summary: 'Provider callback (HMAC-verified, idempotent)',
      description:
        'Unauthenticated endpoint: trust comes from the x-signature header — ' +
        'HMAC-SHA256 over the canonical string `transaction_reference|status|amount`. ' +
        'Fails closed with 503 when PAYMENT_WEBHOOK_SECRET is unset. Replays of a ' +
        'final state return idempotent: true (200); conflicting transitions 409. ' +
        'On COMPLETED, in ONE transaction: payment → COMPLETED, order → CONFIRMED, ' +
        'invoice generated (snapshot) → PAID.',
      security: [],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['transaction_reference', 'status', 'amount'],
              properties: {
                transaction_reference: { type: 'string', maxLength: 255 },
                status: {
                  type: 'string',
                  enum: ['PROCESSING', 'COMPLETED', 'FAILED'],
                },
                amount: { oneOf: [{ type: 'string' }, { type: 'number' }] },
                failure_reason: { type: 'string', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Accepted (idempotent flag reports replays)' },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { $ref: '#/components/responses/NotFound' },
        '409': { $ref: '#/components/responses/Conflict' },
        '503': { description: 'Webhook not configured (fail closed)' },
      },
    },
  },
  '/payments/{id}/confirm': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    post: {
      tags: ['Payments'],
      summary: 'Confirm a payment manually (admin)',
      description: 'Shares the exact webhook completion path (order + invoice in one txn).',
      responses: {
        '200': { description: 'Payment COMPLETED' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/payments/{id}/refund': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    post: {
      tags: ['Payments'],
      summary: 'Refund a completed payment (admin)',
      description:
        'Records a SEPARATE linked payment row (status REFUNDED, ' +
        'provider_response.refund_of → original). The original payment is never ' +
        'modified; double refunds are rejected (409).',
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: { reason: { type: 'string', maxLength: 1000, nullable: true } },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Refund transaction recorded' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },

  // ---- Invoices (entity 36) ---------------------------------------------
  '/invoices': {
    get: {
      tags: ['Invoices'],
      summary: 'List invoices',
      description: 'Admins see all; employers see invoices on their companies\u2019 orders.',
      parameters: [
        { $ref: '#/components/parameters/Page' },
        { $ref: '#/components/parameters/PerPage' },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['DRAFT', 'ISSUED', 'PAID', 'VOID', 'OVERDUE'],
          },
        },
      ],
      responses: { '200': { description: 'Invoices (paginated)' } },
    },
    post: {
      tags: ['Invoices'],
      summary: 'Create a manual DRAFT invoice (admin)',
      description:
        'Totals snapshotted from the order. At most one non-VOID invoice per order (409).',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['order_id'],
              properties: {
                order_id: { type: 'string', format: 'uuid' },
                issue_date: { type: 'string', format: 'date' },
                due_date: { type: 'string', format: 'date', nullable: true },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'DRAFT invoice created' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/invoices/{id}': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    get: {
      tags: ['Invoices'],
      summary: 'Get an invoice',
      description: 'Reads lazily flip ISSUED → OVERDUE past the due date.',
      responses: {
        '200': { description: 'Invoice' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/invoices/{id}/issue': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    post: {
      tags: ['Invoices'],
      summary: 'Issue a DRAFT invoice (admin)',
      description: 'Fills a missing due date with issue_date + 14 days.',
      responses: {
        '200': { description: 'Invoice ISSUED' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },
  '/invoices/{id}/void': {
    parameters: [{ $ref: '#/components/parameters/UuidId' }],
    post: {
      tags: ['Invoices'],
      summary: 'Void an unpaid invoice (admin)',
      description: 'Void keeps the row (history retained). PAID invoices are immutable.',
      responses: {
        '200': { description: 'Invoice VOID' },
        '409': { $ref: '#/components/responses/Conflict' },
      },
    },
  },

  // ---- Entitlement (workflow rule 5) ------------------------------------
  '/companies/{companyId}/entitlement': {
    parameters: [{ $ref: '#/components/parameters/CompanyId' }],
    get: {
      tags: ['Payments'],
      summary: 'Company publish entitlement',
      description:
        'billing_required (COMPANY_BILLING_REQUIRED), used (published jobs), ' +
        'allowance/remaining from active orders (null = unlimited), active_orders ' +
        'and next_expiry. Checked before the first job publish when billing is on.',
      responses: {
        '200': { description: 'Entitlement snapshot' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
};

export default paymentPaths;
