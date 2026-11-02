import { Sequelize } from 'sequelize';

import { getSequelize } from '../config';

import { initUserModel, default as User } from './user/userModel';
import { initRoleModel, default as Role } from './administration/roleModel';
import { initUserRoleModel, default as UserRole } from './administration/userRoleModel';
import { initJobseekerProfileModel, default as JobseekerProfile } from './jobseeker/jobseekerProfileModel';
import { initCompanyModel, default as Company } from './company/companyModel';
import { initCompanyMemberModel, default as CompanyMember } from './company/companyMemberModel';
import { initJobModel, default as Job } from './job/jobModel';
import { initSkillModel, default as Skill } from './job/skillModel';
import { initJobSkillModel, default as JobSkill } from './job/jobSkillModel';
import { initApplicationModel, default as Application } from './application/applicationModel';
import {
  initApplicationStatusHistoryModel,
  default as ApplicationStatusHistory,
} from './application/applicationStatusHistoryModel';
import { initInterviewModel, default as Interview } from './interview/interviewModel';
import { initEducationModel, default as Education } from './jobseeker/educationModel';
import { initWorkExperienceModel, default as WorkExperience } from './jobseeker/workExperienceModel';
import { initResumeModel, default as Resume } from './jobseeker/resumeModel';
import { initJobCategoryModel, default as JobCategory } from './job/jobCategoryModel';
import { initIndustryModel, default as Industry } from './job/industryModel';
import { initLocationModel, default as Location } from './job/locationModel';
import { initCompanyVerificationModel, default as CompanyVerification } from './company/companyVerificationModel';
import { initJobModerationModel, default as JobModeration } from './administration/jobModerationModel';
import { initReportModel, default as Report } from './administration/reportModel';
import { initAuditLogModel, default as AuditLog } from './administration/auditLogModel';
import { initSavedJobModel, default as SavedJob } from './notification/savedJobModel';
import { initJobAlertModel, default as JobAlert } from './notification/jobAlertModel';
import { initNotificationModel, default as Notification } from './notification/notificationModel';
import { initTalentRosterModel, default as TalentRoster } from './talent/talentRosterModel';
import { initTalentRosterMemberModel, default as TalentRosterMember } from './talent/talentRosterMemberModel';
import { initJobQuestionModel, default as JobQuestion } from './job/jobQuestionModel';
import { initQuestionOptionModel, default as QuestionOption } from './job/questionOptionModel';
import { initApplicationAnswerModel, default as ApplicationAnswer } from './application/applicationAnswerModel';
import { initInterviewFeedbackModel, default as InterviewFeedback } from './interview/interviewFeedbackModel';
import { initHiringDecisionModel, default as HiringDecision } from './hiring/hiringDecisionModel';
import { initServicePlanModel, default as ServicePlan } from './payment/servicePlanModel';
import { initOrderModel, default as Order } from './payment/orderModel';
import { initPaymentModel, default as Payment } from './payment/paymentModel';
import { initInvoiceModel, default as Invoice } from './payment/invoiceModel';

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
  Education,
  WorkExperience,
  Resume,
  JobCategory,
  Industry,
  Location,
  CompanyVerification,
  JobModeration,
  Report,
  AuditLog,
  SavedJob,
  JobAlert,
  Notification,
  TalentRoster,
  TalentRosterMember,
  JobQuestion,
  QuestionOption,
  ApplicationAnswer,
  InterviewFeedback,
  HiringDecision,
  ServicePlan,
  Order,
  Payment,
  Invoice,
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
  Education: typeof Education;
  WorkExperience: typeof WorkExperience;
  Resume: typeof Resume;
  JobCategory: typeof JobCategory;
  Industry: typeof Industry;
  Location: typeof Location;
  CompanyVerification: typeof CompanyVerification;
  JobModeration: typeof JobModeration;
  Report: typeof Report;
  AuditLog: typeof AuditLog;
  SavedJob: typeof SavedJob;
  JobAlert: typeof JobAlert;
  Notification: typeof Notification;
  TalentRoster: typeof TalentRoster;
  TalentRosterMember: typeof TalentRosterMember;
  JobQuestion: typeof JobQuestion;
  QuestionOption: typeof QuestionOption;
  ApplicationAnswer: typeof ApplicationAnswer;
  InterviewFeedback: typeof InterviewFeedback;
  HiringDecision: typeof HiringDecision;
  ServicePlan: typeof ServicePlan;
  Order: typeof Order;
  Payment: typeof Payment;
  Invoice: typeof Invoice;
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
  initEducationModel(sequelize);
  initWorkExperienceModel(sequelize);
  initResumeModel(sequelize);
  initJobCategoryModel(sequelize);
  initIndustryModel(sequelize);
  initLocationModel(sequelize);
  initCompanyVerificationModel(sequelize);
  initJobModerationModel(sequelize);
  initReportModel(sequelize);
  initAuditLogModel(sequelize);
  initSavedJobModel(sequelize);
  initJobAlertModel(sequelize);
  initNotificationModel(sequelize);
  initTalentRosterModel(sequelize);
  initTalentRosterMemberModel(sequelize);
  initJobQuestionModel(sequelize);
  initQuestionOptionModel(sequelize);
  initApplicationAnswerModel(sequelize);
  initInterviewFeedbackModel(sequelize);
  initHiringDecisionModel(sequelize);
  // Billing models: ServicePlan must exist before Order references it.
  initServicePlanModel(sequelize);
  initOrderModel(sequelize);
  initPaymentModel(sequelize);
  initInvoiceModel(sequelize);

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
    Education,
    WorkExperience,
    Resume,
    JobCategory,
    Industry,
    Location,
    CompanyVerification,
    JobModeration,
    Report,
    AuditLog,
    SavedJob,
    JobAlert,
    Notification,
    TalentRoster,
    TalentRosterMember,
    JobQuestion,
    QuestionOption,
    ApplicationAnswer,
    InterviewFeedback,
    HiringDecision,
    ServicePlan,
    Order,
    Payment,
    Invoice,
  };
};

export default { initializeModels };
