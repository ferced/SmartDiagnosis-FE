import axios, { AxiosRequestConfig } from 'axios';

import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });

// Callers of this instance receive the response body, not the AxiosError. The
// HTTP status is kept on it so `getErrorMessage` (src/utils/api-error) can
// still tell a rejected sign-in from an outage.
axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => {
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
