import { CatalogStatus } from '../enums';
import { ITimestamps } from './commonInterface';

/** An industry classification for companies and jobs. */
export interface IIndustry extends ITimestamps {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: CatalogStatus;
}

export interface IIndustryCreation {
  name: string;
  slug: string;
  description?: string | null;
  status?: CatalogStatus;
}

export type IIndustryUpdate = Partial<Omit<IIndustryCreation, 'slug'>>;
