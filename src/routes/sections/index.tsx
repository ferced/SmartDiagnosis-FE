import { lazy, Suspense } from 'react';
import { Navigate, useRoutes } from 'react-router-dom';

import LandingLayout from 'src/layouts/landing';

import { SplashScreen } from 'src/components/loading-screen';

// import { PATH_AFTER_LOGIN } from 'src/config-global';
import { authRoutes } from './auth';
import { mainRoutes } from './main';
import { dashboardRoutes } from './dashboard';

// ----------------------------------------------------------------------

const LandingPage = lazy(() => import('src/sections/landing/landing-view'));

export default function Router() {
  return useRoutes([
    // Landing page as index
    {
      path: '/',
      element: (
        <LandingLayout>
          <Suspense fallback={<SplashScreen />}>
            <LandingPage />
          </Suspense>
        </LandingLayout>
      ),
    },

    // Auth routes
    ...authRoutes,

    // Dashboard routes
    ...dashboardRoutes,

    // Main routes
    ...mainRoutes,

    // No match 404
    { path: '*', element: <Navigate to="/404" replace /> },
  ]);
}
