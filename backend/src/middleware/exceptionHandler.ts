import { NextFunction, Request, Response } from 'express';

/**
 * Wraps an async route handler so that any rejected promise is forwarded to
 * the central error handler instead of crashing the process.
 *
 * Usage:
 *   router.get('/', asyncHandler(async (req, res) => { ... }));
 */
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncRequestHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    void Promise.resolve(fn(req, res, next)).catch(next);
  };

export default asyncHandler;
