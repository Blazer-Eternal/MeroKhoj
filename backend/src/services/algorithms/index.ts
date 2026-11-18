/**
 * Phase 1 algorithms — self-contained intelligent capabilities.
 *
 * recommendation/  personalized feeds + smart alerts (jobseeker-facing)
 * matching/        candidate ↔ job match score (recruiter-facing)
 * ranking/         pure scoring + ordering for jobs and candidates
 * salary-estimation/ salary ranges from the board's own postings
 * analytics/       funnels, conversion, time-to-hire, per-job performance
 *
 * `ai/` (Phase 2: resume parsing, JD generation, semantic search, …) will
 * sit beside this folder so algorithms and AI stay clearly separated.
 */
export * from './recommendation';
export * from './matching';
export * from './ranking';
export * from './salary-estimation';
export * from './analytics';
