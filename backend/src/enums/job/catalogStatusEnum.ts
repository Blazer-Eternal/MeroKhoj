/** Active/inactive lifecycle for reference/taxonomy entities. */
export enum CatalogStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export const CATALOG_STATUSES: CatalogStatus[] = Object.values(CatalogStatus);

/** Only ACTIVE taxonomy entries are selectable when creating/updating jobs. */
export const ACTIVE_CATALOG_STATUS: CatalogStatus = CatalogStatus.ACTIVE;
