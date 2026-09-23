import { lazy, Suspense } from 'react';
import { Outlet, Navigate } from 'react-router-dom';

import CompactLayout from 'src/layouts/compact';
import LandingLayout from 'src/layouts/landing';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

const Page500 = lazy(() => import('src/pages/500'));
const Page403 = lazy(() => import('src/pages/403'));
const Page404 = lazy(() => import('src/pages/404'));

const DemoPage = lazy(() => import('src/sections/demo/demo-view'));

// ----------------------------------------------------------------------

export const mainRoutes = [
  {
    element: (
      <CompactLayout>
        <Suspense fallback={<SplashScreen />}>
          <Outlet />
        </Suspense>
      </CompactLayout>
    ),
    children: [
      { path: '500', element: <Page500 /> },
      { path: '404', element: <Page404 /> },
      { path: '403', element: <Page403 /> },
    ],
  },
  // The landing is served at `/`; this old address used to render a second
  // copy of it.
  { path: 'landing', element: <Navigate to="/" replace /> },
  {
    path: 'demo',
    element: (
      <LandingLayout>
        <Suspense fallback={<SplashScreen />}>
          <DemoPage />
        </Suspense>
      </LandingLayout>
    ),
  },
];
