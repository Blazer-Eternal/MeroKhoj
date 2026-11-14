'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { registerSchema } from '@/lib/validations';
import { primaryArea, AREA_HOME } from '@/lib/permissions';
import { Button, Field, Input, Select } from '@/components/ui';
import { ApiRequestError } from '@/services/api-client';
import { RoleName } from '@/enums';

/** Flat illustration for the register panel: a candidate celebrating an offer. */
function CelebrateArt() {
  return (
    <svg viewBox="0 0 360 300" fill="none" aria-hidden className="mt-6 w-full max-w-[320px]">
      {/* confetti */}
      <rect x="40" y="34" width="10" height="10" rx="2" fill="#1b64f5" transform="rotate(-18 40 34)" />
      <rect x="300" y="60" width="10" height="10" rx="2" fill="#14b8a6" transform="rotate(24 300 60)" />
      <circle cx="86" cy="70" r="5" fill="#8ec6ff" />
      <circle cx="268" cy="36" r="5" fill="#f6c8a8" />
      <rect x="322" y="120" width="9" height="9" rx="2" fill="#1b64f5" transform="rotate(30 322 120)" />
      <circle cx="30" cy="130" r="4" fill="#14b8a6" />

      {/* raised arm + fist */}
      <path
        d="M150 168c-8-28-14-52-8-74 2-9 14-11 18-2 5 12 4 34 8 54"
        stroke="#8fb8ee"
        strokeWidth="18"
        strokeLinecap="round"
      />
      <circle cx="144" cy="86" r="13" fill="#f0b48f" />

      {/* head */}
      <circle cx="204" cy="120" r="30" fill="#f6c8a8" />
      {/* hair */}
      <path
        d="M176 118c-2-22 12-38 30-38s32 14 32 34c-8-6-20-10-34-8-10 2-20 6-28 12z"
        fill="#7c4a32"
      />
      <path d="M232 108c8 14 8 34 2 48 12-6 16-30 10-48z" fill="#7c4a32" />
      {/* smile */}
      <path d="M194 128c6 7 16 7 22 0" stroke="#c2410c" strokeWidth="3" strokeLinecap="round" />
      <circle cx="194" cy="114" r="3" fill="#3b2f2a" />
      <circle cx="216" cy="114" r="3" fill="#3b2f2a" />

      {/* torso (sweater) */}
      <path
        d="M164 264c0-44 18-74 46-74s48 30 48 74z"
        fill="#93c5fd"
      />
      <path d="M164 264c2-24 8-44 18-58l-6 58z" fill="#bfdbfe" />
      {/* left arm on hip */}
      <path
        d="M170 210c-14 8-22 22-22 40"
        stroke="#93c5fd"
        strokeWidth="16"
        strokeLinecap="round"
      />
      {/* hand on hip */}
      <circle cx="150" cy="250" r="9" fill="#f0b48f" />

      {/* desk line */}
      <rect x="40" y="268" width="280" height="3" rx="1.5" fill="#8ec6ff" opacity="0.7" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [role, setRole] = useState<RoleName>(RoleName.JOBSEEKER);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');

    const parsed = registerSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      confirm,
      role,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    setSubmitting(true);
    try {
      const payload = await register({
        first_name: parsed.data.first_name,
        last_name: parsed.data.last_name,
        email: parsed.data.email,
        password: parsed.data.password,
        role: parsed.data.role,
      });
      const area = primaryArea(payload.roles);
      router.replace(area ? AREA_HOME[area] : '/');
    } catch (err) {
      setFormError(err instanceof ApiRequestError ? err.message : 'Registration failed. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="grid gap-0 lg:grid-cols-2">
        {/* Light-blue pitch panel (image 2) */}
        <div className="flex flex-col justify-center rounded-xl bg-brand-100 px-8 py-10 lg:px-10">
          <h2 className="font-display text-3xl font-extrabold leading-tight text-brand-800 sm:text-[34px]">
            Register, Apply &amp; Get Job!
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base">
            523K+ Success Stories. Build your profile and achieve your career goals with 600+ daily
            job opportunities from thousands of organizations.
          </p>
          <p className="mt-3 text-sm font-semibold italic text-slate-600 sm:text-base">
            Start Now- It&apos;s Free &amp; takes less than a minute!
          </p>
          <CelebrateArt />
        </div>

        {/* Form column */}
        <div className="px-6 py-8 sm:px-10 lg:py-10">
          <h1 className="font-display text-2xl font-bold text-slate-900 sm:text-[28px]">
            Create your account
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Join MeroKhoj: jobseekers find work, employers find talent.
          </p>

          {formError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" error={errors.first_name} htmlFor="reg-first">
                <Input
                  id="reg-first"
                  autoComplete="given-name"
                  placeholder="Jane"
                  value={firstName}
                  error={!!errors.first_name}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </Field>
              <Field label="Last name" error={errors.last_name} htmlFor="reg-last">
                <Input
                  id="reg-last"
                  autoComplete="family-name"
                  placeholder="Doe"
                  value={lastName}
                  error={!!errors.last_name}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Email address" error={errors.email} htmlFor="reg-email">
              <Input
                id="reg-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                error={!!errors.email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field
              label="I am joining as"
              error={errors.role}
              hint="Employers can create companies and post jobs."
              htmlFor="reg-role"
            >
              <Select
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value as RoleName)}
              >
                <option value="JOBSEEKER">Jobseeker (I&apos;m looking for a job)</option>
                <option value="RECRUITER">Recruiter (I hire for a company)</option>
                <option value="COMPANY_ADMIN">Company admin (I run a company page)</option>
              </Select>
            </Field>

            <Field label="Password" error={errors.password} htmlFor="reg-password">
              <Input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                placeholder="8+ characters, letter & number"
                value={password}
                error={!!errors.password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Field label="Confirm password" error={errors.confirm} htmlFor="reg-confirm">
              <Input
                id="reg-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="Repeat your password"
                value={confirm}
                error={!!errors.confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </Field>

            <Button type="submit" className="w-full" loading={submitting}>
              Create account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
