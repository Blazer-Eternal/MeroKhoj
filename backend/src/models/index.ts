import { Sequelize } from 'sequelize';

import { getSequelize } from '../config';

import { initUserModel, default as User } from './userModel';
import { initRoleModel, default as Role } from './roleModel';
import { initUserRoleModel, default as UserRole } from './userRoleModel';
import { initJobseekerProfileModel, default as JobseekerProfile } from './jobseekerProfileModel';
import { initCompanyModel, default as Company } from './companyModel';
import { initCompanyMemberModel, default as CompanyMember } from './companyMemberModel';
import { initJobModel, default as Job } from './jobModel';
import { initSkillModel, default as Skill } from './skillModel';
import { initJobSkillModel, default as JobSkill } from './jobSkillModel';
import { initApplicationModel, default as Application } from './applicationModel';
import {
  initApplicationStatusHistoryModel,
  default as ApplicationStatusHistory,
} from './applicationStatusHistoryModel';
import { initInterviewModel, default as Interview } from './interviewModel';

import { defineAssociations } from './associations';

export {
  User,
  Role,
  UserRole,
  JobseekerProfile,
  Company,
  CompanyMember,
  Job,
  Skill,
  JobSkill,
  Application,
  ApplicationStatusHistory,
  Interview,
};

/** A mapping of every model keyed by its Sequelize modelName. */
export interface DBModels {
  User: typeof User;
  Role: typeof Role;
  UserRole: typeof UserRole;
  JobseekerProfile: typeof JobseekerProfile;
  Company: typeof Company;
  CompanyMember: typeof CompanyMember;
  Job: typeof Job;
  Skill: typeof Skill;
  JobSkill: typeof JobSkill;
  Application: typeof Application;
  ApplicationStatusHistory: typeof ApplicationStatusHistory;
  Interview: typeof Interview;
}

/**
 * Initialize every model against a Sequelize instance and wire up all
 * associations. Call this once during bootstrap (server.ts / app.ts).
 */
export const initializeModels = (sequelize: Sequelize = getSequelize()): DBModels => {
  initUserModel(sequelize);
  initRoleModel(sequelize);
  initUserRoleModel(sequelize);
  initJobseekerProfileModel(sequelize);
  initCompanyModel(sequelize);
  initCompanyMemberModel(sequelize);
  initJobModel(sequelize);
  initSkillModel(sequelize);
  initJobSkillModel(sequelize);
  initApplicationModel(sequelize);
  initApplicationStatusHistoryModel(sequelize);
  initInterviewModel(sequelize);

  defineAssociations(sequelize);

  return {
    User,
    Role,
    UserRole,
    JobseekerProfile,
    Company,
    CompanyMember,
    Job,
    Skill,
    JobSkill,
    Application,
    ApplicationStatusHistory,
    Interview,
  };
};

export default { initializeModels };
