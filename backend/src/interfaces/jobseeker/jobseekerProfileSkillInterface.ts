/** A skill attached to a jobseeker's profile (candidate-side skills). */
export interface IJobseekerProfileSkill {
  id: string;
  jobseeker_id: string;
  skill_id: string;
}

export interface IJobseekerProfileSkillCreation {
  jobseeker_id: string;
  skill_id: string;
}
