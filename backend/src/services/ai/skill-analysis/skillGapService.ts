import { ISkillGapItem, ISkillGapReport } from '../../../interfaces';
import { JobSkillImportance } from '../../../enums';
import { jobRepository, jobSkillRepository, jobseekerProfileSkillRepository } from '../../../repositories';
import { AppError } from '../../../utils';
import { isAIConfigured } from '../shared/aiConfig';
import {
  calculateMatchScore,
  loadSignalsForUser,
} from '../../algorithms/matching/jobMatchingService';

/**
 * AI skill gap analysis (Phase 2, feature 5).
 *
 * Compares a candidate's profile skills against one job's REQUIRED and
 * PREFERRED skills and reports matched/missing items with learning tips —
 * radar/bar-chart friendly (total gap, average gap, critical gaps,
 * strengths) per the reference design.
 *
 * Proficiency is estimated deterministically:
 *   - held skill: 75 base, +15 when years of experience cover the job's
 *     minimum, +10 when headline/summary mentions the skill → up to 100;
 *   - not held: 0-30 via token overlap with skills the candidate does hold
 *     (the skills table has no categories, so relatedness is lexical).
 * Targets: REQUIRED 80, PREFERRED 60.
 *
 * Learning tips come from a static library — the endpoint works without an
 * OPENAI_API_KEY (`ai_configured: false` flags the degraded mode).
 */

const HELD_BASE = 75;
const YEARS_BONUS = 15;
const MENTION_BONUS = 10;
const RELATED_MAX = 30;
const TARGET_REQUIRED = 80;
const TARGET_PREFERRED = 60;
/** Gaps at or above this are "critical" (the radar's red ring). */
const CRITICAL_GAP = 30;

/** Static learning library keyed by lowercase skill-name fragment. */
const LEARNING_TIPS: Array<{ match: RegExp; tip: string }> = [
  { match: /react|vue|angular|svelte/, tip: 'Build a small production-style app and deploy it; then study one senior codebase on GitHub.' },
  { match: /next\.?js|nuxt|remix/, tip: 'Ship a full-stack page with SSR, data fetching and auth — the docs tutorials cover this in a weekend.' },
  { match: /typescript|javascript/, tip: 'Convert an existing side project to strict TypeScript; read the handbook chapters on generics and narrowing.' },
  { match: /node|express|nest/, tip: 'Build a REST API with validation, tests and Docker; then read "Designing Data-Intensive Applications" chapters on APIs.' },
  { match: /python/, tip: 'Complete a focused track (automation or data) and solve 30-50 exercises on Exercism/LeetCode in Python.' },
  { match: /django|flask|fastapi/, tip: 'Build and deploy one small service end-to-end; read the official "extend the framework" docs.' },
  { match: /\bsql\b|postgres|mysql/, tip: 'Practice joins, window functions and query plans on SQLZoo/Mode Analytics; read EXPLAIN output for your own queries.' },
  { match: /docker|kubernetes|k8s/, tip: 'Containerize an existing project, then run a 3-node local cluster with kind/k3d.' },
  { match: /aws|azure|gcp|cloud/, tip: 'Earn one associate-level cloud certification path and deploy a serverless app with IaC (Terraform).'},
  { match: /ci\/cd|jenkins|github actions|gitlab ci/, tip: 'Add a pipeline to a personal repo: lint, test, build, deploy on tag.' },
  { match: /figma|ui\/ux|user research/, tip: 'Redesign an existing product screen and write a short rationale; practise auto-layout and components.' },
  { match: /machine learning|tensorflow|pytorch|nlp/, tip: 'Finish one structured course then reproduce a paper baseline on a public dataset.' },
  { match: /marketing|seo|sem|content/, tip: 'Run a personal project blog to first-page rankings for a low-competition keyword and document the process.' },
  { match: /finance|accounting|quickbooks|tally/, tip: 'Work through official certification modules and reconcile a sample monthly close.' },
  { match: /communication|leadership|teamwork|problem solving/, tip: 'Use the STAR method: write three stories from real projects and rehearse them aloud.' },
  { match: /project management|agile|scrum|jira/, tip: 'Shadow or run one sprint as facilitator; get familiar with backlog grooming and demo framing.' },
];

const GENERIC_TIP = (skill: string): string =>
  `Take one structured course on ${skill}, then apply it in a small project you can show in interviews.`;

/** Find a static tip for a skill name. */
export const learningTipFor = (skill: string): string => {
  const lower = skill.toLowerCase();
  for (const entry of LEARNING_TIPS) {
    if (entry.match.test(lower)) return entry.tip;
  }
  return GENERIC_TIP(skill);
};

const normalizeToken = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9+#.]/g, '');

/** 0-30: how close a candidate's held skills are to a missing skill. */
export const relatednessLevel = (missing: string, held: string[]): number => {
  const target = normalizeToken(missing);
  if (!target) return 0;

  for (const candidate of held) {
    const token = normalizeToken(candidate);
    if (!token) continue;
    if (token === target) return RELATED_MAX;
    if (token.includes(target) || target.includes(token)) {
      return Math.round(RELATED_MAX * 0.7);
    }
    // Shared significant fragment (e.g. "react" vs "react native").
    const shorter = token.length <= target.length ? token : target;
    const longer = token.length <= target.length ? target : token;
    if (shorter.length >= 4 && longer.includes(shorter)) {
      return Math.round(RELATED_MAX * 0.5);
    }
  }
  return 0;
};

interface IJobSkillRow {
  skill_id: string;
  skill_name: string;
  importance: JobSkillImportance;
  minimum_experience: number | null;
}

/**
 * Pure core: build the gap report from already-loaded rows.
 * Exported for tests — no I/O here.
 */
export const buildGapReport = (input: {
  job_id: string;
  job_title: string;
  jobSkills: IJobSkillRow[];
  heldSkills: string[];
  headline: string | null;
  summary: string | null;
  years_experience: number;
  match_score: number | null;
  ai_configured: boolean;
}): ISkillGapReport => {
  const profileText = `${input.headline ?? ''} ${input.summary ?? ''}`.toLowerCase();
  const items: ISkillGapItem[] = [];

  for (const jobSkill of input.jobSkills) {
    const heldIndex = input.heldSkills.findIndex(
      (name) => normalizeToken(name) === normalizeToken(jobSkill.skill_name),
    );
    const held = heldIndex >= 0;
    const target = jobSkill.importance === JobSkillImportance.REQUIRED ? TARGET_REQUIRED : TARGET_PREFERRED;

    let current = 0;
    if (held) {
      current = HELD_BASE;
      if (
        jobSkill.minimum_experience !== null &&
        input.years_experience >= jobSkill.minimum_experience
      ) {
        current += YEARS_BONUS;
      }
      if (profileText.includes(jobSkill.skill_name.toLowerCase())) {
        current += MENTION_BONUS;
      }
      current = Math.min(100, current);
    } else {
      current = relatednessLevel(jobSkill.skill_name, input.heldSkills);
    }

    const gap = Math.max(0, target - current);
    items.push({
      skill_id: jobSkill.skill_id,
      skill: jobSkill.skill_name,
      importance: jobSkill.importance === JobSkillImportance.REQUIRED ? 'REQUIRED' : 'PREFERRED',
      status: current >= target ? 'MATCHED' : 'MISSING',
      current_level: current,
      target_level: target,
      gap,
      learning_tip: learningTipFor(jobSkill.skill_name),
    });
  }

  // Stable order: biggest gaps first, REQUIRED before PREFERRED on ties.
  items.sort((a, b) => b.gap - a.gap || a.importance.localeCompare(b.importance));

  const totalGap = items.reduce((sum, item) => sum + item.gap, 0);
  return {
    job_id: input.job_id,
    job_title: input.job_title,
    total_gap: totalGap,
    average_gap: items.length > 0 ? Math.round(totalGap / items.length) : 0,
    critical_gaps: items.filter((item) => item.status === 'MISSING' && item.gap >= CRITICAL_GAP),
    strengths: items.filter((item) => item.status === 'MATCHED'),
    items,
    match_score: input.match_score,
    ai_configured: input.ai_configured,
  };
};

/** Analyse one user against one job (DB assembly + pure core). */
export const analyseSkillGap = async (userId: string, jobId: string): Promise<ISkillGapReport> => {
  const job = await jobRepository.findById(jobId);
  if (!job) throw AppError.notFound('Job not found');

  const [jobSkillRows, heldSkills, signals] = await Promise.all([
    jobSkillRepository.listByJob(jobId),
    jobseekerProfileSkillRepository.listByUserId(userId),
    loadSignalsForUser(userId),
  ]);

  const matchScore = signals ? calculateMatchScore(job, jobSkillRows, signals).score : null;

  return buildGapReport({
    job_id: job.id,
    job_title: job.title,
    jobSkills: jobSkillRows.map((row) => ({
      skill_id: row.skill_id,
      skill_name: row.skill?.name ?? '',
      importance: row.importance,
      minimum_experience: row.minimum_experience,
    })).filter((row) => row.skill_name.length > 0),
    heldSkills: heldSkills.map((skill) => skill.name),
    headline: signals?.headline ?? null,
    summary: signals?.summary ?? null,
    years_experience: signals?.years_experience ?? 0,
    match_score: matchScore,
    ai_configured: isAIConfigured(),
  });
};

export const skillGapService = { analyseSkillGap, buildGapReport, learningTipFor, relatednessLevel };

export default skillGapService;
