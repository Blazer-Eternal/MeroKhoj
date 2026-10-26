import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils';
import { env } from '../config';

interface IErrorShape {
  statusCode: number;
  message: string;
  code: string;
  details?: unknown;
  isOperational: boolean;
}

/** Normalize any thrown value into a consistent error shape. */
const normalizeError = (error: unknown): IErrorShape => {
  // AppError — our own operational errors.
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      message: error.message,
      code: error.code,
      details: error.details,
      isOperational: error.isOperational,
    };
  }

  // ZodError — request validation failures.
  if (error instanceof ZodError) {
    return {
      statusCode: 422,
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: error.errors.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
      })),
      isOperational: true,
    };
  }

  // Sequelize unique-constraint violation.
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: string }).name === 'SequelizeUniqueConstraintError'
  ) {
    const uniqueError = error as { fields?: Record<string, string[]>; message?: string };
    return {
      statusCode: 409,
      message: 'A record with that value already exists',
      code: 'UNIQUE_CONSTRAINT_VIOLATION',
      details: uniqueError.fields,
      isOperational: true,
    };
  }

  // Sequelize validation error.
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: string }).name === 'SequelizeValidationError'
  ) {
    const validationError = error as { errors?: Array<{ path?: string; message?: string }> };
    return {
      statusCode: 422,
      message: 'Validation failed',
      code: 'SEQUELIZE_VALIDATION_ERROR',
      details: validationError.errors?.map((e) => ({ path: e.path, message: e.message })),
      isOperational: true,
    };
  }

  // Sequelize foreign-key constraint violation.
  if (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: string }).name === 'SequelizeForeignKeyConstraintError'
  ) {
    return {
      statusCode: 400,
      message: 'Referenced record does not exist',
      code: 'FOREIGN_KEY_VIOLATION',
      isOperational: true,
    };
  }

  // Generic Error with an explicit statusCode attached (e.g. body-parser).
  const generic = error as Error & { statusCode?: number; status?: number; code?: string };
  if (generic?.statusCode || generic?.status) {
    return {
      statusCode: generic.statusCode || generic.status || 400,
      message: generic.message || 'Request error',
      code: generic.code || 'REQUEST_ERROR',
      isOperational: true,
    };
  }

  // Unknown — likely a bug. Never leak internals to the client.
  return {
    statusCode: 500,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR',
    isOperational: false,
  };
};

/**
 * Central error handler. Must be registered last, after all routes.
 * Converts any thrown value into a consistent JSON envelope.
 */
export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  const normalized = normalizeError(error);

  // Log non-operational errors (bugs) with full detail for debugging.
  if (!normalized.isOperational) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}`, error);
  }

  res.status(normalized.statusCode).json({
    success: false,
    error: {
      code: normalized.code,
      message: normalized.message,
      ...(normalized.details !== undefined ? { details: normalized.details } : {}),
      ...(env.isProduction ? {} : { stack: (error as Error)?.stack }),
    },
  });
};

/** 404 fallback for unmatched routes. Register just before errorHandler. */
export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
};

export default errorHandler;
