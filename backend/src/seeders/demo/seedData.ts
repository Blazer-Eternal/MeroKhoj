import type { QueryInterface } from 'sequelize';

/**
 * Demo dataset — the single source of truth for every `demo/*` seeder.
 *
 * Conventions:
 *   - Deterministic UUIDs via `ID(n)` so FKs are stable across runs and
 *     `--reset` + reseed always produces the same graph.
 *   - Emails: the platform admin keeps `admin@merokhoj.com`; employer accounts
 *     use their real company domain (`anil.shrestha@himalayantech.com`);
 *     jobseeker accounts use `@example.com`.
 *   - Every password is `Demo@12345` (hashed once in `userSeeder`).
 *
 * ID ranges:
 *   001            platform admin (adminSeeder)
 *   101-110        jobseeker users
 *   121-128        employer owner users (one per company)
 *   131-134        extra company member users
 *   201-210        jobseeker profiles
 *   501-508        companies
 *   551-562        company_members (551-558 owners, 559-562 extras)
 *   571-578        company_verifications
 *   601-628        published jobs (601-624 re-homed, 625-628 new)
 *   629            PENDING_REVIEW job, 630 DRAFT job
 *   701-761        skills catalog
 *   801+           applications, history, interviews, hiring decisions
 *   9xx            saved jobs, alerts, notifications
 *   10xx           orders / payments / invoices
 *   11xx           rosters, reports, audit logs
 */

/** Deterministic UUID helper (same shape as baseSeeder's TAXONOMY_ID). */
export const ID = (n: number): string =>
  `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

/** All demo accounts share this password. */
export const DEMO_PASSWORD = 'Demo@12345';

export const DAY_MS = 86_400_000;

export const slugify = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Taxonomy ids seeded by baseSeeder (kept stable across runs). */
export const CAT = {
  software: ID(101),
  frontend: ID(102),
  backend: ID(103),
  data: ID(104),
  marketing: ID(105),
  finance: ID(106),
  healthcare: ID(107),
  education: ID(108),
  hr: ID(109),
  graphic: ID(110),
  project: ID(111),
};

export const IND = {
  it: ID(201),
  banking: ID(202),
  health: ID(203),
  education: ID(204),
  telecom: ID(205),
  retail: ID(206),
  digital: ID(207),
  construction: ID(208),
  consulting: ID(209),
};

export const LOC = {
  kathmandu: ID(301),
  lalitpur: ID(302),
  bhaktapur: ID(303),
  pokhara: ID(304),
  bhairahawa: ID(305),
  biratnagar: ID(306),
  chitwan: ID(307),
  butwal: ID(308),
  dharan: ID(309),
};

export const PLAN = {
  basic: ID(401),
  pro: ID(402),
  enterprise: ID(403),
};

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export interface DemoUser {
  n: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
}

/** 10 jobseeker accounts (@example.com). */
export const JOBSEEKER_USERS: DemoUser[] = [
  { n: 101, first_name: 'Aarav', last_name: 'Sharma', email: 'aarav.sharma@example.com', phone: '+977-9841112001' },
  { n: 102, first_name: 'Priya', last_name: 'Gurung', email: 'priya.gurung@example.com', phone: '+977-9841112002' },
  { n: 103, first_name: 'Sita', last_name: 'Tamang', email: 'sita.tamang@example.com', phone: '+977-9841112003' },
  { n: 104, first_name: 'Rohan', last_name: 'Maharjan', email: 'rohan.maharjan@example.com', phone: '+977-9841112004' },
  { n: 105, first_name: 'Anjali', last_name: 'Karki', email: 'anjali.karki@example.com', phone: '+977-9841112005' },
  { n: 106, first_name: 'Bikram', last_name: 'Rai', email: 'bikram.rai@example.com', phone: '+977-9841112006' },
  { n: 107, first_name: 'Nisha', last_name: 'Thapa', email: 'nisha.thapa@example.com', phone: '+977-9841112007' },
  { n: 108, first_name: 'Deepak', last_name: 'Chaudhary', email: 'deepak.chaudhary@example.com', phone: '+977-9841112008' },
  { n: 109, first_name: 'Suman', last_name: 'Bista', email: 'suman.bista@example.com', phone: '+977-9841112009' },
  { n: 110, first_name: 'Kritika', last_name: 'Joshi', email: 'kritika.joshi@example.com', phone: '+977-9841112010' },
];

/** 8 employer owners — one per company, on the company's own domain. */
export const EMPLOYER_OWNERS: Array<DemoUser & { company: number }> = [
  { n: 121, first_name: 'Anil', last_name: 'Shrestha', email: 'anil.shrestha@himalayantech.com', phone: '+977-9841330101', company: 501 },
  { n: 122, first_name: 'Riya', last_name: 'Karki', email: 'riya.karki@everestdigital.com', phone: '+977-9841330102', company: 502 },
  { n: 123, first_name: 'Suresh', last_name: 'Adhikari', email: 'suresh.adhikari@sunrisefinancial.com', phone: '+977-9841330103', company: 503 },
  { n: 124, first_name: 'Manisha', last_name: 'Gurung', email: 'manisha.gurung@greenvalleyhealth.com', phone: '+977-9841330104', company: 504 },
  { n: 125, first_name: 'Prabin', last_name: 'Thapa', email: 'prabin.thapa@nextgeneducation.com', phone: '+977-9841330105', company: 505 },
  { n: 126, first_name: 'Sabina', last_name: 'Joshi', email: 'sabina.joshi@nepalretail.com', phone: '+977-9841330106', company: 506 },
  { n: 127, first_name: 'Bikash', last_name: 'Poudel', email: 'bikash.poudel@apexconstruction.com', phone: '+977-9841330107', company: 507 },
  { n: 128, first_name: 'Nisha', last_name: 'Bhandari', email: 'nisha.bhandari@cloudpeakconsulting.com', phone: '+977-9841330108', company: 508 },
];

/** 4 extra company members on their employer's domain. */
export const EXTRA_MEMBERS: Array<DemoUser & { company: number; member_role: string }> = [
  { n: 131, first_name: 'Ramesh', last_name: 'K.C.', email: 'ramesh.kc@himalayantech.com', phone: '+977-9841330201', company: 501, member_role: 'RECRUITER' },
  { n: 132, first_name: 'Sushil', last_name: 'Rai', email: 'sushil.rai@himalayantech.com', phone: '+977-9841330202', company: 501, member_role: 'HIRING_MANAGER' },
  { n: 133, first_name: 'Asha', last_name: 'Lama', email: 'asha.lama@sunrisefinancial.com', phone: '+977-9841330203', company: 503, member_role: 'ADMIN' },
  { n: 134, first_name: 'Deepak', last_name: 'Shah', email: 'deepak.shah@greenvalleyhealth.com', phone: '+977-9841330204', company: 504, member_role: 'RECRUITER' },
];

// ---------------------------------------------------------------------------
// Companies + verification state
// ---------------------------------------------------------------------------

export interface DemoCompany {
  n: number;
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
  location_id: string;
  verification_status: 'VERIFIED' | 'PENDING' | 'REJECTED';
}

export const COMPANIES: DemoCompany[] = [
  {
    n: 501, name: 'Himalayan Tech Solutions', slug: 'himalayan-tech-solutions',
    description: 'Product studio in Kathmandu building web and mobile platforms for banks, airlines and retailers across South Asia.',
    website: 'https://www.himalayantech.com', email: 'careers@himalayantech.com', phone: '+977-1-4412300',
    industry: 'Information Technology', industry_id: IND.it, company_size: 'MEDIUM',
    city: 'Kathmandu', location_id: LOC.kathmandu, verification_status: 'VERIFIED',
  },
  {
    n: 502, name: 'Everest Digital Agency', slug: 'everest-digital-agency',
    description: 'Full-service digital agency running performance marketing, brand campaigns and content studios for consumer brands.',
    website: 'https://www.everestdigital.com', email: 'hello@everestdigital.com', phone: '+977-1-4650110',
    industry: 'Digital Marketing', industry_id: IND.digital, company_size: 'SMALL',
    city: 'Lalitpur', location_id: LOC.lalitpur, verification_status: 'VERIFIED',
  },
  {
    n: 503, name: 'Sunrise Financial Services', slug: 'sunrise-financial-services',
    description: 'Non-bank financial institution offering business loans, hire purchase and microfinance through 18 branches nationwide.',
    website: 'https://www.sunrisefinancial.com', email: 'careers@sunrisefinancial.com', phone: '+977-1-4221188',
    industry: 'Banking & Finance', industry_id: IND.banking, company_size: 'LARGE',
    city: 'Kathmandu', location_id: LOC.kathmandu, verification_status: 'VERIFIED',
  },
  {
    n: 504, name: 'Green Valley Healthcare', slug: 'green-valley-healthcare',
    description: 'Hospital and clinic network in Chitwan running emergency care, diagnostics, maternity and home-care services.',
    website: 'https://www.greenvalleyhealth.com', email: 'hr@greenvalleyhealth.com', phone: '+977-56-520100',
    industry: 'Healthcare', industry_id: IND.health, company_size: 'MEDIUM',
    city: 'Chitwan', location_id: LOC.chitwan, verification_status: 'VERIFIED',
  },
  {
    n: 505, name: 'NextGen Education Center', slug: 'nextgen-education-center',
    description: 'Training institute and e-learning publisher preparing students for entrance exams, IT certifications and job skills.',
    website: 'https://www.nextgeneducation.com', email: 'jobs@nextgeneducation.com', phone: '+977-71-5910044',
    industry: 'Education', industry_id: IND.education, company_size: 'SMALL',
    city: 'Butwal', location_id: LOC.butwal, verification_status: 'PENDING',
  },
  {
    n: 506, name: 'Nepal Retail Network', slug: 'nepal-retail-network',
    description: 'Supermarket chain in the eastern Terai running 14 stores plus a same-day grocery delivery app.',
    website: 'https://www.nepalretail.com', email: 'hiring@nepalretail.com', phone: '+977-21-470355',
    industry: 'Retail & E-Commerce', industry_id: IND.retail, company_size: 'LARGE',
    city: 'Biratnagar', location_id: LOC.biratnagar, verification_status: 'VERIFIED',
  },
  {
    n: 507, name: 'Apex Construction Group', slug: 'apex-construction-group',
    description: 'Civil contractor delivering roads, bridges and commercial builds across Koshi province since 2009.',
    website: 'https://www.apexconstruction.com', email: 'info@apexconstruction.com', phone: '+977-25-581200',
    industry: 'Construction', industry_id: IND.construction, company_size: 'MEDIUM',
    city: 'Dharan', location_id: LOC.dharan, verification_status: 'REJECTED',
  },
  {
    n: 508, name: 'CloudPeak Consulting', slug: 'cloudpeak-consulting',
    description: 'Boutique management and data consultancy advising tourism, retail and education clients in Gandaki province.',
    website: 'https://www.cloudpeakconsulting.com', email: 'contact@cloudpeakconsulting.com', phone: '+977-61-460777',
    industry: 'Consulting', industry_id: IND.consulting, company_size: 'SOLO',
    city: 'Pokhara', location_id: LOC.pokhara, verification_status: 'PENDING',
  },
];

export interface DemoVerification {
  n: number;
  company: number;
  status: 'VERIFIED' | 'PENDING' | 'REJECTED';
  remarks: string | null;
  /** Days since submission (review fields stay NULL while pending). */
  submittedDaysAgo: number;
  reviewedDaysAgo: number | null;
}

/** 5 VERIFIED, 2 PENDING (review fields NULL), 1 REJECTED with a real reason. */
export const VERIFICATIONS: DemoVerification[] = [
  { n: 571, company: 501, status: 'VERIFIED', remarks: 'Company registration and PAN documents match.', submittedDaysAgo: 96, reviewedDaysAgo: 94 },
  { n: 572, company: 502, status: 'VERIFIED', remarks: 'Trade license verified against municipality records.', submittedDaysAgo: 74, reviewedDaysAgo: 72 },
  { n: 573, company: 503, status: 'VERIFIED', remarks: 'Financial institution license confirmed with central bank registry.', submittedDaysAgo: 120, reviewedDaysAgo: 118 },
  { n: 574, company: 504, status: 'VERIFIED', remarks: 'Hospital registration certificate validated.', submittedDaysAgo: 61, reviewedDaysAgo: 60 },
  { n: 575, company: 505, status: 'PENDING', remarks: null, submittedDaysAgo: 2, reviewedDaysAgo: null },
  { n: 576, company: 506, status: 'VERIFIED', remarks: 'Company registration and PAN documents match.', submittedDaysAgo: 143, reviewedDaysAgo: 141 },
  { n: 577, company: 507, status: 'REJECTED', remarks: 'Registration certificate has expired and the submitted PAN number does not match company records. Please upload a current certificate issued by the Office of the Company Registrar.', submittedDaysAgo: 9, reviewedDaysAgo: 6 },
  { n: 578, company: 508, status: 'PENDING', remarks: null, submittedDaysAgo: 1, reviewedDaysAgo: null },
];

// ---------------------------------------------------------------------------
// Skills catalog (701-761) — shared by job_skills and profile skills
// ---------------------------------------------------------------------------

export const SKILLS: Array<{ n: number; name: string }> = [
  { n: 701, name: 'React' }, { n: 702, name: 'TypeScript' }, { n: 703, name: 'JavaScript' },
  { n: 704, name: 'Node.js' }, { n: 705, name: 'Next.js' }, { n: 706, name: 'Python' },
  { n: 707, name: 'SQL' }, { n: 708, name: 'PostgreSQL' }, { n: 709, name: 'MongoDB' },
  { n: 710, name: 'Git' }, { n: 711, name: 'Docker' }, { n: 712, name: 'AWS' },
  { n: 713, name: 'Figma' }, { n: 714, name: 'Adobe Photoshop' }, { n: 715, name: 'Adobe Illustrator' },
  { n: 716, name: 'UI/UX Design' }, { n: 717, name: 'SEO' }, { n: 718, name: 'Google Analytics' },
  { n: 719, name: 'Content Writing' }, { n: 720, name: 'Social Media Marketing' }, { n: 721, name: 'Email Marketing' },
  { n: 722, name: 'Accounting' }, { n: 723, name: 'Tally' }, { n: 724, name: 'Financial Analysis' },
  { n: 725, name: 'Excel' }, { n: 726, name: 'Nursing' }, { n: 727, name: 'Patient Care' },
  { n: 728, name: 'Lab Techniques' }, { n: 729, name: 'Teaching' }, { n: 730, name: 'Curriculum Development' },
  { n: 731, name: 'React Native' }, { n: 732, name: 'Customer Service' }, { n: 733, name: 'Networking' },
  { n: 734, name: 'Store Management' }, { n: 735, name: 'Inventory Management' }, { n: 736, name: 'E-Commerce' },
  { n: 737, name: 'Sales' }, { n: 738, name: 'Negotiation' }, { n: 739, name: 'Financial Reporting' },
  { n: 740, name: 'Procurement' }, { n: 741, name: 'Recruitment' }, { n: 742, name: 'Graphic Design' },
  { n: 743, name: 'Project Management' }, { n: 744, name: 'Communication' }, { n: 745, name: 'Leadership' },
  { n: 746, name: 'Time Management' }, { n: 747, name: 'Problem Solving' }, { n: 748, name: 'Data Analysis' },
  { n: 749, name: 'Quality Assurance' }, { n: 750, name: 'Technical Writing' }, { n: 751, name: 'Power BI' },
  { n: 752, name: 'Kubernetes' }, { n: 753, name: 'Linux Administration' }, { n: 754, name: 'Pharmacy Practice' },
  { n: 755, name: 'CSS' }, { n: 756, name: 'HTML' }, { n: 757, name: 'REST APIs' },
  { n: 758, name: 'Agile Methodology' }, { n: 759, name: 'Troubleshooting' }, { n: 760, name: 'Employee Relations' },
  { n: 761, name: 'Attention to Detail' },
];

export const skillId = (name: string): string => {
  const found = SKILLS.find((skill) => skill.name === name);
  if (!found) throw new Error(`Unknown skill in seedData: ${name}`);
  return ID(found.n);
};

// ---------------------------------------------------------------------------
// Jobseeker profiles (201-210) + education / experience / resumes / skills
// ---------------------------------------------------------------------------

export interface DemoProfile {
  n: number;
  user: number;
  headline: string;
  professional_summary: string;
  city: string;
  location_id: string;
  expected_salary: number;
  availability: 'IMMEDIATE' | 'NOTICE_PERIOD' | 'NOT_AVAILABLE';
  skills: string[];
}

/** Keyword-rich headlines/summaries so /jobs/recommended has real signals. */
export const PROFILES: DemoProfile[] = [
  {
    n: 201, user: 101, headline: 'Frontend Developer | React & TypeScript',
    professional_summary: 'Frontend developer with 3 years building production web apps in React, TypeScript and Next.js. Shipped a customer dashboard used by 40,000 monthly users, cares about accessibility and clean component APIs. Looking for mid-level frontend roles in Kathmandu.',
    city: 'Kathmandu', location_id: LOC.kathmandu, expected_salary: 120000, availability: 'NOTICE_PERIOD',
    skills: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'CSS', 'Git', 'REST APIs'],
  },
  {
    n: 202, user: 102, headline: 'Data Analyst | SQL, Python & Power BI',
    professional_summary: 'Data analyst with 4 years turning raw transaction data into decisions. Advanced SQL and Python, dashboards in Power BI, and a habit of documenting every metric. Open to analyst roles in Kathmandu banking or fintech teams.',
    city: 'Kathmandu', location_id: LOC.kathmandu, expected_salary: 95000, availability: 'IMMEDIATE',
    skills: ['SQL', 'Python', 'Excel', 'Power BI', 'Data Analysis', 'PostgreSQL'],
  },
  {
    n: 203, user: 103, headline: 'UI/UX Designer | Figma & Design Systems',
    professional_summary: 'Product designer with 2 years in Figma running research, wireframes and high-fidelity flows for mobile and web. Built and maintained a shared design system for a fintech client. Portfolio available on request.',
    city: 'Lalitpur', location_id: LOC.lalitpur, expected_salary: 80000, availability: 'IMMEDIATE',
    skills: ['Figma', 'UI/UX Design', 'Adobe Photoshop', 'Graphic Design', 'Communication'],
  },
  {
    n: 204, user: 104, headline: 'Full Stack Developer | React, Node.js & PostgreSQL',
    professional_summary: 'Full stack developer with 2 years shipping features across React, Node.js and PostgreSQL. Comfortable owning a service from schema to deploy, writing tests and reviewing PRs. Looking for product team roles in the Kathmandu valley.',
    city: 'Bhaktapur', location_id: LOC.bhaktapur, expected_salary: 100000, availability: 'NOTICE_PERIOD',
    skills: ['React', 'Node.js', 'JavaScript', 'PostgreSQL', 'Git', 'REST APIs', 'Docker'],
  },
  {
    n: 205, user: 105, headline: 'Chartered Accountant | Financial Reporting & Analysis',
    professional_summary: 'CA with 5 years across audit and industry finance: monthly closes, statutory reporting, budgeting and cash-flow forecasting. Led a team of 3 juniors through two audit cycles. Seeking finance manager or senior accountant roles.',
    city: 'Kathmandu', location_id: LOC.kathmandu, expected_salary: 160000, availability: 'NOTICE_PERIOD',
    skills: ['Accounting', 'Financial Analysis', 'Financial Reporting', 'Excel', 'Tally', 'Leadership'],
  },
  {
    n: 206, user: 106, headline: 'Digital Marketing Specialist | SEO & Performance',
    professional_summary: 'Digital marketing specialist with 4 years running SEO, paid social and email campaigns for e-commerce and education clients. Grew organic traffic 140% year over year for one client. Comfortable with Google Analytics and Meta Ads.',
    city: 'Pokhara', location_id: LOC.pokhara, expected_salary: 75000, availability: 'IMMEDIATE',
    skills: ['SEO', 'Google Analytics', 'Social Media Marketing', 'Content Writing', 'Email Marketing', 'Communication'],
  },
  {
    n: 207, user: 107, headline: 'Registered Nurse | ICU & Patient Care',
    professional_summary: 'Registered nurse with 3 years in ICU and emergency wards: vitals, medication rounds, ventilator care and patient handovers. Calm under pressure and used to 12-hour shifts. GNMC licensed, open to hospital roles in Chitwan and Kathmandu.',
    city: 'Chitwan', location_id: LOC.chitwan, expected_salary: 55000, availability: 'IMMEDIATE',
    skills: ['Nursing', 'Patient Care', 'Communication', 'Time Management'],
  },
  {
    n: 208, user: 108, headline: 'Sales & Distribution Executive | Retail & FMCG',
    professional_summary: 'Sales executive with 3 years covering Terai retail territories: kirana routing, order collection, credit follow-ups and monthly target ownership. Strong relationship skills in Nepali and Maithili. Looking for territory or key-account roles.',
    city: 'Biratnagar', location_id: LOC.biratnagar, expected_salary: 60000, availability: 'NOTICE_PERIOD',
    skills: ['Sales', 'Negotiation', 'Customer Service', 'Communication', 'Excel'],
  },
  {
    n: 209, user: 109, headline: 'Supply Chain & Procurement Officer',
    professional_summary: 'Procurement officer with 2 years handling vendor sourcing, purchase orders, freight booking and inventory reconciliation for a retail group. Excel-heavy, detail-driven, used to weekly stock reviews across multiple outlets.',
    city: 'Butwal', location_id: LOC.butwal, expected_salary: 58000, availability: 'IMMEDIATE',
    skills: ['Procurement', 'Inventory Management', 'Excel', 'Attention to Detail', 'Communication'],
  },
  {
    n: 210, user: 110, headline: 'Staff Nurse | Ward Care & Triage',
    professional_summary: 'Early-career staff nurse with 1 year of ward experience: admission assessments, IV administration, dressing changes and discharge guidance. Strong patient communication and comfortable with night rotations. Eager to grow in a teaching hospital.',
    city: 'Biratnagar', location_id: LOC.biratnagar, expected_salary: 42000, availability: 'IMMEDIATE',
    skills: ['Nursing', 'Patient Care', 'Communication', 'Attention to Detail'],
  },
];

export interface DemoEducation {
  profile: number;
  institution: string;
  degree: string;
  field_of_study: string | null;
  start: string;
  end: string | null;
  is_current: boolean;
  grade: string | null;
}

export const EDUCATIONS: DemoEducation[] = [
  { profile: 201, institution: 'Tribhuvan University', degree: 'BSc in Computer Science', field_of_study: 'Computer Science', start: '2018-09', end: '2022-06', is_current: false, grade: '3.6 GPA' },
  { profile: 202, institution: 'Tribhuvan University', degree: 'BBS in Management', field_of_study: 'Business Statistics', start: '2017-09', end: '2021-06', is_current: false, grade: '3.4 GPA' },
  { profile: 202, institution: 'Coursera / DeepLearning.AI', degree: 'Data Analytics Professional Certificate', field_of_study: 'Data Analytics', start: '2022-01', end: '2022-08', is_current: false, grade: null },
  { profile: 203, institution: 'Kathmandu University', degree: 'BFA in Visual Communication', field_of_study: 'Design', start: '2019-09', end: '2023-05', is_current: false, grade: '3.7 GPA' },
  { profile: 204, institution: 'Pulchowk Campus', degree: 'BE in Computer Engineering', field_of_study: 'Computer Engineering', start: '2018-09', end: '2022-06', is_current: false, grade: '3.5 GPA' },
  { profile: 205, institution: 'ICAN', degree: 'Chartered Accountant (CA)', field_of_study: 'Accounting & Finance', start: '2017-01', end: '2023-12', is_current: false, grade: 'Both groups passed' },
  { profile: 205, institution: 'Tribhuvan University', degree: 'BBS in Management', field_of_study: 'Accounting', start: '2016-09', end: '2020-06', is_current: false, grade: '3.8 GPA' },
  { profile: 206, institution: 'Pokhara University', degree: 'BBA in Marketing', field_of_study: 'Marketing', start: '2016-09', end: '2020-06', is_current: false, grade: '3.3 GPA' },
  { profile: 207, institution: 'Patan Academy of Health Sciences', degree: 'BSc in Nursing', field_of_study: 'Nursing', start: '2017-09', end: '2021-06', is_current: false, grade: '3.5 GPA' },
  { profile: 208, institution: 'Purbanchal University', degree: 'BBS in Management', field_of_study: 'Sales & Distribution', start: '2018-09', end: '2022-06', is_current: false, grade: '3.2 GPA' },
  { profile: 209, institution: 'Yeti University', degree: 'BBA in Supply Chain', field_of_study: 'Supply Chain Management', start: '2019-09', end: '2023-06', is_current: false, grade: '3.4 GPA' },
  { profile: 210, institution: 'B.P. Koirala Institute of Health Sciences', degree: 'BN in Nursing', field_of_study: 'Nursing', start: '2020-09', end: '2024-06', is_current: false, grade: '3.3 GPA' },
];

export interface DemoExperience {
  profile: number;
  company_name: string;
  job_title: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  location: string;
  start: string;
  end: string | null;
  is_current: boolean;
  description: string;
}

export const EXPERIENCES: DemoExperience[] = [
  { profile: 201, company_name: 'Himalayan Tech Solutions', job_title: 'Frontend Developer', employment_type: 'FULL_TIME', location: 'Kathmandu', start: '2022-08', end: null, is_current: true, description: 'Own the React component library and checkout flows for a retail client; reduced bundle size 38% and mentored one junior engineer.' },
  { profile: 201, company_name: 'Kathmandu Web Works', job_title: 'Junior Web Developer', employment_type: 'FULL_TIME', location: 'Kathmandu', start: '2021-07', end: '2022-07', is_current: false, description: 'Built marketing sites and admin panels in HTML, CSS and JavaScript for small businesses.' },
  { profile: 202, company_name: 'Sunrise Financial Services', job_title: 'Data Analyst', employment_type: 'FULL_TIME', location: 'Kathmandu', start: '2022-05', end: null, is_current: true, description: 'SQL pipelines and Power BI credit-risk dashboards for 18 branches; automated a weekly report that saved 6 hours per cycle.' },
  { profile: 202, company_name: 'Everest Analytics', job_title: 'Junior Analyst', employment_type: 'FULL_TIME', location: 'Kathmandu', start: '2021-06', end: '2022-04', is_current: false, description: 'Survey analysis and Excel modelling for FMCG clients.' },
  { profile: 203, company_name: 'Everest Digital Agency', job_title: 'UI/UX Designer', employment_type: 'FULL_TIME', location: 'Lalitpur', start: '2023-07', end: null, is_current: true, description: 'Design flows for two client apps, run usability tests, maintain the shared Figma design system.' },
  { profile: 203, company_name: 'Bindu EduTech', job_title: 'Visual Designer', employment_type: 'CONTRACT', location: 'Bhaktapur', start: '2022-02', end: '2023-06', is_current: false, description: 'Course thumbnails, social creatives and web banners for an e-learning platform.' },
  { profile: 204, company_name: 'Bindu EduTech', job_title: 'Full Stack Developer', employment_type: 'FULL_TIME', location: 'Bhaktapur', start: '2023-08', end: null, is_current: true, description: 'Ship live-class and quiz features in React and Node used by 180,000 students on low-bandwidth connections.' },
  { profile: 205, company_name: 'Nepal Retail Network', job_title: 'Finance Manager', employment_type: 'FULL_TIME', location: 'Biratnagar', start: '2023-03', end: null, is_current: true, description: 'Lead monthly closes across 14 outlets, own statutory reporting and a NPR 2.4B annual budget cycle.' },
  { profile: 205, company_name: 'Sharma & Associates', job_title: 'Audit Associate', employment_type: 'FULL_TIME', location: 'Kathmandu', start: '2019-04', end: '2023-02', is_current: false, description: 'Statutory audits of banks and insurers; led field teams of 3 juniors.' },
  { profile: 206, company_name: 'Everest Digital Agency', job_title: 'Digital Marketing Specialist', employment_type: 'FULL_TIME', location: 'Lalitpur', start: '2022-09', end: null, is_current: true, description: 'Run SEO and paid campaigns for 6 retainers; one client went from 12k to 29k monthly organic visits.' },
  { profile: 206, company_name: 'Karnali Telecom', job_title: 'Marketing Coordinator', employment_type: 'FULL_TIME', location: 'Bhairahawa', start: '2020-10', end: '2022-08', is_current: false, description: 'Campaign calendars, SMS marketing and dealer collateral for a telecom operator.' },
  { profile: 207, company_name: 'Green Valley Healthcare', job_title: 'Staff Nurse (ICU)', employment_type: 'FULL_TIME', location: 'Chitwan', start: '2022-07', end: null, is_current: true, description: '12-bed ICU: ventilator care, medication rounds, admission assessments and shift handovers.' },
  { profile: 208, company_name: 'Nepal Retail Network', job_title: 'Sales Executive', employment_type: 'FULL_TIME', location: 'Biratnagar', start: '2023-01', end: null, is_current: true, description: 'Cover 80 kirana accounts with monthly order targets; consistently 110% of quota.' },
  { profile: 208, company_name: 'Terai Traders', job_title: 'Distribution Officer', employment_type: 'FULL_TIME', location: 'Biratnagar', start: '2021-05', end: '2022-12', is_current: false, description: 'Route planning, load booking and retailer credit follow-ups across Morang and Sunsari.' },
  { profile: 209, company_name: 'Nepal Retail Network', job_title: 'Procurement Assistant', employment_type: 'FULL_TIME', location: 'Butwal', start: '2023-09', end: null, is_current: true, description: 'Vendor comparison, purchase orders and goods-receipt reconciliation for a 14-store chain.' },
  { profile: 210, company_name: 'Green Valley Healthcare', job_title: 'Staff Nurse', employment_type: 'FULL_TIME', location: 'Chitwan', start: '2024-08', end: null, is_current: true, description: 'Ward duties: admission assessments, IV administration, dressing changes and discharge guidance.' },
];

export interface DemoResume {
  profile: number;
  title: string;
  file_name: string;
  file_size_bytes: number;
  is_default: boolean;
}

export const RESUMES: DemoResume[] = [
  { profile: 201, title: 'Frontend Developer Resume', file_name: 'aarav-sharma-frontend.pdf', file_size_bytes: 248_112, is_default: true },
  { profile: 201, title: 'General Resume', file_name: 'aarav-sharma-general.pdf', file_size_bytes: 231_540, is_default: false },
  { profile: 202, title: 'Data Analyst Resume', file_name: 'priya-gurung-analytics.pdf', file_size_bytes: 214_993, is_default: true },
  { profile: 203, title: 'Design Portfolio Resume', file_name: 'sita-tamang-design.pdf', file_size_bytes: 356_201, is_default: true },
  { profile: 204, title: 'Full Stack Resume', file_name: 'rohan-maharjan-fullstack.pdf', file_size_bytes: 226_447, is_default: true },
  { profile: 205, title: 'Finance Manager Resume', file_name: 'anjali-karki-finance.pdf', file_size_bytes: 219_884, is_default: true },
  { profile: 206, title: 'Marketing Resume', file_name: 'bikram-rai-marketing.pdf', file_size_bytes: 208_665, is_default: true },
  { profile: 207, title: 'Nursing Resume', file_name: 'nisha-thapa-nursing.pdf', file_size_bytes: 198_332, is_default: true },
  { profile: 208, title: 'Sales Resume', file_name: 'deepak-chaudhary-sales.pdf', file_size_bytes: 192_774, is_default: true },
  { profile: 209, title: 'Procurement Resume', file_name: 'suman-bista-procurement.pdf', file_size_bytes: 187_209, is_default: true },
  { profile: 210, title: 'Staff Nurse Resume', file_name: 'kritika-joshi-nursing.pdf', file_size_bytes: 184_556, is_default: true },
];

// ---------------------------------------------------------------------------
// Jobs (601-628 published, 629 PENDING_REVIEW, 630 DRAFT)
// ---------------------------------------------------------------------------

export interface DemoJobSkill {
  skill: string;
  importance: 'REQUIRED' | 'PREFERRED';
}

export interface DemoJob {
  n: number;
  company: number;
  title: string;
  category_id: string | null;
  location_id: string;
  city: string;
  employment_type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  experience_level: 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD';
  salary_min: number;
  salary_max: number;
  vacancies: number;
  ageDays: number;
  status: 'PUBLISHED' | 'PENDING_REVIEW' | 'DRAFT';
  description: string;
  education_requirement: string | null;
  experience_requirement: string | null;
  skills: DemoJobSkill[];
}

export const JOBS: DemoJob[] = [
  // ---- Himalayan Tech Solutions (501) ----
  { n: 601, company: 501, title: 'Senior Frontend Engineer', category_id: CAT.frontend, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'FULL_TIME', experience_level: 'SENIOR', salary_min: 120000, salary_max: 160000, vacancies: 2, ageDays: 1, status: 'PUBLISHED', description: 'Own the design system and checkout experience for a retail client serving 400,000 monthly shoppers. You will pair with two designers and mentor one junior engineer, shipping to production every week.', education_requirement: "Bachelor's in Computer Science or equivalent experience", experience_requirement: '4+ years building production React applications', skills: [{ skill: 'React', importance: 'REQUIRED' }, { skill: 'TypeScript', importance: 'REQUIRED' }, { skill: 'Next.js', importance: 'PREFERRED' }, { skill: 'CSS', importance: 'PREFERRED' }, { skill: 'Git', importance: 'PREFERRED' }] },
  { n: 602, company: 501, title: 'Backend Engineer (Node.js)', category_id: CAT.backend, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 100000, salary_max: 150000, vacancies: 3, ageDays: 2, status: 'PUBLISHED', description: 'Build payment and booking services that handle 12,000 transactions a day. The stack is TypeScript, PostgreSQL and queues; you will own services end to end, from schema design to on-call rotation.', education_requirement: "Bachelor's in Computer Science or equivalent", experience_requirement: '2+ years with Node.js in production', skills: [{ skill: 'Node.js', importance: 'REQUIRED' }, { skill: 'PostgreSQL', importance: 'REQUIRED' }, { skill: 'TypeScript', importance: 'PREFERRED' }, { skill: 'REST APIs', importance: 'PREFERRED' }, { skill: 'Docker', importance: 'PREFERRED' }] },
  { n: 603, company: 501, title: 'UI/UX Designer', category_id: CAT.software, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 70000, salary_max: 100000, vacancies: 1, ageDays: 3, status: 'PUBLISHED', description: 'Run research, wireframes and high-fidelity flows for two client products at once. We expect a portfolio with shipped mobile work and a habit of testing prototypes with real users before handoff.', education_requirement: 'Design degree or equivalent portfolio', experience_requirement: '2+ years of product design work', skills: [{ skill: 'Figma', importance: 'REQUIRED' }, { skill: 'UI/UX Design', importance: 'REQUIRED' }, { skill: 'Adobe Photoshop', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'PREFERRED' }] },
  { n: 604, company: 501, title: 'DevOps Engineer', category_id: CAT.software, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'CONTRACT', experience_level: 'SENIOR', salary_min: 110000, salary_max: 150000, vacancies: 1, ageDays: 5, status: 'PUBLISHED', description: 'Six-month contract to steady a Kubernetes platform that grew faster than its pipelines. Cut deploy time, add real observability, and leave behind documentation the team can actually follow.', education_requirement: 'CS degree or equivalent certification', experience_requirement: '4+ years in DevOps or SRE roles', skills: [{ skill: 'Kubernetes', importance: 'REQUIRED' }, { skill: 'Docker', importance: 'REQUIRED' }, { skill: 'AWS', importance: 'PREFERRED' }, { skill: 'Linux Administration', importance: 'PREFERRED' }, { skill: 'Troubleshooting', importance: 'PREFERRED' }] },
  { n: 616, company: 501, title: 'React Native Developer', category_id: CAT.software, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 100000, salary_max: 150000, vacancies: 2, ageDays: 1, status: 'PUBLISHED', description: 'Own our subscriber app: offline balance checks, USSD fallback and a recharge flow that must work on 2G. Two releases a month, with crash rate as your headline metric.', education_requirement: "Bachelor's or equivalent", experience_requirement: '2+ years shipping React Native apps', skills: [{ skill: 'React Native', importance: 'REQUIRED' }, { skill: 'React', importance: 'REQUIRED' }, { skill: 'JavaScript', importance: 'PREFERRED' }, { skill: 'Git', importance: 'PREFERRED' }] },
  { n: 618, company: 501, title: 'Network Operations Technician', category_id: CAT.software, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 50000, salary_max: 75000, vacancies: 3, ageDays: 6, status: 'PUBLISHED', description: 'Monitor two province-wide microwave links, respond to alarms within 15 minutes and travel to tower sites with the field crew when a section drops. Roster includes one weekend in six.', education_requirement: 'Diploma or degree in electronics/IT', experience_requirement: '1+ years in NOC or field operations', skills: [{ skill: 'Networking', importance: 'REQUIRED' }, { skill: 'Troubleshooting', importance: 'REQUIRED' }, { skill: 'Linux Administration', importance: 'PREFERRED' }, { skill: 'Time Management', importance: 'PREFERRED' }] },

  // ---- Everest Digital Agency (502) ----
  { n: 614, company: 502, title: 'Content Writer (Nepali Medium)', category_id: CAT.marketing, location_id: LOC.lalitpur, city: 'Lalitpur', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 40000, salary_max: 60000, vacancies: 2, ageDays: 5, status: 'PUBLISHED', description: 'Write lesson summaries, practice questions and exam tips in Nepali for grades 9 to 12. Subject accuracy is checked by our teachers; clarity for a 15-year-old on a cheap phone is your standard.', education_requirement: 'Bachelor in Nepali, English or Education', experience_requirement: '1+ years of writing or editing work', skills: [{ skill: 'Content Writing', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'PREFERRED' }, { skill: 'SEO', importance: 'PREFERRED' }] },
  { n: 617, company: 502, title: 'Customer Support Executive', category_id: CAT.marketing, location_id: LOC.lalitpur, city: 'Lalitpur', employment_type: 'FULL_TIME', experience_level: 'ENTRY', salary_min: 35000, salary_max: 50000, vacancies: 8, ageDays: 2, status: 'PUBLISHED', description: 'Handle calls, WhatsApp and store walk-ins for prepaid subscribers: plan changes, failed recharge and coverage questions. Training is four weeks; Nepali and Tharu language skills are a real advantage.', education_requirement: 'Intermediate or above', experience_requirement: 'Fresh graduates welcome', skills: [{ skill: 'Customer Service', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'REQUIRED' }, { skill: 'Problem Solving', importance: 'PREFERRED' }] },
  { n: 626, company: 502, title: 'Graphic Designer', category_id: CAT.graphic, location_id: LOC.lalitpur, city: 'Lalitpur', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 45000, salary_max: 70000, vacancies: 1, ageDays: 4, status: 'PUBLISHED', description: 'Produce campaign creatives, social assets and print collateral for six retainers. Fast turnaround, tight brand guidelines, and a portfolio that shows both typography discipline and commercial instinct.', education_requirement: 'Design diploma or degree', experience_requirement: '2+ years in an agency or in-house team', skills: [{ skill: 'Graphic Design', importance: 'REQUIRED' }, { skill: 'Adobe Photoshop', importance: 'REQUIRED' }, { skill: 'Adobe Illustrator', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'PREFERRED' }] },

  // ---- Sunrise Financial Services (503) ----
  { n: 605, company: 503, title: 'Data Analyst', category_id: CAT.data, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'FULL_TIME', experience_level: 'ENTRY', salary_min: 60000, salary_max: 90000, vacancies: 2, ageDays: 1, status: 'PUBLISHED', description: 'Turn branch transaction data into weekly credit risk reports for the loan committee. SQL and Excel get you started; curiosity about how rural borrowers actually repay is what keeps you here.', education_requirement: 'BBS/BSc with statistics or analytics focus', experience_requirement: '0-2 years; strong SQL is enough', skills: [{ skill: 'SQL', importance: 'REQUIRED' }, { skill: 'Excel', importance: 'REQUIRED' }, { skill: 'Data Analysis', importance: 'PREFERRED' }, { skill: 'Power BI', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'PREFERRED' }] },
  { n: 606, company: 503, title: 'Branch Manager', category_id: CAT.finance, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'FULL_TIME', experience_level: 'LEAD', salary_min: 90000, salary_max: 130000, vacancies: 1, ageDays: 4, status: 'PUBLISHED', description: 'Run a busy urban branch: nine staff, a 1.2 billion loan book and daily cash discipline. You are measured on portfolio quality, service speed and how your team grows over the year.', education_requirement: 'BBS/MBS in management or finance', experience_requirement: '5+ years in financial services, 2 leading a team', skills: [{ skill: 'Leadership', importance: 'REQUIRED' }, { skill: 'Financial Analysis', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'PREFERRED' }, { skill: 'Excel', importance: 'PREFERRED' }] },
  { n: 607, company: 503, title: 'Credit Officer', category_id: CAT.finance, location_id: LOC.bhairahawa, city: 'Bhairahawa', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 45000, salary_max: 65000, vacancies: 4, ageDays: 2, status: 'PUBLISHED', description: 'Assess small business and agriculture loan applications in the Rupandehi corridor: visit applicants, verify cash flow, and write recommendations the committee can act on within 48 hours.', education_requirement: 'BBS or equivalent', experience_requirement: '1+ years in credit or microfinance', skills: [{ skill: 'Financial Analysis', importance: 'REQUIRED' }, { skill: 'Excel', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'PREFERRED' }, { skill: 'Attention to Detail', importance: 'PREFERRED' }] },
  { n: 608, company: 503, title: 'Mobile Loan Officer', category_id: CAT.finance, location_id: LOC.biratnagar, city: 'Biratnagar', employment_type: 'FULL_TIME', experience_level: 'ENTRY', salary_min: 40000, salary_max: 60000, vacancies: 6, ageDays: 6, status: 'PUBLISHED', description: 'Field role visiting shop owners and farmers to originate microloans. Company motorcycle and fuel provided; performance bonus scales with the portfolio you build in your first six months.', education_requirement: 'Intermediate or above', experience_requirement: 'Fresh graduates welcome; sales aptitude helps', skills: [{ skill: 'Sales', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'PREFERRED' }, { skill: 'Negotiation', importance: 'PREFERRED' }] },
  { n: 625, company: 503, title: 'HR Officer', category_id: CAT.hr, location_id: LOC.kathmandu, city: 'Kathmandu', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 55000, salary_max: 80000, vacancies: 1, ageDays: 7, status: 'PUBLISHED', description: 'Own recruitment for 18 branches: posting roles, screening, interview scheduling and onboarding paperwork. You will also run monthly payroll inputs and keep the HRIS clean.', education_requirement: 'BBS/BBA with HR focus', experience_requirement: '2+ years in recruitment or HR operations', skills: [{ skill: 'Recruitment', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'REQUIRED' }, { skill: 'Employee Relations', importance: 'PREFERRED' }, { skill: 'Excel', importance: 'PREFERRED' }] },

  // ---- Green Valley Healthcare (504) ----
  { n: 609, company: 504, title: 'Registered Nurse (ICU)', category_id: CAT.healthcare, location_id: LOC.chitwan, city: 'Chitwan', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 50000, salary_max: 75000, vacancies: 5, ageDays: 1, status: 'PUBLISHED', description: 'Twelve-bed ICU in a teaching hospital: night shifts, ventilator patients and a strong senior nurse on every shift. GNMC registration and two years of acute care experience are required.', education_requirement: 'BSc Nursing with GNMC license', experience_requirement: '2+ years in acute or critical care', skills: [{ skill: 'Nursing', importance: 'REQUIRED' }, { skill: 'Patient Care', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'PREFERRED' }, { skill: 'Time Management', importance: 'PREFERRED' }] },
  { n: 610, company: 504, title: 'Medical Laboratory Technician', category_id: CAT.healthcare, location_id: LOC.chitwan, city: 'Chitwan', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 45000, salary_max: 65000, vacancies: 2, ageDays: 3, status: 'PUBLISHED', description: 'Run haematology, biochemistry and rapid tests on a 90-sample daily load, and keep the analyzer maintenance log audit-ready. Evening shift rotates every two weeks.', education_requirement: 'Diploma or BSc in Medical Laboratory Technology', experience_requirement: '1+ years in a clinical lab', skills: [{ skill: 'Lab Techniques', importance: 'REQUIRED' }, { skill: 'Attention to Detail', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'PREFERRED' }] },
  { n: 611, company: 504, title: 'Hospital Administrator', category_id: CAT.healthcare, location_id: LOC.chitwan, city: 'Chitwan', employment_type: 'FULL_TIME', experience_level: 'SENIOR', salary_min: 80000, salary_max: 120000, vacancies: 1, ageDays: 7, status: 'PUBLISHED', description: 'Coordinate outpatient scheduling, supplier contracts and accreditation paperwork across two sites. The role sits between clinical heads and finance, so clear writing and calm negotiation matter as much as the spreadsheet.', education_requirement: 'MBS/MHA or equivalent experience', experience_requirement: '4+ years managing hospital or clinic operations', skills: [{ skill: 'Project Management', importance: 'REQUIRED' }, { skill: 'Leadership', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'REQUIRED' }, { skill: 'Excel', importance: 'PREFERRED' }] },
  { n: 612, company: 504, title: 'Pharmacy Assistant', category_id: CAT.healthcare, location_id: LOC.chitwan, city: 'Chitwan', employment_type: 'PART_TIME', experience_level: 'ENTRY', salary_min: 35000, salary_max: 50000, vacancies: 2, ageDays: 4, status: 'PUBLISHED', description: 'Dispense prescriptions under pharmacist supervision, keep shelf stock counted, and explain dosage clearly to patients at the counter. Four-hour shifts, six days a week.', education_requirement: 'Certificate in pharmacy or pharmacy studies', experience_requirement: 'Fresh graduates welcome', skills: [{ skill: 'Pharmacy Practice', importance: 'REQUIRED' }, { skill: 'Attention to Detail', importance: 'PREFERRED' }, { skill: 'Customer Service', importance: 'PREFERRED' }] },
  { n: 628, company: 504, title: 'Staff Nurse', category_id: CAT.healthcare, location_id: LOC.chitwan, city: 'Chitwan', employment_type: 'FULL_TIME', experience_level: 'ENTRY', salary_min: 42000, salary_max: 58000, vacancies: 6, ageDays: 2, status: 'PUBLISHED', description: 'Ward rotations across medical and surgical floors: admission assessments, medication rounds, dressing changes and discharge guidance. Preceptors are assigned for the first three months.', education_requirement: 'BN/BSc Nursing with GNMC license', experience_requirement: 'Fresh graduates and 1-year staff nurses welcome', skills: [{ skill: 'Nursing', importance: 'REQUIRED' }, { skill: 'Patient Care', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'PREFERRED' }] },

  // ---- NextGen Education Center (505) ----
  { n: 613, company: 505, title: 'Full Stack Developer', category_id: CAT.software, location_id: LOC.butwal, city: 'Butwal', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 90000, salary_max: 140000, vacancies: 2, ageDays: 2, status: 'PUBLISHED', description: 'Build live-class and quiz features used by 180,000 students on low-bandwidth connections. React, Node and PostgreSQL, with a product team that ships a new experiment every fortnight.', education_requirement: "Bachelor's in Computer Science or equivalent", experience_requirement: '2+ years full stack delivery', skills: [{ skill: 'React', importance: 'REQUIRED' }, { skill: 'Node.js', importance: 'REQUIRED' }, { skill: 'PostgreSQL', importance: 'PREFERRED' }, { skill: 'Git', importance: 'PREFERRED' }, { skill: 'REST APIs', importance: 'PREFERRED' }] },
  { n: 615, company: 505, title: 'Curriculum Designer', category_id: CAT.education, location_id: LOC.butwal, city: 'Butwal', employment_type: 'CONTRACT', experience_level: 'SENIOR', salary_min: 55000, salary_max: 80000, vacancies: 1, ageDays: 8, status: 'PUBLISHED', description: 'Nine-month contract to redesign our science course sequence against the updated national syllabus. You will work with two teachers, one designer and a data analyst who tracks where students stall.', education_requirement: 'Bachelor in Education or subject major', experience_requirement: '3+ years teaching or curriculum work', skills: [{ skill: 'Curriculum Development', importance: 'REQUIRED' }, { skill: 'Teaching', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'PREFERRED' }] },

  // ---- Nepal Retail Network (506) ----
  { n: 619, company: 506, title: 'Store Manager', category_id: CAT.marketing, location_id: LOC.biratnagar, city: 'Biratnagar', employment_type: 'FULL_TIME', experience_level: 'SENIOR', salary_min: 60000, salary_max: 90000, vacancies: 2, ageDays: 3, status: 'PUBLISHED', description: 'Own sales, shrink and staffing for a 6,000 sq ft supermarket doing NPR 40 million a month. You will hire and train a team of 14 and settle the tills with finance every night.', education_requirement: 'Bachelor in management or equivalent experience', experience_requirement: '3+ years in retail, 1 leading a store team', skills: [{ skill: 'Store Management', importance: 'REQUIRED' }, { skill: 'Leadership', importance: 'REQUIRED' }, { skill: 'Sales', importance: 'PREFERRED' }, { skill: 'Excel', importance: 'PREFERRED' }] },
  { n: 620, company: 506, title: 'Inventory Analyst', category_id: CAT.data, location_id: LOC.biratnagar, city: 'Biratnagar', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 45000, salary_max: 70000, vacancies: 1, ageDays: 5, status: 'PUBLISHED', description: 'Forecast demand store by store, flag slow movers before they hit markdown, and run the weekly count reconciliation. Fresh vegetables and dairy move differently from everything else, and that is the interesting part.', education_requirement: 'BBS/BSc with quantitative focus', experience_requirement: '1+ years in inventory or demand planning', skills: [{ skill: 'Inventory Management', importance: 'REQUIRED' }, { skill: 'Excel', importance: 'REQUIRED' }, { skill: 'Data Analysis', importance: 'PREFERRED' }, { skill: 'Attention to Detail', importance: 'PREFERRED' }] },
  { n: 621, company: 506, title: 'E-Commerce Merchandiser', category_id: CAT.marketing, location_id: LOC.biratnagar, city: 'Biratnagar', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 50000, salary_max: 80000, vacancies: 1, ageDays: 7, status: 'PUBLISHED', description: 'Plan the daily grocery app: category placement, bundle offers and delivery-slot capacity. You will work with the warehouse lead so promotions never promise what the shelves cannot cover.', education_requirement: 'Bachelor in management or marketing', experience_requirement: '2+ years in e-commerce or category management', skills: [{ skill: 'E-Commerce', importance: 'REQUIRED' }, { skill: 'Data Analysis', importance: 'PREFERRED' }, { skill: 'Excel', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'PREFERRED' }] },

  // ---- Apex Construction Group (507) ----
  { n: 622, company: 507, title: 'Sales Executive', category_id: CAT.marketing, location_id: LOC.dharan, city: 'Dharan', employment_type: 'FULL_TIME', experience_level: 'ENTRY', salary_min: 40000, salary_max: 70000, vacancies: 5, ageDays: 1, status: 'PUBLISHED', description: 'Grow a territory of contractors and hardware dealers with monthly order targets and a company vehicle. Base salary plus route commission; the top performer on this team earned double their base last year.', education_requirement: 'Intermediate or above', experience_requirement: 'Fresher-friendly; field sales aptitude helps', skills: [{ skill: 'Sales', importance: 'REQUIRED' }, { skill: 'Negotiation', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'PREFERRED' }, { skill: 'Customer Service', importance: 'PREFERRED' }] },
  { n: 623, company: 507, title: 'Accounts Officer', category_id: CAT.finance, location_id: LOC.dharan, city: 'Dharan', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 45000, salary_max: 65000, vacancies: 1, ageDays: 4, status: 'PUBLISHED', description: 'Post supplier invoices, chase the 45-day receivables book and prepare the monthly GST return with our auditor. Tally or a similar ledger is expected; patience with slow-paying retailers is essential.', education_requirement: 'BBS with accounting focus', experience_requirement: '1+ years in accounting or audit', skills: [{ skill: 'Accounting', importance: 'REQUIRED' }, { skill: 'Tally', importance: 'REQUIRED' }, { skill: 'Excel', importance: 'PREFERRED' }, { skill: 'Financial Reporting', importance: 'PREFERRED' }] },
  { n: 624, company: 507, title: 'Procurement Assistant', category_id: null, location_id: LOC.dharan, city: 'Dharan', employment_type: 'FULL_TIME', experience_level: 'ENTRY', salary_min: 40000, salary_max: 60000, vacancies: 2, ageDays: 8, status: 'PUBLISHED', description: 'Support the purchasing desk: compare mill prices, book inter-district freight and keep the goods-receipt register tidy. Detail matters more than experience here; we will train the right person.', education_requirement: 'Intermediate or above', experience_requirement: 'Fresh graduates welcome', skills: [{ skill: 'Procurement', importance: 'REQUIRED' }, { skill: 'Attention to Detail', importance: 'PREFERRED' }, { skill: 'Excel', importance: 'PREFERRED' }] },
  { n: 627, company: 507, title: 'Project Manager (Roads)', category_id: CAT.project, location_id: LOC.dharan, city: 'Dharan', employment_type: 'FULL_TIME', experience_level: 'SENIOR', salary_min: 110000, salary_max: 155000, vacancies: 1, ageDays: 6, status: 'PUBLISHED', description: 'Lead two road upgrade packages in Sunsari: subcontractor scheduling, daily progress against BOQ, safety audits and monthly client reporting. You will own the site team of 12 plus survey crew.', education_requirement: 'BE Civil or equivalent', experience_requirement: '5+ years managing construction packages', skills: [{ skill: 'Project Management', importance: 'REQUIRED' }, { skill: 'Leadership', importance: 'REQUIRED' }, { skill: 'Communication', importance: 'PREFERRED' }, { skill: 'Attention to Detail', importance: 'PREFERRED' }] },

  // ---- CloudPeak Consulting (508): awaiting moderation + one draft ----
  { n: 629, company: 508, title: 'Business Development Executive', category_id: CAT.marketing, location_id: LOC.pokhara, city: 'Pokhara', employment_type: 'FULL_TIME', experience_level: 'MID', salary_min: 50000, salary_max: 85000, vacancies: 2, ageDays: 1, status: 'PENDING_REVIEW', description: 'Open consulting engagements with tourism and retail clients in Gandaki: discovery calls, proposal drafts and handover to delivery. Commission on top of base once you close.', education_requirement: 'Bachelor in business or related field', experience_requirement: '2+ years in B2B sales or consulting sales', skills: [{ skill: 'Sales', importance: 'REQUIRED' }, { skill: 'Negotiation', importance: 'PREFERRED' }, { skill: 'Communication', importance: 'REQUIRED' }] },
  { n: 630, company: 508, title: 'Data Engineer (Contract)', category_id: CAT.data, location_id: LOC.pokhara, city: 'Pokhara', employment_type: 'CONTRACT', experience_level: 'MID', salary_min: 100000, salary_max: 140000, vacancies: 1, ageDays: 1, status: 'DRAFT', description: 'Six-month remote-friendly contract to build ETL pipelines for two retail clients: Python, PostgreSQL and scheduled orchestration. Draft listing — final scope agreed with the partners this week.', education_requirement: "Bachelor's in CS or equivalent", experience_requirement: '2+ years data engineering work', skills: [{ skill: 'Python', importance: 'REQUIRED' }, { skill: 'SQL', importance: 'REQUIRED' }, { skill: 'PostgreSQL', importance: 'PREFERRED' }] },
];

// ---------------------------------------------------------------------------
// Applications (801-814) spanning every status + their status history
// ---------------------------------------------------------------------------

export interface DemoStatusStep {
  to: 'APPLIED' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'INTERVIEW' | 'SELECTED' | 'HIRED' | 'REJECTED' | 'WITHDRAWN';
  /** 'candidate' means changed_by = the applicant; otherwise a user number. */
  by: 'candidate' | number;
  reason: string;
  daysAgo: number;
}

export interface DemoApplication {
  n: number;
  job: number;
  /** jobseeker user number (101-110) */
  user: number;
  status: DemoStatusStep['to'];
  source: 'DIRECT' | 'SEARCH' | 'RECOMMENDATION' | 'REFERRAL' | 'JOB_ALERT';
  appliedDaysAgo: number;
  withdrawnDaysAgo?: number;
  cover_letter: string | null;
  history: DemoStatusStep[];
}

const step = (
  to: DemoStatusStep['to'],
  by: 'candidate' | number,
  reason: string,
  daysAgo: number,
): DemoStatusStep => ({ to, by, reason, daysAgo });

export const APPLICATIONS: DemoApplication[] = [
  { n: 801, job: 601, user: 101, status: 'INTERVIEW', source: 'RECOMMENDATION', appliedDaysAgo: 9, cover_letter: 'I have spent the last year owning a checkout redesign for a high-traffic retail client and would love to bring that same focus to your design system.', history: [step('APPLIED', 'candidate', 'Application submitted', 9), step('UNDER_REVIEW', 121, 'Application moved to review', 7), step('SHORTLISTED', 131, 'Shortlisted for technical round', 4), step('INTERVIEW', 121, 'Interview scheduled with engineering panel', 2)] },
  { n: 802, job: 602, user: 101, status: 'UNDER_REVIEW', source: 'SEARCH', appliedDaysAgo: 5, cover_letter: 'Backend roles complement my frontend work; my strongest evidence is a payments service I helped take to 12k transactions a day.', history: [step('APPLIED', 'candidate', 'Application submitted', 5), step('UNDER_REVIEW', 132, 'Application moved to review', 3)] },
  { n: 803, job: 602, user: 104, status: 'APPLIED', source: 'RECOMMENDATION', appliedDaysAgo: 1, cover_letter: 'Two years of full stack work on a low-bandwidth edtech product; comfortable owning a Node service end to end.', history: [step('APPLIED', 'candidate', 'Application submitted', 1)] },
  { n: 804, job: 605, user: 102, status: 'HIRED', source: 'JOB_ALERT', appliedDaysAgo: 26, cover_letter: 'Weekly credit-risk reporting is exactly the kind of analysis I do now; SQL and Power BI are my daily tools.', history: [step('APPLIED', 'candidate', 'Application submitted', 26), step('UNDER_REVIEW', 123, 'Application moved to review', 24), step('SHORTLISTED', 123, 'Shortlisted after recruiter screen', 21), step('INTERVIEW', 123, 'Interview with analytics team', 17), step('SELECTED', 123, 'Offer approved by branch head', 12), step('HIRED', 123, 'Offer accepted, joining next month', 10)] },
  { n: 805, job: 606, user: 105, status: 'REJECTED', source: 'DIRECT', appliedDaysAgo: 20, cover_letter: 'Five years across audit and retail finance, currently managing 14 outlets monthly close.', history: [step('APPLIED', 'candidate', 'Application submitted', 20), step('UNDER_REVIEW', 123, 'Application moved to review', 18), step('REJECTED', 133, 'Role requires branch banking background', 15)] },
  { n: 806, job: 603, user: 103, status: 'SHORTLISTED', source: 'RECOMMENDATION', appliedDaysAgo: 6, cover_letter: 'My portfolio includes a fintech design system and two shipped mobile flows with usability test results.', history: [step('APPLIED', 'candidate', 'Application submitted', 6), step('UNDER_REVIEW', 121, 'Application moved to review', 5), step('SHORTLISTED', 131, 'Portfolio shortlisted by design lead', 3)] },
  { n: 807, job: 626, user: 103, status: 'APPLIED', source: 'SEARCH', appliedDaysAgo: 2, cover_letter: 'Agency pace suits me; my last role produced campaign creatives across six retainers.', history: [step('APPLIED', 'candidate', 'Application submitted', 2)] },
  { n: 808, job: 623, user: 105, status: 'SELECTED', source: 'DIRECT', appliedDaysAgo: 16, cover_letter: 'CA with audit and industry finance background; Tally and GST returns are routine for me.', history: [step('APPLIED', 'candidate', 'Application submitted', 16), step('UNDER_REVIEW', 127, 'Application moved to review', 14), step('SHORTLISTED', 127, 'Shortlisted for owner interview', 11), step('INTERVIEW', 127, 'Interview with finance head', 7), step('SELECTED', 127, 'Selected, offer letter being drafted', 4)] },
  { n: 809, job: 609, user: 107, status: 'INTERVIEW', source: 'RECOMMENDATION', appliedDaysAgo: 8, cover_letter: 'Three years in a 12-bed ICU with ventilator patients; GNMC licensed and ready for night rostering.', history: [step('APPLIED', 'candidate', 'Application submitted', 8), step('UNDER_REVIEW', 124, 'Application moved to review', 6), step('SHORTLISTED', 134, 'Shortlisted by nursing supervisor', 3), step('INTERVIEW', 124, 'Ward interview scheduled', 1)] },
  { n: 810, job: 628, user: 110, status: 'APPLIED', source: 'JOB_ALERT', appliedDaysAgo: 1, cover_letter: 'First-year staff nurse seeking a structured preceptorship program; ward duties are my daily routine already.', history: [step('APPLIED', 'candidate', 'Application submitted', 1)] },
  { n: 811, job: 622, user: 108, status: 'WITHDRAWN', source: 'DIRECT', appliedDaysAgo: 12, withdrawnDaysAgo: 8, cover_letter: 'Three years covering Terai retail territories with consistent quota performance.', history: [step('APPLIED', 'candidate', 'Application submitted', 12), step('WITHDRAWN', 'candidate', 'Accepted an offer closer to home', 8)] },
  { n: 812, job: 619, user: 108, status: 'REJECTED', source: 'SEARCH', appliedDaysAgo: 18, cover_letter: 'Sales background with store-side exposure through distribution work.', history: [step('APPLIED', 'candidate', 'Application submitted', 18), step('UNDER_REVIEW', 126, 'Application moved to review', 16), step('REJECTED', 126, 'No store management experience yet', 13)] },
  { n: 813, job: 624, user: 109, status: 'SHORTLISTED', source: 'RECOMMENDATION', appliedDaysAgo: 7, cover_letter: 'Procurement assistant at a 14-store chain; vendor comparison and goods-receipt reconciliation are my day to day.', history: [step('APPLIED', 'candidate', 'Application submitted', 7), step('UNDER_REVIEW', 127, 'Application moved to review', 5), step('SHORTLISTED', 127, 'Shortlisted for purchasing desk interview', 2)] },
  { n: 814, job: 614, user: 106, status: 'REJECTED', source: 'DIRECT', appliedDaysAgo: 14, cover_letter: 'Marketing writer comfortable with Nepali medium content and SEO basics.', history: [step('APPLIED', 'candidate', 'Application submitted', 14), step('UNDER_REVIEW', 122, 'Application moved to review', 12), step('REJECTED', 122, 'Writing sample did not meet editorial bar', 10)] },
];

// ---------------------------------------------------------------------------
// Interviews (821-823) + feedback (831), hiring decisions (841-843)
// ---------------------------------------------------------------------------

export interface DemoInterview {
  n: number;
  application: number;
  scheduled_by: number;
  interview_type: 'PHONE' | 'VIDEO' | 'IN_PERSON' | 'TECHNICAL' | 'HR' | 'FINAL';
  scheduledDaysAgo: number | null;
  scheduledInDays: number | null;
  duration_minutes: number;
  location: string | null;
  meeting_url: string | null;
  status: 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED';
  notes: string | null;
  feedback?: {
    n: number;
    reviewer: number;
    communication: number;
    technical: number;
    cultural: number;
    overall: number;
    strengths: string;
    weaknesses: string;
    comments: string;
    recommendation: string;
  };
}

export const INTERVIEWS: DemoInterview[] = [
  {
    n: 821, application: 804, scheduled_by: 123, interview_type: 'TECHNICAL',
    scheduledDaysAgo: 17, scheduledInDays: null, duration_minutes: 60,
    location: null, meeting_url: 'https://meet.sunrisefinancial.com/room/analytics-821', status: 'COMPLETED',
    notes: 'SQL case study plus dashboard walkthrough.',
    feedback: { n: 831, reviewer: 123, communication: 4, technical: 5, cultural: 4, overall: 5, strengths: 'SQL window functions were immediate; explained assumptions clearly.', weaknesses: 'Limited experience with scheduling tools, willing to learn.', comments: 'Walked through a live credit-risk reporting example and tied every metric back to business impact.', recommendation: 'HIRE' },
  },
  {
    n: 822, application: 801, scheduled_by: 121, interview_type: 'TECHNICAL',
    scheduledDaysAgo: null, scheduledInDays: 2, duration_minutes: 75,
    location: null, meeting_url: 'https://meet.himalayantech.com/room/frontend-panel-822', status: 'CONFIRMED',
    notes: 'Live coding on component API design, then system design with the design-system owner.',
  },
  {
    n: 823, application: 809, scheduled_by: 134, interview_type: 'IN_PERSON',
    scheduledDaysAgo: null, scheduledInDays: 3, duration_minutes: 45,
    location: 'Green Valley Healthcare, ICU Block, Chitwan', meeting_url: null, status: 'CONFIRMED',
    notes: 'Ward walk-through with the nursing supervisor, then panel interview.',
  },
];

export interface DemoHiringDecision {
  n: number;
  application: number;
  decided_by: number;
  outcome: 'HIRED' | 'REJECTED' | 'ON_HOLD' | 'SHORTLISTED';
  notes: string;
  daysAgo: number;
}

export const HIRING_DECISIONS: DemoHiringDecision[] = [
  { n: 841, application: 804, decided_by: 123, outcome: 'HIRED', notes: 'Strongest analyst in the pool; offer at the upper band approved.', daysAgo: 10 },
  { n: 842, application: 805, decided_by: 123, outcome: 'REJECTED', notes: 'Excellent finance profile but the role is branch-facing people management.', daysAgo: 15 },
  { n: 843, application: 814, decided_by: 122, outcome: 'REJECTED', notes: 'Hiring for subject accuracy in Nepali; writing sample had factual slips.', daysAgo: 10 },
];

// ---------------------------------------------------------------------------
// Saved jobs (851-858), job alerts (861-864), notifications (871+)
// ---------------------------------------------------------------------------

export const SAVED_JOBS: Array<{ user: number; job: number; daysAgo: number }> = [
  { user: 101, job: 602, daysAgo: 4 },
  { user: 101, job: 613, daysAgo: 2 },
  { user: 102, job: 620, daysAgo: 3 },
  { user: 103, job: 603, daysAgo: 5 },
  { user: 104, job: 613, daysAgo: 1 },
  { user: 107, job: 628, daysAgo: 2 },
  { user: 109, job: 624, daysAgo: 6 },
  { user: 110, job: 609, daysAgo: 1 },
];

export interface DemoJobAlert {
  n: number;
  user: number;
  name: string;
  keywords: string | null;
  category_id: string | null;
  location_id: string | null;
  employment_type: string | null;
  is_active: boolean;
  frequency: 'DAILY' | 'WEEKLY' | 'INSTANT';
  lastSentDaysAgo: number | null;
}

export const JOB_ALERTS: DemoJobAlert[] = [
  { n: 861, user: 101, name: 'Frontend roles in Kathmandu', keywords: 'react typescript frontend', category_id: CAT.frontend, location_id: LOC.kathmandu, employment_type: 'FULL_TIME', is_active: true, frequency: 'WEEKLY', lastSentDaysAgo: 3 },
  { n: 862, user: 110, name: 'Nursing jobs near Biratnagar', keywords: 'nurse nursing staff nurse', category_id: CAT.healthcare, location_id: LOC.biratnagar, employment_type: null, is_active: true, frequency: 'DAILY', lastSentDaysAgo: 1 },
  { n: 863, user: 106, name: 'Marketing & content daily digest', keywords: 'marketing content seo', category_id: CAT.marketing, location_id: null, employment_type: 'FULL_TIME', is_active: true, frequency: 'INSTANT', lastSentDaysAgo: 2 },
  { n: 864, user: 109, name: 'Procurement openings (paused)', keywords: 'procurement purchase', category_id: null, location_id: LOC.butwal, employment_type: null, is_active: false, frequency: 'WEEKLY', lastSentDaysAgo: 21 },
];

export interface DemoNotification {
  n: number;
  user: number;
  type: 'APPLICATION_STATUS' | 'INTERVIEW_SCHEDULED' | 'INTERVIEW_REMINDER' | 'JOB_ALERT' | 'SAVED_JOB_CLOSED' | 'COMPANY_VERIFICATION' | 'JOB_MODERATION' | 'REPORT_UPDATE' | 'PAYMENT_UPDATE' | 'SYSTEM';
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  is_read: boolean;
  createdDaysAgo: number;
}

export const NOTIFICATIONS: DemoNotification[] = [
  { n: 871, user: 101, type: 'INTERVIEW_SCHEDULED', title: 'Interview scheduled', body: 'Himalayan Tech Solutions scheduled your technical interview for Senior Frontend Engineer.', data: { application_id: ID(801), job_id: ID(601) }, is_read: false, createdDaysAgo: 2 },
  { n: 872, user: 101, type: 'APPLICATION_STATUS', title: 'Application shortlisted', body: 'Your application for Senior Frontend Engineer was shortlisted.', data: { application_id: ID(801), job_id: ID(601) }, is_read: true, createdDaysAgo: 4 },
  { n: 873, user: 102, type: 'APPLICATION_STATUS', title: 'You were hired', body: 'Sunrise Financial Services marked your Data Analyst application as hired.', data: { application_id: ID(804), job_id: ID(605) }, is_read: true, createdDaysAgo: 10 },
  { n: 874, user: 104, type: 'APPLICATION_STATUS', title: 'Application received', body: 'NextGen Education Center received your application for Backend Engineer (Node.js).', data: { application_id: ID(803), job_id: ID(602) }, is_read: false, createdDaysAgo: 1 },
  { n: 875, user: 107, type: 'INTERVIEW_SCHEDULED', title: 'Interview confirmed', body: 'Green Valley Healthcare confirmed your ward interview for Registered Nurse (ICU).', data: { application_id: ID(809), job_id: ID(609) }, is_read: false, createdDaysAgo: 1 },
  { n: 876, user: 110, type: 'APPLICATION_STATUS', title: 'Application received', body: 'Green Valley Healthcare received your application for Staff Nurse.', data: { application_id: ID(810), job_id: ID(628) }, is_read: false, createdDaysAgo: 1 },
  { n: 877, user: 101, type: 'JOB_ALERT', title: 'Weekly job alert', body: '3 new frontend roles in Kathmandu match your alert.', data: null, is_read: true, createdDaysAgo: 3 },
  { n: 878, user: 121, type: 'APPLICATION_STATUS', title: 'New application received', body: 'Sita Tamang applied to UI/UX Designer.', data: { application_id: ID(806), job_id: ID(603) }, is_read: false, createdDaysAgo: 6 },
  { n: 879, user: 124, type: 'INTERVIEW_REMINDER', title: 'Interview in 3 days', body: 'Your panel interview with Nisha Thapa for Registered Nurse (ICU) is in 3 days.', data: { interview_id: ID(823) }, is_read: false, createdDaysAgo: 1 },
  { n: 880, user: 1, type: 'COMPANY_VERIFICATION', title: 'New verification request', body: 'CloudPeak Consulting submitted verification documents and is awaiting review.', data: { company_id: ID(508), verification_id: ID(578) }, is_read: false, createdDaysAgo: 1 },
  { n: 881, user: 1, type: 'COMPANY_VERIFICATION', title: 'New verification request', body: 'NextGen Education Center submitted verification documents and is awaiting review.', data: { company_id: ID(505), verification_id: ID(575) }, is_read: false, createdDaysAgo: 2 },
  { n: 882, user: 1, type: 'PAYMENT_UPDATE', title: 'Payment refunded', body: 'A NPR 4,999 payment for Nepal Retail Network was refunded in full.', data: { order_id: ID(1005) }, is_read: true, createdDaysAgo: 5 },
  { n: 883, user: 1, type: 'REPORT_UPDATE', title: 'New report to review', body: 'A job posting was reported for misleading salary information.', data: { report_id: ID(1101) }, is_read: false, createdDaysAgo: 3 },
  { n: 884, user: 128, type: 'JOB_MODERATION', title: 'Job pending review', body: 'Your Business Development Executive listing is queued for moderation.', data: { job_id: ID(629) }, is_read: false, createdDaysAgo: 1 },
];

// ---------------------------------------------------------------------------
// Commerce: orders (1001-1006), payments (1011-1016), invoices (1021-1026)
// ---------------------------------------------------------------------------

export interface DemoOrder {
  n: number;
  company: number;
  plan: 'basic' | 'pro' | 'enterprise';
  created_by: number;
  order_number: string;
  unit_price: number;
  tax_amount: number;
  total_amount: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  createdDaysAgo: number;
}

export const ORDERS: DemoOrder[] = [
  { n: 1001, company: 503, plan: 'enterprise', created_by: 123, order_number: 'MK-ORD-8QK2M7P4-R9TX', unit_price: 19999, tax_amount: 2599.87, total_amount: 22598.87, status: 'CONFIRMED', createdDaysAgo: 45 },
  { n: 1002, company: 501, plan: 'pro', created_by: 121, order_number: 'MK-ORD-3HJ9N1B6-K4WQ', unit_price: 4999, tax_amount: 649.87, total_amount: 5648.87, status: 'COMPLETED', createdDaysAgo: 30 },
  { n: 1003, company: 504, plan: 'pro', created_by: 124, order_number: 'MK-ORD-6VC4L8D2-M7ZY', unit_price: 4999, tax_amount: 649.87, total_amount: 5648.87, status: 'COMPLETED', createdDaysAgo: 22 },
  { n: 1004, company: 502, plan: 'basic', created_by: 122, order_number: 'MK-ORD-1XA5R3F9-P2NE', unit_price: 0, tax_amount: 0, total_amount: 0, status: 'CONFIRMED', createdDaysAgo: 14 },
  { n: 1005, company: 506, plan: 'pro', created_by: 126, order_number: 'MK-ORD-9TG7K4Y1-B6VH', unit_price: 4999, tax_amount: 649.87, total_amount: 5648.87, status: 'CANCELLED', createdDaysAgo: 9 },
  { n: 1006, company: 508, plan: 'pro', created_by: 128, order_number: 'MK-ORD-2PD8W6R5-J8LC', unit_price: 4999, tax_amount: 649.87, total_amount: 5648.87, status: 'PENDING', createdDaysAgo: 1 },
];

export interface DemoPayment {
  n: number;
  order: number;
  transaction_reference: string;
  provider: 'esewa' | 'khalti' | 'fonepay' | 'bank_transfer';
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paidDaysAgo: number | null;
  failure_reason: string | null;
  /** For the refund row: the payment it refunds. */
  refund_of?: number;
  refund_reason?: string;
}

export const PAYMENTS: DemoPayment[] = [
  { n: 1011, order: 1001, transaction_reference: 'FTX-20261003-K2M9', provider: 'fonepay', amount: 22598.87, status: 'COMPLETED', paidDaysAgo: 45, failure_reason: null },
  { n: 1012, order: 1002, transaction_reference: 'FTX-20261017-P4R8', provider: 'fonepay', amount: 5648.87, status: 'COMPLETED', paidDaysAgo: 30, failure_reason: null },
  { n: 1013, order: 1003, transaction_reference: 'FTX-20261025-L6D3', provider: 'khalti', amount: 5648.87, status: 'COMPLETED', paidDaysAgo: 22, failure_reason: null },
  { n: 1014, order: 1005, transaction_reference: 'FTX-20261108-W1Y7', provider: 'khalti', amount: 5648.87, status: 'COMPLETED', paidDaysAgo: 9, failure_reason: null },
  { n: 1015, order: 1005, transaction_reference: 'RFND-9K4T2M8Q-X3PB', provider: 'khalti', amount: 5648.87, status: 'REFUNDED', paidDaysAgo: 5, failure_reason: null, refund_of: 1014, refund_reason: 'Customer cancelled the subscription within the cooling-off period.' },
  { n: 1016, order: 1006, transaction_reference: 'FTX-20261117-J5N2', provider: 'esewa', amount: 5648.87, status: 'PENDING', paidDaysAgo: null, failure_reason: null },
];

export interface DemoInvoice {
  n: number;
  order: number;
  invoice_number: string;
  issueDaysAgo: number;
  dueInDays: number | null;
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'VOID' | 'OVERDUE';
}

export const INVOICES: DemoInvoice[] = [
  { n: 1021, order: 1001, invoice_number: 'INV-202610-8QK2', issueDaysAgo: 45, dueInDays: 7, subtotal: 19999, tax_amount: 2599.87, total_amount: 22598.87, status: 'PAID' },
  { n: 1022, order: 1002, invoice_number: 'INV-202610-3HJ9', issueDaysAgo: 30, dueInDays: 7, subtotal: 4999, tax_amount: 649.87, total_amount: 5648.87, status: 'PAID' },
  { n: 1023, order: 1003, invoice_number: 'INV-202610-6VC4', issueDaysAgo: 22, dueInDays: 7, subtotal: 4999, tax_amount: 649.87, total_amount: 5648.87, status: 'PAID' },
  { n: 1024, order: 1004, invoice_number: 'INV-202611-1XA5', issueDaysAgo: 14, dueInDays: null, subtotal: 0, tax_amount: 0, total_amount: 0, status: 'PAID' },
  { n: 1025, order: 1005, invoice_number: 'INV-202611-9TG7', issueDaysAgo: 9, dueInDays: 7, subtotal: 4999, tax_amount: 649.87, total_amount: 5648.87, status: 'VOID' },
  { n: 1026, order: 1006, invoice_number: 'INV-202611-2PD8', issueDaysAgo: 1, dueInDays: 7, subtotal: 4999, tax_amount: 649.87, total_amount: 5648.87, status: 'DRAFT' },
];

// ---------------------------------------------------------------------------
// Talent rosters (1111-1112 + members), reports (1121-1123),
// job moderation (1131-1132), audit logs (1141+)
// ---------------------------------------------------------------------------

export interface DemoRoster {
  n: number;
  company: number;
  name: string;
  description: string;
  created_by: number;
  createdDaysAgo: number;
  members: Array<{ profile: number; notes: string }>;
}

export const ROSTERS: DemoRoster[] = [
  {
    n: 1111, company: 501, name: 'Frontend talent bench',
    description: 'React and design-system engineers kept warm for Q1 hiring.',
    created_by: 121, createdDaysAgo: 6,
    members: [
      { profile: 201, notes: 'Applied to Senior Frontend; strong system design in screen.' },
      { profile: 204, notes: 'Full stack with solid React; watch for frontend-only openings.' },
    ],
  },
  {
    n: 1112, company: 504, name: 'ICU nursing pipeline',
    description: 'GNMC-registered nurses interviewed for the 12-bed ICU expansion.',
    created_by: 124, createdDaysAgo: 5,
    members: [
      { profile: 207, notes: 'Interview scheduled; three years ventilator care.' },
      { profile: 210, notes: 'Junior but excellent ward fundamentals; consider preceptor program.' },
    ],
  },
];

export interface DemoReport {
  n: number;
  reported_by: number;
  entity_type: 'USER' | 'COMPANY' | 'JOB';
  entity: number;
  reason: string;
  description: string;
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  createdDaysAgo: number;
  resolvedDaysAgo: number | null;
}

export const REPORTS: DemoReport[] = [
  { n: 1121, reported_by: 101, entity_type: 'JOB', entity: 617, reason: 'Misleading salary information', description: 'Ad says NPR 50,000 but the recruiter on the call quoted 32,000 plus commission.', status: 'OPEN', createdDaysAgo: 3, resolvedDaysAgo: null },
  { n: 1122, reported_by: 107, entity_type: 'JOB', entity: 622, reason: 'Spam or duplicate posting', description: 'Same listing appears four times with slightly different titles.', status: 'UNDER_REVIEW', createdDaysAgo: 5, resolvedDaysAgo: null },
  { n: 1123, reported_by: 109, entity_type: 'COMPANY', entity: 507, reason: 'Suspicious recruiting practice', description: 'Asked for a registration fee during the interview process.', status: 'RESOLVED', createdDaysAgo: 7, resolvedDaysAgo: 4 },
];

export interface DemoModeration {
  n: number;
  job: number;
  action: 'APPROVED' | 'REJECTED' | 'FLAGGED';
  reason: string | null;
  daysAgo: number;
}

/** Two reviews: an approval and a rejection (the pending job stays unreviewed). */
export const MODERATIONS: DemoModeration[] = [
  { n: 1131, job: 601, action: 'APPROVED', reason: null, daysAgo: 1 },
  { n: 1132, job: 617, action: 'FLAGGED', reason: 'Salary range in the posting conflicts with the salary the recruiter stated; awaiting clarification.', daysAgo: 3 },
];

export interface DemoAuditLog {
  n: number;
  user: number | null;
  action: string;
  entity_type: string;
  entity: number | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  daysAgo: number;
}

export const AUDIT_LOGS: DemoAuditLog[] = [
  { n: 1141, user: 123, action: 'ORDER_CREATED', entity_type: 'ORDER', entity: 1001, old_values: null, new_values: { order_number: 'MK-ORD-8QK2M7P4-R9TX', total_amount: 22598.87 }, ip_address: '103.21.244.10', daysAgo: 45 },
  { n: 1142, user: 123, action: 'PAYMENT_COMPLETED', entity_type: 'PAYMENT', entity: 1011, old_values: { status: 'PENDING' }, new_values: { status: 'COMPLETED', amount: 22598.87 }, ip_address: '103.21.244.10', daysAgo: 45 },
  { n: 1143, user: 123, action: 'INVOICE_ISSUED', entity_type: 'INVOICE', entity: 1021, old_values: { status: 'DRAFT' }, new_values: { status: 'ISSUED', invoice_number: 'INV-202610-8QK2' }, ip_address: null, daysAgo: 44 },
  { n: 1144, user: 121, action: 'ORDER_CREATED', entity_type: 'ORDER', entity: 1002, old_values: null, new_values: { order_number: 'MK-ORD-3HJ9N1B6-K4WQ', total_amount: 5648.87 }, ip_address: '110.44.18.77', daysAgo: 30 },
  { n: 1145, user: 121, action: 'PAYMENT_COMPLETED', entity_type: 'PAYMENT', entity: 1012, old_values: { status: 'PENDING' }, new_values: { status: 'COMPLETED', amount: 5648.87 }, ip_address: '110.44.18.77', daysAgo: 30 },
  { n: 1146, user: 1, action: 'INVOICE_CREATED', entity_type: 'INVOICE', entity: 1022, old_values: null, new_values: { invoice_number: 'INV-202610-3HJ9' }, ip_address: null, daysAgo: 30 },
  { n: 1147, user: 126, action: 'ORDER_CREATED', entity_type: 'ORDER', entity: 1005, old_values: null, new_values: { order_number: 'MK-ORD-9TG7K4Y1-B6VH', total_amount: 5648.87 }, ip_address: '27.34.9.142', daysAgo: 9 },
  { n: 1148, user: 1, action: 'PAYMENT_REFUNDED', entity_type: 'PAYMENT', entity: 1015, old_values: { status: 'COMPLETED' }, new_values: { status: 'REFUNDED', refund_of: 1014 }, ip_address: null, daysAgo: 5 },
  { n: 1149, user: 1, action: 'INVOICE_VOIDED', entity_type: 'INVOICE', entity: 1025, old_values: { status: 'ISSUED' }, new_values: { status: 'VOID' }, ip_address: null, daysAgo: 5 },
  { n: 1150, user: 1, action: 'ORDER_CANCELLED', entity_type: 'ORDER', entity: 1005, old_values: { status: 'CONFIRMED' }, new_values: { status: 'CANCELLED' }, ip_address: null, daysAgo: 5 },
  { n: 1151, user: 125, action: 'COMPANY_VERIFICATION_SUBMITTED', entity_type: 'COMPANY', entity: 505, old_values: { verification_status: 'PENDING' }, new_values: { verification_id: 575 }, ip_address: '175.100.32.6', daysAgo: 2 },
  { n: 1152, user: 128, action: 'COMPANY_VERIFICATION_SUBMITTED', entity_type: 'COMPANY', entity: 508, old_values: { verification_status: 'PENDING' }, new_values: { verification_id: 578 }, ip_address: '202.160.45.9', daysAgo: 1 },
  { n: 1153, user: 1, action: 'COMPANY_VERIFICATION_REJECTED', entity_type: 'COMPANY', entity: 507, old_values: { verification_status: 'PENDING' }, new_values: { verification_status: 'REJECTED' }, ip_address: null, daysAgo: 6 },
  { n: 1154, user: 101, action: 'JOB_SAVED', entity_type: 'JOB', entity: 602, old_values: null, new_values: { job_id: 602 }, ip_address: '14.140.61.8', daysAgo: 4 },
  { n: 1155, user: 101, action: 'REPORT_CREATED', entity_type: 'REPORT', entity: 1121, old_values: null, new_values: { reason: 'Misleading salary information' }, ip_address: '14.140.61.8', daysAgo: 3 },
  { n: 1156, user: 1, action: 'JOB_APPROVED', entity_type: 'JOB', entity: 601, old_values: { status: 'PENDING_REVIEW' }, new_values: { status: 'PUBLISHED' }, ip_address: null, daysAgo: 1 },
  { n: 1157, user: 121, action: 'TALENT_ROSTER_CREATED', entity_type: 'TALENT_ROSTER', entity: 1111, old_values: null, new_values: { name: 'Frontend talent bench' }, ip_address: '110.44.18.77', daysAgo: 6 },
  { n: 1158, user: 124, action: 'HIRING_DECISION_HIRED', entity_type: 'APPLICATION', entity: 804, old_values: { status: 'SELECTED' }, new_values: { status: 'HIRED', outcome: 'HIRED' }, ip_address: '180.190.77.3', daysAgo: 10 },
  { n: 1159, user: 1, action: 'SERVICE_PLAN_CREATED', entity_type: 'SERVICE_PLAN', entity: 402, old_values: null, new_values: { name: 'Pro', price: 4999 }, ip_address: null, daysAgo: 150 },
  { n: 1160, user: 128, action: 'PAYMENT_INITIATED', entity_type: 'PAYMENT', entity: 1016, old_values: null, new_values: { status: 'PENDING', amount: 5648.87 }, ip_address: '202.160.45.9', daysAgo: 1 },
];

// ---------------------------------------------------------------------------
// Helpers shared by the demo seeders
// ---------------------------------------------------------------------------

/** A timestamp `n` days before now. */
export const daysAgo = (n: number): Date => new Date(Date.now() - n * DAY_MS);

/** A timestamp `n` days from now. */
export const daysFromNow = (n: number): Date => new Date(Date.now() + n * DAY_MS);

/** `YYYY-MM-DD` string `n` days ago (for `date` columns). */
export const dateDaysAgo = (n: number): string => daysAgo(n).toISOString().slice(0, 10);

/** Row count of a table (used for idempotency checks). */
export const countRows = async (
  queryInterface: QueryInterface,
  table: string,
): Promise<number> => {
  const [rows] = (await queryInterface.sequelize.query(
    `SELECT COUNT(*)::int AS count FROM "${table}"`,
  )) as unknown as [Array<{ count: number }>];
  return rows[0].count;
};

/** True when the table already holds data (skip the seeder). */
export const hasRows = async (queryInterface: QueryInterface, table: string): Promise<boolean> =>
  (await countRows(queryInterface, table)) > 0;
