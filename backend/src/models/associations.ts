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
};
