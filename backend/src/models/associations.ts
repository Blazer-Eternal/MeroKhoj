import { Sequelize } from 'sequelize';

import User from './user/userModel';
import Role from './administration/roleModel';
import UserRole from './administration/userRoleModel';
import JobseekerProfile from './jobseeker/jobseekerProfileModel';
import Company from './company/companyModel';
import CompanyMember from './company/companyMemberModel';
import Job from './job/jobModel';
import Skill from './job/skillModel';
import JobSkill from './job/jobSkillModel';
import Application from './application/applicationModel';
import ApplicationStatusHistory from './application/applicationStatusHistoryModel';
import Interview from './interview/interviewModel';
import Education from './jobseeker/educationModel';
import WorkExperience from './jobseeker/workExperienceModel';
import Resume from './jobseeker/resumeModel';
import JobCategory from './job/jobCategoryModel';
import Industry from './job/industryModel';
import Location from './job/locationModel';
import CompanyVerification from './company/companyVerificationModel';
import JobModeration from './administration/jobModerationModel';
import Report from './administration/reportModel';
import AuditLog from './administration/auditLogModel';
import SavedJob from './notification/savedJobModel';
import JobAlert from './notification/jobAlertModel';
import Notification from './notification/notificationModel';
import TalentRoster from './talent/talentRosterModel';
import TalentRosterMember from './talent/talentRosterMemberModel';
import JobQuestion from './job/jobQuestionModel';
import QuestionOption from './job/questionOptionModel';
import ApplicationAnswer from './application/applicationAnswerModel';
import InterviewFeedback from './interview/interviewFeedbackModel';
import HiringDecision from './hiring/hiringDecisionModel';

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

  // ---- User ↔ SavedJob ↔ Job (bookmark) -------------------------------
  User.hasMany(SavedJob, { foreignKey: 'user_id', as: 'saved_jobs' });
  SavedJob.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  SavedJob.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });
  Job.hasMany(SavedJob, { foreignKey: 'job_id', as: 'saved_by_users' });

  // ---- User ↔ JobAlert (saved search) ---------------------------------
  User.hasMany(JobAlert, { foreignKey: 'user_id', as: 'job_alerts' });
  JobAlert.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
  JobAlert.belongsTo(JobCategory, { foreignKey: 'category_id', as: 'alert_category' });
  JobAlert.belongsTo(Location, { foreignKey: 'location_id', as: 'alert_location' });

  // ---- User ↔ Notification (in-app inbox) -----------------------------
  User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
  Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

  // ---- Company ↔ TalentRoster ↔ JobseekerProfile ----------------------
  Company.hasMany(TalentRoster, { foreignKey: 'company_id', as: 'talent_rosters' });
  TalentRoster.belongsTo(Company, { foreignKey: 'company_id', as: 'company' });
  TalentRoster.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
  User.hasMany(TalentRoster, { foreignKey: 'created_by', as: 'created_rosters' });

  TalentRoster.hasMany(TalentRosterMember, { foreignKey: 'roster_id', as: 'members' });
  TalentRosterMember.belongsTo(TalentRoster, { foreignKey: 'roster_id', as: 'roster' });
  TalentRosterMember.belongsTo(JobseekerProfile, {
    foreignKey: 'jobseeker_id',
    as: 'jobseeker_profile',
  });
  TalentRosterMember.belongsTo(User, { foreignKey: 'added_by', as: 'adder' });
  User.hasMany(TalentRosterMember, { foreignKey: 'added_by', as: 'added_roster_members' });
  // Reverse lookup: which rosters is this jobseeker on?
  JobseekerProfile.hasMany(TalentRosterMember, {
    foreignKey: 'jobseeker_id',
    as: 'roster_memberships',
  });

  // ---- Job ↔ JobQuestion ↔ QuestionOption (screening form) ------------
  Job.hasMany(JobQuestion, { foreignKey: 'job_id', as: 'questions' });
  JobQuestion.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

  JobQuestion.hasMany(QuestionOption, {
    foreignKey: 'question_id',
    as: 'options',
    onDelete: 'CASCADE',
  });
  QuestionOption.belongsTo(JobQuestion, { foreignKey: 'question_id', as: 'question' });

  // ---- Application ↔ ApplicationAnswer --------------------------------
  Application.hasMany(ApplicationAnswer, {
    foreignKey: 'application_id',
    as: 'answers',
  });
  ApplicationAnswer.belongsTo(Application, {
    foreignKey: 'application_id',
    as: 'application',
  });
  ApplicationAnswer.belongsTo(JobQuestion, { foreignKey: 'question_id', as: 'question' });
  ApplicationAnswer.belongsTo(QuestionOption, {
    foreignKey: 'selected_option_id',
    as: 'selected_option',
  });

  // ---- Interview ↔ InterviewFeedback ----------------------------------
  Interview.hasMany(InterviewFeedback, {
    foreignKey: 'interview_id',
    as: 'feedback',
  });
  InterviewFeedback.belongsTo(Interview, { foreignKey: 'interview_id', as: 'interview' });
  InterviewFeedback.belongsTo(User, { foreignKey: 'reviewer_id', as: 'reviewer' });
  User.hasMany(InterviewFeedback, { foreignKey: 'reviewer_id', as: 'given_feedback' });

  // ---- Application ↔ HiringDecision (1:1) ------------------------------
  Application.hasOne(HiringDecision, {
    foreignKey: 'application_id',
    as: 'hiring_decision',
  });
  HiringDecision.belongsTo(Application, {
    foreignKey: 'application_id',
    as: 'application',
  });
  HiringDecision.belongsTo(User, { foreignKey: 'decided_by', as: 'decider' });
  User.hasMany(HiringDecision, { foreignKey: 'decided_by', as: 'decided_hires' });
};
