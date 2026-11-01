# MeroKhoj Backend — Entities 13–36 Build Plan

## Phase 1: Jobseeker profiles & job classification (13–18)
- [x] 13 educations (jobseeker_id → jobseeker_profiles.id)
- [x] 14 work_experiences
- [x] 15 resumes (partial unique default resume index)
- [x] 16 job_categories (self-FK, cycle prevention)
- [x] 17 industries
- [x] 18 locations (lat/lng bounds)
- [x] jobs: + category_id, industry_id, location_id; companies: + industry_id (ALTER migration)
- [x] seeder: sample categories, industries, Nepal locations
- [x] tsc + eslint clean; migrations + seeders ran

## Phase 2: Administration, verification & auditing (29–32)
- [x] 29 company_verifications (sync companies.verification_status; history preserved)
- [x] 30 job_moderation (action → consistent job status; audit)
- [x] 31 reports (entity_type/entity_id app-level validation; status transitions)
- [x] 32 audit_logs (append-only; admin list; helper used by later phases)

## Phase 3: Jobseeker & talent management (24–28)
- [x] 24 saved_jobs (unique; PUBLISHED only)
- [x] 25 job_alerts (+ worker service; setInterval scheduler in server.ts)
- [x] 26 notifications (read_at; index user_id+is_read+created_at; create helper)
- [x] 27 talent_rosters (company isolation)
- [x] 28 talent_roster_members (unique; visibility checks)
- [x] Swagger spec expanded to cover Phases 1–3 endpoints

## Phase 4: Screening, applications & hiring (19–23)
- [ ] 19 job_questions (type↔options rules; locked once applications exist)
- [ ] 20 question_options (unique per question)
- [ ] 21 application_answers (answer↔question type match; unique per app+question)
- [ ] 22 interview_feedback (unique per reviewer+interview; scoring bounds)
- [ ] 23 hiring_decisions (unique per application; txn with status update; audit)

## Phase 5: Employer services & payments (33–36)
- [ ] 33 service_plans (admin CRUD)
- [ ] 34 orders (server-side totals; order_number; transitions)
- [ ] 35 payments (idempotent callbacks; refund as event; order sync)
- [ ] 36 invoices (snapshot from order; status sync)
- [ ] job publish entitlement check (plan allowance)

## Final integration
- [ ] migrations + seeders ran
- [ ] tsc --noEmit clean
- [ ] eslint clean
- [ ] end-to-end API verification
- [ ] README updated
