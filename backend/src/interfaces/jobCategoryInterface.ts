import { CatalogStatus } from '../enums';
import { ITimestamps } from './commonInterface';

/** A job category (optionally nested under a parent category). */
export interface IJobCategory extends ITimestamps {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  status: CatalogStatus;
}

export interface IJobCategoryCreation {
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string | null;
  status?: CatalogStatus;
}

export type IJobCategoryUpdate = Partial<Omit<IJobCategoryCreation, 'slug'>>;

/** Category with its direct children (used by the tree endpoint). */
export interface IJobCategoryTreeNode extends IJobCategory {
  children: IJobCategoryTreeNode[];
}
