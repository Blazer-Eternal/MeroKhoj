import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects, ZodError } from 'zod';

/**
 * Zod request validation middleware.
 *
 * Validates `req.body` (and optionally query/params) against a schema, then
 * replaces `req.body` with the parsed (coerced/trimmed) value. Any ZodError is
 * forwarded to the central error handler which renders it as a 422.
 */

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

interface IValidateSchemas {
  body?: Schema;
  query?: Schema;
  params?: Schema;
}

export const validate =
  (schemas: IValidateSchemas) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as typeof req.params;
      }
      if (schemas.query) {
        // Express 5 makes req.query a getter; assign via defineProperty fallback.
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, 'query', {
          value: parsed,
          writable: true,
          configurable: true,
        });
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(error);
      }
      return next(error);
    }
  };

/** Shorthand: validate only the request body. */
export const validateBody = (schema: Schema) => validate({ body: schema });

/** Shorthand: validate only the query string. */
export const validateQuery = (schema: Schema) => validate({ query: schema });

/** Shorthand: validate only the route params. */
export const validateParams = (schema: Schema) => validate({ params: schema });

export default validate;
