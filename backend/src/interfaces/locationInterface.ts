import { ITimestamps } from './commonInterface';

/** A geographic location (country → province → district → city hierarchy). */
export interface ILocation extends ITimestamps {
  id: string;
  country: string;
  province: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface ILocationCreation {
  country: string;
  province?: string | null;
  district?: string | null;
  city?: string | null;
  address?: string | null;
  postal_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export type ILocationUpdate = Partial<ILocationCreation>;

/** Filters accepted when searching locations. */
export interface ILocationSearchQuery {
  q?: string;
  country?: string;
  province?: string;
  district?: string;
  city?: string;
}
