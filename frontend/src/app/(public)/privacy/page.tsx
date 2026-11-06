export const metadata = { title: 'Privacy Policy' };

const SECTIONS = [
  {
    title: 'What we collect',
    body: [
      'Account data: name, email, phone, and password (stored as a salted hash — never in plain text).',
      'Profile data you choose to add: headline, summary, education, work experience, resumes, and preferences.',
      'Employer data: company details, job postings, and hiring activity.',
      'Technical data: request logs and audit entries used for security and abuse prevention.',
    ],
  },
  {
    title: 'How it is used',
    body: [
      'To run your account: login, role-based dashboards, and notifications.',
      'To match seekers and employers: search, job alerts, and application delivery.',
      'To operate the marketplace: billing, invoices, moderation, and audit logs.',
      'We do not sell your personal data.',
    ],
  },
  {
    title: 'Who can see it',
    body: [
      'Employers see your application and the profile fields attached to it — never your password or auth data.',
      'Administrators can review data for moderation, verification, and support, and those actions are audit-logged.',
      'Everything else stays private to your account.',
    ],
  },
  {
    title: 'Your choices',
    body: [
      'Edit or remove profile, education, experience, and resume entries at any time from your dashboard.',
      'Pause or delete job alerts.',
      'Request account deletion by contacting us — rows required for legal/billing records are retained as required.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Privacy Policy</h1>
      <p className="mt-3 text-sm text-slate-500">
        Last updated: November 2026 · This policy describes how MeroKhoj handles data on this
        demo platform.
      </p>

      <div className="mt-10 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            <ul className="mt-3 space-y-2">
              {section.body.map((line) => (
                <li key={line} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {line}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
        Questions about your data? <a href="/contact" className="font-semibold text-brand-600">Contact us</a>.
      </div>
    </div>
  );
}
