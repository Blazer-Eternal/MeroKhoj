/**
 * Central endpoint map — every backend path used by the frontend lives here.
 * Paths are relative to NEXT_PUBLIC_API_URL (no leading /api).
 * Verified against backend/src/api/routes (Swagger v1.3.0, 146 operations).
 */
export const endpoints = {
  // ---- auth --------------------------------------------------------------
  auth: {
    register: '/auth/register',
    login: '/auth/login',
    refresh: '/auth/refresh',
    me: '/auth/me',
    logout: '/auth/logout',
    // NOTE: verify/forgot/reset are UI-stub pages for now — the backend does
    // not expose these routes yet (see BUILD_PLAN "frontend phase").
  },

  // ---- user account ------------------------------------------------------
  users: {
    me: '/users/me',
    mePassword: '/users/me/password',
    myProfile: '/users/me/profile', // jobseeker profile (GET/PUT)
    // No admin user-list endpoint exists yet (deferred backend gap B4).
  },

  // ---- jobseeker profile -------------------------------------------------
  profiles: {
    educations: (profileId: string) => `/profiles/${profileId}/educations`,
    education: (id: string) => `/educations/${id}`,
    experiences: (profileId: string) => `/profiles/${profileId}/work-experiences`,
    experience: (id: string) => `/work-experiences/${id}`,
    resumes: (profileId: string) => `/profiles/${profileId}/resumes`,
    resume: (id: string) => `/resumes/${id}`,
    resumeDefault: (id: string) => `/resumes/${id}/default`,
  },

  // ---- company -----------------------------------------------------------
  companies: {
    list: '/companies',
    mine: '/companies/mine',
    byId: (id: string) => `/companies/${id}`,
    members: (companyId: string) => `/companies/${companyId}/members`,
    member: (companyId: string, memberId: string) =>
      `/companies/${companyId}/members/${memberId}`,
    jobs: (companyId: string) => `/companies/${companyId}/jobs`,
    applications: (companyId: string) => `/companies/${companyId}/applications`,
    rosters: (companyId: string) => `/companies/${companyId}/rosters`,
    verifications: (companyId: string) => `/companies/${companyId}/verifications`,
    latestVerification: (companyId: string) =>
      `/companies/${companyId}/verifications/latest`,
    entitlement: (companyId: string) => `/companies/${companyId}/entitlement`,
    // Admin review:
    reviewVerification: (id: string) => `/admin/verifications/${id}/review`,
  },

  // ---- job & taxonomy ----------------------------------------------------
  jobs: {
    search: '/jobs',
    byId: (id: string) => `/jobs/${id}`,
    skills: (id: string) => `/jobs/${id}/skills`,
    setSkills: (id: string) => `/jobs/${id}/skills`,
    status: (id: string) => `/jobs/${id}/status`,
    moderationLatest: (jobId: string) => `/jobs/${jobId}/moderation/latest`,
    apply: (jobId: string) => `/jobs/${jobId}/applications`,
    questions: (jobId: string) => `/jobs/${jobId}/questions`,
    question: (id: string) => `/questions/${id}`,
    questionOptions: (id: string) => `/questions/${id}/options`,
  },
  jobCategories: {
    list: '/job-categories',
    tree: '/job-categories/tree',
    byId: (id: string) => `/job-categories/${id}`,
  },
  industries: { list: '/industries', byId: (id: string) => `/industries/${id}` },
  locations: { list: '/locations', byId: (id: string) => `/locations/${id}` },
  skills: {
    list: '/skills',
    search: '/skills/search',
    byId: (id: string) => `/skills/${id}`,
  },

  // ---- applications ------------------------------------------------------
  applications: {
    mine: '/applications/mine',
    byId: (id: string) => `/applications/${id}`,
    history: (id: string) => `/applications/${id}/history`,
    status: (id: string) => `/applications/${id}/status`,
    withdraw: (id: string) => `/applications/${id}/withdraw`,
    answers: (id: string) => `/applications/${id}/answers`,
    decision: (id: string) => `/applications/${id}/decision`,
  },

  // ---- interviews --------------------------------------------------------
  interviews: {
    list: '/interviews',
    create: '/interviews',
    byId: (id: string) => `/interviews/${id}`,
    status: (id: string) => `/interviews/${id}/status`,
    feedback: (id: string) => `/interviews/${id}/feedback`,
    myFeedback: (id: string) => `/interviews/${id}/feedback/mine`,
    feedbackItem: (id: string, feedbackId: string) =>
      `/interviews/${id}/feedback/${feedbackId}`,
  },

  // ---- hiring & talent ---------------------------------------------------
  rosters: {
    byId: (id: string) => `/rosters/${id}`,
    members: (rosterId: string) => `/rosters/${rosterId}/members`,
    member: (rosterId: string, jobseekerId: string) =>
      `/rosters/${rosterId}/members/${jobseekerId}`,
  },

  // ---- notifications -----------------------------------------------------
  notifications: {
    list: '/notifications',
    unreadCount: '/notifications/unread-count',
    markAllRead: '/notifications/read-all',
    markRead: (id: string) => `/notifications/${id}/read`,
    remove: (id: string) => `/notifications/${id}`,
  },
  savedJobs: {
    list: '/saved-jobs',
    status: (jobId: string) => `/saved-jobs/${jobId}/status`,
    toggle: (jobId: string) => `/saved-jobs/${jobId}`,
  },
  jobAlerts: {
    list: '/job-alerts',
    byId: (id: string) => `/job-alerts/${id}`,
    test: (id: string) => `/job-alerts/${id}/test`,
  },

  // ---- payment -----------------------------------------------------------
  servicePlans: {
    list: '/service-plans',
    byId: (id: string) => `/service-plans/${id}`,
    create: '/service-plans', // admin
  },
  orders: {
    list: '/orders',
    byId: (id: string) => `/orders/${id}`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    initiatePayment: (orderId: string) => `/orders/${orderId}/payments`,
  },
  payments: {
    list: '/payments',
    byId: (id: string) => `/payments/${id}`,
    confirm: (id: string) => `/payments/${id}/confirm`, // admin
    refund: (id: string) => `/payments/${id}/refund`, // admin
    webhook: '/payments/webhook', // provider callback, unauthenticated
  },
  invoices: {
    list: '/invoices',
    byId: (id: string) => `/invoices/${id}`,
    issue: (id: string) => `/invoices/${id}/issue`, // admin
    void: (id: string) => `/invoices/${id}/void`, // admin
    create: '/invoices', // admin
  },

  // ---- administration ----------------------------------------------------
  admin: {
    moderation: {
      moderate: (jobId: string) => `/admin/moderation/jobs/${jobId}`,
      history: (jobId: string) => `/admin/moderation/jobs/${jobId}/history`,
    },
    reports: {
      list: '/reports', // GET is admin-only; POST is any authenticated user
      status: (id: string) => `/reports/${id}/status`,
      byId: (id: string) => `/reports/${id}`,
    },
    auditLogs: {
      list: '/audit-logs',
      byEntity: (entityType: string, entityId: string) =>
        `/audit-logs/entity/${entityType}/${entityId}`,
    },
  },
} as const;

/** Build a path with query params, dropping empty values. */
export const withQuery = (
  path: string,
  query: Record<string, string | number | boolean | undefined | null>,
): string => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
};
