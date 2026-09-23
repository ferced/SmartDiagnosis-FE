import axios, { AxiosError, AxiosRequestConfig } from 'axios';

import { HOST_API } from 'src/config-global';

import { handleSessionExpired } from './session-expiry';

// ----------------------------------------------------------------------

// A 401 anywhere means the session is gone (expired or revoked token): end it
// in one place instead of every screen showing its own "Unauthorized". Two
// 401s are not about the session and are left to their callers: a rejected
// sign-in, and /openai/validate rejecting the clinician's own OpenAI key.
function isSessionExpiry(error: AxiosError) {
  if (error.response?.status !== 401) return false;

  const url = error.config?.url || '';
  if (url.includes('/auth/login')) return false;

  const body = error.response.data as { error?: string } | undefined;
  if (url.includes('/openai/validate') && body?.error === 'Invalid API key') return false;

  // No token was sent, so there was no session to expire.
  return Boolean(sessionStorage.getItem('accessToken'));
}

function onSessionError(error: AxiosError) {
  if (isSessionExpiry(error)) handleSessionExpired();
}

// Most screens call the default axios export directly, so the interceptor is
// installed there as well as on the shared instance below.
axios.interceptors.response.use(
  (res) => res,
  (error) => {
    onSessionError(error);
    return Promise.reject(error);
  }
);

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });

// Callers of this instance receive the response body, not the AxiosError. The
// HTTP status is kept on it so `getErrorMessage` (src/utils/api-error) can
// still tell a rejected sign-in from an outage.
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
    onSessionError(error);
    const { response } = error;
    if (!response) return Promise.reject(error);
    const body = response.data;
    // eslint-disable-next-line prefer-promise-reject-errors -- callers read the body's fields
    return Promise.reject(
      body && typeof body === 'object'
        ? { ...body, status: response.status }
        : { error: body || 'Something went wrong', status: response.status }
    );
  }
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: '/chat',
  kanban: '/kanban',
  calendar: '/calendar',
  auth: {
    me: '/auth/me',
    login: '/auth/login',
    register: '/auth/register',
  },
  mail: {
    list: '/mail/list',
    details: '/mail/details',
    labels: '/mail/labels',
  },
  post: {
    list: '/post/list',
    details: '/post/details',
    latest: '/post/latest',
    search: '/post/search',
  },
  product: {
    list: '/product/list',
    details: '/product/details',
    search: '/product/search',
  },
  diagnosis: {
    submitDiagnosis: '/diagnosis/submit',
  },
};
