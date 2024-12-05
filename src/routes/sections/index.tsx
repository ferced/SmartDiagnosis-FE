import { lazy } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import { GuestGuard } from 'src/auth/guard';
import AuthClassicLayout from 'src/layouts/auth/classic';

import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { authDemoRoutes } from './auth-demo';
import { dashboardRoutes } from './dashboard';
import { componentsRoutes } from './components';

// ----------------------------------------------------------------------

export default function Router() {
  // Lazy-loaded login page for JWT authentication
  const JwtLoginPage = lazy(() => import('src/pages/auth/jwt/login'));

  return useRoutes([
    // Root path redirects to the login page for guests
    {
      path: '/',
      element: (
        <GuestGuard>
          <AuthClassicLayout>
            <JwtLoginPage />
          </AuthClassicLayout>
        </GuestGuard>
      ),
    },

    // Authentication routes
    ...authRoutes,
    ...authDemoRoutes,

    // Dashboard routes (includes CRUD for users)
    ...dashboardRoutes,

    // Main routes
    ...mainRoutes,

    // Components routes
    ...componentsRoutes,

    // Catch-all route for 404 Not Found
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
