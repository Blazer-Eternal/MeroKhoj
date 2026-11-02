/**
 * Shared cross-cutting types used by many modules.
 */

/** Standard ISO timestamp string returned by the API. */
export type Timestamp = Date;

/** Marker for rows that carry the standard Sequelize timestamps. */
export interface ITimestamps {
  created_at: Timestamp;
  updated_at: Timestamp;
}

/** UUID v4 string. */
export type Uuid = string;

/** Generic paginated envelope returned by list endpoints. */
export interface IPaginatedResult<T> {
  data: T[];
  meta: IPaginationMeta;
}

export interface IPaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/** Query parameters accepted by paginated list endpoints. */
export interface IPaginationQuery {
  page?: number;
  perPage?: number;
}

/** Ordering hint accepted by list endpoints. */
export interface ISortQuery {
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

/** Result shape produced by repository "create/find" helpers that wrap ORM calls. */
export interface IRepositoryResult<T> {
  success: boolean;
  data?: T;
  message?: string;
}
