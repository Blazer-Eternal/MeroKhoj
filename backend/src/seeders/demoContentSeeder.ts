import type { QueryInterface } from 'sequelize';

/**
 * Demo content seeder — realistic employers and published jobs so the public
 * board (homepage, mega menu counts, company directory) has real data to show.
 *
 * Like `baseSeeder`, this file is intentionally SELF-CONTAINED: sequelize-cli
 * loads `.ts` seeders via dynamic `import()`, which cannot resolve directory
 * imports. Only type-only imports from third-party packages are allowed.
 *
 * Idempotent: companies are skipped when any beyond the demo company exist,
 * jobs are skipped when the board already has rows. Each block runs in its
 * own transaction so a failure never leaves half a board behind.
 *
 * Deterministic UUIDs (501-507 companies, 601-624 jobs) keep `down()` exact.
 */

const ADMIN_ID = '00000000-0000-4000-8000-000000000001';

/** Deterministic UUID helper (same shape as baseSeeder's TAXONOMY_ID). */
const ID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** Taxonomy ids seeded by baseSeeder (kept stable across runs). */
const CAT = {
  software: ID(101),
  frontend: ID(102),
  backend: ID(103),
  data: ID(104),
  marketing: ID(105),
  finance: ID(106),
  healthcare: ID(107),
  education: ID(108),
};
const IND = {
  it: ID(201),
  banking: ID(202),
  health: ID(203),
  education: ID(204),
  telecom: ID(205),
  retail: ID(206),
};
const LOC = {
  kathmandu: ID(301),
  lalitpur: ID(302),
  bhaktapur: ID(303),
  pokhara: ID(304),
  bhairahawa: ID(305),
  biratnagar: ID(306),
};

interface DemoCompany {
  id: string;
  name: string;
  slug: string;
  description: string;
  website: string;
  email: string;
  phone: string;
  industry: string;
  industry_id: string;
  company_size: 'SOLO' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';
  city: string;
}

const DEMO_COMPANIES: DemoCompany[] = [
  {
    id: ID(501),
    name: 'Himalayan Digital',
    slug: 'himalayan-digital',
    description:
      'Product studio in Kathmandu building web and mobile platforms for banks, airlines and retailers across South Asia.',
    website: 'https://himalayandigital.example.com',
    email: 'careers@himalayandigital.example.com',
    phone: '+977-1-4412300',
    industry: 'Information Technology',
    industry_id: IND.it,
    company_size: 'MEDIUM',
    city: 'Kathmandu',
  },
  {
    id: ID(502),
    name: 'Sagarmatha Finance',
    slug: 'sagarmatha-finance',
    description:
      'Commercial bank with 42 branches nationwide, focused on small business lending and rural microfinance.',
    website: 'https://sagarmathafinance.example.com',
    email: 'careers@sagarmathafinance.example.com',
    phone: '+977-1-4221188',
    industry: 'Banking & Finance',
    industry_id: IND.banking,
    company_size: 'LARGE',
    city: 'Kathmandu',
  },
  {
    id: ID(503),
    name: 'Everest Health Network',
    slug: 'everest-health-network',
    description:
      'Three-hospital group running outpatient clinics, diagnostics and home care across the Bagmati corridor.',
    website: 'https://everesthealth.example.com',
    email: 'hr@everesthealth.example.com',
    phone: '+977-1-4650022',
    industry: 'Healthcare',
    industry_id: IND.health,
    company_size: 'LARGE',
    city: 'Lalitpur',
  },
  {
    id: ID(504),
    name: 'Bindu EduTech',
    slug: 'bindu-edutech',
    description:
      'Learning platform serving 180,000 students with exam prep, live classes and a growing library of Nepali-medium courses.',
    website: 'https://binduedutech.example.com',
    email: 'jobs@binduedutech.example.com',
    phone: '+977-1-5910044',
    industry: 'Education',
    industry_id: IND.education,
    company_size: 'SMALL',
    city: 'Bhaktapur',
  },
  {
    id: ID(505),
    name: 'Karnali Telecom',
    slug: 'karnali-telecom',
    description:
      'Regional mobile and broadband operator covering Lumbini and Karnali provinces with 2.1 million subscribers.',
    website: 'https://karnalitelecom.example.com',
    email: 'careers@karnalitelecom.example.com',
    phone: '+977-71-540199',
    industry: 'Telecommunications',
    industry_id: IND.telecom,
    company_size: 'MEDIUM',
    city: 'Bhairahawa',
  },
  {
    id: ID(506),
    name: 'Annapurna Retail',
    slug: 'annapurna-retail',
    description:
      'Supermarket chain in Gandaki province running 11 stores and a same-day grocery delivery service in Pokhara.',
    website: 'https://annapurnaretail.example.com',
    email: 'hiring@annapurnaretail.example.com',
    phone: '+977-61-460777',
    industry: 'Retail & E-Commerce',
    industry_id: IND.retail,
    company_size: 'MEDIUM',
    city: 'Pokhara',
  },
  {
    id: ID(507),
    name: 'Terai Traders',
    slug: 'terai-traders',
    description:
      'Wholesale distributor of packaged foods and household goods supplying 600+ kirana shops across eastern Nepal.',
    website: 'https://teraitraders.example.com',
    email: 'admin@teraitraders.example.com',
    phone: '+977-21-470355',
    industry: 'Retail & E-Commerce',
    industry_id: IND.retail,
    company_size: 'SMALL',
    city: 'Biratnagar',
  },
];

type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'TEMPORARY' | 'FREELANCE';
type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';

interface DemoJob {
  n: number;
  company: number; // index into DEMO_COMPANIES
  title: string;
  category_id: string | null;
  location_id: string;
  employment_type: EmploymentType;
  experience_level: ExperienceLevel;
  salary_min: number;
  salary_max: number;
  vacancies: number;
  ageDays: number;
  description: string;
}

const DEMO_JOBS: DemoJob[] = [
  {
    n: 601, company: 0, title: 'Senior Frontend Engineer', category_id: CAT.frontend,
    location_id: LOC.kathmandu, employment_type: 'FULL_TIME', experience_level: 'SENIOR',
    salary_min: 120000, salary_max: 160000, vacancies: 2, ageDays: 1,
    description:
      'Own the design system and checkout experience for a retail client serving 400,000 monthly shoppers. You will pair with two designers and mentor one junior engineer, shipping to production every week.',
  },
  {
    n: 602, company: 0, title: 'Backend Engineer (Node.js)', category_id: CAT.backend,
    location_id: LOC.kathmandu, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 100000, salary_max: 150000, vacancies: 3, ageDays: 2,
    description:
      'Build payment and booking services that handle 12,000 transactions a day. The stack is TypeScript, PostgreSQL and queues; you will own services end to end, from schema design to on-call rotation.',
  },
  {
    n: 603, company: 0, title: 'UI/UX Designer', category_id: CAT.software,
    location_id: LOC.kathmandu, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 70000, salary_max: 100000, vacancies: 1, ageDays: 3,
    description:
      'Run research, wireframes and high-fidelity flows for two client products at once. We expect a portfolio with shipped mobile work and a habit of testing prototypes with real users before handoff.',
  },
  {
    n: 604, company: 0, title: 'DevOps Engineer', category_id: CAT.software,
    location_id: LOC.kathmandu, employment_type: 'CONTRACT', experience_level: 'SENIOR',
    salary_min: 110000, salary_max: 150000, vacancies: 1, ageDays: 5,
    description:
      'Six-month contract to steady a Kubernetes platform that grew faster than its pipelines. Cut deploy time, add real observability, and leave behind documentation the team can actually follow.',
  },
  {
    n: 605, company: 1, title: 'Data Analyst', category_id: CAT.data,
    location_id: LOC.kathmandu, employment_type: 'FULL_TIME', experience_level: 'ENTRY',
    salary_min: 60000, salary_max: 90000, vacancies: 2, ageDays: 1,
    description:
      'Turn branch transaction data into weekly credit risk reports for the loan committee. SQL and Excel get you started; curiosity about how rural borrowers actually repay is what keeps you here.',
  },
  {
    n: 606, company: 1, title: 'Branch Manager', category_id: CAT.finance,
    location_id: LOC.kathmandu, employment_type: 'FULL_TIME', experience_level: 'LEAD',
    salary_min: 90000, salary_max: 130000, vacancies: 1, ageDays: 4,
    description:
      'Run a busy urban branch: nine staff, a 1.2 billion loan book and daily cash discipline. You are measured on portfolio quality, service speed and how your team grows over the year.',
  },
  {
    n: 607, company: 1, title: 'Credit Officer', category_id: CAT.finance,
    location_id: LOC.bhairahawa, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 45000, salary_max: 65000, vacancies: 4, ageDays: 2,
    description:
      'Assess small business and agriculture loan applications in the Rupandehi corridor: visit applicants, verify cash flow, and write recommendations the committee can act on within 48 hours.',
  },
  {
    n: 608, company: 1, title: 'Mobile Loan Officer', category_id: CAT.finance,
    location_id: LOC.biratnagar, employment_type: 'FULL_TIME', experience_level: 'ENTRY',
    salary_min: 40000, salary_max: 60000, vacancies: 6, ageDays: 6,
    description:
      'Field role visiting shop owners and farmers to originate microloans. Company motorcycle and fuel provided; performance bonus scales with the portfolio you build in your first six months.',
  },
  {
    n: 609, company: 2, title: 'Registered Nurse (ICU)', category_id: CAT.healthcare,
    location_id: LOC.lalitpur, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 50000, salary_max: 75000, vacancies: 5, ageDays: 1,
    description:
      'Twelve-bed ICU in a teaching hospital: night shifts, ventilator patients and a strong senior nurse on every shift. GNMC registration and two years of acute care experience are required.',
  },
  {
    n: 610, company: 2, title: 'Medical Laboratory Technician', category_id: CAT.healthcare,
    location_id: LOC.lalitpur, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 45000, salary_max: 65000, vacancies: 2, ageDays: 3,
    description:
      'Run haematology, biochemistry and rapid tests on a 90-sample daily load, and keep the analyzer maintenance log audit-ready. Evening shift rotates every two weeks.',
  },
  {
    n: 611, company: 2, title: 'Hospital Administrator', category_id: CAT.healthcare,
    location_id: LOC.lalitpur, employment_type: 'FULL_TIME', experience_level: 'SENIOR',
    salary_min: 80000, salary_max: 120000, vacancies: 1, ageDays: 7,
    description:
      'Coordinate outpatient scheduling, supplier contracts and accreditation paperwork across two sites. The role sits between clinical heads and finance, so clear writing and calm negotiation matter as much as the spreadsheet.',
  },
  {
    n: 612, company: 2, title: 'Pharmacy Assistant', category_id: CAT.healthcare,
    location_id: LOC.kathmandu, employment_type: 'PART_TIME', experience_level: 'ENTRY',
    salary_min: 35000, salary_max: 50000, vacancies: 2, ageDays: 4,
    description:
      'Dispense prescriptions under pharmacist supervision, keep shelf stock counted, and explain dosage clearly to patients at the counter. Four-hour shifts, six days a week.',
  },
  {
    n: 613, company: 3, title: 'Full Stack Developer', category_id: CAT.software,
    location_id: LOC.bhaktapur, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 90000, salary_max: 140000, vacancies: 2, ageDays: 2,
    description:
      'Build live-class and quiz features used by 180,000 students on low-bandwidth connections. React, Node and PostgreSQL, with a product team that ships a new experiment every fortnight.',
  },
  {
    n: 614, company: 3, title: 'Content Writer (Nepali Medium)', category_id: CAT.marketing,
    location_id: LOC.bhaktapur, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 40000, salary_max: 60000, vacancies: 2, ageDays: 5,
    description:
      'Write lesson summaries, practice questions and exam tips in Nepali for grades 9 to 12. Subject accuracy is checked by our teachers; clarity for a 15-year-old on a cheap phone is your standard.',
  },
  {
    n: 615, company: 3, title: 'Curriculum Designer', category_id: CAT.education,
    location_id: LOC.bhaktapur, employment_type: 'CONTRACT', experience_level: 'SENIOR',
    salary_min: 55000, salary_max: 80000, vacancies: 1, ageDays: 8,
    description:
      'Nine-month contract to redesign our science course sequence against the updated national syllabus. You will work with two teachers, one designer and a data analyst who tracks where students stall.',
  },
  {
    n: 616, company: 4, title: 'React Native Developer', category_id: CAT.software,
    location_id: LOC.bhairahawa, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 100000, salary_max: 150000, vacancies: 2, ageDays: 1,
    description:
      'Own our subscriber app: offline balance checks, USSD fallback and a recharge flow that must work on 2G. Two releases a month, with crash rate as your headline metric.',
  },
  {
    n: 617, company: 4, title: 'Customer Support Executive', category_id: CAT.marketing,
    location_id: LOC.bhairahawa, employment_type: 'FULL_TIME', experience_level: 'ENTRY',
    salary_min: 35000, salary_max: 50000, vacancies: 8, ageDays: 2,
    description:
      'Handle calls, WhatsApp and store walk-ins for prepaid subscribers: plan changes, failed recharge and coverage questions. Training is four weeks; Nepali and Tharu language skills are a real advantage.',
  },
  {
    n: 618, company: 4, title: 'Network Operations Technician', category_id: CAT.software,
    location_id: LOC.bhairahawa, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 50000, salary_max: 75000, vacancies: 3, ageDays: 6,
    description:
      'Monitor two province-wide microwave links, respond to alarms within 15 minutes and travel to tower sites with the field crew when a section drops. Roster includes one weekend in six.',
  },
  {
    n: 619, company: 5, title: 'Store Manager', category_id: CAT.marketing,
    location_id: LOC.pokhara, employment_type: 'FULL_TIME', experience_level: 'SENIOR',
    salary_min: 60000, salary_max: 90000, vacancies: 2, ageDays: 3,
    description:
      'Own sales, shrink and staffing for a 6,000 sq ft supermarket doing NPR 40 million a month. You will hire and train a team of 14 and settle the tills with finance every night.',
  },
  {
    n: 620, company: 5, title: 'Inventory Analyst', category_id: CAT.data,
    location_id: LOC.pokhara, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 45000, salary_max: 70000, vacancies: 1, ageDays: 5,
    description:
      'Forecast demand store by store, flag slow movers before they hit markdown, and run the weekly count reconciliation. Fresh vegetables and dairy move differently from everything else, and that is the interesting part.',
  },
  {
    n: 621, company: 5, title: 'E-Commerce Merchandiser', category_id: CAT.marketing,
    location_id: LOC.pokhara, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 50000, salary_max: 80000, vacancies: 1, ageDays: 7,
    description:
      'Plan the daily grocery app: category placement, bundle offers and delivery-slot capacity. You will work with the warehouse lead so promotions never promise what the shelves cannot cover.',
  },
  {
    n: 622, company: 6, title: 'Sales Executive', category_id: CAT.marketing,
    location_id: LOC.biratnagar, employment_type: 'FULL_TIME', experience_level: 'ENTRY',
    salary_min: 40000, salary_max: 70000, vacancies: 5, ageDays: 1,
    description:
      'Grow a territory of 80 kirana shops with monthly order targets and a company vehicle. Base salary plus route commission; the top performer on this team earned double their base last year.',
  },
  {
    n: 623, company: 6, title: 'Accounts Officer', category_id: CAT.finance,
    location_id: LOC.biratnagar, employment_type: 'FULL_TIME', experience_level: 'MID',
    salary_min: 45000, salary_max: 65000, vacancies: 1, ageDays: 4,
    description:
      'Post supplier invoices, chase the 45-day receivables book and prepare the monthly GST return with our auditor. Tally or a similar ledger is expected; patience with slow-paying retailers is essential.',
  },
  {
    n: 624, company: 6, title: 'Procurement Assistant', category_id: null,
    location_id: LOC.biratnagar, employment_type: 'FULL_TIME', experience_level: 'ENTRY',
    salary_min: 40000, salary_max: 60000, vacancies: 2, ageDays: 8,
    description:
      'Support the purchasing desk: compare mill prices, book inter-district freight and keep the goods-receipt register tidy. Detail matters more than experience here; we will train the right person.',
  },
];

const DAY_MS = 86_400_000;

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const seedCompanies = async (queryInterface: QueryInterface): Promise<void> => {
  const sequelize = queryInterface.sequelize;
  const [count] = (await sequelize.query(
    'SELECT COUNT(*)::int AS count FROM companies',
  )) as unknown as [Array<{ count: number }>];

  // Anything beyond the demo company means employers already exist (ours or
  // the operator's) — never overwrite a real directory.
  if (count[0].count > 1) {
    console.log('  • companies already present, skipping demo employers');
    return;
  }

  const now = new Date();
  const rows = DEMO_COMPANIES.map((company) => ({
    id: company.id,
    name: company.name,
    slug: company.slug,
    description: company.description,
    logo_url: null,
    website: company.website,
    email: company.email,
    phone: company.phone,
    industry: company.industry,
    industry_id: company.industry_id,
    company_size: company.company_size,
    address: null,
    city: company.city,
    country: 'Nepal',
    verification_status: 'VERIFIED',
    status: 'ACTIVE',
    created_at: now,
    updated_at: now,
  }));

  await sequelize.transaction(async (transaction) => {
    await queryInterface.bulkInsert('companies', rows, { transaction });
  });
  console.log(`  • seeded ${rows.length} demo employers`);
};

const seedJobs = async (queryInterface: QueryInterface): Promise<void> => {
  const sequelize = queryInterface.sequelize;
  const [count] = (await sequelize.query(
    'SELECT COUNT(*)::int AS count FROM jobs',
  )) as unknown as [Array<{ count: number }>];
  if (count[0].count > 0) {
    console.log('  • jobs already present, skipping demo jobs');
    return;
  }

  const now = Date.now();
  const rows = DEMO_JOBS.map((job) => {
    const company = DEMO_COMPANIES[job.company];
    const slug = `${company.slug}-${slugify(job.title)}`;
    const publishedAt = new Date(now - job.ageDays * DAY_MS);
    return {
      id: ID(job.n),
      company_id: company.id,
      created_by: ADMIN_ID,
      title: job.title,
      slug,
      description: job.description,
      employment_type: job.employment_type,
      experience_level: job.experience_level,
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      salary_currency: 'NPR',
      vacancies: job.vacancies,
      education_requirement: null,
      experience_requirement: null,
      location: company.city,
      application_deadline: new Date(now + 30 * DAY_MS),
      status: 'PUBLISHED',
      published_at: publishedAt,
      closed_at: null,
      category_id: job.category_id,
      industry_id: company.industry_id,
      location_id: job.location_id,
      created_at: publishedAt,
      updated_at: publishedAt,
    };
  });

  await sequelize.transaction(async (transaction) => {
    await queryInterface.bulkInsert('jobs', rows, { transaction });
  });
  console.log(`  • seeded ${rows.length} demo jobs`);
};

export const up = async (queryInterface: QueryInterface): Promise<void> => {
  console.log('Seeding demo employers and jobs...');
  await seedCompanies(queryInterface);
  await seedJobs(queryInterface);
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  const jobSlugs = DEMO_JOBS.map(
    (job) => `${DEMO_COMPANIES[job.company].slug}-${slugify(job.title)}`,
  );
  await queryInterface.bulkDelete('jobs', { slug: jobSlugs });
  await queryInterface.bulkDelete('companies', {
    slug: DEMO_COMPANIES.map((company) => company.slug),
  });
  console.log('  • removed demo employers and jobs');
};

export default { up, down };
