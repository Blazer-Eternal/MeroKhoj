export const metadata = { title: 'Terms of Service' };

const SECTIONS = [
  {
    title: '1. Acceptance',
    body: 'By creating an account or using MeroKhoj you agree to these terms. If you do not agree, do not use the platform.',
  },
  {
    title: '2. Accounts',
    body: 'You are responsible for keeping your credentials secure. One person may not impersonate another, and platform roles (moderator/admin) are granted only by MeroKhoj — never self-selected at registration.',
  },
  {
    title: '3. For jobseekers',
    body: 'You agree that information in your profile and applications is truthful. You may withdraw an application while it is still under review. Saving jobs and creating alerts are personal-use features.',
  },
  {
    title: '4. For employers',
    body: 'You must have the right to hire for the company you represent. Job postings are subject to verification and moderation; misleading or discriminatory postings may be rejected or removed. Service plans, orders, payments, and invoices follow the pricing and billing rules shown at checkout.',
  },
  {
    title: '5. Content & conduct',
    body: 'Do not post unlawful, hateful, or infringing content, scrape the service at scale, or attempt to bypass authorization. Violations may result in suspension and are recorded in audit logs.',
  },
  {
    title: '6. Moderation & enforcement',
    body: 'MeroKhoj may moderate companies, jobs, and applications to keep the marketplace trustworthy. Decisions are logged and, where available, can be appealed through the contact page.',
  },
  {
    title: '7. Liability',
    body: 'The platform is provided "as is". To the extent permitted by law, MeroKhoj is not liable for hiring decisions, employment outcomes, or indirect damages arising from use of the service.',
  },
  {
    title: '8. Changes',
    body: 'We may update these terms; the version date above will change accordingly. Continued use after an update constitutes acceptance.',
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-extrabold text-slate-900">Terms of Service</h1>
      <p className="mt-3 text-sm text-slate-500">
        Last updated: November 2026 · This is the operating agreement for the MeroKhoj demo
        platform.
      </p>

      <div className="mt-10 space-y-7">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{section.body}</p>
          </section>
        ))}
      </div>

      <div className="mt-12 rounded-xl bg-slate-50 p-5 text-sm text-slate-600">
        Need clarification? <a href="/contact" className="font-semibold text-brand-600">Contact the team</a>.
      </div>
    </div>
  );
}
