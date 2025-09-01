import { Helmet } from 'react-helmet-async';

import { RoleBasedGuard } from 'src/auth/guard';

import { UserStatisticsView } from 'src/sections/user-management/view';

// ----------------------------------------------------------------------

export default function UserStatisticsPage() {
  return (
    <>
      <Helmet>
        <title>User Statistics - SmartDiagnosis</title>
      </Helmet>

      <RoleBasedGuard hasContent roles={['admin', 'manager']}>
        <UserStatisticsView />
      </RoleBasedGuard>
    </>
  );
}