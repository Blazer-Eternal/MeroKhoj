import { UserStatus, RoleName } from '../enums';
import { ITimestamps } from './commonInterface';

/** A platform account (authentication entity). */
export interface IUser extends ITimestamps {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: UserStatus;
  email_verified: boolean;
  last_login_at: Date | null;
}

/** Attributes required when creating a user (before defaults are applied). */
export interface IUserCreation {
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string | null;
  status?: UserStatus;
  email_verified?: boolean;
  last_login_at?: Date | null;
}

/** Safe projection of a user (never leaks password_hash). */
export interface IUserPublic {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: UserStatus;
  email_verified: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/** A role row. */
export interface IRole extends ITimestamps {
  id: string;
  name: RoleName;
  description: string | null;
}

/** A user ↔ role assignment. */
export interface IUserRole extends ITimestamps {
  id: string;
  user_id: string;
  role_id: string;
}
