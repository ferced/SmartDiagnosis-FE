import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthGuard } from 'src/auth/guard';
import DashboardLayout from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// DIAGNOSIS APP PAGES
const ProductCreatePage = lazy(() => import('src/pages/dashboard/product/new'));
const HistoryPage = lazy(() => import('src/pages/dashboard/history'));
const ConversationPage = lazy(() => import('src/pages/dashboard/conversation'));
const FileManagerPage = lazy(() => import('src/pages/dashboard/file-manager'));


// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <ProductCreatePage />, index: true },
      {
        path: 'product',
        children: [
          { element: <ProductCreatePage />, index: true },
          { path: 'new', element: <ProductCreatePage /> },
        ],
      },
      { path: 'file-manager', element: <FileManagerPage /> },
      {
        path: 'history', 
        children: [
          { element: <HistoryPage />, index: true },
          { path: 'conversation/:id', element: <ConversationPage /> },
        ]
      },
    ],
  },
];
