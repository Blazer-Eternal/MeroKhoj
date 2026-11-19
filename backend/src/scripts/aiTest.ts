/**
 * Phase 2 AI test suite.
 *
 * Run with: npm run test:ai   (requires the dev server on :8000 for the
 * HTTP cases; service/pure cases talk to the database directly).
 *
 * Covers the seven Phase 2 capabilities:
 *   1. AI resume parsing           (coercion + apply merge + upload guards)
 *   2. AI resume improvement       (suggestion normalisation)
 *   3. AI JD generator             (draft normalisation + tone actions)
 *   4. AI career assistant         (chat guards; live turn when keyed)
 *   5. AI skill gap analysis       (pure core + HTTP report)
 *   6. AI interview prep           (question/feedback normalisation; live)
 *   7. AI semantic search          (intent parser + cosine + keyword mode)
 *
 * Generative paths are asserted in BOTH modes: without OPENAI_API_KEY every
 * endpoint must answer 503 AI_NOT_CONFIGURED (never a 500), and the
 * LLM-dependent sections run only when the key is present.
 *
 * Nothing seeded is mutated: the profile-apply section snapshots the
 * jobseeker profile/user/skills and restores them in the finally block;
 * chat history, practice sessions and test embeddings created here are
 * removed as well.
 */
import { cosineSimilarity, normalizeSimilarity } from '../services/ai/semantic-search/cosine';
import { parseSearchIntent } from '../services/ai/semantic-search/intentParser';
import { keywordOverlap } from '../services/ai/semantic-search/semanticSearchService';
import { normalizeParsedResume, parseStoredResume } from '../services/ai/resume/resumeParserService';
import { normalizeSuggestions } from '../services/ai/resume/resumeImprovementService';
import { normalizeDraft } from '../services/ai/job-description/jobDescriptionService';
import { normalizeFeedback, normalizeQuestions } from '../services/ai/interview-assistant/interviewPrepService';
import { buildGapReport, learningTipFor, relatednessLevel } from '../services/ai/skill-analysis/skillGapService';
import { isAIConfigured } from '../services/ai/shared/aiConfig';
import {
  applyParsedResume,
  generateJobDescription,
  improveJobDescription,
  improveResume,
  parseResumeText,
  searchJobsSemantic,
} from '../services';
import { connection, closeConnection, getSequelize } from '../config';
import { initializeModels } from '../models';
import {
  aiChatMessageRepository,
  educationRepository,
  jobEmbeddingRepository,
  jobRepository,
  jobSkillRepository,
  jobseekerProfileRepository,
  jobseekerProfileSkillRepository,
  resumeRepository,
  skillRepository,
  userRepository,
  workExperienceRepository,
} from '../repositories';
import { JobSkillImportance } from '../enums';
import { IParsedResume, IJob } from '../interfaces';

// ---------------------------------------------------------------------------
// Tiny test harness (same shape as algoTest.ts)
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

const errorInfo = (body: Record<string, unknown>): string => {
  const error = asRecord(body.error);
  return `${error.code ?? '?'}:${error.message ?? '?'}`;
};

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
  token: string | undefined,
  payload: Record<string, unknown> = {},
): Promise<IHttpResponse> => {
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body: asRecord(body) };
};

const del = async (path: string, token: string): Promise<IHttpResponse> => {
  const response = await fetch(`${API}${path}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body: asRecord(body) };
};

const dataOf = (response: IHttpResponse): Record<string, unknown> =>
  asRecord(response.body.data);

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SAMPLE_RESUME = [
  'Jane Doe - Frontend Engineer',
  'Email: jane.doe@example.com | Phone: +977-9800000111 | Kathmandu, Nepal',
  'Summary: Frontend engineer with 4 years building React applications.',
  'Experience: Acme Pvt Ltd, Frontend Developer, 2021-03 to Present - Built React dashboards.',
  'Education: Tribhuvan University, Bachelor of Science in Computer Science, 2016-2022.',
  'Skills: React, TypeScript, JavaScript, CSS, Git',
  'Certifications: AWS Certified Cloud Practitioner',
].join('\n');

/** Minimal single-page PDF with one text line (ASCII), valid xref table. */
const buildMinimalPdf = (text: string): Buffer => {
  const escaped = text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const stream = `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf, 'latin1');
};

const uploadFile = async (
  path: string,
  token: string,
  fileName: string,
  content: Buffer,
  mimeType: string,
): Promise<IHttpResponse> => {
  const form = new FormData();
  form.append('file', new Blob([new Uint8Array(content)], { type: mimeType }), fileName);
  const response = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  return { status: response.status, body: asRecord(body) };
};

/** Deterministic UUID used by the demo seeder for row `n`. */
const seedId = (n: number): string => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

// ---------------------------------------------------------------------------
// Profile snapshot (apply section) — restored in finally
// ---------------------------------------------------------------------------

interface IProfileSnapshot {
  headline: string | null;
  summary: string | null;
  city: string | null;
  country: string | null;
  phone: string | null;
  firstName: string;
  lastName: string;
  skillIds: string[];
  educationIds: string[];
  experienceIds: string[];
}

let activeSnapshot: IProfileSnapshot | null = null;
/** Assigned in main() so the finally block can restore without re-login. */
let seekerUserIdCache = '';

const takeSnapshot = async (userId: string): Promise<IProfileSnapshot> => {
  const profile = await jobseekerProfileRepository.findByUserId(userId);
  const user = await userRepository.findById(userId);
  const skills = await jobseekerProfileSkillRepository.listByUserId(userId);
  const profileId = profile?.id ?? '';
  const educations = profileId ? await educationRepository.listByJobseeker(profileId) : [];
  const experiences = profileId ? await workExperienceRepository.listByJobseeker(profileId) : [];
  return {
    headline: profile?.headline ?? null,
    summary: profile?.professional_summary ?? null,
    city: profile?.city ?? null,
    country: profile?.country ?? null,
    phone: user?.phone ?? null,
    firstName: user?.first_name ?? '',
    lastName: user?.last_name ?? '',
    skillIds: skills.map((skill) => skill.id),
    educationIds: educations.map((entry) => entry.id),
    experienceIds: experiences.map((entry) => entry.id),
  };
};

const restoreSnapshot = async (userId: string, snap: IProfileSnapshot): Promise<void> => {
  await jobseekerProfileRepository.updateByUserId(userId, {
    headline: snap.headline,
    professional_summary: snap.summary,
    city: snap.city,
    country: snap.country,
  });
  await userRepository.update(userId, {
    phone: snap.phone,
    first_name: snap.firstName,
    last_name: snap.lastName,
  });
  await jobseekerProfileSkillRepository.replaceByUserId(userId, snap.skillIds);

  const profile = await jobseekerProfileRepository.findByUserId(userId);
  if (profile) {
    const before = new Set(snap.educationIds);
    for (const entry of await educationRepository.listByJobseeker(profile.id)) {
      if (!before.has(entry.id)) await educationRepository.destroy(entry.id);
    }
    const beforeXp = new Set(snap.experienceIds);
    for (const entry of await workExperienceRepository.listByJobseeker(profile.id)) {
      if (!beforeXp.has(entry.id)) await workExperienceRepository.destroy(entry.id);
    }
  }
};

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const main = async (): Promise<void> => {
  await connection();
  initializeModels();

  const keyed = isAIConfigured();
  info(`OPENAI_API_KEY: ${keyed ? 'configured (live sections ON)' : 'not set (offline mode)'}`);

  const seeker = await login('aarav.sharma@example.com', 'Demo@12345');
  const employer = await login('anil.shrestha@himalayantech.com', 'Demo@12345');
  seekerUserIdCache = seeker.userId;

  // =========================================================================
  section('1. Search intent parser (pure)');
  // =========================================================================
  {
    const intent = parseSearchIntent(
      'remote senior full time react developer over 100k last 30 days',
    );
    check('remote detected', intent.remote_only === true);
    check('level detected (SENIOR)', intent.experience_level === 'SENIOR', String(intent.experience_level));
    check('employment detected (FULL_TIME)', intent.employment_type === 'FULL_TIME', String(intent.employment_type));
    check('salary floor 100000', intent.salary_min === 100000, String(intent.salary_min));
    check('recency 30 days', intent.posted_within_days === 30, String(intent.posted_within_days));
    check(
      'keywords keep the real terms',
      intent.keywords.includes('react') && intent.keywords.includes('developer'),
      intent.keywords.join(','),
    );
    check(
      'filter words stripped from keywords',
      !intent.keywords.includes('remote') && !intent.keywords.includes('senior') && !intent.keywords.includes('full'),
      intent.keywords.join(','),
    );

    const plain = parseSearchIntent('junior data analyst part-time');
    check('junior → ENTRY', plain.experience_level === 'ENTRY', String(plain.experience_level));
    check('part-time → PART_TIME', plain.employment_type === 'PART_TIME', String(plain.employment_type));

    const empty = parseSearchIntent('   ');
    check('empty query → empty intent', empty.keywords.length === 0 && empty.remote_only === false);

    const week = parseSearchIntent('marketing roles past week');
    check('past week → 7 days', week.posted_within_days === 7, String(week.posted_within_days));
    check('week words stripped', !week.keywords.includes('past') && !week.keywords.includes('week'), week.keywords.join(','));
  }

  // =========================================================================
  section('2. Cosine similarity + score normalisation (pure)');
  // =========================================================================
  {
    check('identical vectors → 1', Math.abs(cosineSimilarity([1, 2, 3], [1, 2, 3]) - 1) < 1e-9);
    check('orthogonal vectors → 0', Math.abs(cosineSimilarity([1, 0], [0, 1])) < 1e-9);
    check('opposite vectors → -1', Math.abs(cosineSimilarity([1, 0], [-1, 0]) + 1) < 1e-9);
    check('empty vector → 0', cosineSimilarity([], [1]) === 0);
    check('length mismatch → 0', cosineSimilarity([1, 2], [1]) === 0);
    check('zero vector → 0', cosineSimilarity([0, 0], [1, 2]) === 0);

    check('normalize(0.05) → 0 (floor)', normalizeSimilarity(0.05) === 0);
    check('normalize(0.55) → 100 (ceil)', normalizeSimilarity(0.55) === 100);
    check('normalize(below floor) → 0', normalizeSimilarity(0.01) === 0);
    check('normalize(above ceil) → 100', normalizeSimilarity(0.9) === 100);
    check('normalize(midpoint) → 50', normalizeSimilarity(0.3) === 50);

    check('keywordOverlap full match → 1', keywordOverlap(['react', 'node'], 'react and node jobs') === 1);
    check('keywordOverlap partial → 0.5', keywordOverlap(['react', 'node'], 'react jobs') === 0.5);
    check('keywordOverlap none → 0', keywordOverlap(['react'], 'design roles') === 0);
    check('keywordOverlap no keywords → 0', keywordOverlap([], 'anything') === 0);
  }

  // =========================================================================
  section('3. Resume parser coercion (pure)');
  // =========================================================================
  {
    const parsed = normalizeParsedResume({
      name: '  Jane Doe  ',
      email: 'jane@example.com',
      phone: null,
      city: 'Kathmandu',
      country: 'Nepal',
      headline: 'Frontend Engineer',
      summary: 'I build web apps.',
      education: [
        { institution: 'TU', degree: 'BSc', field_of_study: 'CS', start_date: '2018-06', end_date: '2022-06' },
        { institution: '', degree: 'BSc' },
        'garbage',
      ],
      experience: [
        { company_name: 'Acme', job_title: 'Dev', start_date: '2022-01', end_date: 'Present', is_current: false, description: 'x' },
        { company_name: 'Acme' },
      ],
      skills: ['React', 'react', ' TypeScript ', 42, null],
      certifications: ['AWS SAA', 'aws saa'],
    });

    check('name trimmed', parsed.name === 'Jane Doe', String(parsed.name));
    check('email kept', parsed.email === 'jane@example.com');
    check('missing phone → null', parsed.phone === null);
    check('valid education kept', parsed.education.length === 1 && parsed.education[0].institution === 'TU');
    check('blank/garbage education dropped', parsed.education.length === 1);
    check('valid experience kept', parsed.experience.length === 1 && parsed.experience[0].job_title === 'Dev');
    check('Present end_date → is_current', parsed.experience[0].is_current === true);
    check('incomplete experience dropped', parsed.experience.length === 1);
    check('skills trimmed + de-duped + non-strings dropped', JSON.stringify(parsed.skills) === JSON.stringify(['React', 'TypeScript']), JSON.stringify(parsed.skills));
    check('certifications de-duped case-insensitively', JSON.stringify(parsed.certifications) === JSON.stringify(['AWS SAA']), JSON.stringify(parsed.certifications));

    const garbage = normalizeParsedResume('not an object at all');
    check('string input → all-null payload', garbage.name === null && garbage.education.length === 0 && garbage.skills.length === 0);
  }

  // =========================================================================
  section('4. Resume improvement suggestions (pure)');
  // =========================================================================
  {
    const suggestions = normalizeSuggestions({
      suggestions: [
        { area: 'professional_summary', original: 'Old summary', suggestion: 'New summary', reason: 'Stronger verbs' },
        { area: 'grammar', original: '', suggestion: 'Fix the tense', reason: 'Consistent tense' },
        { area: 'banana', original: '', suggestion: 'Something', reason: 'Unknown area defaults' },
        { area: 'grammar', original: '', suggestion: 'Fix the tense', reason: 'Consistent tense' },
        { area: 'skills', original: 'x', suggestion: '', reason: 'no suggestion text' },
        'not an object',
      ],
    });

    check('valid suggestions kept', suggestions.length === 3, String(suggestions.length));
    check('area alias mapped (professional_summary → summary)', suggestions[0].area === 'summary');
    check('unknown area → grammar', suggestions[2].area === 'grammar');
    check('exact duplicate dropped', suggestions.filter((s) => s.suggestion === 'Fix the tense').length === 1);
    check('empty suggestion dropped', suggestions.every((s) => s.suggestion.length > 0));
    check('reasons present', suggestions.every((s) => s.reason.length > 0));
  }

  // =========================================================================
  section('5. JD generator normalisation (pure)');
  // =========================================================================
  {
    const draft = normalizeDraft(
      {
        overview: ' We are hiring. ',
        responsibilities: ['Own features', 'Own features', 42, 'Write tests'],
        required_qualifications: ['3+ years'],
        required_skills: ['React', 'React', 'Node'],
        experience_requirements: '4+ years building web apps.',
      },
      'FORMAL',
    );
    check('tone attached', draft.tone === 'FORMAL');
    check('overview trimmed', draft.overview === 'We are hiring.');
    check('responsibilities filtered + de-duped', JSON.stringify(draft.responsibilities) === JSON.stringify(['Own features', 'Write tests']), JSON.stringify(draft.responsibilities));
    check('skills de-duped', JSON.stringify(draft.required_skills) === JSON.stringify(['React', 'Node']));
    check('missing fields → empty strings/arrays', normalizeDraft({}, 'NEUTRAL').overview === '' && normalizeDraft({}, 'NEUTRAL').responsibilities.length === 0);
  }

  // =========================================================================
  section('6. Interview prep normalisation (pure)');
  // =========================================================================
  {
    const questions = normalizeQuestions({
      questions: [
        { category: 'Technical', question: 'What is React?' },
        { category: 'Behavioural', question: 'what is react?' },
        { question: '   ' },
        { category: 'Situational', question: 'Describe a conflict you resolved.' },
        'junk',
      ],
    });
    check('usable questions kept', questions.length === 2, String(questions.length));
    check('case-insensitive de-dupe', questions.filter((q) => q.question.toLowerCase() === 'what is react?').length === 1);
    check('default category when missing', questions[1].category === 'General' || questions[0].category === 'Technical');

    const feedback = normalizeFeedback({
      score: 78.6,
      breakdown: { relevance: 80, structure: 70, specificity: '65', communication: 150 },
      strengths: ['Clear structure', 'Clear structure', 'Good example', 'Extra one'],
      improvements: 'not an array',
      insight: '  Add metrics to your result.  ',
    });
    check('score rounded + clamped', feedback.score === 79, String(feedback.score));
    check('breakdown numeric + clamped', feedback.breakdown.relevance === 80 && feedback.breakdown.specificity === 65 && feedback.breakdown.communication === 100, JSON.stringify(feedback.breakdown));
    check('strengths de-duped + capped at 3', feedback.strengths.length === 3, JSON.stringify(feedback.strengths));
    check('non-array improvements → []', Array.isArray(feedback.improvements) && feedback.improvements.length === 0);
    check('insight trimmed', feedback.insight === 'Add metrics to your result.');
    check('all breakdown keys present', ['relevance', 'structure', 'specificity', 'communication'].every((k) => k in feedback.breakdown));
  }

  // =========================================================================
  section('7. Skill gap core (pure)');
  // =========================================================================
  {
    const report = buildGapReport({
      job_id: 'job-1',
      job_title: 'Full Stack Developer',
      jobSkills: [
        { skill_id: 's-react', skill_name: 'React', importance: JobSkillImportance.REQUIRED, minimum_experience: 2 },
        { skill_id: 's-ts', skill_name: 'TypeScript', importance: JobSkillImportance.REQUIRED, minimum_experience: null },
        { skill_id: 's-docker', skill_name: 'Docker', importance: JobSkillImportance.PREFERRED, minimum_experience: null },
        { skill_id: 's-aws', skill_name: 'AWS', importance: JobSkillImportance.PREFERRED, minimum_experience: null },
      ],
      heldSkills: ['React', 'React Native', 'JavaScript'],
      headline: 'Frontend Developer',
      summary: 'React and TypeScript developer',
      years_experience: 3,
      match_score: 84,
      ai_configured: false,
    });

    const byName = new Map(report.items.map((item) => [item.skill, item]));
    check('React fully matched (75+15+10=100)', byName.get('React')?.current_level === 100, String(byName.get('React')?.current_level));
    check('React target 80 (REQUIRED)', byName.get('React')?.target_level === 80);
    check('React gap 0', byName.get('React')?.gap === 0);
    check('TypeScript matched (75+10=85)', byName.get('TypeScript')?.current_level === 85, String(byName.get('TypeScript')?.current_level));
    check('Docker missing at 0 (no lexical relation)', byName.get('Docker')?.current_level === 0, String(byName.get('Docker')?.current_level));
    check('Docker target 60 (PREFERRED)', byName.get('Docker')?.target_level === 60);
    check('Docker gap 60', byName.get('Docker')?.gap === 60);
    check('total gap = 120', report.total_gap === 120, String(report.total_gap));
    check('average gap = 30', report.average_gap === 30, String(report.average_gap));
    check('critical gaps = the two missing', report.critical_gaps.length === 2, String(report.critical_gaps.length));
    check('strengths = React + TypeScript', report.strengths.length === 2, String(report.strengths.length));
    check('match score carried through', report.match_score === 84);
    check('ai_configured false offline', report.ai_configured === false);
    check('items sorted by gap desc', report.items[0].gap >= report.items[1].gap);
    check('statuses correct', byName.get('React')?.status === 'MATCHED' && byName.get('Docker')?.status === 'MISSING');

    check('relatedness: held exact → 30', relatednessLevel('React', ['React']) === 30);
    check('relatedness: superset → 21', relatednessLevel('React', ['React Native']) === 21, String(relatednessLevel('React', ['React Native'])));
    check('relatedness: unrelated → 0', relatednessLevel('Kubernetes', ['Figma', 'Copywriting']) === 0);
    check('learning tip: React hits library', learningTipFor('React').includes('deploy'));
    check('learning tip: Kubernetes hits library', learningTipFor('Kubernetes').includes('kind/k3d'));
    check('learning tip: unknown skill gets generic', learningTipFor('Quantum Basket Weaving').includes('Quantum Basket Weaving'));

    const emptyReport = buildGapReport({
      job_id: 'job-2',
      job_title: 'No-skill job',
      jobSkills: [],
      heldSkills: ['React'],
      headline: null,
      summary: null,
      years_experience: 0,
      match_score: null,
      ai_configured: false,
    });
    check('no job skills → zeroed report', emptyReport.total_gap === 0 && emptyReport.average_gap === 0 && emptyReport.items.length === 0);
  }

  // =========================================================================
  section('8. Job embedding repository round-trip (REAL[] serialisation)');
  // =========================================================================
  {
    const published = await jobRepository.findPublishedMatching({});
    check('published jobs available', published.length > 0, String(published.length));
    const target: IJob = published[0];
    // float32-exact values so REAL[] round-trips bit-for-bit.
    const vector = [0.5, -0.25, 0.125, 0.75];

    await jobEmbeddingRepository.upsert(target.id, vector, 'test-model', vector.length);
    const map = await jobEmbeddingRepository.mapByJobIds([target.id]);
    const stored = map.get(target.id);
    check('upsert → mapByJobIds returns the vector', Array.isArray(stored) && stored.length === 4, JSON.stringify(stored));
    check('values round-trip exactly', JSON.stringify(stored) === JSON.stringify(vector), JSON.stringify(stored));

    const all = await jobEmbeddingRepository.listAll();
    const row = all.find((entry) => entry.job_id === target.id);
    check('listAll includes the row with model/dimensions', row?.model === 'test-model' && row?.dimensions === 4);

    await jobEmbeddingRepository.upsert(target.id, [0.25, 0.5], 'test-model-v2', 2);
    const remapped = await jobEmbeddingRepository.mapByJobIds([target.id]);
    check('second upsert replaces (no duplicate row)', remapped.get(target.id)?.length === 2);
    check('listAll still has exactly one row for the job', (await jobEmbeddingRepository.listAll()).filter((e) => e.job_id === target.id).length === 1);

    await jobEmbeddingRepository.destroy(target.id);
    const afterDelete = await jobEmbeddingRepository.mapByJobIds([target.id]);
    check('destroy removes the row', afterDelete.size === 0);
  }

  // =========================================================================
  section('9. HTTP guards: auth, validation, AI-not-configured');
  // =========================================================================
  {
    const noAuth = await post('/ai/resume/parse', undefined, { text: SAMPLE_RESUME });
    check('unauthenticated parse → 401', noAuth.status === 401, String(noAuth.status));

    const badBody = await post('/ai/resume/parse', seeker.token, { text: 'too short' });
    check('short text → 422 validation', badBody.status === 422, `${badBody.status} ${errorInfo(badBody.body)}`);

    const badTone = await post(
      '/ai/job-descriptions/generate',
      seeker.token,
      { title: 'Developer', tone: 'SARCASM' },
    );
    check('invalid tone → 422 validation', badTone.status === 422, String(badTone.status));

    const badAction = await post(
      '/ai/job-descriptions/improve',
      seeker.token,
      { draft: { tone: 'NEUTRAL', overview: 'x', responsibilities: [], required_qualifications: [], required_skills: [], experience_requirements: 'y' }, action: 'REWRITE' },
    );
    check('invalid improve action → 422 validation', badAction.status === 422, String(badAction.status));

    const badQuickAction = await post(
      '/ai/career-assistant/message',
      seeker.token,
      { message: 'hello', quick_action: 'NOT_A_REAL_ACTION' },
    );
    check('invalid quick action → 422 validation', badQuickAction.status === 422, String(badQuickAction.status));

    const wrongRole = await get('/ai/skill-gap?job_id=' + seedId(601), employer.token);
    check('employer on jobseeker route → 403', wrongRole.status === 403, String(wrongRole.status));

    const badUuid = await get('/ai/skill-gap?job_id=not-a-uuid', seeker.token);
    check('malformed job_id → 422', badUuid.status === 422, String(badUuid.status));

    const badSession = await get('/ai/interview/sessions/00000000-0000-4000-8000-000000000999', seeker.token);
    check('unknown session → 404', badSession.status === 404, String(badSession.status));

    // Generative endpoints: 503 offline, 201 when keyed.
    const cases: Array<{ label: string; run: () => Promise<IHttpResponse> }> = [
      { label: 'resume parse', run: () => post('/ai/resume/parse', seeker.token, { text: SAMPLE_RESUME }) },
      { label: 'resume improve', run: () => post('/ai/resume/improve', seeker.token, { text: SAMPLE_RESUME }) },
      { label: 'jd generate', run: () => post('/ai/job-descriptions/generate', seeker.token, { title: 'Frontend Developer', tone: 'NEUTRAL' }) },
      { label: 'career chat', run: () => post('/ai/career-assistant/message', seeker.token, { message: 'Which career path suits a React developer?' }) },
      { label: 'interview session', run: () => post('/ai/interview/sessions', seeker.token, { job_title: 'Frontend Developer', question_count: 3 }) },
    ];
    for (const testCase of cases) {
      const response = await testCase.run();
      if (keyed) {
        check(`${testCase.label}: keyed → 201`, response.status === 201, `${response.status} ${errorInfo(response.body)}`);
        // The keyed interview case creates a real session — remove it now so
        // this section leaves no residue (chat history is cleared later).
        if (testCase.label === 'interview session' && response.status === 201) {
          const sessionId = asRecord(dataOf(response).session).id;
          if (typeof sessionId === 'string') {
            await getSequelize().query('DELETE FROM interview_practice_sessions WHERE id = :id', {
              replacements: { id: sessionId },
            });
          }
        }
      } else {
        const error = asRecord(response.body.error);
        check(
          `${testCase.label}: no key → 503 AI_NOT_CONFIGURED`,
          response.status === 503 && error.code === 'AI_NOT_CONFIGURED',
          `${response.status} ${errorInfo(response.body)}`,
        );
      }
    }
  }

  // =========================================================================
  section('10. Semantic search: keyword mode + intent passthrough (HTTP, public)');
  // =========================================================================
  {
    const response = await get('/jobs/semantic?q=' + encodeURIComponent('frontend developer'));
    check('public access → 200', response.status === 200, String(response.status));
    const data = dataOf(response);
    const mode = String(data.mode);
    check(`mode is ${keyed ? 'SEMANTIC' : 'KEYWORD'}`, mode === (keyed ? 'SEMANTIC' : 'KEYWORD'), mode);
    const matches = asArray(data.matches);
    check('frontend query matches jobs', matches.length > 0, String(matches.length));
    check(
      'scores in 0-100 and sorted desc',
      matches.every((m) => Number(m.match_score) >= 0 && Number(m.match_score) <= 100) &&
        matches.every((m, i) => i === 0 || Number(matches[i - 1].match_score) >= Number(m.match_score)),
      matches.map((m) => m.match_score).join(','),
    );
    check('every match has a why line', matches.every((m) => typeof m.why === 'string' && String(m.why).length > 5));
    check(
      'why mentions a query keyword',
      matches.some((m) => {
        const why = String(m.why).toLowerCase();
        return why.includes('frontend') || why.includes('developer');
      }),
      String(matches[0]?.why),
    );

    const filtered = await get(
      '/jobs/semantic?q=' + encodeURIComponent('remote senior full time over 100k last 30 days'),
    );
    const filteredIntent = asRecord(dataOf(filtered).intent);
    check('filters parsed in HTTP intent', filtered.status === 200 && filteredIntent.remote_only === true && filteredIntent.employment_type === 'FULL_TIME' && filteredIntent.experience_level === 'SENIOR' && Number(filteredIntent.salary_min) === 100000 && Number(filteredIntent.posted_within_days) === 30, JSON.stringify(filteredIntent));

    const tooShort = await get('/jobs/semantic?q=x');
    check('single-char query → 422', tooShort.status === 422, String(tooShort.status));

    const direct = await searchJobsSemantic({ query: 'backend node developer', limit: 5 });
    check('service returns ≤ limit matches', direct.matches.length <= 5, String(direct.matches.length));
    check('service matches sorted desc', direct.matches.every((m, i) => i === 0 || direct.matches[i - 1].match_score >= m.match_score));
    check('service why non-empty', direct.matches.every((m) => m.why.length > 5));
  }

  // =========================================================================
  section('11. Skill gap analysis over real rows (HTTP)');
  // =========================================================================
  {
    // Find a published job with at least two skills.
    let targetJob: IJob | null = null;
    let targetSkillRows: Array<{ skill_id: string; importance: JobSkillImportance; skill?: { name: string } }> = [];
    for (const job of await jobRepository.findPublishedMatching({})) {
      const rows = await jobSkillRepository.listByJob(job.id);
      if (rows.length >= 2) {
        targetJob = job;
        targetSkillRows = rows;
        break;
      }
    }
    check('a published job with ≥2 skills exists', targetJob !== null);

    if (targetJob) {
      const response = await get(`/ai/skill-gap?job_id=${targetJob.id}`, seeker.token);
      check('skill-gap → 200', response.status === 200, `${response.status} ${errorInfo(response.body)}`);
      const report = asRecord(dataOf(response).report);
      const items = asArray(report.items);
      check('one item per job skill', items.length === targetSkillRows.length, `${items.length} vs ${targetSkillRows.length}`);
      check('ai_configured reflects the server', report.ai_configured === keyed);
      check('total_gap = sum of item gaps', Number(report.total_gap) === items.reduce((sum, item) => sum + Number(item.gap), 0), String(report.total_gap));
      check('every item has a learning tip', items.every((item) => typeof item.learning_tip === 'string' && String(item.learning_tip).length > 10));
      check('statuses are MATCHED/MISSING only', items.every((item) => item.status === 'MATCHED' || item.status === 'MISSING'));
      check('targets are 80/60 only', items.every((item) => Number(item.target_level) === 80 || Number(item.target_level) === 60));
      check('match_score present for a real candidate', typeof report.match_score === 'number' && Number(report.match_score) >= 0 && Number(report.match_score) <= 100, String(report.match_score));
      const missing = items.filter((item) => item.status === 'MISSING');
      check('critical gaps ⊆ missing with gap ≥ 30', asArray(report.critical_gaps).every((gapItem) => Number(gapItem.gap) >= 30 && gapItem.status === 'MISSING') && asArray(report.critical_gaps).length === missing.filter((item) => Number(item.gap) >= 30).length);
    }
  }

  // =========================================================================
  section('12. Resume apply → profile merge (snapshot/restored)');
  // =========================================================================
  {
    const seedResume = (await resumeRepository.listByJobseeker(
      (await jobseekerProfileRepository.findByUserId(seeker.userId))!.id,
    ))[0];
    check('seed resume exists for parse-ownership cases', Boolean(seedResume));

    // parseStoredResume guards run BEFORE the AI call → testable offline.
    const notFound = await parseStoredResume(
      seeker.userId,
      '00000000-0000-4000-8000-000000000999',
      SAMPLE_RESUME,
    ).then(() => null, (error: { statusCode?: number }) => error.statusCode ?? 0);
    check('unknown resume id → 404', notFound === 404, String(notFound));

    activeSnapshot = await takeSnapshot(seeker.userId);
    const catalog = await skillRepository.findAllActive();
    const heldIds = new Set(activeSnapshot.skillIds);
    const freshCatalogSkill = catalog.find((skill) => !heldIds.has(skill.id));

    const payload: IParsedResume = {
      name: 'Zed Tester',
      email: 'zed.tester@example.com',
      phone: '+977-9800000999',
      city: 'Pokhara',
      country: 'Nepal',
      headline: 'QA Automation Engineer',
      summary: 'Detail-oriented QA engineer automating web tests.',
      education: [
        { institution: 'Test University', degree: 'BSc', field_of_study: 'Maths', start_date: '2015-01', end_date: '2019-01' },
      ],
      experience: [
        { company_name: 'Test Co', job_title: 'QA Analyst', start_date: '2019-02', end_date: null, is_current: true, description: 'Automated web tests.' },
      ],
      skills: [
        'Quantum Basket Weaving XYZ',
        'Flux Capacitor Design',
        freshCatalogSkill?.name ?? 'Quantum Basket Weaving XYZ',
      ].filter((v, i, a) => a.indexOf(v) === i),
      certifications: ['ISTQB Foundation'],
    };

    // --- pass 1: fill-only-empty ---------------------------------------
    const before1 = await takeSnapshot(seeker.userId);
    const applied1 = await applyParsedResume(seeker.userId, payload, false);
    check('apply pass 1 runs', Boolean(applied1));
    check(
      'existing headline NOT overwritten without overwrite flag',
      before1.headline === null || !applied1.profile_fields_updated.includes('headline'),
      `headline="${before1.headline}" updated=${applied1.profile_fields_updated.join('|')}`,
    );
    check(
      'empty scalar fields filled',
      (before1.summary !== null || applied1.profile_fields_updated.includes('professional_summary')) &&
        (before1.city !== null || applied1.profile_fields_updated.includes('city')),
      applied1.profile_fields_updated.join(','),
    );
    if (freshCatalogSkill) {
      check('catalog skill linked', applied1.skills_added.includes(freshCatalogSkill.name), applied1.skills_added.join(','));
      check(
        'unknown skills reported unmatched',
        applied1.skills_unmatched.includes('Quantum Basket Weaving XYZ') &&
          applied1.skills_unmatched.includes('Flux Capacitor Design'),
        applied1.skills_unmatched.join(','),
      );
    } else {
      info('no unused catalog skill available — skipping linked-skill assertions');
      check(
        'unknown skills reported unmatched',
        applied1.skills_unmatched.includes('Quantum Basket Weaving XYZ'),
        applied1.skills_unmatched.join(','),
      );
    }
    check('one education added', applied1.educations_added === 1, String(applied1.educations_added));
    check('one experience added', applied1.experiences_added === 1, String(applied1.experiences_added));

    const after1 = await takeSnapshot(seeker.userId);
    check('phone filled when empty', before1.phone !== null || after1.phone === payload.phone);

    // --- pass 2: overwrite ----------------------------------------------
    const applied2 = await applyParsedResume(seeker.userId, payload, true);
    const after2 = await takeSnapshot(seeker.userId);
    check('overwrite updates headline', applied2.profile_fields_updated.includes('headline'), applied2.profile_fields_updated.join(','));
    check('headline now the parsed value', after2.headline === payload.headline, String(after2.headline));
    check('overwrite does not duplicate education', applied2.educations_added === 0, String(applied2.educations_added));
    check('overwrite does not duplicate experience', applied2.experiences_added === 0, String(applied2.experiences_added));
    check('name applied on overwrite', after2.firstName === 'Zed', `${after2.firstName} ${after2.lastName}`);

    // --- pass 3: idempotency --------------------------------------------
    const applied3 = await applyParsedResume(seeker.userId, payload, false);
    check('third pass adds nothing', applied3.educations_added === 0 && applied3.experiences_added === 0 && applied3.skills_added.length === 0, JSON.stringify(applied3));
    check('third pass reports no scalar changes', applied3.profile_fields_updated.length === 0, applied3.profile_fields_updated.join(','));
  }

  // =========================================================================
  section('13. Upload endpoint guards (multipart)');
  // =========================================================================
  {
    const noAuthUpload = await uploadFile('/ai/resume/parse/file', '', 'resume.pdf', buildMinimalPdf(SAMPLE_RESUME), 'application/pdf');
    check('unauthenticated upload → 401', noAuthUpload.status === 401, String(noAuthUpload.status));

    const txtUpload = await uploadFile('/ai/resume/parse/file', seeker.token, 'resume.txt', Buffer.from(SAMPLE_RESUME, 'utf-8'), 'text/plain');
    check('txt rejected → 400', txtUpload.status === 400, `${txtUpload.status} ${errorInfo(txtUpload.body)}`);

    const corruptUpload = await uploadFile('/ai/resume/parse/file', seeker.token, 'resume.pdf', Buffer.from('this is not a pdf at all, just bytes', 'utf-8'), 'application/pdf');
    check('corrupt pdf → 400 (not 500)', corruptUpload.status === 400, `${corruptUpload.status} ${errorInfo(corruptUpload.body)}`);

    const validUpload = await uploadFile('/ai/resume/parse/file', seeker.token, 'resume.pdf', buildMinimalPdf(SAMPLE_RESUME), 'application/pdf');
    if (keyed) {
      check('valid pdf (keyed) → 201 with parsed payload', validUpload.status === 201, `${validUpload.status} ${errorInfo(validUpload.body)}`);
      const parsed = asRecord(dataOf(validUpload).parsed);
      check('upload parse found contact info', typeof parsed.email === 'string' || typeof parsed.name === 'string', JSON.stringify(parsed).slice(0, 120));
    } else {
      const error = asRecord(validUpload.body.error);
      check(
        'valid pdf extracted, then 503 AI_NOT_CONFIGURED',
        validUpload.status === 503 && error.code === 'AI_NOT_CONFIGURED',
        `${validUpload.status} ${errorInfo(validUpload.body)}`,
      );
    }
  }

  // =========================================================================
  section('14. LIVE: generative paths (requires OPENAI_API_KEY)');
  // =========================================================================
  if (keyed) {
    // 1+2. Resume parse + improve
    try {
      const parsed = await parseResumeText(SAMPLE_RESUME);
      check('live parse: name extracted', parsed.name === 'Jane Doe', String(parsed.name));
      check('live parse: email extracted', parsed.email === 'jane.doe@example.com', String(parsed.email));
      check('live parse: skills extracted', parsed.skills.length >= 3, parsed.skills.join(','));
      check('live parse: education extracted', parsed.education.length >= 1, String(parsed.education.length));
      check('live parse: experience extracted', parsed.experience.length >= 1, String(parsed.experience.length));
      check('live parse: certifications extracted', parsed.certifications.length >= 1, parsed.certifications.join(','));
    } catch (error) {
      check('live parse ran', false, (error as Error).message);
    }

    try {
      const suggestions = await improveResume({ text: SAMPLE_RESUME, target_role: 'Frontend Developer' });
      check('live improve: suggestions returned', suggestions.length >= 1, String(suggestions.length));
      check('live improve: typed shape', suggestions.every((s) => s.area && s.suggestion && s.reason));
      info(`live improve produced ${suggestions.length} suggestion(s)`);
    } catch (error) {
      check('live improve ran', false, (error as Error).message);
    }

    // 3. JD generate + improve
    try {
      const draft = await generateJobDescription({
        title: 'Frontend Developer',
        requirements: 'React, 3 years, TypeScript',
        tone: 'FORMAL',
      });
      check('live jd: overview present', draft.overview.length > 40, String(draft.overview.length));
      check('live jd: responsibilities ≥3', draft.responsibilities.length >= 3, String(draft.responsibilities.length));
      check('live jd: skills ≥3', draft.required_skills.length >= 3, String(draft.required_skills.length));
      check('live jd: qualifications present', draft.required_qualifications.length >= 1, String(draft.required_qualifications.length));
      check('live jd: tone echoed', draft.tone === 'FORMAL');

      const retone = await improveJobDescription({ draft, action: 'CHANGE_TONE', tone: 'EXCITING' });
      check('live jd improve: tone switched', retone.tone === 'EXCITING');
      check('live jd improve: content kept', retone.overview.length > 20 && retone.responsibilities.length >= 1);

      const shorter = await improveJobDescription({ draft, action: 'ADJUST_LENGTH', length: 'SHORTER' });
      check('live jd improve: shorter pass returns a draft', shorter.overview.length > 0 && shorter.responsibilities.length >= 1);
      info(`generated ${draft.responsibilities.length} responsibilities, shortened to ${shorter.responsibilities.length}`);
    } catch (error) {
      check('live jd generate/improve ran', false, (error as Error).message);
    }

    // 4. Career assistant (HTTP, persisted + cleared)
    try {
      const chat = await post('/ai/career-assistant/message', seeker.token, {
        message: 'I am a React developer with 3 years experience. What should I learn next?',
        quick_action: 'SKILL_ANALYSIS',
      });
      check('live chat → 201', chat.status === 201, `${chat.status} ${errorInfo(chat.body)}`);
      const reply = String(dataOf(chat).reply ?? '');
      check('live chat: reply is substantial', reply.length >= 40, String(reply.length));
      check('live chat: quick action echoed', dataOf(chat).quick_action === 'SKILL_ANALYSIS', String(dataOf(chat).quick_action));

      const history = await get('/ai/career-assistant/history', seeker.token);
      const historyRows = asArray(dataOf(history).history);
      check('live chat: history persisted (≥2 turns)', historyRows.length >= 2, String(historyRows.length));

      const cleared = await del('/ai/career-assistant/history', seeker.token);
      const after = await get('/ai/career-assistant/history', seeker.token);
      check('live chat: history cleared', cleared.status === 200 && asArray(dataOf(after).history).length === 0);
    } catch (error) {
      check('live chat ran', false, (error as Error).message);
    }

    // 6. Interview prep (generate → answer → score → cleanup)
    let liveSessionId: string | null = null;
    try {
      const created = await post('/ai/interview/sessions', seeker.token, {
        job_title: 'Frontend Developer',
        industry: 'Software',
        skills: ['React', 'TypeScript'],
        question_count: 3,
      });
      check('live interview: session → 201', created.status === 201, `${created.status} ${errorInfo(created.body)}`);
      const session = asRecord(dataOf(created).session);
      liveSessionId = typeof session.id === 'string' ? session.id : null;
      const questions = asArray(session.questions);
      check('live interview: 3 questions generated', questions.length === 3, String(questions.length));
      check('live interview: questions have categories', questions.every((q) => String(q.category).length > 0));
      check('live interview: session stored (GET round-trip)', Boolean(liveSessionId));

      if (liveSessionId) {
        const fetched = await get(`/ai/interview/sessions/${liveSessionId}`, seeker.token);
        const fetchedSession = asRecord(dataOf(fetched).session);
        check('live interview: GET returns the session', fetched.status === 200 && asArray(fetchedSession.questions).length === 3);

        const questionId = String(asArray(fetchedSession.questions)[0].id);
        const answered = await post(
          `/ai/interview/sessions/${liveSessionId}/questions/${questionId}/answer`,
          seeker.token,
          {
            answer:
              'In my last role I rebuilt our checkout flow in React, cut load time by 40 percent, and wrote tests to keep it stable. I would apply the same approach here.',
          },
        );
        check('live interview: answer scored → 200', answered.status === 200, `${answered.status} ${errorInfo(answered.body)}`);
        const feedback = asRecord(dataOf(answered).feedback);
        const breakdown = asRecord(feedback.breakdown);
        check('live interview: score 0-100', Number(feedback.score) >= 0 && Number(feedback.score) <= 100, String(feedback.score));
        check('live interview: breakdown complete', ['relevance', 'structure', 'specificity', 'communication'].every((k) => Number(breakdown[k]) >= 0 && Number(breakdown[k]) <= 100), JSON.stringify(breakdown));
        check('live interview: strengths + improvements + insight', asArray(feedback.strengths).length >= 1 && asArray(feedback.improvements).length >= 1 && String(feedback.insight ?? '').length > 10);

        const afterAnswer = await get(`/ai/interview/sessions/${liveSessionId}`, seeker.token);
        const afterQuestions = asArray(asRecord(dataOf(afterAnswer).session).questions);
        check('live interview: answer persisted on the question', afterQuestions[0].score !== null && afterQuestions[0].answer !== null, JSON.stringify(afterQuestions[0]).slice(0, 120));
        info(`practice answer scored ${String(feedback.score)}/100`);
      }
    } catch (error) {
      check('live interview prep ran', false, (error as Error).message);
    } finally {
      if (liveSessionId) {
        await getSequelize().query('DELETE FROM interview_practice_sessions WHERE id = :id', {
          replacements: { id: liveSessionId },
        });
      }
    }

    // 7. Semantic search in SEMANTIC mode
    try {
      const semantic = await searchJobsSemantic({ query: 'remote frontend developer', limit: 5 });
      check('live semantic: mode SEMANTIC', semantic.mode === 'SEMANTIC', semantic.mode);
      check('live semantic: matches returned', semantic.matches.length >= 1, String(semantic.matches.length));
      check('live semantic: scores 0-100', semantic.matches.every((m) => m.match_score >= 0 && m.match_score <= 100));
      info(`semantic top score: ${semantic.matches[0]?.match_score}`);
    } catch (error) {
      check('live semantic search ran', false, (error as Error).message);
    }

    // 1b. HTTP parse with the key present
    try {
      const httpParse = await post('/ai/resume/parse', seeker.token, { text: SAMPLE_RESUME });
      check('live HTTP parse → 201', httpParse.status === 201, `${httpParse.status} ${errorInfo(httpParse.body)}`);
    } catch (error) {
      check('live HTTP parse ran', false, (error as Error).message);
    }
  } else {
    info('SKIPPED — add OPENAI_API_KEY to .env.local to run the live LLM sections');
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
      try {
        // Restore the seeded jobseeker exactly as we found them.
        if (activeSnapshot) {
          await restoreSnapshot(seekerUserIdCache, activeSnapshot);
          info('profile snapshot restored');
        }
      } catch (error) {
        console.error('failed to restore profile snapshot:', error);
      }
      try {
        // Remove chat history created by the live section.
        if (seekerUserIdCache) await aiChatMessageRepository.clearForUser(seekerUserIdCache);
      } catch (error) {
        console.error('failed to clear chat history:', error);
      }
      await closeConnection();

      console.log(`\n${'='.repeat(60)}`);
      if (failures.length === 0) {
        console.log(`ALL PASSED — ${passed} assertions`);
      } else {
        console.log(`${failures.length} FAILED / ${passed + failures.length} assertions`);
        for (const failure of failures) console.log(`  - ${failure}`);
        process.exitCode = 1;
      }
      console.log('='.repeat(60));
      process.exit(process.exitCode ?? 0);
    })();
  });
