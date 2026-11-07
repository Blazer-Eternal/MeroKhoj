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
    <div className="card">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-500">
          Join MeroKhoj: jobseekers find work, employers find talent.
        </p>
      </div>

      {formError && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
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
  );
}
