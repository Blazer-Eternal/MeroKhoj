'use client';

import { useState, type FormEvent } from 'react';
import { contactSchema } from '@/lib/validations';
import { Button, Field, Input, Textarea } from '@/components/ui';

/**
 * Contact form — client-side validated. There is no contact endpoint on the
 * backend yet, so a valid submission shows a local confirmation (the form
 * state itself demonstrates validation UX).
 */
export default function ContactPage() {
  const [values, setValues] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = contactSchema.safeParse(values);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        fieldErrors[String(issue.path[0])] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSent(true);
  };

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
      <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Contact us</h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            Questions about hiring, verification, or billing? Send a message and the MeroKhoj
            team will get back to you.
          </p>

          {sent ? (
            <div className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
              <p className="text-2xl">✅</p>
              <h2 className="mt-2 font-semibold text-emerald-800">Message ready</h2>
              <p className="mt-1 text-sm text-emerald-700">
                This demo doesn&apos;t have a backend contact endpoint yet — in production your
                message would be delivered to the team.
              </p>
              <Button className="mt-4" variant="secondary" onClick={() => setSent(false)}>
                Send another
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="mt-8 max-w-xl space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Your name" error={errors.name} required htmlFor="c-name">
                  <Input id="c-name" value={values.name} error={!!errors.name} onChange={set('name')} placeholder="Jane Doe" />
                </Field>
                <Field label="Email" error={errors.email} required htmlFor="c-email">
                  <Input id="c-email" type="email" value={values.email} error={!!errors.email} onChange={set('email')} placeholder="you@example.com" />
                </Field>
              </div>
              <Field label="Subject" error={errors.subject} required htmlFor="c-subject">
                <Input id="c-subject" value={values.subject} error={!!errors.subject} onChange={set('subject')} placeholder="How can we help?" />
              </Field>
              <Field label="Message" error={errors.message} required htmlFor="c-message">
                <Textarea
                  id="c-message"
                  rows={6}
                  value={values.message}
                  error={!!errors.message}
                  onChange={set('message')}
                  placeholder="Tell us more…"
                />
              </Field>
              <Button type="submit">Send message</Button>
            </form>
          )}
        </div>

        <aside className="space-y-4">
          <div className="card">
            <h2 className="font-semibold text-slate-900">Reach the team</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li>✉️ hello@merokhoj.com</li>
              <li>📍 Kathmandu, Nepal</li>
              <li>🕐 Sun–Fri, 9:00–18:00 NPT</li>
            </ul>
          </div>
          <div className="card">
            <h2 className="font-semibold text-slate-900">For employers</h2>
            <p className="mt-2 text-sm text-slate-600">
              Questions about plans, orders, or invoices? See billing in your employer
              dashboard after signing in.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
