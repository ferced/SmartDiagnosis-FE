import { Helmet } from 'react-helmet-async';

import { RoleBasedGuard } from 'src/auth/guard';

import { ActivityLogsView } from 'src/sections/user-management/view';

// ----------------------------------------------------------------------

export default function ActivityLogsPage() {
  return (
    <>
      <Helmet>
        <title>Activity Logs - SmartDiagnosis</title>
      </Helmet>

      <RoleBasedGuard hasContent roles={['admin', 'manager']}>
        <ActivityLogsView />
      </RoleBasedGuard>
    </>
  );
}