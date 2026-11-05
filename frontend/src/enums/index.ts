/**
 * Frontend enums — mirrors of the backend enums (backend/src/enums).
 * Keep values byte-identical: they travel over the API as strings.
 */

// ---- user ----------------------------------------------------------------
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  SUSPENDED = 'SUSPENDED',
  DEACTIVATED = 'DEACTIVATED',
}

export enum RoleName {
  JOBSEEKER = 'JOBSEEKER',
  RECRUITER = 'RECRUITER',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export const EMPLOYER_ROLES: RoleName[] = [RoleName.RECRUITER, RoleName.COMPANY_ADMIN];
export const ADMINISTRATIVE_ROLES: RoleName[] = [
  RoleName.MODERATOR,
  RoleName.ADMIN,
  RoleName.SUPER_ADMIN,
];

// ---- job -----------------------------------------------------------------
export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERNSHIP = 'INTERNSHIP',
  TEMPORARY = 'TEMPORARY',
  FREELANCE = 'FREELANCE',
}

export enum ExperienceLevel {
  ENTRY = 'ENTRY',
  MID = 'MID',
  SENIOR = 'SENIOR',
  LEAD = 'LEAD',
  EXECUTIVE = 'EXECUTIVE',
}

export enum JobStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  PAUSED = 'PAUSED',
  CLOSED = 'CLOSED',
  CANCELLED = 'CANCELLED',
}

export enum JobSkillImportance {
  REQUIRED = 'REQUIRED',
  PREFERRED = 'PREFERRED',
}

export enum QuestionType {
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
}

export enum SkillStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export enum CatalogStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

// ---- jobseeker -----------------------------------------------------------
export enum ProfileVisibility {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export enum Availability {
  IMMEDIATE = 'IMMEDIATE',
  NOTICE_PERIOD = 'NOTICE_PERIOD',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

// ---- company -------------------------------------------------------------
export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

export enum CompanyVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export enum CompanySize {
  SOLO = 'SOLO',
  SMALL = 'SMALL',
  MEDIUM = 'MEDIUM',
  LARGE = 'LARGE',
  ENTERPRISE = 'ENTERPRISE',
}

export enum CompanyRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  VIEWER = 'VIEWER',
}

export enum CompanyMemberStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REMOVED = 'REMOVED',
}

// ---- application ---------------------------------------------------------
export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  SHORTLISTED = 'SHORTLISTED',
  INTERVIEW = 'INTERVIEW',
  SELECTED = 'SELECTED',
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  WITHDRAWN = 'WITHDRAWN',
}

export enum ApplicationSource {
  DIRECT = 'DIRECT',
  SEARCH = 'SEARCH',
  RECOMMENDATION = 'RECOMMENDATION',
  REFERRAL = 'REFERRAL',
  JOB_ALERT = 'JOB_ALERT',
  TALENT_POOL = 'TALENT_POOL',
}

// ---- interview -----------------------------------------------------------
export enum InterviewStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  RESCHEDULED = 'RESCHEDULED',
  NO_SHOW = 'NO_SHOW',
}

export enum InterviewType {
  PHONE = 'PHONE',
  VIDEO = 'VIDEO',
  IN_PERSON = 'IN_PERSON',
  TECHNICAL = 'TECHNICAL',
  HR = 'HR',
  FINAL = 'FINAL',
}

// ---- hiring --------------------------------------------------------------
export enum HiringDecisionOutcome {
  HIRED = 'HIRED',
  REJECTED = 'REJECTED',
  ON_HOLD = 'ON_HOLD',
  SHORTLISTED = 'SHORTLISTED',
}

// ---- notification --------------------------------------------------------
export enum NotificationType {
  APPLICATION_STATUS = 'APPLICATION_STATUS',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_REMINDER = 'INTERVIEW_REMINDER',
  NEW_MESSAGE = 'NEW_MESSAGE',
  JOB_ALERT = 'JOB_ALERT',
  SAVED_JOB_CLOSED = 'SAVED_JOB_CLOSED',
  COMPANY_VERIFICATION = 'COMPANY_VERIFICATION',
  JOB_MODERATION = 'JOB_MODERATION',
  REPORT_UPDATE = 'REPORT_UPDATE',
  PAYMENT_UPDATE = 'PAYMENT_UPDATE',
  SYSTEM = 'SYSTEM',
}

export enum JobAlertFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  INSTANT = 'INSTANT',
}

// ---- payment -------------------------------------------------------------
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  ISSUED = 'ISSUED',
  PAID = 'PAID',
  VOID = 'VOID',
  OVERDUE = 'OVERDUE',
}

// ---- administration ------------------------------------------------------
export enum ModerationAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  FLAGGED = 'FLAGGED',
  REMOVED = 'REMOVED',
}

export enum ReportStatus {
  OPEN = 'OPEN',
  UNDER_REVIEW = 'UNDER_REVIEW',
  RESOLVED = 'RESOLVED',
  DISMISSED = 'DISMISSED',
}

export enum ReportEntityType {
  USER = 'USER',
  COMPANY = 'COMPANY',
  JOB = 'JOB',
}
