import { Sequelize } from 'sequelize';

import User from './userModel';
import Role from './roleModel';
import UserRole from './userRoleModel';
import JobseekerProfile from './jobseekerProfileModel';
import Company from './companyModel';
import CompanyMember from './companyMemberModel';
import Job from './jobModel';
import Skill from './skillModel';
import JobSkill from './jobSkillModel';
import Application from './applicationModel';
import ApplicationStatusHistory from './applicationStatusHistoryModel';
import Interview from './interviewModel';
import Education from './educationModel';
import WorkExperience from './workExperienceModel';
import Resume from './resumeModel';
import JobCategory from './jobCategoryModel';
import Industry from './industryModel';
import Location from './locationModel';
import CompanyVerification from './companyVerificationModel';
import JobModeration from './jobModerationModel';
import Report from './reportModel';
import AuditLog from './auditLogModel';

/**
 * Central place where every model relationship is declared.
 *
 * Convention: association aliases are plural for collections and singular for
 * single targets (e.g. `user.jobseeker_profile` vs `user.applications`).
 */
export const defineAssociations = (sequelize: Sequelize): void => {
  // Ensure every model is registered on this instance before we reference
  // other tables by name.
  void sequelize;

  // ---- Users ↔ Roles (many-to-many) -----------------------------------
  User.belongsToMany(Role, {
    through: UserRole,
    foreignKey: 'user_id',
    otherKey: 'role_id',
    as: 'roles',
  });
  Role.belongsToMany(User, {
    through: UserRole,
    foreignKey: 'role_id',
    otherKey: 'user_id',
    as: 'users',
  });

  UserRole.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  UserRole.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
  User.hasMany(UserRole, { foreignKey: 'user_id', as: 'userRoles' });

  // ---- User ↔ JobseekerProfile (1:1) ----------------------------------
  User.hasOne(JobseekerProfile, { foreignKey: 'user_id', as: 'jobseeker_profile' });
  JobseekerProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ---- User ↔ CompanyMember ↔ Company ---------------------------------
  User.hasMany(CompanyMember, { foreignKey: 'user_id', as: 'company_memberships' });
  CompanyMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  CompanyMember.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });

  Company.hasMany(CompanyMember, { foreignKey: 'company_id', as: 'members' });
  // The owner is just the member with role OWNER.
  Company.hasOne(CompanyMember, {
    foreignKey: 'company_id',
    as: 'owner',
    scope: { role: 'OWNER' },
  });

  // ---- Company ↔ Job (1:N) --------------------------------------------
  Company.hasMany(Job, { foreignKey: 'company_id', as: 'jobs' });
  Job.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  Job.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  User.hasMany(Job, { foreignKey: 'created_by', as: 'created_jobs' });

  // ---- Job ↔ Skill (many-to-many via job_skills) -----------------------
  Job.belongsToMany(Skill, {
    through: JobSkill,
    foreignKey: 'job_id',
    otherKey: 'skill_id',
    as: 'skills',
  });
  Skill.belongsToMany(Job, {
    through: JobSkill,
    foreignKey: 'skill_id',
    otherKey: 'job_id',
    as: 'jobs',
  });

  JobSkill.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });
  JobSkill.belongsTo(Skill, { foreignKey: 'skill_id', as: 'skill' });
  Job.hasMany(JobSkill, { foreignKey: 'job_id', as: 'jobSkills' });

  // ---- Job ↔ Application (1:N) ----------------------------------------
  Job.hasMany(Application, { foreignKey: 'job_id', as: 'applications' });
  Application.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

  // ---- User (jobseeker) ↔ Application (1:N) ---------------------------
  User.hasMany(Application, { foreignKey: 'jobseeker_id', as: 'applications' });
  Application.belongsTo(User, { foreignKey: 'jobseeker_id', as: 'jobseeker' });

  // ---- Application ↔ StatusHistory (1:N, append-only) -----------------
  Application.hasMany(ApplicationStatusHistory, {
    foreignKey: 'application_id',
    as: 'status_history',
  });
  ApplicationStatusHistory.belongsTo(Application, {
    foreignKey: 'application_id',
    as: 'application',
  });
  ApplicationStatusHistory.belongsTo(User, { foreignKey: 'changed_by', as: 'changer' });
  User.hasMany(ApplicationStatusHistory, { foreignKey: 'changed_by', as: 'status_changes' });

  // ---- Application ↔ Interview (1:N) ----------------------------------
  Application.hasMany(Interview, { foreignKey: 'application_id', as: 'interviews' });
  Interview.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });
  Interview.belongsTo(User, { foreignKey: 'scheduled_by', as: 'scheduler' });
  User.hasMany(Interview, { foreignKey: 'scheduled_by', as: 'scheduled_interviews' });

  // ---- JobseekerProfile ↔ Education / WorkExperience / Resume (1:N) ---
  JobseekerProfile.hasMany(Education, { foreignKey: 'jobseeker_id', as: 'educations' });
  Education.belongsTo(JobseekerProfile, { foreignKey: 'jobseeker_id', as: 'jobseeker_profile' });

  JobseekerProfile.hasMany(WorkExperience, { foreignKey: 'jobseeker_id', as: 'work_experiences' });
  WorkExperience.belongsTo(JobseekerProfile, {
    foreignKey: 'jobseeker_id',
    as: 'jobseeker_profile',
  });

  JobseekerProfile.hasMany(Resume, { foreignKey: 'jobseeker_id', as: 'resumes' });
  Resume.belongsTo(JobseekerProfile, { foreignKey: 'jobseeker_id', as: 'jobseeker_profile' });

  // ---- JobCategory (self-referential hierarchy) -----------------------
  JobCategory.belongsTo(JobCategory, { foreignKey: 'parent_id', as: 'parent' });
  JobCategory.hasMany(JobCategory, { foreignKey: 'parent_id', as: 'children' });

  // ---- Job ↔ Category / Industry / Location ---------------------------
  Job.belongsTo(JobCategory, { foreignKey: 'category_id', as: 'category' });
  JobCategory.hasMany(Job, { foreignKey: 'category_id', as: 'jobs' });

  Job.belongsTo(Industry, { foreignKey: 'industry_id', as: 'industry' });
  Industry.hasMany(Job, { foreignKey: 'industry_id', as: 'jobs' });

  Job.belongsTo(Location, { foreignKey: 'location_id', as: 'job_location' });
  Location.hasMany(Job, { foreignKey: 'location_id', as: 'jobs' });

  // ---- Company ↔ Industry ---------------------------------------------
  // NOTE: alias is `company_industry` because Company already has a legacy
  // `industry` string column that would collide with an `industry` alias.
  Company.belongsTo(Industry, { foreignKey: 'industry_id', as: 'company_industry' });
  Industry.hasMany(Company, { foreignKey: 'industry_id', as: 'companies' });

  // ---- Company ↔ CompanyVerification (1:N, append-only history) --------
  Company.hasMany(CompanyVerification, { foreignKey: 'company_id', as: 'verifications' });
  CompanyVerification.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  CompanyVerification.belongsTo(User, { foreignKey: 'submitted_by', as: 'submitter' });
  CompanyVerification.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
  User.hasMany(CompanyVerification, { foreignKey: 'submitted_by', as: 'submitted_verifications' });
  User.hasMany(CompanyVerification, { foreignKey: 'reviewed_by', as: 'reviewed_verifications' });

  // ---- Job ↔ JobModeration (1:N, append-only) -------------------------
  Job.hasMany(JobModeration, { foreignKey: 'job_id', as: 'moderations' });
  JobModeration.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });
  JobModeration.belongsTo(User, { foreignKey: 'reviewed_by', as: 'reviewer' });
  User.hasMany(JobModeration, { foreignKey: 'reviewed_by', as: 'moderated_jobs' });

  // ---- Report (polymorphic target, reported_by/resolved_by users) ------
  Report.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });
  Report.belongsTo(User, { foreignKey: 'resolved_by', as: 'resolver' });
  User.hasMany(Report, { foreignKey: 'reported_by', as: 'filed_reports' });
  User.hasMany(Report, { foreignKey: 'resolved_by', as: 'resolved_reports' });

  // ---- AuditLog (user nullable for system actions) ---------------------
  AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  User.hasMany(AuditLog, { foreignKey: 'user_id', as: 'audit_logs' });
};
