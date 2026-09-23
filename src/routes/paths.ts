// Only addresses the router actually serves (src/routes/sections). The
// template's paths to demo pages, other auth providers and its own docs are
// gone, so a link to a page that does not exist cannot be written by
// accident.

const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
};

// ----------------------------------------------------------------------

export const paths = {
  page403: '/403',
  page404: '/404',
  page500: '/500',
  // AUTH
  auth: {
    jwt: {
      login: `${ROOTS.AUTH}/jwt/login`,
    },
  },
  // DASHBOARD
  dashboard: {
    root: ROOTS.DASHBOARD,
    fileManager: `${ROOTS.DASHBOARD}/file-manager`,
    patientTimeline: `${ROOTS.DASHBOARD}/patient-timeline`,
    howItWorks: `${ROOTS.DASHBOARD}/how-it-works`,
    history: {
      root: `${ROOTS.DASHBOARD}/history`,
      conversation: (id: number) => `${ROOTS.DASHBOARD}/history/conversation/${id}`,
    },
    product: {
      root: `${ROOTS.DASHBOARD}/product`,
      new: `${ROOTS.DASHBOARD}/product/new`,
    },
    user: {
      list: `${ROOTS.DASHBOARD}/user/list`,
      new: `${ROOTS.DASHBOARD}/user/new`,
      edit: (id: string) => `${ROOTS.DASHBOARD}/user/${id}/edit`,
      activity: `${ROOTS.DASHBOARD}/user/activity`,
      statistics: `${ROOTS.DASHBOARD}/user/statistics`,
    },
  },
};
