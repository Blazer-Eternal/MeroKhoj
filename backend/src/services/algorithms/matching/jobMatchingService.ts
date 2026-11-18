import {
  IEducation,
  IJob,
  IJobSkill,
  IWorkExperience,
  IApplication,
} from '../../../interfaces';
import { EXPERIENCE_LEVEL_YEARS, JobSkillImportance } from '../../../enums';
import {
  educationRepository,
  jobRepository,
  jobSkillRepository,
  jobseekerProfileRepository,
  jobseekerProfileSkillRepository,
  workExperienceRepository,
} from '../../../repositories';

/**
 * Candidate ↔ job matching (Phase 1 algorithm).
 *
 * Produces a 0-100 "match score" plus a per-dimension breakdown so recruiters
 * can see WHY a candidate scored the way they did:
 *
 *   skills      40  weighted overlap with the job's REQUIRED/PREFERRED skills
 *   experience  20  years of experience vs the job's experience_level band
 *   location    15  profile city vs the job's location text
 *   salary      10  expected salary vs the job's salary_max
 *   education   5   degree level parsed from the job's education_requirement
 *   keywords    10  headline/summary terms appearing in the job title
 *               ---
 *               100
 *
 * Missing data never zeroes a dimension: it scores a neutral midpoint so an
 * incomplete profile is neither rewarded nor punished. Every helper here is
 * pure — the DB work lives in `loadCandidateSignals` / `scoreApplications`.
 */

export interface IMatchBreakdown {
  skills: number;
  experience: number;
  location: number;
  salary: number;
  education: number;
  keywords: number;
}

export interface IMatchResult {
  score: number;
  breakdown: IMatchBreakdown;
  matched_skills: string[];
  total_skills: number;
}

/** Everything the scorer needs about a candidate, pre-loaded in batch. */
export interface ICandidateSignals {
  user_id: string;
  profile_id: string;
  headline: string | null;
  summary: string | null;
  city: string | null;
  expected_salary: number | null;
  skill_ids: Set<string>;
  skill_names: string[];
  years_experience: number;
  education_level: number | null;
}

const DAY_MS = 86_400_000;
const DAYS_PER_YEAR = 365.25;

// ---------------------------------------------------------------------------
// Pure helpers (exported for tests)
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'these', 'those', 'your', 'you',
  'are', 'our', 'will', 'can', 'has', 'have', 'had', 'was', 'were', 'been',
  'from', 'into', 'their', 'they', 'them', 'who', 'what', 'when', 'where',
  'work', 'team', 'role', 'jobs', 'join', 'about', 'over', 'under', 'more',
  'most', 'some', 'such', 'than', 'then', 'also', 'able', 'must', 'per',
]);

/** Lowercase word tokens of length >= 4 that are not stopwords. */
export const keywords = (text: string | null | undefined): string[] => {
  if (!text) return [];
  return text
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word));
};

/**
 * Total years of work experience from profile entries.
 * Current roles count until today; overlapping stints are summed as-is
 * (demo data is non-overlapping, and double counting only inflates slightly).
 */
export const yearsOfExperience = (
  experiences: IWorkExperience[],
  now: Date = new Date(),
): number => {
  let days = 0;
  for (const entry of experiences) {
    const start = new Date(entry.start_date).getTime();
    if (Number.isNaN(start)) continue;
    const end = entry.end_date ? new Date(entry.end_date).getTime() : now.getTime();
    days += Math.max(0, end - start) / DAY_MS;
  }
  return Math.round((days / DAYS_PER_YEAR) * 10) / 10;
};

/**
 * Map a degree/requirement string onto an ordinal level so two sides can be
 * compared: 1 certificate, 2 diploma/+2, 3 bachelor/+4, 4 master, 5 doctorate.
 * Returns null when the text carries no recognisable level.
 */
export const parseEducationLevel = (text: string | null | undefined): number | null => {
  if (!text) return null;
  const value = text.toLowerCase();
  if (/ph\.?\s?d|doctorate|dphil/.test(value)) return 5;
  if (/master|mba|m\.?tech|m\.?sc|m\.?a\b|mphil/.test(value)) return 4;
  if (/bachelor|undergraduate|b\.?tech|b\.?sc|b\.?ba|b\.?e\b|bcs|\+\s?4/.test(value)) return 3;
  if (/diploma|intermediate|higher secondary|\+\s?2/.test(value)) return 2;
  if (/certificate|\+\s?10|slc|secondary school/.test(value)) return 1;
  return null;
};

/** Highest degree level held across a candidate's education entries. */
export const highestEducationLevel = (educations: IEducation[]): number | null => {
  let highest: number | null = null;
  for (const entry of educations) {
    const level = parseEducationLevel(entry.degree) ?? parseEducationLevel(entry.field_of_study);
    if (level !== null && (highest === null || level > highest)) highest = level;
  }
  return highest;
};

/** Normalised city comparison that tolerates "Kathmandu" vs "Kathmandu Valley". */
const sameCity = (a: string, b: string): boolean => {
  const left = a.trim().toLowerCase();
  const right = b.trim().toLowerCase();
  if (!left || !right) return false;
  if (left === right) return true;
  return (left.length >= 4 && right.includes(left)) || (right.length >= 4 && left.includes(right));
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

/**
 * Score one job against one candidate's signals. Pure: no I/O.
 * Returns the total, the per-dimension breakdown, and which job skills matched.
 */
export const calculateMatchScore = (
  job: IJob,
  jobSkills: Array<IJobSkill & { skill?: { name: string } }>,
  candidate: ICandidateSignals,
): IMatchResult => {
  // --- skills (40): REQUIRED weighs double PREFERRED.
  let weight = 0;
  let satisfied = 0;
  const matchedSkills: string[] = [];
  for (const jobSkill of jobSkills) {
    const weightForSkill = jobSkill.importance === JobSkillImportance.REQUIRED ? 2 : 1;
    weight += weightForSkill;
    if (candidate.skill_ids.has(jobSkill.skill_id)) {
      satisfied += weightForSkill;
      matchedSkills.push(jobSkill.skill?.name ?? jobSkill.skill_id);
    }
  }
  const skillsScore = weight === 0 ? 20 : Math.round((40 * satisfied) / weight);

  // --- experience (20): band sufficiency from EXPERIENCE_LEVEL_YEARS.
  const band = job.experience_level ? EXPERIENCE_LEVEL_YEARS[job.experience_level] : null;
  let experienceScore = 10;
  if (band) {
    if (band.min === 0) experienceScore = 20;
    else if (candidate.years_experience >= band.min && candidate.years_experience <= band.max) {
      experienceScore = 20;
    } else if (candidate.years_experience > band.max) {
      experienceScore = 16; // capable but overqualified for the band
    } else if (candidate.years_experience >= band.min - 1) {
      experienceScore = 12; // within a year of the floor
    } else {
      experienceScore = Math.max(4, Math.round((20 * candidate.years_experience) / band.min));
    }
  }

  // --- location (15): neutral when either side is missing.
  const jobCity = job.location ?? '';
  const profileCity = candidate.city ?? '';
  let locationScore = 7;
  if (jobCity.trim() && profileCity.trim()) {
    locationScore = sameCity(profileCity, jobCity) ? 15 : 0;
  }

  // --- salary (10): expected pay must fit inside the posted range.
  let salaryScore = 5;
  if (job.salary_max !== null && candidate.expected_salary !== null) {
    salaryScore = candidate.expected_salary <= job.salary_max ? 10 : 0;
  }

  // --- education (5): ordinal comparison of both sides.
  const jobLevel = parseEducationLevel(job.education_requirement);
  let educationScore = 3;
  if (jobLevel !== null && candidate.education_level !== null) {
    if (candidate.education_level >= jobLevel) educationScore = 5;
    else if (candidate.education_level === jobLevel - 1) educationScore = 3;
    else educationScore = 1;
  }

  // --- keywords (10): headline/summary terms appearing in the job title.
  const candidateWords = new Set([
    ...keywords(candidate.headline),
    ...keywords(candidate.summary),
  ]);
  const titleWords = new Set(keywords(job.title));
  let hits = 0;
  for (const word of candidateWords) {
    if (titleWords.has(word)) hits += 1;
  }
  const keywordScore = hits >= 2 ? 10 : hits === 1 ? 5 : 0;

  const breakdown: IMatchBreakdown = {
    skills: skillsScore,
    experience: experienceScore,
    location: locationScore,
    salary: salaryScore,
    education: educationScore,
    keywords: keywordScore,
  };

  const score = Math.max(
    0,
    Math.min(
      100,
      skillsScore + experienceScore + locationScore + salaryScore + educationScore + keywordScore,
    ),
  );

  return { score, breakdown, matched_skills: matchedSkills, total_skills: jobSkills.length };
};

// ---------------------------------------------------------------------------
// Batch loading (the only part that touches the database)
// ---------------------------------------------------------------------------

/**
 * Load matching signals for many candidates in a constant number of queries.
 * `userIds` are user ids (applications.jobseeker_id is a user id); the profile
 * rows are the join to `jobseeker_profiles`.
 */
export const loadCandidateSignals = async (
  userIds: string[],
): Promise<Map<string, ICandidateSignals>> => {
  const map = new Map<string, ICandidateSignals>();
  if (userIds.length === 0) return map;

  const profiles = await jobseekerProfileRepository.listByUserIds(userIds);
  if (profiles.size === 0) return map;

  const profileIds = [...profiles.values()].map((profile) => profile.id);

  const [skillMap, experiences, educations] = await Promise.all([
    jobseekerProfileSkillRepository.mapByUserIds(userIds),
    workExperienceRepository.listByJobseekerIds(profileIds),
    educationRepository.listByJobseekerIds(profileIds),
  ]);

  const experiencesByProfile = new Map<string, IWorkExperience[]>();
  for (const entry of experiences) {
    const list = experiencesByProfile.get(entry.jobseeker_id) ?? [];
    list.push(entry);
    experiencesByProfile.set(entry.jobseeker_id, list);
  }
  const educationsByProfile = new Map<string, IEducation[]>();
  for (const entry of educations) {
    const list = educationsByProfile.get(entry.jobseeker_id) ?? [];
    list.push(entry);
    educationsByProfile.set(entry.jobseeker_id, list);
  }

  for (const profile of profiles.values()) {
    const profileSkills = skillMap.get(profile.user_id) ?? [];
    map.set(profile.user_id, {
      user_id: profile.user_id,
      profile_id: profile.id,
      headline: profile.headline,
      summary: profile.professional_summary,
      city: profile.city,
      expected_salary: profile.expected_salary,
      skill_ids: new Set(profileSkills.map((skill) => skill.id)),
      skill_names: profileSkills.map((skill) => skill.name),
      years_experience: yearsOfExperience(experiencesByProfile.get(profile.id) ?? []),
      education_level: highestEducationLevel(educationsByProfile.get(profile.id) ?? []),
    });
  }
  return map;
};

/** A single candidate's signals (thin wrapper used by the alert matcher). */
export const loadSignalsForUser = async (
  userId: string,
): Promise<ICandidateSignals | null> => {
  const signals = await loadCandidateSignals([userId]);
  return signals.get(userId) ?? null;
};

export type ScoredApplication = IApplication & {
  match_score: number | null;
  match_breakdown: IMatchBreakdown | null;
};

/**
 * Attach `match_score` + `match_breakdown` to application rows (recruiter
 * pipeline). Jobs and candidates are batch-loaded, so N rows cost 4 queries.
 * Rows whose job or candidate profile is missing score null rather than 0 —
 * absence of data is not a bad fit.
 */
export const scoreApplications = async (
  applications: IApplication[],
): Promise<ScoredApplication[]> => {
  if (applications.length === 0) return [];

  const jobIds = [...new Set(applications.map((application) => application.job_id))];
  const userIds = [...new Set(applications.map((application) => application.jobseeker_id))];

  const [jobs, jobSkills, signals] = await Promise.all([
    jobRepository.findByIds(jobIds),
    jobSkillRepository.mapByJobIds(jobIds),
    loadCandidateSignals(userIds),
  ]);

  return applications.map((application) => {
    const job = jobs.get(application.job_id);
    const candidate = signals.get(application.jobseeker_id);
    if (!job || !candidate) {
      return { ...application, match_score: null, match_breakdown: null };
    }
    const result = calculateMatchScore(job, jobSkills.get(job.id) ?? [], candidate);
    return {
      ...application,
      match_score: result.score,
      match_breakdown: result.breakdown,
    };
  });
};

export const jobMatchingService = {
  keywords,
  yearsOfExperience,
  parseEducationLevel,
  highestEducationLevel,
  calculateMatchScore,
  loadCandidateSignals,
  loadSignalsForUser,
  scoreApplications,
};

export default jobMatchingService;
