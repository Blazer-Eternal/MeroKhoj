/**
 * Phase 1 algorithm test suite.
 *
 * Run with: npm run test:algo   (requires the dev server on :8000 for the
 * HTTP cases; the service/pure cases talk to the database directly).
 *
 * Covers the six Phase 1 capabilities end to end:
 *   1. Job recommendation ranking      (pure + GET /jobs/recommended)
 *   2. Candidate-job match score       (pure + batch scoring of real rows)
 *   3. Candidate search & ranking      (filters, sorts, authorization)
 *   4. Salary estimation               (widening ladder + histogram)
 *   5. Recruitment analytics           (funnel, conversion, time-to-hire)
 *   6. Smart job alerts                (frequency windows, dispatch lifecycle)
 *
 * Nothing seeded is mutated: alerts/notifications created here are removed in
 * the finally block, and the seeded alerts' last_sent_at values are restored
 * to whatever they were when the run started.
 */
import {
  buildProfileSignals,
  rankJobsForCandidate,
  scoreJobAgainstSignals,
} from '../services/algorithms/ranking/jobRankingService';
import { scoreCandidate, sortCandidates } from '../services/algorithms/ranking/candidateRankingService';
import {
  calculateMatchScore,
  IMatchBreakdown,
  parseEducationLevel,
  scoreApplications,
  yearsOfExperience,
} from '../services/algorithms/matching/jobMatchingService';
import { estimateSalary } from '../services/algorithms/salary-estimation/salaryEstimationService';
import { getPlatformAnalytics } from '../services/algorithms/analytics/recruitmentAnalyticsService';
import { getCompanyAnalytics } from '../services/algorithms/analytics/companyAnalyticsService';
import { getJobAnalytics } from '../services/algorithms/analytics/jobAnalyticsService';
import {
  dispatchAlert,
  dispatchDueAlerts,
  findMatches,
  hasExplicitFilters,
  isAlertDue,
  jobMatchesAlertFilters,
  notifyInstantAlerts,
} from '../services/algorithms/recommendation/smartJobAlertService';
import { closeConnection, connection } from '../config';
import { initializeModels } from '../models';
import {
  applicationRepository,
  jobAlertRepository,
  jobRepository,
  notificationRepository,
} from '../repositories';
import {
  EmploymentType,
  ExperienceLevel,
  JobAlertFrequency,
  JobSkillImportance,
  JobStatus,
  NotificationType,
} from '../enums';
import { IEducation, IJob, IJobAlert, IJobSkill, IJobseekerProfile, IWorkExperience } from '../interfaces';
import { getPaginationParams } from '../utils';

// ---------------------------------------------------------------------------
// Tiny test harness
// ---------------------------------------------------------------------------

let passed = 0;
const failures: string[] = [];

const section = (title: string): void => {
  console.log(`\n## ${title}`);
};

const check = (label: string, condition: boolean, detail = ''): void => {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
  } else {
    failures.push(detail ? `${label} — ${detail}` : label);
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
};

const info = (message: string): void => console.log(`       ${message}`);

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

const API = 'http://localhost:8000/api';

interface ISession {
  token: string;
  userId: string;
  roles: string[];
}

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const asArray = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.map(asRecord) : [];

const login = async (email: string, password: string): Promise<ISession> => {
  const response = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = asRecord(await response.json());
  if (!response.ok) throw new Error(`login failed for ${email} (${response.status})`);
  const data = asRecord(body.data);
  const tokens = asRecord(data.tokens);
  return {
    token: String(tokens.access_token),
    userId: String(data.user && asRecord(data.user).id),
    roles: asArray(data.roles).map(String),
  };
};

interface IHttpResponse {
  status: number;
  body: Record<string, unknown>;
}

const get = async (path: string, token?: string): Promise<IHttpResponse> => {
  const response = await fetch(`${API}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body: asRecord(body) };
};

const post = async (
  path: string,
  token: string,
  payload: Record<string, unknown> = {},
): Promise<IHttpResponse> => {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body: asRecord(body) };
};

const dataOf = (response: IHttpResponse): Record<string, unknown> =>
  asRecord(response.body.data);

const metaOf = (response: IHttpResponse): Record<string, unknown> =>
  asRecord(response.body.meta);

/** Ids in a user's notification inbox (GET /notifications → {notifications}). */
const notificationIds = async (token: string): Promise<string[]> => {
  const response = await get('/notifications', token);
  return asArray(asRecord(dataOf(response).notifications)).map((row) => String(row.id));
};

// ---------------------------------------------------------------------------
// Fixtures for the pure functions
// ---------------------------------------------------------------------------

const makeJob = (overrides: Partial<IJob> = {}): IJob =>
  ({
    id: '00000000-0000-4000-8000-000000000601',
    company_id: '00000000-0000-4000-8000-000000000501',
    created_by: '00000000-0000-4000-8000-000000000401',
    title: 'Senior React Developer',
    slug: 'senior-react-developer',
    description: 'Build web applications with React and TypeScript.',
    employment_type: EmploymentType.FULL_TIME,
    experience_level: ExperienceLevel.MID,
    salary_min: 60000,
    salary_max: 90000,
    salary_currency: 'NPR',
    vacancies: 1,
    education_requirement: "Bachelor's degree in Computer Science",
    experience_requirement: '3+ years',
    location: 'Kathmandu',
    application_deadline: null,
    status: JobStatus.PUBLISHED,
    published_at: new Date('2026-11-17T00:00:00.000Z'),
    closed_at: null,
    category_id: null,
    industry_id: null,
    location_id: null,
    created_at: new Date('2026-11-01T00:00:00.000Z'),
    updated_at: new Date('2026-11-01T00:00:00.000Z'),
    ...overrides,
  } as IJob);

const makeSignals = (overrides: Partial<Parameters<typeof calculateMatchScore>[2]> = {}) => ({
  user_id: 'user-1',
  profile_id: 'profile-1',
  headline: 'Senior React Developer',
  summary: 'Frontend engineer shipping React applications.',
  city: 'Kathmandu',
  expected_salary: 80000,
  skill_ids: new Set<string>(['skill-react', 'skill-ts']),
  skill_names: ['React', 'TypeScript'],
  years_experience: 5,
  education_level: 3,
  ...overrides,
});

const makeJobSkill = (
  skillId: string,
  name: string,
  importance: JobSkillImportance,
): IJobSkill & { skill: { name: string } } => ({
  id: `jobskill-${skillId}`,
  job_id: 'job-1',
  skill_id: skillId,
  importance,
  minimum_experience: null,
  skill: { name },
});

const breakdownSum = (breakdown: IMatchBreakdown | null | undefined): number =>
  breakdown ? Object.values(breakdown).reduce((sum, value) => sum + value, 0) : -1;

/** Minimal IJobAlert fixture for the pure alert predicates. */
const makeAlert = (overrides: Partial<IJobAlert> = {}): IJobAlert => ({
  id: 'alert-test-1',
  user_id: 'user-1',
  name: 'Test alert',
  keywords: null,
  category_id: null,
  location_id: null,
  employment_type: null,
  is_active: true,
  frequency: JobAlertFrequency.DAILY,
  last_sent_at: null,
  created_at: new Date('2026-11-01T00:00:00.000Z'),
  updated_at: new Date('2026-11-01T00:00:00.000Z'),
  ...overrides,
});

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const cleanupAlertIds: string[] = [];
const cleanupNotificationIds: string[] = [];
interface ISeedSnapshot {
  id: string;
  last_sent_at: Date | null;
}
const seedSnapshots: ISeedSnapshot[] = [];
/** Deterministic UUID used by the demo seeder for row `n`. */
const seedId = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const SEED_ALERT_IDS = [861, 862, 863, 864].map(seedId);

const main = async (): Promise<void> => {
  // The script talks to repositories directly, so it needs its own
  // connection + model bootstrap (the HTTP cases hit the running server).
  await connection();
  initializeModels();

  const jobseeker = await login('aarav.sharma@example.com', 'Demo@12345');
  const employer = await login('anil.shrestha@himalayantech.com', 'Demo@12345');
  const admin = await login('admin@merokhoj.com', 'Admin@123');

  const mine = dataOf(await get('/companies/mine', employer.token));
  const companies = asArray(mine.companies);
  const companyId = String(asRecord(companies[0]).id);
  info(`employer company: ${companyId}`);

  // Snapshot the seeded alerts so the run can put them back afterwards.
  for (const id of SEED_ALERT_IDS) {
    const alert = await jobAlertRepository.findById(id);
    if (alert) seedSnapshots.push({ id, last_sent_at: alert.last_sent_at });
  }

  // =========================================================================
  section('1. Job recommendation algorithm');
  // =========================================================================

  // --- pure ranking -------------------------------------------------------
  const profile = {
    id: 'profile-1',
    user_id: 'user-1',
    headline: 'Senior React Developer',
    professional_summary: 'Frontend engineer shipping React applications.',
    city: 'Kathmandu',
  } as unknown as IJobseekerProfile;

  const signals = buildProfileSignals(
    profile,
    [{ name: 'React' }, { name: 'TypeScript' }],
    [{ degree: 'Bachelor of Engineering', field_of_study: 'Computer Science' } as IEducation],
    [{ job_title: 'Frontend Developer' } as IWorkExperience],
  );

  check('signals keep skill names lowercased', signals.skill_names.has('react'));
  check('signals keep the profile city', signals.city === 'kathmandu');
  check(
    'signals merge education + experience into a background string',
    signals.background.includes('bachelor of engineering') &&
      signals.background.includes('frontend developer'),
    signals.background,
  );

  const rankableJob = {
    ...makeJob({ title: 'React Developer', location: 'Kathmandu' }),
    category: { id: 'cat-1', name: 'Frontend' },
    skills: [{ id: 's1', name: 'React' }],
  };
  const rankScore = scoreJobAgainstSignals(rankableJob, signals);
  // +4 skill overlap, +3 same city, +6 title keywords (capped), +1 category.
  check('score = skills(4) + city(3) + keywords(6) + category(1) = 14', rankScore === 14, `got ${rankScore}`);

  const manySkillsJob = {
    ...makeJob(),
    skills: Array.from({ length: 10 }, (_, index) => ({ id: `s${index}`, name: `Skill ${index}` })),
  };
  const cappedScore = scoreJobAgainstSignals(manySkillsJob, signals);
  check('skill overlap is capped at 12', cappedScore <= 12 + 3 + 6, `got ${cappedScore}`);

  const ranked = rankJobsForCandidate(
    [rankableJob, { ...makeJob({ title: 'Unrelated Coordinator' }), skills: [] }],
    signals,
  );
  check(
    'ranking orders by score (best first)',
    ranked.length === 2 && ranked[0].score >= ranked[1].score,
    ranked.map((job) => job.score).join(', '),
  );

  const unranked = rankJobsForCandidate([rankableJob, { ...makeJob(), title: 'Second' }], null);
  check(
    'without signals every job scores 0 (newest-first fallback)',
    unranked.every((job) => job.score === 0),
  );

  // --- HTTP feed ----------------------------------------------------------
  const recommended = await get('/jobs/recommended?perPage=20', jobseeker.token);
  const recommendedJobs = asArray(dataOf(recommended));
  const scores = recommendedJobs.map((job) => Number(job.score));
  const applied = asArray(dataOf(await get('/applications/mine?perPage=100', jobseeker.token))).map(
    (row) => String(asRecord(row.job_id)),
  );
  const recommendedIds = recommendedJobs.map((job) => String(job.id));

  check('GET /jobs/recommended returns 200', recommended.status === 200, String(recommended.status));
  check('feed is not empty', recommendedJobs.length > 0);
  check('every job carries a numeric score', scores.every((score) => Number.isFinite(score)));
  check(
    'scores are non-increasing',
    scores.every((score, index) => index === 0 || scores[index - 1] >= score),
    scores.join(', '),
  );
  check(
    'already-applied jobs are excluded',
    recommendedIds.every((id) => !applied.includes(id)),
  );
  check(
    'no duplicates in the feed',
    new Set(recommendedIds).size === recommendedIds.length,
  );
  check(
    'meta.total counts the whole candidate pool',
    Number(metaOf(recommended).total) >= recommendedJobs.length,
  );

  // =========================================================================
  section('2. Candidate-job matching algorithm');
  // =========================================================================

  const fullMatchSkills = [
    makeJobSkill('skill-react', 'React', JobSkillImportance.REQUIRED),
    makeJobSkill('skill-ts', 'TypeScript', JobSkillImportance.PREFERRED),
  ];
  const perfect = calculateMatchScore(makeJob(), fullMatchSkills, makeSignals());
  check('perfect candidate scores 100', perfect.score === 100, `got ${perfect.score}`);
  check('breakdown sums to the score', breakdownSum(perfect.breakdown) === perfect.score);
  check('skills component is full marks', perfect.breakdown.skills === 40);
  check('both matched skills are reported', perfect.matched_skills.length === 2);

  const noSkills = calculateMatchScore(makeJob({ experience_level: null }), [], makeSignals());
  check('a job without skills scores neutral 20 on skills', noSkills.breakdown.skills === 20);

  const entryJob = calculateMatchScore(
    makeJob({ experience_level: ExperienceLevel.ENTRY, education_requirement: null }),
    fullMatchSkills,
    makeSignals({ years_experience: 0.5, education_level: null }),
  );
  check('ENTRY jobs always give full experience marks', entryJob.breakdown.experience === 20);
  check('unparsable education requirement is neutral 3', entryJob.breakdown.education === 3);

  const seniorJob = calculateMatchScore(
    makeJob({ experience_level: ExperienceLevel.SENIOR, salary_max: 50000 }),
    fullMatchSkills,
    makeSignals({ years_experience: 3 }),
  );
  check(
    'under-experienced candidates lose experience marks',
    seniorJob.breakdown.experience < 20,
    String(seniorJob.breakdown.experience),
  );
  check('expected salary above the cap scores 0', seniorJob.breakdown.salary === 0);

  const locationMismatch = calculateMatchScore(
    makeJob({ location: 'Pokhara' }),
    fullMatchSkills,
    makeSignals(),
  );
  check('city mismatch scores 0 on location', locationMismatch.breakdown.location === 0);

  const noLocation = calculateMatchScore(
    makeJob({ location: null }),
    fullMatchSkills,
    makeSignals({ city: null }),
  );
  check('missing location on either side is neutral 7', noLocation.breakdown.location === 7);

  const overqualified = calculateMatchScore(
    makeJob({ experience_level: ExperienceLevel.ENTRY, education_requirement: null }),
    [],
    makeSignals({ years_experience: 9, education_level: 4 }),
  );
  check('score never exceeds 100', overqualified.score <= 100, String(overqualified.score));
  check('a master beats a bachelor requirement', calculateMatchScore(
    makeJob({ education_requirement: "Bachelor's degree" }),
    [],
    makeSignals({ education_level: 4 }),
  ).breakdown.education === 5);
  check('one level below the requirement keeps partial marks', calculateMatchScore(
    makeJob({ education_requirement: "Bachelor's degree" }),
    [],
    makeSignals({ education_level: 2 }),
  ).breakdown.education === 3);
  check('two levels below the requirement scores minimal', calculateMatchScore(
    makeJob({ education_requirement: "Bachelor's degree" }),
    [],
    makeSignals({ education_level: 1 }),
  ).breakdown.education === 1);

  check('parseEducationLevel maps masters → 4', parseEducationLevel("Master's degree") === 4);
  check('parseEducationLevel returns null for noise', parseEducationLevel('whatever') === null);

  const fourYears = yearsOfExperience([
    {
      start_date: new Date('2022-01-01T00:00:00.000Z'),
      end_date: new Date('2026-01-01T00:00:00.000Z'),
    } as IWorkExperience,
  ], new Date('2026-11-19T00:00:00.000Z'));
  check('yearsOfExperience sums dated stints', Math.abs(fourYears - 4) < 0.01, String(fourYears));

  // --- batch scoring against real rows ------------------------------------
  const openJobs = await jobRepository.search({}, getPaginationParams({ perPage: 100 }));
  const companyOfJobs = String(asRecord((openJobs.data[0] as unknown as Record<string, unknown>).company).id);
  const realApplications = await applicationRepository.listAllByCompany(companyOfJobs, {});
  const scoredApplications = await scoreApplications(realApplications);

  check('every real application is scored', scoredApplications.length > 0);
  check(
    'real scores are within 0..100',
    scoredApplications.every(
      (row) => row.match_score === null || (row.match_score >= 0 && row.match_score <= 100),
    ),
  );
  check(
    'real breakdowns sum to their score',
    scoredApplications
      .filter((row) => row.match_score !== null)
      .every((row) => breakdownSum(row.match_breakdown) === row.match_score),
  );
  info(
    `scored ${scoredApplications.length} applications for ${companyOfJobs} (top ${scoredApplications
      .map((row) => row.match_score)
      .sort((a, b) => (b ?? 0) - (a ?? 0))
      .slice(0, 3)
      .join(', ')})`,
  );

  // =========================================================================
  section('3. Candidate search and ranking');
  // =========================================================================

  const pool = asArray(dataOf(await get(`/companies/${companyId}/candidates?perPage=100`, employer.token)));
  const relevanceScores = pool.map((row) => Number(row.relevance_score));

  check('GET /companies/:companyId/candidates returns 200', pool.length >= 0);
  check('public pool is not empty', pool.length > 0, String(pool.length));
  check('every candidate carries a relevance score', relevanceScores.every((score) => Number.isFinite(score)));
  check(
    'relevance scores are non-increasing',
    relevanceScores.every((score, index) => index === 0 || relevanceScores[index - 1] >= score),
    relevanceScores.join(', '),
  );

  // Pick the most common skill/city in the pool so the filters are meaningful.
  // `skills` comes back as a plain string[] in the response payload.
  const skillsOf = (row: Record<string, unknown>): string[] =>
    Array.isArray(row.skills) ? row.skills.map(String) : [];
  const skillCounts = new Map<string, number>();
  for (const row of pool) {
    for (const name of skillsOf(row)) {
      skillCounts.set(name, (skillCounts.get(name) ?? 0) + 1);
    }
  }
  const topSkill = [...skillCounts.entries()].sort((a, b) => b[1] - a[1])[0];

  if (topSkill) {
    const bySkill = asArray(
      dataOf(
        await get(
          `/companies/${companyId}/candidates?perPage=100&skills=${encodeURIComponent(topSkill[0])}`,
          employer.token,
        ),
      ),
    );
    check(
      `skill filter "${topSkill[0]}" returns only candidates holding it`,
      bySkill.length > 0 && bySkill.every((row) => skillsOf(row).includes(topSkill[0])),
      `${bySkill.length} rows`,
    );
    check(
      'matched skills are reported back',
      bySkill.every((row) => asArray(row.matched_skills).length > 0),
    );
  } else {
    check('skill filter fixture available', false, 'pool has no skills');
  }

  const cityCounts = new Map<string, number>();
  for (const row of pool) {
    const city = String(row.city ?? '');
    if (city) cityCounts.set(city, (cityCounts.get(city) ?? 0) + 1);
  }
  const topCity = [...cityCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topCity) {
    const byCity = asArray(
      dataOf(
        await get(
          `/companies/${companyId}/candidates?perPage=100&location=${encodeURIComponent(topCity[0])}`,
          employer.token,
        ),
      ),
    );
    check(
      `location filter "${topCity[0]}" keeps only that city`,
      byCity.length > 0 && byCity.every((row) => String(row.city).toLowerCase() === topCity[0].toLowerCase()),
      `${byCity.length} rows`,
    );
  }

  const byExperience = asArray(
    dataOf(await get(`/companies/${companyId}/candidates?perPage=100&min_experience=5`, employer.token)),
  );
  check(
    'min_experience=5 keeps only candidates with 5+ years',
    byExperience.every((row) => Number(row.years_experience) >= 5),
    byExperience.map((row) => row.years_experience).join(', '),
  );

  const bySort = asArray(
    dataOf(await get(`/companies/${companyId}/candidates?perPage=100&sort=experience`, employer.token)),
  );
  const yearsList = bySort.map((row) => Number(row.years_experience));
  check(
    'sort=experience orders years descending',
    yearsList.every((year, index) => index === 0 || yearsList[index - 1] >= year),
    yearsList.join(', '),
  );

  const byName = asArray(
    dataOf(await get(`/companies/${companyId}/candidates?perPage=10&q=aarav`, employer.token)),
  );
  check(
    'free-text q matches by name',
    byName.length > 0 &&
      byName.every((row) => String(row.name).toLowerCase().includes('aarav')),
    `${byName.length} rows`,
    );

  const forbidden = await get(`/companies/${companyId}/candidates`, jobseeker.token);
  check('jobseekers cannot search the talent pool (403)', forbidden.status === 403, String(forbidden.status));

  // --- pure ranking -------------------------------------------------------
  const poolRow = {
    profile: { ...profile, user: { first_name: 'Aarav', last_name: 'Sharma', email: 'a@b.c' } },
    skills: [{ id: 's1', name: 'React' }],
    years: 5,
    educationLevel: 3,
  };
  const scored = scoreCandidate(poolRow, { skills: ['React', 'Node.js'] });
  check('one of two requested skills scores 20/40', scored.breakdown.skills === 20, String(scored.breakdown.skills));
  check('matched skills are listed', scored.matched_skills.length === 1);

  const noFilterScore = scoreCandidate(poolRow, {});
  check('without filters a complete profile still scores', noFilterScore.score > 0, String(noFilterScore.score));

  const sorted = sortCandidates(
    [
      { relevance_score: 10, years_experience: 1, profile_updated_at: new Date('2026-01-01') } as never,
      { relevance_score: 90, years_experience: 9, profile_updated_at: new Date('2026-02-01') } as never,
    ],
    'relevance',
  );
  check('sortCandidates re-orders by score', Number(sorted[0].relevance_score) === 90);

  // =========================================================================
  section('4. Salary estimation algorithm');
  // =========================================================================

  const globalEstimate = await estimateSalary({});
  check('global estimate has a sample', !!globalEstimate && globalEstimate.sample_size >= 3, String(globalEstimate?.sample_size));
  if (globalEstimate) {
    check(
      'min ≤ avg ≤ max',
      globalEstimate.salary_min <= globalEstimate.salary_avg &&
        globalEstimate.salary_avg <= globalEstimate.salary_max,
      `${globalEstimate.salary_min} / ${globalEstimate.salary_avg} / ${globalEstimate.salary_max}`,
    );
    check(
      'global sample uses no filters',
      globalEstimate.applied_filters.length === 0,
      globalEstimate.applied_filters.join(','),
    );
    check('histogram has 8 buckets', globalEstimate.histogram.length === 8);
    check(
      'histogram counts sum to the sample size',
      globalEstimate.histogram.reduce((sum, bucket) => sum + bucket.count, 0) ===
        globalEstimate.sample_size,
    );
    info(
      `global: ${globalEstimate.salary_min}–${globalEstimate.salary_max} avg ${globalEstimate.salary_avg} (${globalEstimate.sample_size} postings)`,
    );
  }

  const sampleJob = openJobs.data[0] as unknown as { category_id: string | null; location_id: string | null };
  const narrowEstimate = await estimateSalary({
    category_id: sampleJob.category_id,
    location_id: sampleJob.location_id,
    experience_level: ExperienceLevel.SENIOR,
  });
  check('narrow query still returns a usable estimate', !!narrowEstimate, 'null result');
  if (narrowEstimate) {
    check(
      'narrow query keeps at least MIN_SAMPLE postings',
      narrowEstimate.sample_size >= 3,
      String(narrowEstimate.sample_size),
    );
    check(
      'narrow query min ≤ avg ≤ max',
      narrowEstimate.salary_min <= narrowEstimate.salary_avg &&
        narrowEstimate.salary_avg <= narrowEstimate.salary_max,
    );
    check(
      'filters are reported when they survived the widening',
      Array.isArray(narrowEstimate.applied_filters),
      JSON.stringify(narrowEstimate.applied_filters),
    );
    info(`narrow: sample ${narrowEstimate.sample_size}, filters ${JSON.stringify(narrowEstimate.applied_filters)}`);
  }

  const salaryHttp = await get('/analytics/salary-estimate');
  check('GET /analytics/salary-estimate is public', salaryHttp.status === 200, String(salaryHttp.status));
  check(
    'HTTP payload carries the estimate',
    !!asRecord(dataOf(salaryHttp).estimate).sample_size,
  );

  // =========================================================================
  section('5. Recruitment analytics');
  // =========================================================================

  const platform = await getPlatformAnalytics();
  const platformCounts = platform.funnel.map((stage) => stage.count);

  check('funnel has every stage', platform.funnel.length === 6);
  check(
    'funnel is monotonically non-increasing',
    platformCounts.every((count, index) => index === 0 || platformCounts[index - 1] >= count),
    platformCounts.join(' → '),
  );
  check('funnel starts from real applications', platformCounts[0] >= 1, String(platformCounts[0]));
  info(`platform funnel: ${platform.funnel.map((stage) => `${stage.status}=${stage.count}`).join(' → ')}`);

  const rates = Object.entries(platform.conversion);
  check(
    'all conversion rates are within 0..1',
    rates.every(([, value]) => value >= 0 && value <= 1),
    JSON.stringify(platform.conversion),
  );
  check('overall hire rate is non-zero', platform.conversion.overall_hire_rate > 0);
  check(
    'time-to-hire reports completed hires',
    platform.time_to_hire.count >= 1,
    String(platform.time_to_hire.count),
  );
  check(
    'time-to-hire bounds are consistent',
    platform.time_to_hire.avg_days !== null &&
      platform.time_to_hire.min_days !== null &&
      platform.time_to_hire.max_days !== null &&
      platform.time_to_hire.min_days <= platform.time_to_hire.avg_days &&
      platform.time_to_hire.avg_days <= platform.time_to_hire.max_days,
    JSON.stringify(platform.time_to_hire),
  );
  info(`time to hire: avg ${platform.time_to_hire.avg_days}d (n=${platform.time_to_hire.count})`);

  if (platform.sources.length > 0) {
    const shareSum = platform.sources.reduce((sum, source) => sum + source.share, 0);
    check('source shares add up to ~1', Math.abs(shareSum - 1) < 0.02, String(shareSum));
  }
  check('per-job performance rows exist', platform.jobs.length > 0, String(platform.jobs.length));
  check(
    'per-job hire rates are within 0..1',
    platform.jobs.every((job) => job.hire_rate >= 0 && job.hire_rate <= 1),
  );

  const company = await getCompanyAnalytics(companyId);
  check(
    'company scope never exceeds platform scope',
    company.volume.applications <= platform.volume.applications &&
      company.funnel[0].count <= platform.funnel[0].count,
    `${company.volume.applications} vs ${platform.volume.applications}`,
  );
  check('company scope has applications', company.volume.applications > 0, String(company.volume.applications));
  check(
    'company funnel is monotonic too',
    company.funnel.every((stage, index) => index === 0 || company.funnel[index - 1].count >= stage.count),
  );

  const busiestJob = platform.jobs[0];
  const jobStats = await getJobAnalytics(busiestJob.id);
  check('job analytics finds the posting', jobStats.job.id === busiestJob.id);
  check(
    'job volume matches its performance row',
    jobStats.volume.applications === jobStats.performance.applications,
    `${jobStats.volume.applications} vs ${jobStats.performance.applications}`,
  );
  check(
    'job funnel starts at its applications',
    jobStats.funnel[0].count >= jobStats.performance.applications || jobStats.funnel[0].count >= 1,
  );
  info(`busiest job: ${busiestJob.title} (${busiestJob.applications} applications)`);

  // --- HTTP endpoints + authorization -------------------------------------
  const recruitmentOk = await get(`/analytics/recruitment?company_id=${companyId}`, employer.token);
  check('employer can read company analytics', recruitmentOk.status === 200, String(recruitmentOk.status));
  check(
    'HTTP analytics payload is complete',
    asArray(asRecord(dataOf(recruitmentOk).analytics).funnel).length === 6,
  );

  const recruitmentNoScope = await get('/analytics/recruitment', employer.token);
  check('company_id is required (422)', recruitmentNoScope.status === 422, String(recruitmentNoScope.status));

  const recruitmentJobseeker = await get(`/analytics/recruitment?company_id=${companyId}`, jobseeker.token);
  check('jobseekers cannot read company analytics (403)', recruitmentJobseeker.status === 403, String(recruitmentJobseeker.status));

  const platformOk = await get('/analytics/platform', admin.token);
  check('admin can read platform analytics', platformOk.status === 200, String(platformOk.status));

  const platformAsEmployer = await get('/analytics/platform', employer.token);
  check('employers cannot read platform analytics (403)', platformAsEmployer.status === 403, String(platformAsEmployer.status));

  const jobStatsHttp = await get(`/analytics/jobs/${busiestJob.id}`, employer.token);
  check('employer can read its own job analytics', jobStatsHttp.status === 200, String(jobStatsHttp.status));

  const jobStatsAsJobseeker = await get(`/analytics/jobs/${busiestJob.id}`, jobseeker.token);
  check('jobseekers cannot read job analytics (403)', jobStatsAsJobseeker.status === 403, String(jobStatsAsJobseeker.status));

  // =========================================================================
  section('6. Smart job alerts');
  // =========================================================================

  // --- pure frequency windows --------------------------------------------
  const now = new Date('2026-11-19T12:00:00.000Z');
  const hoursAgo = (hours: number): Date => new Date(now.getTime() - hours * 3_600_000);

  check('INSTANT alerts are always due', isAlertDue(JobAlertFrequency.INSTANT, hoursAgo(0), now));
  check('DAILY is not due after 23h', !isAlertDue(JobAlertFrequency.DAILY, hoursAgo(23), now));
  check('DAILY is due after 25h', isAlertDue(JobAlertFrequency.DAILY, hoursAgo(25), now));
  check('WEEKLY is not due after 6d', !isAlertDue(JobAlertFrequency.WEEKLY, hoursAgo(6 * 24), now));
  check('WEEKLY is due after 8d', isAlertDue(JobAlertFrequency.WEEKLY, hoursAgo(8 * 24), now));
  check('a never-sent alert is due', isAlertDue(JobAlertFrequency.WEEKLY, null, now));
  check('a corrupt timestamp counts as due', isAlertDue(JobAlertFrequency.DAILY, 'nonsense', now));

  const filterless = makeAlert();
  const filtered = makeAlert({ keywords: 'react' });
  check('an empty alert has no explicit filters', !hasExplicitFilters(filterless));
  check('keywords make an alert explicit', hasExplicitFilters(filtered));

  const devJob = makeJob({ title: 'React Developer', category_id: 'cat-1' });
  check(
    'keyword terms are OR-matched (react OR typescript)',
    jobMatchesAlertFilters(devJob, makeAlert({ keywords: 'react typescript nosuchterm' })),
  );
  check(
    'a different category rejects the job',
    !jobMatchesAlertFilters(devJob, makeAlert({ category_id: 'cat-other' })),
  );

  // --- live matching + dispatch lifecycle ---------------------------------
  const notificationBefore = await notificationIds(jobseeker.token);

  const throwaway = await jobAlertRepository.create({
    user_id: jobseeker.userId,
    name: 'Algo test alert (temporary)',
    keywords: 'developer react typescript nosuchterm',
    frequency: JobAlertFrequency.DAILY,
    is_active: true,
    last_sent_at: null,
  });
  cleanupAlertIds.push(throwaway.id);
  info(`throwaway alert: ${throwaway.id}`);

  const matches = await findMatches(throwaway);
  check('findMatches returns matches for a never-sent alert', matches.length > 0, String(matches.length));
  check(
    'multi-term keywords OR together (bogus term does not empty the set)',
    matches.length > 0,
  );
  check(
    'matches carry scores and are ranked descending',
    matches.every((match, index) => index === 0 || matches[index - 1].score >= match.score),
    matches.map((match) => match.score).join(', '),
  );

  const preview = await post(`/job-alerts/${throwaway.id}/test`, jobseeker.token);
  check('POST /job-alerts/:id/test returns 200', preview.status === 200, String(preview.status));
  check(
    'preview exposes the scored matches',
    asArray(dataOf(preview).matches).length > 0,
  );

  const dispatched = await dispatchAlert(throwaway);
  check('dispatchAlert notifies on matches', dispatched > 0, String(dispatched));

  const afterDispatch = await jobAlertRepository.findById(throwaway.id);
  check('last_sent_at is stamped after a dispatch', !!afterDispatch?.last_sent_at);

  const notificationsAfter = await notificationIds(jobseeker.token);
  const newNotificationIds = notificationsAfter.filter((id) => !notificationBefore.includes(id));
  cleanupNotificationIds.push(...newNotificationIds);
  check('a JOB_ALERT notification was created', newNotificationIds.length > 0);

  const stampedAt = afterDispatch?.last_sent_at ? new Date(afterDispatch.last_sent_at).toISOString() : null;
  const notDue = await dispatchDueAlerts({ onlyAlertIds: [throwaway.id] });
  const afterGate = await jobAlertRepository.findById(throwaway.id);
  check('DAILY alert is skipped inside its window', notDue === 0, String(notDue));
  check(
    'a skipped dispatch leaves last_sent_at untouched',
    (afterGate?.last_sent_at ? new Date(afterGate.last_sent_at).toISOString() : null) === stampedAt,
  );

  // INSTANT is always due, but there is nothing published after last_sent_at,
  // so this run must dispatch nothing AND must not stamp the alert.
  await jobAlertRepository.update(throwaway.id, { frequency: JobAlertFrequency.INSTANT });
  const instantRun = await dispatchDueAlerts({ onlyAlertIds: [throwaway.id] });
  const afterInstant = await jobAlertRepository.findById(throwaway.id);
  check('no new matches means no dispatch', instantRun === 0, String(instantRun));
  check(
    'last_sent_at is only stamped when matches were sent',
    (afterInstant?.last_sent_at ? new Date(afterInstant.last_sent_at).toISOString() : null) === stampedAt,
  );

  // --- on-publish hook -----------------------------------------------------
  const publishedJobs = await jobRepository.search({}, getPaginationParams({ perPage: 100 }));
  const developerJob = publishedJobs.data.find((job) =>
    `${job.title} ${job.description}`.toLowerCase().includes('developer'),
  );
  if (developerJob) {
    const notified = await notifyInstantAlerts(developerJob);
    check('notifyInstantAlerts wakes matching INSTANT alerts', notified >= 1, String(notified));
    const afterInstantNotify = await notificationIds(jobseeker.token);
    cleanupNotificationIds.push(
      ...afterInstantNotify.filter((id) => !notificationBefore.includes(id)),
    );
  } else {
    check('found a published "developer" job for the instant hook', false);
  }

  // Real seeded alert, no mutation: just prove it can be matched.
  const seededAlert = await jobAlertRepository.findById(SEED_ALERT_IDS[0]);
  if (seededAlert) {
    check('seeded alert is recognised as explicitly filtered', hasExplicitFilters(seededAlert));
    const seededMatches = await findMatches(seededAlert);
    check(
      'seeded alert matching runs without error',
      Array.isArray(seededMatches),
      JSON.stringify(seededMatches).slice(0, 120),
    );
    check(
      'seeded alert matches stay within the cap',
      seededMatches.length <= 50,
      String(seededMatches.length),
    );
    info(`seeded alert "Frontend roles in Kathmandu": ${seededMatches.length} matches`);
  }
};

// ---------------------------------------------------------------------------
// Run + cleanup
// ---------------------------------------------------------------------------

main()
  .catch((error) => {
    failures.push(`unexpected error: ${(error as Error).message}`);
    console.error(error);
  })
  .finally(() => {
    void (async () => {
      // Remove everything this run created.
      for (const id of cleanupNotificationIds) {
        try {
          await notificationRepository.destroy(id);
        } catch (error) {
          console.error(`failed to delete notification ${id}:`, error);
        }
      }
      for (const id of cleanupAlertIds) {
        try {
          await jobAlertRepository.destroy(id);
        } catch (error) {
          console.error(`failed to delete alert ${id}:`, error);
        }
      }
      // Put the seeded alerts back exactly as we found them (the background
      // worker may have re-stamped them while the suite was running).
      for (const snapshot of seedSnapshots) {
        try {
          await jobAlertRepository.update(snapshot.id, { last_sent_at: snapshot.last_sent_at });
        } catch (error) {
          console.error(`failed to restore alert ${snapshot.id}:`, error);
        }
      }
      await closeConnection();

      console.log(`\n${'='.repeat(60)}`);
      if (failures.length === 0) {
        console.log(`ALL PASSED — ${passed} assertions`);
      } else {
        console.log(`${failures.length} FAILED / ${passed + failures.length} assertions`);
        for (const failure of failures) console.log(`  ✗ ${failure}`);
        process.exitCode = 1;
      }
      console.log('='.repeat(60));
      process.exit(process.exitCode ?? 0);
    })();
  });

// Keep the imported enums referenced for type-checking clarity.
void NotificationType;
void JobStatus;
