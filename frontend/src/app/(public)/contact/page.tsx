'use client';

import { useState, type FormEvent } from 'react';
import { contactSchema } from '@/lib/validations';
import { Button, Field, Input, Textarea } from '@/components/ui';

/**
 * Contact form with client-side validation and a local confirmation state.
 * Topic chips above the form prefill the subject so the most common
 * reasons for writing reach the right desk without the sender guessing
 * a phrasing.
 */

const TOPICS = [
  {
    label: 'Hiring & employer plans',
    subject: 'Employer plans and hiring',
    blurb: 'Which plan fits your hiring volume, featured slots, or team size.',
  },
  {
    label: 'Company verification',
    subject: 'Company verification',
    blurb: 'Document submissions, a decision you are waiting on, or a rejection note.',
  },
  {
    label: 'Billing & invoices',
    subject: 'Billing and invoices',
    blurb: 'An order, an invoice copy, or a payment that needs checking.',
  },
  {
    label: 'Something broke',
    subject: 'Technical issue',
    blurb: 'A page that failed, an application that did not submit, or account access.',
  },
] as const;

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

  const pickTopic = (subject: string) => {
    setValues((v) => ({ ...v, subject }));
    setErrors((e) => ({ ...e, subject: '' }));
    document.getElementById('c-subject')?.focus();
  };

  const chosen = TOPICS.find((topic) => topic.subject === values.subject) ?? null;

  return (
    <>
      {/* Branded header band */}
      <div className="border-b border-slate-100 bg-brand-50">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1
            className="mk-rise font-display text-3xl font-extrabold text-slate-900 sm:text-4xl"
            style={{ '--mk-delay': '40ms' } as React.CSSProperties}
          >
            Talk to the <span className="text-brand-600">MeroKhoj team</span>
          </h1>
          <p
            className="mk-rise mt-3 max-w-2xl text-lg leading-relaxed text-slate-600"
            style={{ '--mk-delay': '110ms' } as React.CSSProperties}
          >
            Hiring questions, verification files, billing or a bug — write once and a person
            reads it. Every message gets a written reply, usually within one business day.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        {/* Topic chips — pick one to prefill the subject */}
        <div
          className="mk-rise grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          style={{ '--mk-delay': '160ms' } as React.CSSProperties}
        >
          {TOPICS.map((topic) => {
            const active = values.subject === topic.subject;
            return (
              <button
                key={topic.subject}
                type="button"
                onClick={() => pickTopic(topic.subject)}
                aria-pressed={active}
                className={`group rounded-xl border p-4 text-left transition-all duration-150 ${
                  active
                    ? 'border-brand-600 bg-brand-50 shadow-[0_16px_32px_-24px_rgba(27,100,245,0.6)]'
                    : 'border-slate-200 bg-white hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-md'
                }`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm font-bold text-slate-900">
                    {topic.label}
                  </span>
                  <svg
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden
                    className={`h-4 w-4 shrink-0 transition-transform duration-150 ${
                      active ? 'text-brand-600' : 'text-slate-300 group-hover:translate-x-0.5 group-hover:text-brand-500'
                    }`}
                  >
                    <path
                      fillRule="evenodd"
                      d="M3 10a1 1 0 0 1 1-1h10.586l-3.293-3.293a1 1 0 1 1 1.414-1.414l5 5a1 1 0 0 1 0 1.414l-5 5a1 1 0 0 1-1.414-1.414L14.586 11H4a1 1 0 0 1-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                <span className="mt-1.5 block text-sm leading-snug text-slate-500">
                  {topic.blurb}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_360px]">
          <div>
            {sent ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-6 py-8 text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <h2 className="mt-3 font-semibold text-emerald-800">Message received</h2>
                <p className="mt-1 text-sm text-emerald-700">
                  Thanks, {values.name.split(' ')[0] || 'friend'}. We will reply to{' '}
                  {values.email} within one business day.
                </p>
                <Button className="mt-4" variant="secondary" onClick={() => setSent(false)}>
                  Send another
                </Button>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="max-w-xl space-y-5" noValidate>
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
                    placeholder={
                      chosen
                        ? `Tell us about ${chosen.label.toLowerCase()} — include any order or company name that helps us find it fast.`
                        : 'Tell us more… include any order, company, or job link that helps us find it fast.'
                    }
                  />
                </Field>
                <div className="flex flex-wrap items-center gap-4">
                  <Button type="submit">Send message</Button>
                  <p className="text-xs text-slate-400">
                    One reply to your inbox — we do not add you to any mailing list.
                  </p>
                </div>
              </form>
            )}
          </div>

          <aside className="space-y-4">
            <div className="card">
              <h2 className="font-semibold text-slate-900">Reach the team</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  <span className="font-semibold text-slate-700">Email</span>{' '}
                  hello@merokhoj.com
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Office</span> Kathmandu, Nepal
                </li>
                <li>
                  <span className="font-semibold text-slate-700">Hours</span> Sunday to Friday,
                  9:00 to 18:00 NPT
                </li>
              </ul>
            </div>

            <div className="card">
              <h2 className="font-semibold text-slate-900">For employers</h2>
              <p className="mt-2 text-sm text-slate-600">
                Questions about plans, orders, or invoices? Sign in and open Billing in your
                employer dashboard, or ask us here.
              </p>
              <a href="/employer" className="mt-3 inline-block text-sm font-bold text-brand-600 hover:text-brand-700">
                Employer zone →
              </a>
            </div>

            <div className="card bg-slate-50">
              <h2 className="font-semibold text-slate-900">Faster routes</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-600">
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>
                    Applying or saving jobs needs no ticket — use the site directly and your
                    dashboard keeps the history.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>
                    Verification decisions arrive with a written note on your employer
                    dashboard the moment an admin reviews your file.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  <span>
                    Password resets are self-serve from the login page — no waiting on a
                    reply to get back in.
                  </span>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
