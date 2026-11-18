import { getSequelize } from '../../../config';
import { AppError } from '../../../utils';
import {
  IApplyResult,
  IParsedEducation,
  IParsedExperience,
  IParsedResume,
} from '../../../interfaces';
import {
  educationRepository,
  jobseekerProfileRepository,
  jobseekerProfileSkillRepository,
  resumeRepository,
  skillRepository,
  userRepository,
  workExperienceRepository,
} from '../../../repositories';
import { EmploymentType } from '../../../enums';
import { requireAI } from '../shared/aiConfig';
import { chatJSON } from '../shared/openaiClient';
import { asObjectArray, asString, asStringArray, parseLooseDate } from '../shared/coerce';
import { extractResumeText } from '../shared/textExtract';

/**
 * AI resume parser (Phase 2, feature 1).
 *
 * Two stages:
 *   1. `parse*` — file/text in, structured `IParsedResume` out (LLM).
 *   2. `applyParsedResume` — structured payload merged into the jobseeker
 *      profile with conservative, idempotent rules:
 *        - scalar fields fill only when empty (unless `overwrite`);
 *        - skills union with the existing set, matched against the catalog;
 *        - education / experience entries are de-duplicated, never replaced.
 *
 * The parser never guesses: fields the model cannot find stay null and are
 * simply not applied.
 */

const SYSTEM_PROMPT = `You are a precision resume parsing engine.
Extract structured data from the resume text the user provides.
Rules:
- Respond with ONLY a JSON object, no prose, no markdown fences.
- Use null for any field you cannot find with confidence.
- Dates use "YYYY-MM" or "YYYY-MM-DD" when known, else null.
- is_current is true when the role has no end date or says Present/Current.
- skills = concrete technologies/methods only (no soft traits like "hardworking").
- certifications = certificates and licenses only.
- headline = the person's professional title/positioning line.
- Keep descriptions verbatim-ish, plain text, no line-break characters inside strings.
JSON shape:
{
  "name": string|null,
  "email": string|null,
  "phone": string|null,
  "city": string|null,
  "country": string|null,
  "headline": string|null,
  "summary": string|null,
  "education": [{"institution": string, "degree": string, "field_of_study": string|null, "start_date": string|null, "end_date": string|null}],
  "experience": [{"company_name": string, "job_title": string, "start_date": string|null, "end_date": string|null, "is_current": boolean, "description": string|null}],
  "skills": string[],
  "certifications": string[]
}`;

/** Normalise the model's JSON into a full `IParsedResume`. */
export const normalizeParsedResume = (raw: unknown): IParsedResume => {
  const record = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;

  const education: IParsedEducation[] = asObjectArray(record.education)
    .map((entry) => ({
      institution: asString(entry.institution),
      degree: asString(entry.degree),
      field_of_study: asString(entry.field_of_study),
      start_date: asString(entry.start_date),
      end_date: asString(entry.end_date),
    }))
    .filter((entry): entry is IParsedEducation => Boolean(entry.institution && entry.degree));

  const experience: IParsedExperience[] = asObjectArray(record.experience)
    .map((entry) => ({
      company_name: asString(entry.company_name),
      job_title: asString(entry.job_title),
      start_date: asString(entry.start_date),
      end_date: asString(entry.end_date),
      is_current: entry.is_current === true || /^(present|current)$/i.test(String(entry.end_date ?? '')),
      description: asString(entry.description),
    }))
    .filter((entry): entry is IParsedExperience => Boolean(entry.company_name && entry.job_title));

  return {
    name: asString(record.name),
    email: asString(record.email),
    phone: asString(record.phone),
    city: asString(record.city),
    country: asString(record.country),
    headline: asString(record.headline),
    summary: asString(record.summary),
    education,
    experience,
    skills: asStringArray(record.skills),
    certifications: asStringArray(record.certifications),
  };
};

/** Run the LLM over extracted resume text. `requireAI()` guards the call. */
export const parseResumeText = async (text: string): Promise<IParsedResume> => {
  requireAI();
  const trimmed = text.trim();
  if (trimmed.length < 20) {
    throw AppError.badRequest('Resume text is too short to parse');
  }

  const raw = await chatJSON<unknown>({
    system: SYSTEM_PROMPT,
    user: `Resume text:\n\n${trimmed.slice(0, 12000)}`,
    temperature: 0.1,
  });
  return normalizeParsedResume(raw);
};

/** File buffer in, structured payload out (pdf/doc/docx/txt). */
export const parseResumeFile = async (
  buffer: Buffer,
  fileName: string,
  mimeType?: string | null,
): Promise<IParsedResume> => {
  const { text } = await extractResumeText(buffer, fileName, mimeType);
  return parseResumeText(text);
};

const sameText = (a: string | null, b: string | null): boolean =>
  Boolean(a && b && a.trim().toLowerCase() === b.trim().toLowerCase());

/**
 * Merge a parsed payload into the user's profile (idempotent).
 *
 * @param overwrite when true, non-empty parsed values replace existing ones
 *                  (scalars only — skills union, entries still de-duped).
 */
export const applyParsedResume = async (
  userId: string,
  parsed: IParsedResume,
  overwrite = false,
): Promise<IApplyResult> => {
  const profile = await jobseekerProfileRepository.findByUserId(userId);
  if (!profile) throw AppError.notFound('Jobseeker profile not found');

  const result: IApplyResult = {
    profile_fields_updated: [],
    skills_added: [],
    skills_unmatched: [],
    educations_added: 0,
    experiences_added: 0,
  };

  // --- scalar profile fields: fill-only-empty unless overwrite -----------
  const profileUpdates: Record<string, string> = {};
  const fill = (field: string, incoming: string | null): void => {
    if (!incoming) return;
    const current = (profile as unknown as Record<string, string | null>)[field];
    if (overwrite || !current) {
      if (current !== incoming) {
        profileUpdates[field] = incoming;
        result.profile_fields_updated.push(field);
      }
    }
  };
  fill('headline', parsed.headline);
  fill('professional_summary', parsed.summary);
  fill('city', parsed.city);
  fill('country', parsed.country);

  if (Object.keys(profileUpdates).length > 0) {
    await jobseekerProfileRepository.updateByUserId(userId, profileUpdates);
  }

  // --- contact details on the user record --------------------------------
  const user = await userRepository.findById(userId);
  if (user) {
    const userUpdates: Record<string, string> = {};
    if (parsed.phone && (overwrite || !user.phone)) userUpdates.phone = parsed.phone;
    // Name is identity: only replaced when the caller explicitly overwrites.
    if (overwrite && parsed.name) {
      const parts = parsed.name.split(/\s+/);
      userUpdates.first_name = parts[0];
      userUpdates.last_name = parts.slice(1).join(' ') || parts[0];
    }
    if (Object.keys(userUpdates).length > 0) {
      await userRepository.update(userId, userUpdates);
      result.profile_fields_updated.push(...Object.keys(userUpdates));
    }
  }

  // --- skills: union, matched case-insensitively against the catalog -----
  if (parsed.skills.length > 0) {
    const catalog = await skillRepository.findAllActive();
    const byName = new Map(catalog.map((skill) => [skill.name.toLowerCase(), skill.id]));

    const existing = await jobseekerProfileSkillRepository.listByUserId(userId);
    const currentIds = new Set(existing.map((skill) => skill.id));
    const currentNames = new Set(existing.map((skill) => skill.name.toLowerCase()));

    for (const name of parsed.skills) {
      const normalized = name.toLowerCase();
      if (currentNames.has(normalized)) continue;
      const skillId = byName.get(normalized);
      if (skillId) {
        currentIds.add(skillId);
        currentNames.add(normalized);
        result.skills_added.push(name);
      } else {
        result.skills_unmatched.push(name);
      }
    }
    if (result.skills_added.length > 0) {
      await jobseekerProfileSkillRepository.replaceByUserId(userId, [...currentIds]);
    }
  }

  // --- education: append when (institution, degree) not already present ---
  const existingEducations = await educationRepository.listByJobseeker(profile.id);
  for (const entry of parsed.education) {
    const duplicate = existingEducations.some(
      (existing) =>
        sameText(existing.institution, entry.institution) &&
        sameText(existing.degree, entry.degree),
    );
    if (duplicate) continue;
    await educationRepository.create({
      jobseeker_id: profile.id,
      institution: entry.institution,
      degree: entry.degree,
      field_of_study: entry.field_of_study,
      start_date: parseLooseDate(entry.start_date),
      end_date: parseLooseDate(entry.end_date),
      is_current: entry.is_current,
    });
    result.educations_added += 1;
  }

  // --- experience: append when (company, title) not already present -------
  const existingExperience = await workExperienceRepository.listByJobseeker(profile.id);
  for (const entry of parsed.experience) {
    const duplicate = existingExperience.some(
      (existing) =>
        sameText(existing.company_name, entry.company_name) &&
        sameText(existing.job_title, entry.job_title),
    );
    if (duplicate) continue;

    const startDate = parseLooseDate(entry.start_date);
    if (!startDate) continue; // start_date is NOT NULL — skip unusable rows
    await workExperienceRepository.create({
      jobseeker_id: profile.id,
      company_name: entry.company_name,
      job_title: entry.job_title,
      employment_type: EmploymentType.FULL_TIME,
      start_date: startDate,
      end_date: parseLooseDate(entry.end_date),
      is_current: entry.is_current || !entry.end_date,
      description: entry.description,
    });
    result.experiences_added += 1;
  }

  return result;
};

/**
 * Parse a stored resume (by id) and cache the payload on the row
 * (`resumes.parsed_payload` / `parsed_at`). Applying to the profile is a
 * separate, explicit step (`applyParsedResume`).
 */
export const parseStoredResume = async (
  userId: string,
  resumeId: string,
  text: string,
): Promise<IParsedResume> => {
  const resume = await resumeRepository.findById(resumeId);
  if (!resume) throw AppError.notFound('Resume not found');

  const profile = await jobseekerProfileRepository.findByUserId(userId);
  if (!profile || profile.id !== resume.jobseeker_id) {
    throw AppError.forbidden('Resume does not belong to this profile');
  }

  const parsed = await parseResumeText(text);

  await getSequelize().query(
    `UPDATE resumes SET parsed_payload = :payload::jsonb, parsed_at = NOW(), updated_at = NOW()
     WHERE id = :resumeId`,
    { replacements: { resumeId, payload: JSON.stringify(parsed) } },
  );

  return parsed;
};

export const resumeParserService = {
  parseResumeText,
  parseResumeFile,
  applyParsedResume,
  normalizeParsedResume,
  parseStoredResume,
};

export default resumeParserService;
