'use client';

import { useState } from 'react';

/**
 * Employer FAQ — a grid-rows accordion (mk-accordion-panel in globals.css).
 * Only the open row animates; the plus glyph rotates 45° into a close
 * mark. One row is open at a time so the section never grows taller than
 * the viewport on mobile.
 */

interface FaqItem {
  q: string;
  a: string;
}

const ITEMS: FaqItem[] = [
  {
    q: 'How much does it cost to post a job?',
    a: 'Your first job post is free and no card is required to start. The free tier keeps one live posting; paid plans add more simultaneous postings, longer coverage windows and featured slots when your team is hiring at volume.',
  },
  {
    q: 'How does verification work?',
    a: 'Submit your company documents and remarks from the employer dashboard. An admin reviews the file and returns an approval or a rejection with a written note. Once verified, your profile and every posting carry the verified badge candidates look for.',
  },
  {
    q: 'What happens after I publish a role?',
    a: 'Applications arrive in one pipeline with screening answers attached. Your team reviews, shortlists, schedules interviews and records the decision on the same record, so nothing lives in a private inbox.',
  },
  {
    q: 'Can more than one person on my team review applicants?',
    a: 'Yes. Company members share the same pipeline and candidate history, so anyone you add to the organisation can pick up a review where a colleague left off.',
  },
  {
    q: 'What is a talent roster?',
    a: 'A roster is a company-owned shortlist. Save candidates you met but did not hire, keep your private notes on them, and start your next similar search by reaching out to that list first.',
  },
  {
    q: 'Do I need a paid plan to get started?',
    a: 'No. Create an employer account, verify your company and publish. Paid plans exist for teams that need more live postings at once or want featured placement, and you can talk to our team before committing.',
  },
];

export function EmployerFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:py-20">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
            Questions employers <span className="text-brand-600">ask us first</span>
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-slate-600">
            Straight answers on pricing, verification and how the pipeline works. If yours is not
            here, our team replies to every message.
          </p>
          <a href="/contact" className="btn-secondary mt-6 inline-flex px-6 py-3">
            Ask a question
          </a>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {ITEMS.map((item, index) => {
            const open = openIndex === index;
            return (
              <div key={item.q}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenIndex(open ? null : index)}
                  className="flex w-full items-start justify-between gap-5 py-5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                >
                  <span className="font-display text-[15px] font-bold leading-snug text-slate-900 sm:text-base">
                    {item.q}
                  </span>
                  <span
                    aria-hidden
                    className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full transition-all duration-300 ${
                      open ? 'rotate-45 bg-brand-600 text-white' : 'bg-white text-slate-500 ring-1 ring-slate-200'
                    }`}
                  >
                    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2.4} className="h-3.5 w-3.5">
                      <path strokeLinecap="round" d="M10 4.5v11M4.5 10h11" />
                    </svg>
                  </span>
                </button>

                <div className="mk-accordion-panel" data-open={open}>
                  <div>
                    <p className="pb-5 pr-10 text-[15px] leading-relaxed text-slate-600">
                      {item.a}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
