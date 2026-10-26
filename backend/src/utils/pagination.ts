import { env } from '../config';
import { IPaginationMeta, IPaginationQuery } from '../interfaces';
import { parsePositiveInt } from './parseId';

export interface IPaginationParams {
  page: number;
  perPage: number;
  offset: number;
  limit: number;
}

/**
 * Normalize incoming pagination query params into safe, bounded values.
 * `page` is 1-based; `offset`/`limit` are what Sequelize expects.
 */
export const getPaginationParams = (query: IPaginationQuery = {}): IPaginationParams => {
  const page = parsePositiveInt(query.page, 1, 1);
  const perPage = parsePositiveInt(
    query.perPage,
    env.pagination.defaultPageSize,
    1,
    env.pagination.maxPageSize,
  );
  return {
    page,
    perPage,
    offset: (page - 1) * perPage,
    limit: perPage,
  };
};

/** Build the standard pagination envelope returned by list endpoints. */
export const buildPaginationMeta = (
  total: number,
  page: number,
  perPage: number,
): IPaginationMeta => {
  const totalPages = perPage > 0 ? Math.ceil(total / perPage) : 0;
  return {
    total,
    page,
    perPage,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};
