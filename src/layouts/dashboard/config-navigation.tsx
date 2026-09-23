import { useMemo } from 'react';

import { paths } from 'src/routes/paths';

import { useTranslate } from 'src/locales';
import { useAuthContext } from 'src/auth/hooks';

import SvgColor from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name: string) => (
  <SvgColor src={`/assets/icons/navbar/${name}.svg`} sx={{ width: 1, height: 1 }} />
);

const ICONS = {
  chat: icon('ic_chat'),
  user: icon('ic_user'),
  folder: icon('ic_folder'),
  calendar: icon('ic_calendar'),
  analytics: icon('ic_analytics'),
};

// ----------------------------------------------------------------------

export function useNavData() {
  const { t } = useTranslate();
  const { user } = useAuthContext();

  const userRole = user?.role || 'user';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isManagerOrAdmin = isAdmin || isManager;

  const data = useMemo(
    () => [
      {
        subheader: t('AI Professor'),
        items: [
          // NEW DIAGNOSIS
          {
            title: 'New Diagnosis',
            path: paths.dashboard.product.new,
            icon: ICONS.chat,
          },

          // HOW IT WORKS
          {
            title: 'How it works',
            path: paths.dashboard.howItWorks,
            icon: ICONS.analytics,
          },

          // HISTORY
          {
            title: 'History',
            path: paths.dashboard.history.root,
            icon: ICONS.analytics,
          },

          // PATIENT TIMELINE
          {
            title: 'Patient Timeline',
            path: paths.dashboard.patientTimeline,
            icon: ICONS.calendar,
          },

          // FILE MANAGER
          {
            title: 'File Manager',
            path: paths.dashboard.fileManager,
            icon: ICONS.folder,
          },

          // USER MANAGEMENT - Only show for managers and admins
          ...(isManagerOrAdmin
            ? [
                {
                  title: 'User Management',
                  path: paths.dashboard.user.list,
                  icon: ICONS.user,
                  children: [
                    { title: 'Users List', path: paths.dashboard.user.list },
                    { title: 'Activity Logs', path: paths.dashboard.user.activity },
                    { title: 'Statistics', path: paths.dashboard.user.statistics },
                  ],
                },
              ]
            : []),
        ],
      },
    ],
    [t, isManagerOrAdmin]
  );

  return data;
}
