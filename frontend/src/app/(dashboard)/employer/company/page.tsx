'use client';

/**
 * Employer company profile — the company record every employer page scopes to.
 *
 *   GET   /companies/mine                       (useCompany hook)
 *   PATCH /companies/:id                        profile edits
 *   GET   /companies/:id/verifications/latest   latest verification submission
 *   POST  /companies/:id/verifications          submit a document for review
 *   POST  /companies                            only when no company exists yet
 *
 * The verification status on the company row is derived from the review of
 * these submissions, so the page shows both the company badge and the latest
 * submission record (document, remarks, submitted/reviewed timestamps).
 */
import { useEffect, useState, type FormEvent } from 'react';
import { useCompany } from '@/hooks/use-company';
import { apiGet, apiPatch, apiPost, ApiRequestError } from '@/services/api-client';
import { endpoints } from '@/services/api-endpoints';
import {
  Button,
  Badge,
  StatusBadge,
  Spinner,
  Field,
  Input,
  Select,
  Textarea,
  Modal,
} from '@/components/ui';
import { NavIcon } from '@/components/ui/icons';
import { CompanySize, CompanyStatus, CompanyVerificationStatus } from '@/enums';
import { formatDate, timeAgo, humanize } from '@/utils/format';
import type { Company } from '@/types';

/** Latest submission as `GET /companies/:id/verifications/latest` returns it. */
interface VerificationRow {
  id: string;
  status: CompanyVerificationStatus;
  document_url: string | null;
  remarks: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface CompanyForm {
  name: string;
  description: string;
  logo_url: string;
  website: string;
  email: string;
  phone: string;
  industry: string;
  company_size: string;
  address: string;
  city: string;
  country: string;
}

const EMPTY_FORM: CompanyForm = {
  name: '',
  description: '',
  logo_url: '',
  website: '',
  email: '',
  phone: '',
  industry: '',
  company_size: '',
  address: '',
  city: '',
  country: '',
};

const toForm = (company: Company): CompanyForm => ({
  name: company.name,
  description: company.description ?? '',
  logo_url: company.logo_url ?? '',
  website: company.website ?? '',
  email: company.email ?? '',
  phone: company.phone ?? '',
  industry: company.industry ?? '',
  company_size: company.company_size ?? '',
  address: company.address ?? '',
  city: company.city ?? '',
  country: company.country ?? '',
});

/** Empty input → null (nullable columns), non-empty → trimmed value. */
const nullable = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

function Banner({ msg }: { msg: { ok: boolean; text: string } }) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        msg.ok
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : 'border-red-200 bg-red-50 text-red-700'
      }`}
    >
      {msg.text}
    </div>
  );
}

function ErrorBox({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {text}
    </div>
  );
}

export default function EmployerCompanyPage() {
  const { company, loading, error, refetch } = useCompany();

  const [verification, setVerification] = useState<VerificationRow | null>(null);
  const [verifLoading, setVerifLoading] = useState(false);

  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Create form (no company yet)
  const [createForm, setCreateForm] = useState<CompanyForm>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit modal
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<CompanyForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  // Verification modal
  const [docOpen, setDocOpen] = useState(false);
  const [submittingDoc, setSubmittingDoc] = useState(false);
  const [docForm, setDocForm] = useState({ document_url: '', remarks: '' });
  const [docError, setDocError] = useState('');

  useEffect(() => {
    if (!company) {
      setVerification(null);
      return;
    }
    let cancelled = false;
    setVerifLoading(true);
    void (async () => {
      try {
        const res = await apiGet<{ verification: VerificationRow | null }>(
          endpoints.companies.latestVerification(company.id),
        );
        if (!cancelled) setVerification(res.verification);
      } catch {
        if (!cancelled) setVerification(null);
      } finally {
        if (!cancelled) setVerifLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [company]);

  const openEdit = () => {
    if (!company) return;
    setEditForm(toForm(company));
    setEditError('');
    setEditing(true);
  };

  const openDoc = () => {
    setDocForm({ document_url: '', remarks: '' });
    setDocError('');
    setDocOpen(true);
  };

  const submitCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreateError('');
    const name = createForm.name.trim();
    if (name.length < 2) {
      setCreateError('Company name must be at least 2 characters.');
      return;
    }
    setCreating(true);
    try {
      await apiPost(endpoints.companies.create, {
        name,
        description: nullable(createForm.description),
        website: nullable(createForm.website),
        industry: nullable(createForm.industry),
        city: nullable(createForm.city),
        ...(createForm.country.trim() ? { country: createForm.country.trim() } : {}),
      });
      setCreateForm(EMPTY_FORM);
      setMsg({ ok: true, text: 'Company created. You can post jobs right away.' });
      refetch();
    } catch (err) {
      setCreateError(
        err instanceof ApiRequestError ? err.message : 'Could not create the company.',
      );
    } finally {
      setCreating(false);
    }
  };

  const submitEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setEditError('');
    const name = editForm.name.trim();
    if (name.length < 2) {
      setEditError('Company name must be at least 2 characters.');
      return;
    }
    setSaving(true);
    try {
      await apiPatch(endpoints.companies.byId(company.id), {
        name,
        description: nullable(editForm.description),
        logo_url: nullable(editForm.logo_url),
        website: nullable(editForm.website),
        email: nullable(editForm.email),
        phone: nullable(editForm.phone),
        industry: nullable(editForm.industry),
        company_size: editForm.company_size || null,
        address: nullable(editForm.address),
        city: nullable(editForm.city),
        ...(editForm.country.trim() ? { country: editForm.country.trim() } : {}),
      });
      setEditing(false);
      setMsg({ ok: true, text: 'Company profile saved.' });
      refetch();
    } catch (err) {
      setEditError(err instanceof ApiRequestError ? err.message : 'Could not save the profile.');
    } finally {
      setSaving(false);
    }
  };

  const submitDocument = async (e: FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setDocError('');
    const documentUrl = docForm.document_url.trim();
    if (!documentUrl) {
      setDocError('Paste the document URL you want reviewed.');
      return;
    }
    setSubmittingDoc(true);
    try {
      await apiPost(endpoints.companies.verifications(company.id), {
        document_url: documentUrl,
        remarks: nullable(docForm.remarks),
      });
      setDocOpen(false);
      setMsg({ ok: true, text: 'Document submitted. An admin will review it shortly.' });
      refetch();
    } catch (err) {
      setDocError(
        err instanceof ApiRequestError ? err.message : 'Could not submit the document.',
      );
    } finally {
      setSubmittingDoc(false);
    }
  };

  if (loading) {
    return (
      <div className="card flex items-center gap-3 text-sm text-slate-500">
        <Spinner /> Loading company…
      </div>
    );
  }

  const header = (
    <header>
      <h1 className="text-xl font-bold text-slate-900">Company</h1>
      <p className="mt-1 text-sm text-slate-500">
        {company
          ? `Profile, contact details and verification for ${company.name}.`
          : 'Set up the company profile every employer page is scoped to.'}
      </p>
    </header>
  );

  if (error) {
    return (
      <div className="space-y-6">
        {header}
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {error}
        </div>
      </div>
    );
  }

  // No company yet: inline creation form.
  if (!company) {
    return (
      <div className="space-y-6">
        {header}
        {msg && <Banner msg={msg} />}
        <form onSubmit={submitCreate} className="card lift mk-rise space-y-4" noValidate>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <NavIcon name="building" className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Create your company</h2>
              <p className="text-sm text-slate-500">
                The company profile powers your job postings and applicant pipeline.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" required htmlFor="c-name">
              <Input
                id="c-name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Himalayan Digital"
              />
            </Field>
            <Field label="Industry" htmlFor="c-industry">
              <Input
                id="c-industry"
                value={createForm.industry}
                onChange={(e) => setCreateForm({ ...createForm, industry: e.target.value })}
                placeholder="Software"
              />
            </Field>
            <Field label="Website" htmlFor="c-website">
              <Input
                id="c-website"
                type="url"
                placeholder="https://example.com"
                value={createForm.website}
                onChange={(e) => setCreateForm({ ...createForm, website: e.target.value })}
              />
            </Field>
            <Field label="City" htmlFor="c-city">
              <Input
                id="c-city"
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                placeholder="Kathmandu"
              />
            </Field>
            <Field label="Country" htmlFor="c-country">
              <Input
                id="c-country"
                value={createForm.country}
                onChange={(e) => setCreateForm({ ...createForm, country: e.target.value })}
                placeholder="Nepal"
              />
            </Field>
            <Field label="Description" htmlFor="c-desc">
              <Textarea
                id="c-desc"
                rows={2}
                maxLength={5000}
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="What does the company build?"
              />
            </Field>
          </div>

          {createError && <ErrorBox text={createError} />}

          <div className="flex justify-end">
            <Button type="submit" loading={creating}>
              Create company
            </Button>
          </div>
        </form>
      </div>
    );
  }

  const details: Array<{ label: string; value: string }> = [
    { label: 'Website', value: company.website ?? 'Not set' },
    { label: 'Contact email', value: company.email ?? 'Not set' },
    { label: 'Phone', value: company.phone ?? 'Not set' },
    { label: 'Industry', value: company.industry ?? 'Not set' },
    {
      label: 'Company size',
      value: company.company_size ? humanize(company.company_size) : 'Not set',
    },
    { label: 'Address', value: company.address ?? 'Not set' },
    { label: 'City', value: company.city ?? 'Not set' },
    { label: 'Country', value: company.country || 'Not set' },
    { label: 'Profile slug', value: company.slug },
    { label: 'Joined', value: formatDate(company.created_at) },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Company</h1>
          <p className="mt-1 text-sm text-slate-500">
            Profile, contact details and verification for {company.name}.
          </p>
        </div>
        <Button variant="secondary" onClick={openEdit}>
          Edit profile
        </Button>
      </header>

      {msg && <Banner msg={msg} />}

      {/* Overview */}
      <section className="card lift mk-rise" style={{ '--mk-delay': '0ms' } as React.CSSProperties}>
        <div className="flex flex-wrap items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <NavIcon name="building" className="h-7 w-7" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-slate-900">{company.name}</h2>
              <StatusBadge kind="verification" value={company.verification_status} />
              <Badge tone={company.status === CompanyStatus.ACTIVE ? 'green' : 'slate'}>
                {humanize(company.status)}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {company.industry ?? 'Industry not set'} · {company.city ?? 'City not set'},{' '}
              {company.country || 'Country not set'}
            </p>
            <p className="mt-2 max-w-3xl text-sm text-slate-600">
              {company.description ||
                'No description yet. Add one so candidates know what you build.'}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <section
          className="card lift mk-rise"
          style={{ '--mk-delay': '70ms' } as React.CSSProperties}
        >
          <h2 className="text-lg font-bold text-slate-900">Details</h2>
          <dl className="mt-3 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
            {details.map((row) => (
              <div key={row.label}>
                <dt className="text-slate-400">{row.label}</dt>
                <dd className="mt-0.5 break-words font-medium text-slate-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Verification */}
        <section
          className="card lift mk-rise"
          style={{ '--mk-delay': '140ms' } as React.CSSProperties}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">Verification</h2>
            <StatusBadge kind="verification" value={company.verification_status} />
          </div>

          {verifLoading ? (
            <div className="mt-4 flex items-center gap-3 text-sm text-slate-500">
              <Spinner /> Checking submissions…
            </div>
          ) : verification ? (
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="slate">Latest submission</Badge>
                <StatusBadge kind="verification" value={verification.status} />
              </div>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-slate-400">Document</dt>
                  <dd className="mt-0.5 break-all font-medium text-slate-800">
                    {verification.document_url ?? 'No document attached'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Submitted</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">
                    {verification.submitted_at
                      ? `${formatDate(verification.submitted_at)} · ${timeAgo(verification.submitted_at)}`
                      : formatDate(verification.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Reviewed</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">
                    {verification.reviewed_at
                      ? formatDate(verification.reviewed_at)
                      : 'Not reviewed yet'}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-400">Remarks</dt>
                  <dd className="mt-0.5 font-medium text-slate-800">
                    {verification.remarks || 'None'}
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <p className="mt-4 text-sm text-slate-500">
              No verification submitted yet. Verified companies get a trusted badge and
              can publish jobs.
            </p>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <Button variant="primary" onClick={openDoc}>
              Submit verification document
            </Button>
          </div>
        </section>
      </div>

      {/* Edit modal */}
      <Modal
        open={editing}
        title="Edit company profile"
        onClose={() => setEditing(false)}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="company-edit-form" loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <form id="company-edit-form" onSubmit={submitEdit} className="space-y-4" noValidate>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company name" required htmlFor="e-name">
              <Input
                id="e-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </Field>
            <Field label="Industry" htmlFor="e-industry">
              <Input
                id="e-industry"
                value={editForm.industry}
                onChange={(e) => setEditForm({ ...editForm, industry: e.target.value })}
              />
            </Field>
            <Field label="Website" htmlFor="e-website">
              <Input
                id="e-website"
                type="url"
                placeholder="https://example.com"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
              />
            </Field>
            <Field label="Logo URL" htmlFor="e-logo">
              <Input
                id="e-logo"
                type="url"
                placeholder="https://example.com/logo.png"
                value={editForm.logo_url}
                onChange={(e) => setEditForm({ ...editForm, logo_url: e.target.value })}
              />
            </Field>
            <Field label="Contact email" htmlFor="e-email">
              <Input
                id="e-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </Field>
            <Field label="Phone" htmlFor="e-phone">
              <Input
                id="e-phone"
                type="tel"
                placeholder="+977 98XXXXXXXX"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </Field>
            <Field label="Company size" htmlFor="e-size">
              <Select
                id="e-size"
                value={editForm.company_size}
                onChange={(e) => setEditForm({ ...editForm, company_size: e.target.value })}
              >
                <option value="">Not set</option>
                {Object.values(CompanySize).map((value) => (
                  <option key={value} value={value}>
                    {humanize(value)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="City" htmlFor="e-city">
              <Input
                id="e-city"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
              />
            </Field>
            <Field label="Country" htmlFor="e-country">
              <Input
                id="e-country"
                value={editForm.country}
                onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
              />
            </Field>
            <Field label="Address" htmlFor="e-address">
              <Input
                id="e-address"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Description" htmlFor="e-desc">
            <Textarea
              id="e-desc"
              rows={4}
              maxLength={5000}
              value={editForm.description}
              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
            />
          </Field>
          {editError && <ErrorBox text={editError} />}
        </form>
      </Modal>

      {/* Verification submit modal */}
      <Modal
        open={docOpen}
        title="Submit verification document"
        onClose={() => setDocOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDocOpen(false)} disabled={submittingDoc}>
              Cancel
            </Button>
            <Button type="submit" form="company-doc-form" loading={submittingDoc}>
              Submit for review
            </Button>
          </>
        }
      >
        <form id="company-doc-form" onSubmit={submitDocument} className="space-y-4" noValidate>
          <p className="text-sm text-slate-600">
            An admin reviews the document and moves your company to VERIFIED or REJECTED.
            Submitting while a request is already pending returns a conflict.
          </p>
          <Field
            label="Document URL"
            required
            hint="Registration certificate, tax document or trade licence."
            htmlFor="d-url"
          >
            <Input
              id="d-url"
              type="url"
              placeholder="https://example.com/certificate.pdf"
              value={docForm.document_url}
              onChange={(e) => setDocForm({ ...docForm, document_url: e.target.value })}
            />
          </Field>
          <Field label="Remarks" hint="Optional note for the reviewer." htmlFor="d-remarks">
            <Textarea
              id="d-remarks"
              rows={3}
              maxLength={2000}
              value={docForm.remarks}
              onChange={(e) => setDocForm({ ...docForm, remarks: e.target.value })}
            />
          </Field>
          {docError && <ErrorBox text={docError} />}
        </form>
      </Modal>
    </div>
  );
}
