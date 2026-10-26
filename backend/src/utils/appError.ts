/**
 * Application-wide error class.
 *
 * Controllers/services throw AppError to signal a failure with an HTTP status
 * code and a safe, client-facing message. The central errorHandler middleware
 * converts these into JSON responses; anything else is treated as a 500.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_ERROR',
    isOperational = true,
    details?: unknown,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  // ---- Convenience factories -------------------------------------------

  static badRequest(message = 'Bad request', details?: unknown): AppError {
    return new AppError(message, 400, 'BAD_REQUEST', true, details);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 401, 'UNAUTHORIZED', true);
  }

  static forbidden(message = 'Forbidden'): AppError {
    return new AppError(message, 403, 'FORBIDDEN', true);
  }

  static notFound(message = 'Resource not found'): AppError {
    return new AppError(message, 404, 'NOT_FOUND', true);
  }

  static conflict(message = 'Resource already exists'): AppError {
    return new AppError(message, 409, 'CONFLICT', true);
  }

  static unprocessable(message = 'Unprocessable entity', details?: unknown): AppError {
    return new AppError(message, 422, 'UNPROCESSABLE_ENTITY', true, details);
  }

  static tooMany(message = 'Too many requests'): AppError {
    return new AppError(message, 429, 'TOO_MANY_REQUESTS', true);
  }

  static internal(message = 'Internal server error'): AppError {
    return new AppError(message, 500, 'INTERNAL_ERROR', false);
  }
}

export default AppError;
