'use client';

/**
 * Jobseeker profile — GET/PUT /users/me/profile (upsert) + basic account
 * details read from the session.
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '@/context/auth-context';
import { apiGet, apiPut, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import { Button, Field, Input, Select, Textarea, Spinner } from '@/components/ui';
import { Availability, ProfileVisibility } from '@/enums';
import type { JobseekerProfile } from '@/types';
import { displayName, formatDate } from '@/utils/format';

interface ProfileResponse {
  profile: JobseekerProfile | null;
}

export default function JobseekerProfilePage() {
  const { user, refresh } = useAuth();
  const [profile, setProfile] = useState<JobseekerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    headline: '',
    professional_summary: '',
    gender: '',
    address: '',
    city: '',
    country: '',
    profile_photo_url: '',
    expected_salary: '',
    availability: '' as string,
    profile_visibility: ProfileVisibility.PRIVATE as ProfileVisibility,
    date_of_birth: '',
  });

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiGet<ProfileResponse>(endpoints.users.myProfile);
        if (cancelled) return;
        const p = res.profile;
        setProfile(p);
        if (p) {
          setForm({
            headline: p.headline ?? '',
            professional_summary: p.professional_summary ?? '',
            gender: p.gender ?? '',
            address: p.address ?? '',
            city: p.city ?? '',
            country: p.country ?? '',
            profile_photo_url: p.profile_photo_url ?? '',
            expected_salary: p.expected_salary != null ? String(p.expected_salary) : '',
            availability: p.availability ?? '',
            profile_visibility: p.profile_visibility,
            date_of_birth: p.date_of_birth ? p.date_of_birth.slice(0, 10) : '',
          });
        }
      } catch (err) {
        if (!cancelled) {
          setLoadError(err instanceof ApiRequestError ? err.message : 'Could not load profile.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => {
    setSaved(false);
    setForm((f) => ({ ...f, [key]: e.target.value }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await apiPut<ProfileResponse>(endpoints.users.myProfile, {
        headline: form.headline.trim() || null,
        professional_summary: form.professional_summary.trim() || null,
        gender: form.gender.trim() || null,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country: form.country.trim() || null,
        profile_photo_url: form.profile_photo_url.trim() || null,
        expected_salary: form.expected_salary ? Number(form.expected_salary) : null,
        availability: form.availability || null,
        profile_visibility: form.profile_visibility,
        date_of_birth: form.date_of_birth || null,
      });
      setSaved(true);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save the profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading profile…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">My profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            {profile
              ? `Profile ID ${profile.id.slice(0, 8)}… · last updated ${formatDate(profile.updated_at)}`
              : 'No profile row yet — saving creates it (upsert).'}
          </p>
        </div>
        {user && (
          <div className="rounded-lg bg-slate-50 px-4 py-2 text-sm text-slate-600">
            <span className="font-medium text-slate-800">{displayName(user)}</span>
            <span className="mx-2 text-slate-300">|</span>
            {user.email}
          </div>
        )}
      </header>

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {loadError}
        </div>
      )}

      <form onSubmit={onSubmit} className="card space-y-5" noValidate>
        <Field label="Headline" hint="One line shown to employers" htmlFor="p-headline">
          <Input
            id="p-headline"
            placeholder="Senior React Developer | 5 yrs"
            value={form.headline}
            onChange={set('headline')}
            maxLength={255}
          />
        </Field>

        <Field label="Professional summary" htmlFor="p-summary">
          <Textarea
            id="p-summary"
            rows={5}
            placeholder="A short pitch about your experience and what you're looking for…"
            value={form.professional_summary}
            onChange={set('professional_summary')}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Date of birth" htmlFor="p-dob">
            <Input
              id="p-dob"
              type="date"
              value={form.date_of_birth}
              onChange={set('date_of_birth')}
            />
          </Field>
          <Field label="Gender" htmlFor="p-gender">
            <Input
              id="p-gender"
              placeholder="Optional"
              value={form.gender}
              onChange={set('gender')}
            />
          </Field>
        </div>

        <Field label="Address" htmlFor="p-address">
          <Input
            id="p-address"
            placeholder="Street address"
            value={form.address}
            onChange={set('address')}
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City" htmlFor="p-city">
            <Input id="p-city" placeholder="Kathmandu" value={form.city} onChange={set('city')} />
          </Field>
          <Field label="Country" htmlFor="p-country">
            <Input
              id="p-country"
              placeholder="Nepal"
              value={form.country}
              onChange={set('country')}
            />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Expected salary (NPR / month)" htmlFor="p-salary">
            <Input
              id="p-salary"
              type="number"
              min={0}
              placeholder="80000"
              value={form.expected_salary}
              onChange={set('expected_salary')}
            />
          </Field>
          <Field label="Availability" htmlFor="p-availability">
            <Select id="p-availability" value={form.availability} onChange={set('availability')}>
              <option value="">Not specified</option>
              <option value={Availability.IMMEDIATE}>Available immediately</option>
              <option value={Availability.NOTICE_PERIOD}>On notice period</option>
              <option value={Availability.NOT_AVAILABLE}>Not available</option>
            </Select>
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Profile visibility" hint="PUBLIC profiles appear in employer search" htmlFor="p-visibility">
            <Select
              id="p-visibility"
              value={form.profile_visibility}
              onChange={set('profile_visibility')}
            >
              <option value={ProfileVisibility.PRIVATE}>Private</option>
              <option value={ProfileVisibility.PUBLIC}>Public</option>
            </Select>
          </Field>
          <Field label="Photo URL" hint="Direct image link (upload service pending)" htmlFor="p-photo">
            <Input
              id="p-photo"
              type="url"
              placeholder="https://…"
              value={form.profile_photo_url}
              onChange={set('profile_photo_url')}
            />
          </Field>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {saved && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Profile saved ✓
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Save profile
          </Button>
        </div>
      </form>
    </div>
  );
}
