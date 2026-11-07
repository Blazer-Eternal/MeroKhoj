/**
 * Shared API types — mirrors of the backend response envelope and entities.
 * Backend always answers `{ success, data }` (+ `meta` on paginated lists)
 * or `{ success: false, error: { code, message } }`.
 */
import type {
  ApplicationSource,
  ApplicationStatus,
  Availability,
  CompanyMemberStatus,
  CompanyRole,
  CompanySize,
  CompanyStatus,
  CompanyVerificationStatus,
  EmploymentType,
  ExperienceLevel,
  HiringDecisionOutcome,
  InterviewStatus,
  InterviewType,
  InvoiceStatus,
  JobAlertFrequency,
  JobSkillImportance,
  JobStatus,
  ModerationAction,
  NotificationType,
  OrderStatus,
  PaymentStatus,
  ProfileVisibility,
  ReportEntityType,
  ReportStatus,
  RoleName,
  UserStatus,
} from '@/enums';

// ---- envelope ------------------------------------------------------------
export interface ApiError {
  code: string;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: PaginationMeta;
  error?: ApiError;
}

export interface PaginationMeta {
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// ---- auth ----------------------------------------------------------------
export interface PublicUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: UserStatus;
  email_verified: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Mirrors backend token payload (`authServices` → `ITokens`). */
export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface AuthPayload {
  user: PublicUser;
  roles: RoleName[];
  tokens: AuthTokens;
}

export interface MePayload {
  user: PublicUser;
  roles: RoleName[];
}

// ---- taxonomy ------------------------------------------------------------
export interface JobCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parent_id: string | null;
  status: string;
}

export interface JobCategoryTreeNode extends JobCategory {
  children: JobCategoryTreeNode[];
}

export interface Industry {
  id: string;
  name: string;
  slug: string;
  status: string;
}

export interface Location {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  country: string | null;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  status: string;
}

// ---- job -----------------------------------------------------------------
export interface Job {
  id: string;
  company_id: string;
  created_by: string;
  title: string;
  slug: string;
  description: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  vacancies: number;
  education_requirement: string | null;
  experience_requirement: string | null;
  location: string | null;
  application_deadline: string | null;
  status: JobStatus;
  published_at: string | null;
  closed_at: string | null;
  category_id: string | null;
  industry_id: string | null;
  location_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobSkill {
  job_id: string;
  skill_id: string;
  importance: JobSkillImportance;
  years_required: number | null;
}

export interface JobSkillWithSkill extends JobSkill {
  skill?: Skill;
}

// ---- company -------------------------------------------------------------
export interface Company {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  industry: string | null;
  company_size: CompanySize | null;
  address: string | null;
  city: string | null;
  country: string;
  industry_id: string | null;
  verification_status: CompanyVerificationStatus;
  status: CompanyStatus;
  created_at: string;
  updated_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
  status: CompanyMemberStatus;
  joined_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyVerification {
  id: string;
  company_id: string;
  submitted_by: string | null;
  document_url: string | null;
  note: string | null;
  status: CompanyVerificationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
}

// ---- jobseeker profile ---------------------------------------------------
/** Mirrors backend IJobseekerProfile (1:1 with users, upserted via /users/me/profile). */
export interface JobseekerProfile {
  id: string;
  user_id: string;
  headline: string | null;
  professional_summary: string | null;
  date_of_birth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  profile_photo_url: string | null;
  expected_salary: number | null;
  availability: Availability | null;
  profile_visibility: ProfileVisibility;
  created_at: string;
  updated_at: string;
}

export interface Education {
  id: string;
  jobseeker_id: string;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  grade: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkExperience {
  id: string;
  jobseeker_id: string;
  company_name: string;
  job_title: string;
  employment_type: EmploymentType;
  location: string | null;
  start_date: string;
  end_date: string | null;
  is_current: boolean;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Resume {
  id: string;
  jobseeker_id: string;
  title: string;
  file_url: string;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

// ---- application ---------------------------------------------------------
export interface Application {
  id: string;
  job_id: string;
  jobseeker_id: string;
  resume_id: string | null;
  cover_letter: string | null;
  source: ApplicationSource;
  status: ApplicationStatus;
  applied_at: string | null;
  withdrawn_at: string | null;
  created_at: string;
  updated_at: string;
  job?: Job;
  jobseeker?: JobseekerProfile & { user?: PublicUser };
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

// ---- interview -----------------------------------------------------------
export interface Interview {
  id: string;
  application_id: string;
  scheduled_by: string | null;
  interview_type: InterviewType;
  scheduled_at: string;
  duration_minutes: number | null;
  location: string | null;
  meeting_url: string | null;
  status: InterviewStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  application?: Application;
}

export interface InterviewFeedback {
  id: string;
  interview_id: string;
  author_id: string | null;
  rating: number | null;
  comments: string | null;
  created_at: string;
  updated_at: string;
}

// ---- hiring & talent -----------------------------------------------------
export interface HiringDecision {
  id: string;
  application_id: string;
  decided_by: string | null;
  outcome: HiringDecisionOutcome;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentRoster {
  id: string;
  company_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalentRosterMember {
  roster_id: string;
  jobseeker_id: string;
  note: string | null;
  added_at: string | null;
}

// ---- notification --------------------------------------------------------
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SavedJob {
  id: string;
  jobseeker_id: string;
  job_id: string;
  created_at: string;
  updated_at: string;
  job?: Job;
}

/** Mirrors backend IJobAlert (owned by user, optional taxonomy filters). */
export interface JobAlert {
  id: string;
  user_id: string;
  name: string;
  keywords: string | null;
  location_id: string | null;
  category_id: string | null;
  employment_type: EmploymentType | null;
  frequency: JobAlertFrequency;
  is_active: boolean;
  last_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---- payment -------------------------------------------------------------
export interface ServicePlan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  duration_days: number;
  job_limit: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  company_id: string;
  plan_id: string;
  created_by: string | null;
  order_number: string;
  quantity: number;
  unit_price: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  plan?: ServicePlan;
}

export interface Payment {
  id: string;
  order_id: string;
  provider: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  transaction_reference: string | null;
  paid_at: string | null;
  refund_of: string | null;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  order_id: string;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  currency: string;
  status: InvoiceStatus;
  created_at: string;
  updated_at: string;
}

export interface PublishEntitlement {
  billing_required: boolean;
  used: number;
  allowance: number;
  remaining: number;
  unlimited: boolean;
  active_orders: number;
  next_expiry: string | null;
}

// ---- administration ------------------------------------------------------
export interface JobModeration {
  id: string;
  job_id: string;
  moderated_by: string | null;
  action: ModerationAction;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface Report {
  id: string;
  reporter_id: string | null;
  entity_type: ReportEntityType;
  entity_id: string;
  reason: string | null;
  details: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  resolution_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  updated_at: string;
}
