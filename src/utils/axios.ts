import axios, { AxiosRequestConfig } from 'axios';

import { HOST_API } from 'src/config-global';

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: HOST_API });

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject((error.response && error.response.data) || 'Something went wrong')
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

// export const endpoints = {
//   chat: '/chat',
//   kanban: '/kanban',
//   calendar: '/calendar',
//   auth: {
//     me: '/auth/me',
//     login: '/auth/login',
//     register: '/auth/register',
//   },
//   mail: {
//     list: '/mail/list',
//     details: '/mail/details',
//     labels: '/mail/labels',
//   },
//   post: {
//     list: '/post/list',
//     details: '/post/details',
//     latest: '/post/latest',
//     search: '/post/search',
//   },
//   product: {
//     list: '/product/list',
//     details: '/product/details',
//     search: '/product/search',
//   },
//   diagnosis: {
//     submitDiagnosis: '/diagnosis/submit',
//   },
// };

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
  product: {
    list: '/product/list',
    details: '/product/details',
    search: '/product/search',
  },
  user: {
    list: '/user', // Endpoint para obtener todos los usuarios
    details: (username: string) => `/user/${username}`, // Endpoint para obtener un usuario por username
    create: '/user', // Endpoint para crear un usuario
    update: (username: string) => `/user/${username}`, // Endpoint para actualizar un usuario
    delete: (username: string) => `/user/${username}`, // Endpoint para eliminar un usuario
  },
};
