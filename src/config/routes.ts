// Base path configuration
export const BASE_PATH = process.env.NODE_ENV === 'production' ? '/lms' : '';

// Helper function to get the full path
export const getFullPath = (path: string) => `${BASE_PATH}${path}`;

// Helper function to get the relative path (removes base path)
export const getRelativePath = (fullPath: string) => fullPath.replace(BASE_PATH, '');

// LMS API base URL
export const LMS_API_BASE_URL =  "http://10.80.4.72";

// Common routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  LEARNER_DASHBOARD: '/learner-dashboard',
  MODULES: '/modules',
  MODULE_DETAIL: (moduleName: string) => `/module/${moduleName}`,
  MODULE_EDIT: (moduleName: string) => `/module/${moduleName}/edit`,
  LEARNER_MODULES: '/modules/learner',
  LEARNER_MODULE_DETAIL: (moduleName: string) => `/modules/learner/${moduleName}`,
  LEARNERS: '/learners',
  ANALYTICS: '/analytics',
  PROJECTS: '/projects',
  PROFILE: '/profile',
  NEW_MODULE: '/module/new',
} as const; 